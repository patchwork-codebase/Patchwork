import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../components/auth/AuthContext';
import { normalizeRow, registerAvatarUrl } from '../utils/helpers';
import { QUERY_KEYS, CHANNEL_NAMES } from '../constants';
import type { Profile } from '../types';

export function useProfile(userId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery<Profile | null, Error>({
    queryKey: QUERY_KEYS.profile(userId ?? ''),
    queryFn: async () => {
      const { data: userRow, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
      if (error) throw new Error(error.message || JSON.stringify(error));
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

      // Register avatar so getAvatarUrl(userId) returns the real photo everywhere
      const avatarUrlStr = ('avatar_url' in userRow ? userRow.avatar_url : ('avatar' in userRow ? userRow.avatar : null)) as string | null;
      if (avatarUrlStr) {
        registerAvatarUrl(userId!, avatarUrlStr);
      }

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

    let invalidateTimer: NodeJS.Timeout;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
        () => {
          clearTimeout(invalidateTimer);
          invalidateTimer = setTimeout(() => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile(userId) }), 1500);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(invalidateTimer);
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return query;
}
