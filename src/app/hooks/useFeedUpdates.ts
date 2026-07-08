import { useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../components/auth/AuthContext';

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

      // Also fetch recent replies to surface as top-level Activity items
      const { data: repliesData } = await supabase
        .from('reactions')
        .select('*, updates!update_id(*, rooms(title, tags), users!author_id(is_verified_expert, organization_name, organization_logo_url, avatar)), users!observer_id(avatar)')
        .eq('type', 'reply')
        .order('created_at', { ascending: sortOrder === 'asc' })
        .range(from, to);

      const updateIds = (data || []).map(u => u.id);
      let reactionsData: Reaction[] = [];
      
      if (updateIds.length > 0) {
        const { data: rData } = await supabase
          .from('reactions')
          .select('*')
          .in('update_id', updateIds);
        reactionsData = (rData || []).map(r => normalizeRow<Reaction & { text: string }>(r as Record<string, unknown>));
      }

      const standardUpdates = (data || []).map(row => {
        const normalized = normalizeRow<FeedUpdate>(row as Record<string, unknown>);
        normalized.authorIsVerifiedExpert = !!(row.users?.is_verified_expert);
        normalized.authorAvatar = row.users?.avatar;
        normalized.authorOrgName = row.users?.organization_name;
        normalized.authorOrgLogo = row.users?.organization_logo_url;
        normalized.reactions = reactionsData.filter(r => r.updateId === row.id);
        return normalized;
      });

      const activityUpdates = (repliesData || []).map(row => {
        const reply = normalizeRow<Reaction & { text: string, users: any, updates: any }>(row as Record<string, unknown>);
        const parentUpdateRow = row.updates as any;
        const parentUpdate = normalizeRow<FeedUpdate>(parentUpdateRow);
        parentUpdate.authorIsVerifiedExpert = !!(parentUpdateRow.users?.is_verified_expert);
        parentUpdate.authorAvatar = parentUpdateRow.users?.avatar;
        parentUpdate.authorOrgName = parentUpdateRow.users?.organization_name;
        parentUpdate.authorOrgLogo = parentUpdateRow.users?.organization_logo_url;

        return {
          id: reply.id,
          roomId: reply.roomId,
          authorId: reply.observerId,
          authorName: reply.observerName,
          authorAvatar: reply.users?.avatar,
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
