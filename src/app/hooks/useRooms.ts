import { useEffect } from 'react';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../components/auth/AuthContext';

import { normalizeRow, registerAvatarUrl } from '../utils/helpers';
import { QUERY_KEYS, CHANNEL_NAMES } from '../constants';
import { PATCHWORK_OFFICIAL_ROOM_ID } from '../constants/patchwork';
import type { Room, Update, Reaction } from '../types';

import type { QueryClient, QueryKey } from '@tanstack/react-query';

export function parseBuilderInfo(usersObj: unknown) {
  if (!usersObj) return { builderIsVerifiedExpert: false, builderOrgName: null, builderOrgLogo: null, builderAvatarUrl: null };
  const obj = Array.isArray(usersObj) ? usersObj[0] : usersObj;
  const safeObj = obj as Record<string, unknown>;
  const avatarUrl = (safeObj?.avatar_url || safeObj?.avatar) as string | null;
  const builderId = safeObj?.id as string | null;
  if (builderId) registerAvatarUrl(builderId, avatarUrl);
  return {
    builderIsVerifiedExpert: !!safeObj?.is_verified_expert,
    builderOrgName: obj?.organization_name ?? null,
    builderOrgLogo: obj?.organization_logo_url ?? null,
    builderAvatarUrl: avatarUrl ?? null,
  };
}


/** Helper: remove any existing Supabase channel with this name before (re-)subscribing.
 *  Prevents the "cannot add postgres_changes callbacks after subscribe()" crash
 *  that occurs in React StrictMode or when an effect re-fires before cleanup. */
