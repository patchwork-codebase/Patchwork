import { useQuery } from '@tanstack/react-query';
import { supabase } from '../components/auth/AuthContext';

export function useGithubAccount(userId: string | undefined) {
  return useQuery({
    queryKey: ['github_account', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase.from('github_accounts').select('*').eq('user_id', userId).maybeSingle();
      if (error) {
        throw error;
      }
      return data;
    },
    enabled: !!userId,
  });
}

export function useGithubRepositories(userId: string | undefined) {
  return useQuery({
    queryKey: ['github_repositories', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase.from('repositories').select('*').eq('linked_user_id', userId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
}

export function useGithubDrafts(roomId: string | undefined) {
  return useQuery({
    queryKey: ['github_drafts', roomId],
    queryFn: async () => {
      if (!roomId) return [];
      const { data, error } = await supabase.from('github_drafts').select('*').eq('room_id', roomId).eq('status', 'draft').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!roomId,
  });
}
