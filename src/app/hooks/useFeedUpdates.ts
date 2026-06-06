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

function toCamelCase(key: string) {
  return key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

function normalizeRow(row: any): any {
  if (!row || typeof row !== 'object') return row;
  return Object.entries(row).reduce((result: any, [key, value]) => {
    const camelKey = toCamelCase(key);
    if (Array.isArray(value)) {
      result[camelKey] = value.map(item => (typeof item === 'object' && item !== null ? normalizeRow(item) : item));
    } else if (value && typeof value === 'object') {
      result[camelKey] = normalizeRow(value);
    } else {
      result[camelKey] = value;
    }
    return result;
  }, {});
}

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
        .select('*, rooms:room_id(title, tags), reactions(*)')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return (data || []).map(normalizeRow);
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 10 ? allPages.length : undefined;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('feed-updates-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'updates' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['feed-updates'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reactions' },
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
