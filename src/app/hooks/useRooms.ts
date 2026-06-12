import { useEffect } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, apiCall } from '../components/auth/AuthContext';

import { normalizeRow } from "../utils/helpers";

/** Helper: remove any existing Supabase channel with this name before (re-)subscribing.
 *  Prevents the "cannot add postgres_changes callbacks after subscribe()" crash
 *  that occurs in React StrictMode or when an effect re-fires before cleanup. */
function removeStaleChannel(name: string) {
  const existing = supabase.getChannels().find(c => c.topic === `realtime:${name}`);
  if (existing) supabase.removeChannel(existing);
}

export function useRoomDetails(roomId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['room-details', roomId],
    queryFn: async () => {
      if (!roomId) return null;

      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .maybeSingle();

      if (roomError) throw roomError;
      if (!roomData) return null;

      const { data: updatesData, error: updatesError } = await supabase
        .from('updates')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false });

      if (updatesError) throw updatesError;

      const { data: reactionsData, error: reactionsError } = await supabase
        .from('reactions')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false });

      if (reactionsError) throw reactionsError;

      return {
        ...normalizeRow(roomData),
        updates: (updatesData || []).map(normalizeRow),
        reactions: (reactionsData || []).map(normalizeRow)
      };
    },
    enabled: !!roomId,
  });

  useEffect(() => {
    if (!roomId) return;

    const channelName = `room-details-${roomId}`;
    removeStaleChannel(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        () => queryClient.invalidateQueries({ queryKey: ['room-details', roomId] })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'updates', filter: `room_id=eq.${roomId}` },
        () => queryClient.invalidateQueries({ queryKey: ['room-details', roomId] })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reactions', filter: `room_id=eq.${roomId}` },
        () => queryClient.invalidateQueries({ queryKey: ['room-details', roomId] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);

  return query;
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
        .eq('status', 'active')
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
    const channelName = 'public-rooms';
    removeStaleChannel(channelName);

    const channel = supabase
      .channel(channelName)
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

    const channelName = `user-rooms-${userId}`;
    removeStaleChannel(channelName);

    const channel = supabase
      .channel(channelName)
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

export function useObservedRooms(userId?: string) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery<any[], Error>({
    queryKey: ['observed-rooms', userId],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      if (!userId) return [];
      const pageSize = 12;
      const from = (pageParam as number) * pageSize;
      const to = from + pageSize - 1;

      // We select the room_id and expand the room details.
      const { data, error } = await supabase
        .from('room_observers')
        .select(`
          room_id,
          rooms:rooms(*)
        `)
        .eq('observer_id', userId)
        .order('joined_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      // Map to return just the room objects formatted correctly
      return (data || []).map(row => {
        const room = Array.isArray(row.rooms) ? row.rooms[0] : row.rooms;
        return room ? normalizeRow(room) : null;
      }).filter(Boolean);
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 12 ? allPages.length : undefined;
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userId) return;

    const channelName = `observed-rooms-${userId}`;
    removeStaleChannel(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_observers', filter: `observer_id=eq.${userId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['observed-rooms', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return query;
}

export function useObserverStats(userId?: string) {
  return useQuery({
    queryKey: ['observer-stats', userId],
    queryFn: async () => {
      if (!userId) return { totalReactions: 0, sharpInsights: 0, shippedProducts: 0, roomsFollowed: 0 };
      
      const { count: roomsFollowed } = await supabase
        .from('room_observers')
        .select('*', { count: 'exact', head: true })
        .eq('observer_id', userId);

      const { data: reactionsData } = await supabase
        .from('reactions')
        .select('type')
        .eq('observer_id', userId);
        
      const totalReactions = reactionsData?.length || 0;
      const sharpInsights = reactionsData?.filter(r => r.type === 'sharp').length || 0;
      
      const { data: observed } = await supabase.from('room_observers').select('room_id').eq('observer_id', userId);
      const roomIds = observed?.map(d => d.room_id) || [];
      let shippedProducts = 0;
      if (roomIds.length > 0) {
        const { count } = await supabase
          .from('rooms')
          .select('id', { count: 'exact', head: true })
          .in('id', roomIds)
          .eq('status', 'shipped');
        shippedProducts = count || 0;
      }
        
      return {
        roomsFollowed: roomsFollowed || 0,
        totalReactions,
        sharpInsights,
        shippedProducts
      };
    },
    enabled: !!userId,
  });
}
