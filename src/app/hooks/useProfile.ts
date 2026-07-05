import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../components/auth/AuthContext';
import { normalizeRow } from '../utils/helpers';
import { QUERY_KEYS, CHANNEL_NAMES } from '../constants';
import type { Profile } from '../types';

export function useProfile(userId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery<Profile | null, Error>({
    queryKey: QUERY_KEYS.profile(userId ?? ''),
    queryFn: async () => {
      const { data: userRow, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
      if (error) throw error;
      if (!userRow) return null;

      const profileData = normalizeRow<Profile>(userRow);

      const [{ data: followersData, count: followerCount }, { count: followingCount }] = await Promise.all([
        supabase.from('follows').select('follower_id', { count: 'exact' }).eq('following_id', userId).order('created_at', { ascending: false }).limit(5),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId)
      ]);

      const { data: { session } } = await supabase.auth.getSession();
      let isFollowing = false;
      if (session?.user) {
        const { data: followData } = await supabase.from('follows')
          .select('follower_id')
          .eq('follower_id', session.user.id)
          .eq('following_id', userId)
          .maybeSingle();
        isFollowing = !!followData;
      }

      profileData.followerCount = followerCount || 0;
      profileData.followers = followersData?.map(f => f.follower_id) || [];
      profileData.followingCount = followingCount || 0;
      profileData.isFollowing = isFollowing;

      return profileData;
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userId) return;

    const channelName = CHANNEL_NAMES.userProfile(userId);

    // Remove any stale channel before (re-)subscribing.
    const existing = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`);
    if (existing) supabase.removeChannel(existing);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile(userId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return query;
}
