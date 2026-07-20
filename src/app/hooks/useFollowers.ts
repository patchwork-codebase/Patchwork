import { useQuery } from '@tanstack/react-query';
import { supabase } from '../components/auth/AuthContext';

export interface FollowUser {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string | null;
  isVerifiedExpert: boolean;
  domain?: string | null;
  reputation?: number;
}

export function useFollowers(userId?: string) {
  return useQuery({
    queryKey: ['followers', 'v2', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data: followsData, error: followsError } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', userId)
        .order('created_at', { ascending: false });

      if (followsError) throw followsError;
      if (!followsData || followsData.length === 0) return [];

      const followerIds = followsData.map(f => f.follower_id);

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, avatar, role, is_verified_expert, domain, reputation')
        .in('id', followerIds);

      if (usersError) throw usersError;

      // Preserve chronological order from the follows table
      const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);
      
      return followerIds.map(id => {
        const u = usersMap.get(id);
        if (!u) return null;
        return {
          id: u.id,
          name: u.name,
          avatarUrl: u.avatar || null,
          role: u.role,
          isVerifiedExpert: u.is_verified_expert,
          domain: u.domain,
          reputation: u.reputation
        } as FollowUser;
      }).filter(Boolean) as FollowUser[];
    },
    enabled: !!userId,
  });
}

export function useFollowing(userId?: string) {
  return useQuery({
    queryKey: ['following', 'v2', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data: followsData, error: followsError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId)
        .order('created_at', { ascending: false });

      if (followsError) throw followsError;
      if (!followsData || followsData.length === 0) return [];

      const followingIds = followsData.map(f => f.following_id);

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, avatar, role, is_verified_expert, domain, reputation')
        .in('id', followingIds);

      if (usersError) throw usersError;

      // Preserve chronological order
      const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);

      return followingIds.map(id => {
        const u = usersMap.get(id);
        if (!u) return null;
        return {
          id: u.id,
          name: u.name,
          avatarUrl: u.avatar || null,
          role: u.role,
          isVerifiedExpert: u.is_verified_expert,
          domain: u.domain,
          reputation: u.reputation
        } as FollowUser;
      }).filter(Boolean) as FollowUser[];
    },
    enabled: !!userId,
  });
}
