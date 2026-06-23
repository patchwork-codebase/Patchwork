import { useEffect } from 'react';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../components/auth/AuthContext';

import { normalizeRow } from '../utils/helpers';
import { QUERY_KEYS, CHANNEL_NAMES } from '../constants';
import type { Room } from '../types';


/** Helper: remove any existing Supabase channel with this name before (re-)subscribing.
 *  Prevents the "cannot add postgres_changes callbacks after subscribe()" crash
 *  that occurs in React StrictMode or when an effect re-fires before cleanup. */
function removeStaleChannel(name: string) {
  const existing = supabase.getChannels().find(c => c.topic === `realtime:${name}`);
  if (existing) supabase.removeChannel(existing);
}

const debounceTimers = new Map<string, NodeJS.Timeout>();
function debouncedInvalidate(queryClient: any, queryKey: any[]) {
  const keyStr = JSON.stringify(queryKey);
  const existing = debounceTimers.get(keyStr);
  if (existing) clearTimeout(existing);
  
  const timer = setTimeout(() => {
    queryClient.invalidateQueries({ queryKey });
    debounceTimers.delete(keyStr);
  }, 1500); // 1.5s debounce for realtime events
}

export function useRoomDetails(roomId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery<Room | null, Error>({
    queryKey: QUERY_KEYS.roomDetails(roomId ?? ''),
    queryFn: async () => {
      if (!roomId) return null;

      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*, users!builder_id(is_verified_expert)')
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
        builderIsVerifiedExpert: !!(roomData.users?.is_verified_expert),
        builderOrgName: roomData.users?.organization_name,
        builderOrgLogo: roomData.users?.organization_logo_url,
        updates: (updatesData || []).map(normalizeRow),
        reactions: (reactionsData || []).map(normalizeRow)
      };
    },
    enabled: !!roomId,
  });

  useEffect(() => {
    if (!roomId) return;

    const channelName = CHANNEL_NAMES.roomDetails(roomId);
    removeStaleChannel(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        () => debouncedInvalidate(queryClient, QUERY_KEYS.roomDetails(roomId))
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'updates', filter: `room_id=eq.${roomId}` },
        () => debouncedInvalidate(queryClient, QUERY_KEYS.roomDetails(roomId))
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reactions', filter: `room_id=eq.${roomId}` },
        () => debouncedInvalidate(queryClient, QUERY_KEYS.roomDetails(roomId))
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);

  return query;
}

