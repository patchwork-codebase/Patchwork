import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../components/auth/AuthContext';
import { normalizeRow } from '../utils/helpers';

export function useProfile(userId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
      if (error) throw error;
      return data ? normalizeRow(data) : null;
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userId) return;

    const channelName = `user-profile-${userId}`;

    // Remove any stale channel before (re-)subscribing.
    const existing = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`);
    if (existing) supabase.removeChannel(existing);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['profile', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return query;
}
