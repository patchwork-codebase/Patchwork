import { useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../components/auth/AuthContext';
import { getAvatarUrl, registerAvatarUrl } from '../utils/helpers';

export interface FeedUpdate {
  id: string;
  roomId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorIsVerifiedExpert?: boolean;
  authorOrgName?: string | null;
  authorOrgLogo?: string | null;
  content: string;
  mediaUrl?: string;
  codeSnippet?: string;
  createdAt: string;
  rooms?: {
    title: string;
    tags: string[];
  };
  reactions?: {
    id: string;
    roomId: string;
    updateId: string;
    observerId: string;
    observerName: string;
    observerAvatar?: string;
    type: string;
    text?: string | null;
    createdAt: string;
  }[];
}

import { normalizeRow } from '../utils/helpers';
import { QUERY_KEYS, CHANNEL_NAMES } from '../constants';
import type { Reaction } from '../types';

export function useFeedUpdates(sortOrder: 'desc' | 'asc' = 'desc') {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery<FeedUpdate[], Error>({
    queryKey: ['feed-updates-v2', sortOrder],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const pageSize = 10;
      const from = (pageParam as number) * pageSize;
      const to = from + pageSize - 1;

      // Original query — unchanged to keep feed working
      const { data, error } = await supabase
        .from('updates')
        .select('*, rooms(title, tags), users!author_id(is_verified_expert, organization_name, organization_logo_url, avatar)')
        .order('created_at', { ascending: sortOrder === 'asc' })
        .range(from, to);

      if (error) throw error;



      const standardUpdates = (data || []).map(row => {
        const normalized = normalizeRow<FeedUpdate>(row as Record<string, unknown>);
        normalized.authorIsVerifiedExpert = !!(row.users?.is_verified_expert);
        // Register real avatar in cache; avatar column is the confirmed DB field
        const authorAvatar = row.users?.avatar;
        if (authorAvatar) registerAvatarUrl(normalized.authorId, authorAvatar);
        normalized.authorAvatar = authorAvatar || getAvatarUrl(normalized.authorName || normalized.authorId);
        normalized.authorOrgName = row.users?.organization_name ?? null;
        normalized.authorOrgLogo = row.users?.organization_logo_url ?? null;
        return normalized;
      });

      // Fetch reactions for all standard updates so isActive renders correctly and replies can be threaded
      const updateIds = standardUpdates.map(u => u.id);
      const allUpdateIds = [...updateIds];

      if (allUpdateIds.length > 0) {
        const { data: rData } = await supabase
          .from('reactions')
          .select('*, users!observer_id(avatar)')
          .in('update_id', allUpdateIds);

        const reactionsData = (rData || []).map((r: any) => {
          if (r.users?.avatar) registerAvatarUrl(r.observer_id, r.users.avatar);
          const normalized = normalizeRow<Reaction & { text: string }>(r as Record<string, unknown>);
          (normalized as any).observerAvatar = r.users?.avatar || null;
          return normalized;
        });

        standardUpdates.forEach(upd => {
          upd.reactions = reactionsData.filter(r => r.updateId === upd.id) as FeedUpdate['reactions'];
        });
      }

      return standardUpdates;
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length > 0 ? allPages.length : undefined;
    },
  });

  useEffect(() => {
    const channelName = CHANNEL_NAMES.feedUpdates;

    // Remove any stale channel before (re-)subscribing.
    // Prevents "cannot add postgres_changes callbacks after subscribe()" crash.
    const existing = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`);
    if (existing) supabase.removeChannel(existing);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'updates' },
        () => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.feedUpdates });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}