export function useRooms(searchQuery: string = "", category: string = "All") {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery<Room[], Error>({
    queryKey: QUERY_KEYS.rooms(searchQuery, category),
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const pageSize = 12;
      const from = (pageParam as number) * pageSize;
      const to = from + pageSize - 1;

      let queryBuilder = supabase
        .from('rooms')
        .select(`
          id, title, description, status, is_private,
          builder_id, builder_name, tags, cover_image, primary_link,
          project_stage, primary_goal, observer_count, update_count,
          created_at, updated_at,
          users!builder_id(is_verified_expert, organization_name, organization_logo_url),
          room_observers(observer_id)
        `)
        .eq('status', 'active')
        .eq('is_private', false);

      if (searchQuery) {
        queryBuilder = queryBuilder.or(`title.ilike.%${searchQuery}%,builder_name.ilike.%${searchQuery}%`);
      }

      if (category && category !== "All") {
        queryBuilder = queryBuilder.contains('tags', [category]);
      }

      const { data, error } = await queryBuilder
        .order('updated_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return (data || []).map(row => {
        const usersObj = Array.isArray(row.users) ? row.users[0] : row.users;
        return {
          ...normalizeRow(row),
          builderIsVerifiedExpert: !!((usersObj as any)?.is_verified_expert),
          builderOrgName: (usersObj as any)?.organization_name,
          builderOrgLogo: (usersObj as any)?.organization_logo_url,
        };
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 12 ? allPages.length : undefined;
    },
  });

  useEffect(() => {
    const channelName = CHANNEL_NAMES.publicRooms;
    removeStaleChannel(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        () => {
          debouncedInvalidate(queryClient, ['rooms']);
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

  const query = useInfiniteQuery<Room[], Error>({
    queryKey: QUERY_KEYS.userRooms(userId ?? ''),
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      if (!userId) return [];
      const pageSize = 12;
      const from = (pageParam as number) * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from('rooms')
        .select(`
          id, title, description, status, is_private,
          builder_id, builder_name, tags, cover_image, primary_link,
          project_stage, primary_goal, observer_count, update_count,
          invite_token, whitelisted_domains,
          created_at, updated_at,
          room_observers(observer_id)
        `)
        .eq('builder_id', userId)
        .order('updated_at', { ascending: false })
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

    const channelName = CHANNEL_NAMES.userRooms(userId);
    removeStaleChannel(channelName);

    const updatesChannelName = `user-rooms-updates-${userId}`;
    removeStaleChannel(updatesChannelName);

    // Refetch when any of the user's rooms are updated (e.g., status change)
    const roomsChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `builder_id=eq.${userId}` },
        () => {
          debouncedInvalidate(queryClient, QUERY_KEYS.userRooms(userId));
        }
      )
      .subscribe();

    // Refetch when a new update is posted in any of the user's rooms so the
    // room bubbles to the top (updated_at is bumped on each post).
    const updatesChannel = supabase
      .channel(updatesChannelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'updates', filter: `author_id=eq.${userId}` },
        () => {
          debouncedInvalidate(queryClient, QUERY_KEYS.userRooms(userId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomsChannel);
      supabase.removeChannel(updatesChannel);
    };
  }, [userId, queryClient]);

  return query;
}

export function useObservedRooms(userId?: string) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery<Room[], Error>({
    queryKey: QUERY_KEYS.observedRooms(userId ?? ''),
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
          rooms:rooms(
            id, title, description, status, is_private,
            builder_id, builder_name, tags, cover_image, primary_link,
            project_stage, primary_goal, observer_count, update_count,
            created_at, updated_at,
            users!builder_id(is_verified_expert, organization_name, organization_logo_url),
            room_observers(observer_id)
          )
        `)
        .eq('observer_id', userId)
        .order('joined_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      // Map to return just the room objects formatted correctly
      return (data || []).map(row => {
        const room = Array.isArray(row.rooms) ? row.rooms[0] : row.rooms;
        if (!room) return null;
        const usersObj = Array.isArray(room.users) ? room.users[0] : room.users;
        return {
          ...normalizeRow(room),
          builderIsVerifiedExpert: !!((usersObj as any)?.is_verified_expert),
          builderOrgName: (usersObj as any)?.organization_name,
          builderOrgLogo: (usersObj as any)?.organization_logo_url,
        };
      }).filter(Boolean);
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 12 ? allPages.length : undefined;
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userId) return;

    const channelName = CHANNEL_NAMES.observedRooms(userId);
    removeStaleChannel(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_observers', filter: `observer_id=eq.${userId}` },
        () => {
          debouncedInvalidate(queryClient, QUERY_KEYS.observedRooms(userId));
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

export function useRegenerateInviteToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roomId: string) => {
      const { data, error } = await supabase.rpc('regenerate_invite_token', { p_room_id: roomId });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, roomId) => {
      queryClient.invalidateQueries({ queryKey: ['room-details', roomId] });
    }
  });
}

export function useUpdateRoomAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ roomId, whitelistedDomains }: { roomId: string, whitelistedDomains: string[] }) => {
      const { data, error } = await supabase.from('rooms').update({ whitelisted_domains: whitelistedDomains }).eq('id', roomId).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ['room-details', roomId] });
    }
  });
}

export function useJoinPrivateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ roomId, inviteToken }: { roomId: string, inviteToken?: string | null }) => {
      const { data, error } = await supabase.rpc('join_private_room', { 
        p_room_id: roomId,
        p_invite_token: inviteToken || null
      });
      if (error) throw error;
      if (!data) throw new Error("Access denied or invalid invite token.");
      return data;
    },
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ['room-details', roomId] });
    }
  });
}
