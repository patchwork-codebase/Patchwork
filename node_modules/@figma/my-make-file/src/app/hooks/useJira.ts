import { useQuery } from '@tanstack/react-query';
import { supabase } from '../components/auth/AuthContext';

export function useJiraAccount(userId: string) {
  return useQuery({
    queryKey: ['jira_account', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('jira_accounts')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      return data;
    },
    enabled: !!userId,
  });
}
