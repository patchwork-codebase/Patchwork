import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../components/auth/AuthContext';
import { toast } from 'sonner';

export interface PendingInvite {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

export function usePendingInvites(roomId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['room-invites', roomId];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('room_invitations')
        .select('id, email, role, status, created_at')
        .eq('room_id', roomId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PendingInvite[];
    },
    enabled: !!roomId,
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const { data: token, error } = await supabase.rpc('invite_user_to_room', {
        p_room_id: roomId,
        p_email: email.trim().toLowerCase(),
        p_role: role
      });
      if (error) throw error;

      // Invoke the edge function to send the email since webhooks might not be set up
      const { error: invokeError } = await supabase.functions.invoke('room-invitations', {
        body: {
          record: {
            email: email.trim().toLowerCase(),
            role,
            token,
            room_id: roomId,
            origin: window.location.origin
          }
        }
      });
      if (invokeError) {
        console.error("Failed to send email via edge function:", invokeError);
      }

      return { email, role, token };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Invitation sent successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to send invitation');
    }
  });

  const revokeMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from('room_invitations')
        .update({ status: 'revoked' })
        .eq('id', inviteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Invitation revoked');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to revoke invitation');
    }
  });

  const resendMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const { data: token, error } = await supabase.rpc('invite_user_to_room', {
        p_room_id: roomId,
        p_email: email.trim().toLowerCase(),
        p_role: role
      });
      if (error) throw error;

      // Invoke the edge function to send the email
      const { error: invokeError } = await supabase.functions.invoke('room-invitations', {
        body: {
          record: {
            email: email.trim().toLowerCase(),
            role,
            token,
            room_id: roomId,
            origin: window.location.origin
          }
        }
      });
      if (invokeError) {
        console.error("Failed to send email via edge function:", invokeError);
      }

      return { email, role, token };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Invitation resent successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to resend invitation');
    }
  });

  return {
    invites: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    inviteUser: inviteMutation.mutate,
    isInviting: inviteMutation.isPending,
    revokeInvite: revokeMutation.mutate,
    isRevoking: revokeMutation.isPending,
    resendInvite: resendMutation.mutate,
    isResending: resendMutation.isPending,
  };
}
