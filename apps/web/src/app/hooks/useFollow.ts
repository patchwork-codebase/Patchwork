import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../components/auth/AuthContext';
import { QUERY_KEYS } from '../constants';
import { toast } from 'sonner';

export function useFollow(targetUserId?: string, currentUserId?: string) {
  const queryClient = useQueryClient();

  const { data: isFollowing = false, isLoading: queryLoading } = useQuery({
    queryKey: ['is-following', currentUserId, targetUserId],
    queryFn: async () => {
      if (!currentUserId || !targetUserId) return false;
      const { data, error } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!currentUserId && !!targetUserId,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId || !targetUserId) throw new Error("Authentication required");
      
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId);
        if (error) throw error;
        return false;
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: currentUserId, following_id: targetUserId });
        if (error) throw error;
        return true;
      }
    },
    onSuccess: (newStatus) => {
      queryClient.setQueryData(['is-following', currentUserId, targetUserId], newStatus);
      
      // Invalidate target user profile cache so stats and other elements sync
      if (targetUserId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile(targetUserId) });
      }
      
      // Invalidate observer stats if current user is observer
      if (currentUserId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.observerStats(currentUserId) });
      }
    },
    onError: (err: any) => {
      console.error("Follow toggle error:", err);
      toast.error(err.message || "Failed to update follow status");
    }
  });

  return {
    isFollowing,
    isLoading: queryLoading || mutation.isPending,
    toggleFollow: () => mutation.mutate(),
  };
}
