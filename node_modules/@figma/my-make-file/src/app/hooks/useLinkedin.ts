import { useQuery } from '@tanstack/react-query';
import { supabase } from '../components/auth/AuthContext';

export function useLinkedinAccount(userId: string | undefined) {
  return useQuery({
    queryKey: ['linkedin_account', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase.from('linkedin_accounts').select('*').eq('user_id', userId).maybeSingle();
      if (error) {
        throw error;
      }
      return data;
    },
    enabled: !!userId,
  });
}
