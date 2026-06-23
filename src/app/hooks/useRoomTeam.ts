import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../components/auth/AuthContext';
import { normalizeRow } from '../utils/helpers';
import { toast } from 'sonner';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  domain?: string;
  joined_at: string;
  is_verified_expert: boolean;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'revoked';
  created_at: string;
  expires_at: string;
}

export function useRoomTeam(roomId?: string) {
  return useQuery({
    queryKey: ['room-team', roomId],
    queryFn: async () => {
      if (!roomId) return { members: [], invitations: [] };

      // 1. Fetch active members (from room_observers JOIN users)
      const { data: observersData, error: observersError } = await supabase
        .from('room_observers')
        .select(`
          joined_at,
          role,
          users:observer_id (
            id,
            name,
            email,
            avatar,
            domain,
            is_verified_expert,
            organization_name,
            organization_logo_url
          )
        `)
        .eq('room_id', roomId);

      if (observersError) throw observersError;

      // 2. Fetch invitations (only builders will be able to fetch this due to RLS,
      // but if the fetch fails due to RLS, it might throw an error. We handle it safely).
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('room_invitations')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false });

      // Ignore RLS errors for non-builders fetching invitations
      const invitations = invitationsError ? [] : (invitationsData || []).map(normalizeRow) as TeamInvitation[];

      // 3. Fetch Room Owner's (Builder) org details
      const { data: roomData } = await supabase
        .from('rooms')
        .select(`
          builder_id,
          users:builder_id (
            is_verified_expert,
            organization_name,
            organization_logo_url
          )
        `)
        .eq('id', roomId)
        .single();
      
      const builderUser = roomData?.users ? (Array.isArray(roomData.users) ? roomData.users[0] : roomData.users) : null;
      
      const ownerOrg = {
        builder_id: roomData?.builder_id,
        is_verified_expert: !!builderUser?.is_verified_expert,
        organization_name: builderUser?.organization_name,
        organization_logo_url: builderUser?.organization_logo_url
      };

      const members: TeamMember[] = (observersData || []).map((row: any) => {
        const user = Array.isArray(row.users) ? row.users[0] : row.users;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: row.role,
          avatar: user.avatar,
          domain: user.domain,
          joined_at: row.joined_at,
          is_verified_expert: !!user.is_verified_expert
        };
      });

      return { members, invitations, ownerOrg };
    },
    enabled: !!roomId,
  });
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ inviteId, roomId }: { inviteId: string, roomId: string }) => {
      const { error } = await supabase
        .from('room_invitations')
        .update({ status: 'revoked', updated_at: new Date().toISOString() })
        .eq('id', inviteId);

      if (error) throw error;
      return true;
    },
    onSuccess: (_, { roomId }) => {
      toast.success("Invitation revoked successfully");
      queryClient.invalidateQueries({ queryKey: ['room-team', roomId] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to revoke invitation");
    }
  });
}

export function useResendInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, email, role, roomTitle, builderName }: { roomId: string, email: string, role: string, roomTitle: string, builderName: string }) => {
      
      // 1. Generate new token via RPC to resend
      const { data: token, error: rpcError } = await supabase.rpc('invite_user_to_room', {
        p_room_id: roomId,
        p_email: email.trim().toLowerCase(),
        p_role: role
      });
      if (rpcError) throw rpcError;

      // 2. Call the edge function which handles sending the email
      const { data, error } = await supabase.functions.invoke('room-invitations', {
        body: {
          record: {
            email,
            role,
            token,
            room_id: roomId,
            origin: window.location.origin
          }
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to send invitation");
      
      return data;
    },
    onSuccess: (_, { roomId }) => {
      toast.success("Invitation resent successfully!");
      queryClient.invalidateQueries({ queryKey: ['room-team', roomId] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to resend invitation");
    }
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, userId, newRole }: { roomId: string, userId: string, newRole: string }) => {
      const { error } = await supabase.rpc('update_room_member_role', {
        p_room_id: roomId,
        p_user_id: userId,
        p_new_role: newRole
      });

      if (error) throw error;
      return true;
    },
    onSuccess: (_, { roomId }) => {
      toast.success("Member role updated successfully");
      queryClient.invalidateQueries({ queryKey: ['room-team', roomId] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update member role");
    }
  });
}
