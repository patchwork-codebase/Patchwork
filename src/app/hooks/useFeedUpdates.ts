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
}

import { normalizeRow } from '../utils/helpers';
import { QUERY_KEYS, CHANNEL_NAMES } from '../constants';
import type { Reaction } from '../types';

export function useFeedUpdates() {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery<FeedUpdate[], Error>({
    queryKey: ['feed-updates'],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const pageSize = 10;
      const from = (pageParam as number) * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from('updates')
        .select('*, rooms(title, tags), users!author_id(is_verified_expert, organization_name, organization_logo_url, avatar)')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const updateIds = (data || []).map(u => u.id);
      let reactionsData: Reaction[] = [];
      
      if (updateIds.length > 0) {
        const { data: rData } = await supabase
          .from('reactions')
          .select('*')
          .in('update_id', updateIds);
        reactionsData = (rData || []).map(r => normalizeRow<Reaction & { text: string }>(r as Record<string, unknown>));
      }

      return (data || []).map(row => {
        const normalized = normalizeRow<FeedUpdate>(row as Record<string, unknown>);
        // Hoist is_verified_expert and org branding from the joined users row
        normalized.authorIsVerifiedExpert = !!(row.users?.is_verified_expert);
        normalized.authorAvatar = row.users?.avatar;
        normalized.authorOrgName = row.users?.organization_name;
        normalized.authorOrgLogo = row.users?.organization_logo_url;
        normalized.reactions = reactionsData.filter(r => r.updateId === row.id);
        return normalized;
      });
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