function removeStaleChannel(name: string) {
  const existing = supabase.getChannels().find(c => c.topic === `realtime:${name}`);
  if (existing) supabase.removeChannel(existing);
}
// Local debounce timer maps are no longer needed globally.
// We use local timeouts inside the useEffects to ensure proper cleanup.
export function useRoomDetails(roomId?: string, userId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery<Room | null, Error>({
    queryKey: [...QUERY_KEYS.roomDetails(roomId ?? ''), userId],
    queryFn: async () => {
      if (!roomId) return null;

      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select(`
          *,
          users!builder_id(
            id,
            is_verified_expert,
            organization_name,
            organization_logo_url,
            avatar
          )
        `)
        .eq('id', roomId)
        .maybeSingle();

      console.log('useRoomDetails fetch result:', { roomId, userId, roomData, roomError });

      if (roomError) throw new Error(roomError.message || JSON.stringify(roomError));
      if (!roomData) return null;

      // Strict Privacy Check — works with both legacy is_private and new visibility
      const visibility = roomData.visibility ?? (roomData.is_private ? 'private' : 'public');
      const isRestricted = ['private', 'org_only', 'nda_protected'].includes(visibility);

      if (isRestricted) {
        if (!userId) return null; // Unauthenticated users cannot see restricted rooms

        if (roomData.builder_id !== userId) {
          // Not the builder — check if they are an approved observer
          const { data: observerData } = await supabase
            .from('room_observers')
            .select('observer_id')
            .eq('room_id', roomId)
            .eq('observer_id', userId)
            .maybeSingle();

          console.log('useRoomDetails observer check:', { observerData });
          if (!observerData) return null; // Not authorized — hide room completely
        }
      }

      const usersObj = Array.isArray(roomData.users) ? roomData.users[0] : roomData.users;
      return {
        ...normalizeRow<Record<string, unknown>>(roomData as Record<string, unknown>),
        visibility: (roomData.visibility ?? (roomData.is_private ? 'private' : 'public')) as Room['visibility'],
        contentPermissions: roomData.content_permissions ?? null,
        protectionFlags: roomData.protection_flags ?? null,
        ndaText: roomData.nda_text ?? null,
        authorshipTimestamp: roomData.authorship_timestamp ?? null,
        ...parseBuilderInfo(usersObj),
        // These will be hydrated by separate queries below, but we initialize them here for compat
        updates: [],
        reactions: []
      } as unknown as Room;
    },
    enabled: !!roomId,
  });

  // Fetch updates separately
  const updatesQuery = useQuery<Update[], Error>({
    queryKey: ['room-updates', roomId],
    queryFn: async () => {
      if (!roomId) return [];
      const { data, error } = await supabase
        .from('updates')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message || JSON.stringify(error));
      return (data || []).map(row => normalizeRow<Update>(row));
    },
    enabled: !!roomId,
  });

  // Fetch reactions separately
  const reactionsQuery = useQuery<Reaction[], Error>({
    queryKey: ['room-reactions', roomId],
    queryFn: async () => {
      if (!roomId) return [];
      const { data, error } = await supabase
        .from('reactions')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message || JSON.stringify(error));

      // Safely fetch and register observer avatars (non-fatal)
      const obsIds = (data || []).map((r: { observer_id: string }) => r.observer_id).filter(Boolean);
      const obsAvatarMap: Record<string, string> = {};
      if (obsIds.length > 0) {
        try {
          const { data: obsUsers } = await supabase
            .from('users')
            .select('id, avatar')
            .in('id', Array.from(new Set(obsIds)));
          (obsUsers || []).forEach((u: { id: string; avatar: string | null }) => {
            const av = u.avatar;
            if (av) {
              obsAvatarMap[u.id] = av;
              registerAvatarUrl(u.id, av);
            }
          });
        } catch { /* non-fatal */ }
      }

      return (data || []).map(row => {
        const normalized = normalizeRow<Reaction>(row);
        normalized.observerAvatar = obsAvatarMap[row.observer_id] || null;
        return normalized;
      });
    },
    enabled: !!roomId,
  });

  useEffect(() => {
    if (!roomId) return;

    const channelName = CHANNEL_NAMES.roomDetails(roomId);
    removeStaleChannel(channelName);

    let invalidateTimer: NodeJS.Timeout;
    const invalidate = (keys: QueryKey) => {
      clearTimeout(invalidateTimer);
      invalidateTimer = setTimeout(() => queryClient.invalidateQueries({ queryKey: keys }), 1500);
    };

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        () => invalidate(QUERY_KEYS.roomDetails(roomId))
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'updates', filter: `room_id=eq.${roomId}` },
        () => invalidate(['room-updates', roomId])
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reactions', filter: `room_id=eq.${roomId}` },
        () => invalidate(['room-reactions', roomId])
      )
      .subscribe();

    return () => {
      clearTimeout(invalidateTimer);
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);

  // Combine them for backward compatibility so existing UI doesn't break
  const combinedQuery = {
    ...query,
    data: query.data ? {
      ...query.data,
      updates: updatesQuery.data || [],
      reactions: reactionsQuery.data || []
    } : null,
    isLoading: query.isLoading || updatesQuery.isLoading || reactionsQuery.isLoading
  };

  return combinedQuery;
}

