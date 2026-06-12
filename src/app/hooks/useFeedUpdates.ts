import { useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../components/auth/AuthContext';

export interface FeedUpdate {
  id: string;
  roomId: string;
  authorId: string;
  authorName: string;
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
    text: string;
    createdAt: string;
  }[];
}

import { normalizeRow } from "../utils/helpers";

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
        .select('*, rooms(title, tags)')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const updateIds = (data || []).map(u => u.id);
      let reactionsData: any[] = [];
      
      if (updateIds.length > 0) {
        const { data: rData } = await supabase
          .from('reactions')
          .select('*')
          .in('update_id', updateIds);
        reactionsData = rData || [];
      }

      return (data || []).map(row => {
        const normalized = normalizeRow(row);
        normalized.reactions = reactionsData
          .filter(r => r.update_id === row.id)
          .map(normalizeRow);
        return normalized;
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length > 0 ? allPages.length : undefined;
    },
  });

  useEffect(() => {
    const channelName = 'feed-updates-live';

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
          queryClient.invalidateQueries({ queryKey: ['feed-updates'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}
