import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../components/auth/AuthContext';

export interface RoomIntegration {
  id: string;
  roomId: string;       // text — matches rooms.id column type
  builderId: string;    // uuid — matches auth.users.id
  platform: string;
  label: string | null;
  url: string;
  metadata: Record<string, any>;
  createdAt: string;
}

function normalizeIntegration(row: any): RoomIntegration {
  return {
    id: row.id,
    roomId: row.room_id,
    builderId: row.builder_id,
    platform: row.platform,
    label: row.label ?? null,
    url: row.url,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

/** Fetch all integrations for a given room */
export function useRoomIntegrations(roomId?: string) {
  return useQuery<RoomIntegration[], Error>({
    queryKey: ['room-integrations', roomId],
    queryFn: async () => {
      if (!roomId) return [];
      const { data, error } = await supabase
        .from('room_integrations')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      // 404 means the table doesn't exist yet (migration not run) — return empty silently
      if (error) {
        if ((error as any).code === 'PGRST116' || error.message?.includes('does not exist') || (error as any).status === 404 || (error as any).hint?.includes('room_integrations')) {
          return [];
        }
        throw error;
      }
      return (data || []).map(normalizeIntegration);
    },
    enabled: !!roomId,
    retry: false, // Don't retry on table-not-found errors
  });
}

/** Add a new integration to a room */
export function useAddIntegration(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation<RoomIntegration, Error, {
    platform: string;
    url: string;
    label?: string;
    builderId: string;
  }>({
    mutationFn: async ({ platform, url, label, builderId }) => {
      const { data, error } = await supabase
        .from('room_integrations')
        .upsert(
          { room_id: roomId, builder_id: builderId, platform, url, label: label || null },
          { onConflict: 'room_id,platform' }
        )
        .select()
        .single();
      if (error) throw error;
      return normalizeIntegration(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-integrations', roomId] });
    },
  });
}

/** Remove an integration from a room */
export function useRemoveIntegration(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (integrationId: string) => {
      const { error } = await supabase
        .from('room_integrations')
        .delete()
        .eq('id', integrationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-integrations', roomId] });
    },
  });
}
