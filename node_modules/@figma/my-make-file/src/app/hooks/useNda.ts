import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../components/auth/AuthContext';
import type { NdaTemplate } from '../types';

/**
 * Checks whether the current user has already accepted the NDA for a given room.
 */
export function useCheckNdaAccepted(roomId?: string) {
  return useQuery<boolean, Error>({
    queryKey: ['nda-accepted', roomId],
    queryFn: async () => {
      if (!roomId) return false;

      try {
        const { data, error } = await supabase.rpc('check_nda_accepted', {
          p_room_id: roomId,
        });
        if (error) return false;
        return !!data;
      } catch {
        return false;
      }
    },
    enabled: !!roomId,
    staleTime: 1000 * 60 * 5, // 5 minutes — NDA acceptance is sticky
  });
}

/**
 * Fetches the active global NDA template text.
 */
export function useNdaTemplate() {
  return useQuery<NdaTemplate | null, Error>({
    queryKey: ['nda-template'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('get_active_nda_template');
        if (error) {
          console.warn('[useNdaTemplate]', error.message);
          return null;
        }
        if (!data || data.length === 0) return null;
        const row = data[0];
        return {
          version: row.version,
          title: row.title,
          body: row.body,
        } as NdaTemplate;
      } catch {
        return null;
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour — templates change infrequently
  });
}

/**
 * Mutation to accept the NDA for a room.
 * On success, invalidates the nda-accepted check and room-details queries.
 */
export function useAcceptNda(roomId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!roomId) throw new Error('roomId is required');

      const { data, error } = await supabase.rpc('accept_room_nda', {
        p_room_id: roomId,
      });

      if (error) throw error;
      return !!data;
    },
    onSuccess: () => {
      // Invalidate the NDA check so the gate is lifted
      queryClient.invalidateQueries({ queryKey: ['nda-accepted', roomId] });
      // Refetch room details so the observer is now present
      queryClient.invalidateQueries({ queryKey: ['room-details', roomId] });
    },
  });
}
