import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../components/auth/AuthContext';
import type { BuildTimelineEvent } from '../types';

/**
 * Fetches the immutable build timeline for a room.
 * Accessible by builders, room members, and anyone for public rooms.
 */
export function useBuildTimeline(roomId?: string) {
  return useQuery<BuildTimelineEvent[], Error>({
    queryKey: ['build-timeline', roomId],
    queryFn: async () => {
      if (!roomId) return [];

      try {
        const { data, error } = await supabase.rpc('get_build_timeline', {
          p_room_id: roomId,
        });

        // 400 = RPC doesn't exist yet (migration not applied). Return empty gracefully.
        if (error) {
          if ((error as any).code === '42883' || error.message?.includes('does not exist')) {
            console.warn('[useBuildTimeline] RPC not found — migration may not be applied yet.');
          } else {
            console.warn('[useBuildTimeline]', error.message);
          }
          return [];
        }

        return (data || []).map((row: any) => ({
          id: row.event_id,      // renamed from 'id' to avoid SQL ambiguity
          roomId: roomId,
          actorId: row.actor_id ?? null,
          actorName: row.actor_name,
          eventType: row.event_type,
          eventSummary: row.event_summary,
          eventData: row.event_data ?? {},
          versionHash: row.version_hash ?? null,
          createdAt: row.created_at,
        })) as BuildTimelineEvent[];
      } catch {
        return [];
      }
    },
    enabled: !!roomId,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Mutation to manually append a timeline event (builder only).
 * Most events are auto-appended by database triggers.
 */
export function useAppendTimelineEvent(roomId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventType,
      eventSummary,
      eventData = {},
    }: {
      eventType: BuildTimelineEvent['eventType'];
      eventSummary: string;
      eventData?: Record<string, unknown>;
    }) => {
      if (!roomId) throw new Error('roomId is required');

      const { data, error } = await supabase.rpc('append_timeline_event', {
        p_room_id: roomId,
        p_event_type: eventType,
        p_event_summary: eventSummary,
        p_event_data: eventData,
      });

      if (error) throw error;
      return data as string; // returns UUID of new event
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['build-timeline', roomId] });
    },
  });
}
