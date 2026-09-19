import { useQuery } from '@tanstack/react-query';
import { supabase } from '../components/auth/AuthContext';

export interface NotionAccount {
  id: string;
  user_id: string;
  workspace_name: string;
  workspace_icon: string;
  bot_id: string;
  created_at: string;
}

export function useNotionAccount(userId: string | undefined) {
  return useQuery({
    queryKey: ['notion-account', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('notion_accounts')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching Notion account:", error);
        return null;
      }
      return data as NotionAccount | null;
    },
    enabled: !!userId,
  });
}
