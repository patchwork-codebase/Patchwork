import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, supabase } from '../components/auth/AuthContext';

export interface RoomMemberPermissions {
  can_manage_tickets: boolean;
  can_post_updates: boolean;
  can_manage_docs: boolean;
  can_invite_members: boolean;
}

export const DEFAULT_PERMISSIONS: RoomMemberPermissions = {
  can_manage_tickets: true,
  can_post_updates: true,
  can_manage_docs: true,
  can_invite_members: false,
};

export function useRoomPermissions(roomId?: string | null) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['room-permissions', roomId, userId],
    queryFn: async () => {
      if (!roomId || !userId) {
        return {
          isOwner: false,
          isTeamMember: false,
          isObserver: true,
          permissions: {
            can_manage_tickets: false,
            can_post_updates: false,
            can_manage_docs: false,
            can_invite_members: false,
          },
        };
      }

      // Check if owner
      const { data: roomData } = await supabase
        .from('rooms')
        .select('builder_id')
        .eq('id', roomId)
        .maybeSingle();

      const isOwner = roomData?.builder_id === userId;
      if (isOwner) {
        return {
          isOwner: true,
          isTeamMember: true,
          isObserver: false,
          permissions: {
            can_manage_tickets: true,
            can_post_updates: true,
            can_manage_docs: true,
            can_invite_members: true,
          },
        };
      }

      // Check room_observers role and permissions
      const { data: memberData } = await supabase
        .from('room_observers')
        .select('role, permissions')
        .eq('room_id', roomId)
        .eq('observer_id', userId)
        .maybeSingle();

      const role = memberData?.role || 'observer';
      const isTeamMember = ['team_member', 'collaborator', 'co_founder', 'org_member', 'expert'].includes(role);
      const isObserver = !isTeamMember;

      const perms: RoomMemberPermissions = isTeamMember
        ? { ...DEFAULT_PERMISSIONS, ...(memberData?.permissions || {}) }
        : {
            can_manage_tickets: false,
            can_post_updates: false,
            can_manage_docs: false,
            can_invite_members: false,
          };

      return {
        isOwner: false,
        isTeamMember,
        isObserver,
        userRole: role,
        permissions: perms,
      };
    },
    enabled: !!roomId && !!userId,
  });
}

export function useUpdateMemberPermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, userId, permissions }: { roomId: string; userId: string; permissions: RoomMemberPermissions }) => {
      const { error } = await supabase.rpc('update_member_permissions', {
        p_room_id: roomId,
        p_user_id: userId,
        p_permissions: permissions,
      });
      if (error) {
        // Fallback to direct update if RPC fails
        const { error: directError } = await supabase
          .from('room_observers')
          .update({ permissions })
          .eq('room_id', roomId)
          .eq('observer_id', userId);
        if (directError) throw directError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['room-permissions', variables.roomId] });
      queryClient.invalidateQueries({ queryKey: ['room-team', variables.roomId] });
    },
  });
}
