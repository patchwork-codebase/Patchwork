import { useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../components/auth/AuthContext';
import { getAvatarUrl } from '../utils/helpers';

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
    type: string;
    text?: string | null;
    createdAt: string;
  }[];
  _isActivity?: boolean;
  parentUpdate?: Omit<FeedUpdate, 'reactions' | 'parentUpdate'>;
}

import { normalizeRow } from '../utils/helpers';
import { QUERY_KEYS, CHANNEL_NAMES } from '../constants';
import type { Reaction } from '../types';

export function useFeedUpdates(sortOrder: 'desc' | 'asc' = 'desc') {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery<FeedUpdate[], Error>({
    queryKey: ['feed-updates', sortOrder],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const pageSize = 10;
      const from = (pageParam as number) * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from('updates')
        .select('*, rooms(title, tags), users!author_id(is_verified_expert, organization_name, organization_logo_url, avatar)')
        .order('created_at', { ascending: sortOrder === 'asc' })
        .range(from, to);

      if (error) throw error;

      // Also fetch recent replies to surface as top-level Activity items.
      // NOTE: We avoid nested joins (e.g. updates!update_id) from reactions
      // because PostgREST can't resolve the FK hint across two hops → 400.
      // Instead: fetch reply reactions first, then batch-fetch parent updates.
      const { data: repliesRaw } = await supabase
        .from('reactions')
        .select('*')
        .eq('type', 'reply')
        .order('created_at', { ascending: sortOrder === 'asc' })
        .range(from, to);

      const replies = (repliesRaw || []).map(r =>
        normalizeRow<Reaction & { text: string }>(r as Record<string, unknown>)
      );

      // Batch-fetch the parent updates for those replies
      const parentUpdateIds = [...new Set(replies.map(r => r.updateId).filter(Boolean))];
      let parentUpdatesMap: Record<string, FeedUpdate> = {};

      if (parentUpdateIds.length > 0) {
        const { data: parentRows } = await supabase
          .from('updates')
          .select('*, rooms(title, tags)')
          .in('id', parentUpdateIds);

        (parentRows || []).forEach(row => {
          const pu = normalizeRow<FeedUpdate>(row as Record<string, unknown>);
          pu.authorAvatar = getAvatarUrl(pu.authorName || pu.authorId);
          pu.authorIsVerifiedExpert = false;
          pu.authorOrgName = null;
          pu.authorOrgLogo = null;
          parentUpdatesMap[pu.id] = pu;
        });
      }

      const standardUpdates = (data || []).map(row => {
        const normalized = normalizeRow<FeedUpdate>(row as Record<string, unknown>);
        normalized.authorIsVerifiedExpert = !!(row.users?.is_verified_expert);
        normalized.authorAvatar = row.users?.avatar || getAvatarUrl(normalized.authorName || normalized.authorId);
        normalized.authorOrgName = row.users?.organization_name ?? null;
        normalized.authorOrgLogo = row.users?.organization_logo_url ?? null;
        return normalized;
      });

      // Fetch reactions for all standard updates so isActive renders correctly
      const updateIds = standardUpdates.map(u => u.id);
      if (updateIds.length > 0) {
        const { data: rData } = await supabase
          .from('reactions')
          .select('*')
          .in('update_id', updateIds);

        const reactionsData = (rData || []).map(r =>
          normalizeRow<Reaction & { text: string }>(r as Record<string, unknown>)
        );

        standardUpdates.forEach(upd => {
          upd.reactions = reactionsData.filter(r => r.updateId === upd.id) as any;
        });
      }


      const activityUpdates = replies.map(reply => {
        const parentUpdate = parentUpdatesMap[reply.updateId] || null;

        return {
          id: reply.id,
          roomId: reply.roomId,
          authorId: reply.observerId,
          authorName: reply.observerName,
          authorAvatar: getAvatarUrl(reply.observerName || reply.observerId),
          content: reply.text || '',
          createdAt: reply.createdAt,
          _isActivity: true,
          parentUpdate: parentUpdate,
        } as FeedUpdate;
      });


      // Merge and sort
      const combined = [...standardUpdates, ...activityUpdates];
      combined.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });

      return combined;
    },
    getNextPageParam: (lastPage, allPages) => {
      // Because we merge two sources, the page size might be up to 20.
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
