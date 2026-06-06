import { useEffect } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, apiCall } from '../components/auth/AuthContext';

function toCamelCase(key: string) {
  return key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

export function normalizeRow(row: any): any {
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

export function useRooms() {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery<any[], Error>({
    queryKey: ['rooms'],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const pageSize = 12;
      const from = (pageParam as number) * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('updated_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return (data || []).map(normalizeRow);
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 12 ? allPages.length : undefined;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('public-rooms')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['rooms'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useUserRooms(userId?: string) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery<any[], Error>({
    queryKey: ['user-rooms', userId],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      if (!userId) return [];
      const pageSize = 12;
      const from = (pageParam as number) * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('builder_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return (data || []).map(normalizeRow);
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 12 ? allPages.length : undefined;
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`user-rooms-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `builder_id=eq.${userId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['user-rooms', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return query;
}