export function useOfficialRoom() {
  return useQuery<Room | null, Error>({
    queryKey: ['official_room', PATCHWORK_OFFICIAL_ROOM_ID],
    queryFn: async () => {
      if (!PATCHWORK_OFFICIAL_ROOM_ID || PATCHWORK_OFFICIAL_ROOM_ID === '00000000-0000-0000-0000-000000000000') return null;

      const { data, error } = await supabase
        .from('rooms')
        .select(`
          id, title, description, status, is_private,
          builder_id, builder_name, tags, cover_image, primary_link,
          project_stage, primary_goal, observer_count, update_count,
          created_at, updated_at,
          users!builder_id(is_verified_expert, organization_name, organization_logo_url),
          room_observers(observer_id)
        `)
        .eq('id', PATCHWORK_OFFICIAL_ROOM_ID)
        .maybeSingle();

      if (error || !data) return null;

      return {
        ...normalizeRow(data),
        ...parseBuilderInfo(data.users),
      } as Room;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
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
          room_observers(observer_id),
          updates(content, created_at)
        `)
        .eq('status', 'active')
        .eq('visibility', 'public');

      if (searchQuery) {
        queryBuilder = queryBuilder.or(`title.ilike.%${searchQuery}%,builder_name.ilike.%${searchQuery}%`);
      }

      if (category && category !== "All") {
        queryBuilder = queryBuilder.contains('tags', [category]);
      }

      const { data, error } = await queryBuilder
        .order('updated_at', { ascending: false })
        .range(from, to);

      if (error) throw new Error(error.message || JSON.stringify(error));
      return (data || []).map(row => {
        const updatesObj = Array.isArray(row.updates) ? row.updates[0] : row.updates;
        return {
          ...normalizeRow<Record<string, unknown>>(row as Record<string, unknown>),
          ...parseBuilderInfo(row.users),
          latestUpdate: updatesObj ? normalizeRow<Update>(updatesObj) : undefined,
        } as unknown as Room;
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 12 ? allPages.length : undefined;
    },
  });

  useEffect(() => {
    const channelName = CHANNEL_NAMES.publicRooms;
    removeStaleChannel(channelName);

    let invalidateTimer: NodeJS.Timeout;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        () => {
          clearTimeout(invalidateTimer);
          invalidateTimer = setTimeout(() => queryClient.invalidateQueries({ queryKey: ['rooms'] }), 1500);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(invalidateTimer);
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
          users!builder_id(is_verified_expert, organization_name, organization_logo_url),
          room_observers(observer_id),
          updates(content, created_at)
        `)
        .eq('builder_id', userId)
        .order('updated_at', { ascending: false })
        .range(from, to);

      if (error) throw new Error(error.message || JSON.stringify(error));
      return (data || []).map(row => {
        const updatesObj = Array.isArray(row.updates) ? row.updates[0] : row.updates;
        return {
          ...normalizeRow<Record<string, unknown>>(row as Record<string, unknown>),
          ...parseBuilderInfo(row.users),
          latestUpdate: updatesObj ? normalizeRow<Update>(updatesObj) : undefined,
        } as unknown as Room;
      });
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

    let invalidateTimer: NodeJS.Timeout;
    const invalidate = () => {
      clearTimeout(invalidateTimer);
      invalidateTimer = setTimeout(() => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userRooms(userId) }), 1500);
    };

    // Refetch when any of the user's rooms are updated (e.g., status change)
    const roomsChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `builder_id=eq.${userId}` },
        invalidate
      )
      .subscribe();

    // Refetch when a new update is posted in any of the user's rooms so the
    // room bubbles to the top (updated_at is bumped on each post).
    const updatesChannel = supabase
      .channel(updatesChannelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'updates', filter: `author_id=eq.${userId}` },
        invalidate
      )
      .subscribe();

    return () => {
      clearTimeout(invalidateTimer);
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
            room_observers(observer_id),
            updates(content, created_at)
          )
        `)
        .eq('observer_id', userId)
        .order('joined_at', { ascending: false })
        .range(from, to);

      if (error) throw new Error(error.message || JSON.stringify(error));
      
      // Map to return just the room objects formatted correctly
      return (data || []).map(row => {
        const room = Array.isArray(row.rooms) ? row.rooms[0] : row.rooms;
        if (!room) return null;
        const updatesObj = Array.isArray(room.updates) ? room.updates[0] : room.updates;
        return {
          ...normalizeRow<Record<string, unknown>>(room as Record<string, unknown>),
          ...parseBuilderInfo(room.users),
          latestUpdate: updatesObj ? normalizeRow<Update>(updatesObj) : undefined,
        } as unknown as Room;
      }).filter((room): room is Room => Boolean(room));
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

    let invalidateTimer: NodeJS.Timeout;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_observers', filter: `observer_id=eq.${userId}` },
        () => {
          clearTimeout(invalidateTimer);
          invalidateTimer = setTimeout(() => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.observedRooms(userId) }), 1500);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(invalidateTimer);
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
      if (error) throw new Error(error.message || JSON.stringify(error));
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
      if (error) throw new Error(error.message || JSON.stringify(error));
      return data;
    },
    onSuccess: (_, { roomId }) => {
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
      if (error) throw new Error(error.message || JSON.stringify(error));
      if (!data) throw new Error("Access denied or invalid invite token.");
      return data;
    },
    onSuccess: (_, { roomId }) => {
      // Invalidate by prefix so it catches keys with userId appended (e.g. ['room-details', roomId, userId])
      queryClient.invalidateQueries({ queryKey: ['room-details', roomId] });
    }
  });
}
