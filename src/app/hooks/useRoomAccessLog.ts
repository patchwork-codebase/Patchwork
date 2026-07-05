import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '../components/auth/AuthContext';
import type { AccessLogEntry } from '../types';


/**
 * Fetches the access audit log for a room.
 * Only callable by the builder of the room.
 */
export function useRoomAccessLog(roomId?: string, limit = 100) {
  return useQuery<AccessLogEntry[], Error>({
    queryKey: ['room-access-log', roomId, limit],
    queryFn: async () => {
      if (!roomId) return [];

      try {
        const { data, error } = await supabase.rpc('get_room_access_log', {
          p_room_id: roomId,
          p_limit: limit,
        });

        if (error) {
          console.warn('[useRoomAccessLog]', error.message);
          return [];
        }

        return (data || []).map((row: any) => ({
          id: row.log_id,        // renamed from 'id' to avoid SQL ambiguity
          roomId: roomId,
          userId: row.user_id ?? null,
          userName: row.user_name ?? null,
          userEmail: row.user_email ?? null,
          action: row.action,
          metadata: row.metadata ?? {},
          createdAt: row.created_at,
        })) as AccessLogEntry[];
      } catch {
        return [];
      }
    },
    enabled: !!roomId,
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Mutation to log a room access event.
 * Fire-and-forget — does not block the UI.
 */
export function useLogRoomAccess() {
  return useMutation({
    mutationFn: async ({
      roomId,
      action,
      metadata = {},
    }: {
      roomId: string;
      action: AccessLogEntry['action'];
      metadata?: Record<string, unknown>;
    }) => {
      const { error } = await supabase.rpc('log_room_access', {
        p_room_id: roomId,
        p_action: action,
        p_metadata: metadata,
      });
      if (error) console.warn('[useLogRoomAccess] Failed to log:', error.message);
    },
    // No invalidation needed — access log is append-only
  });
}
