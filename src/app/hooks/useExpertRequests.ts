import { useQuery } from '@tanstack/react-query';
import { supabase } from '../components/auth/AuthContext';

export interface ExpertRequest {
  id: string;
  builder_id: string;
  expert_id: string;
  room_id: string;
  build_summary: string;
  specific_challenge: string;
  questions: string;
  priority: string;
  is_public: boolean;
  deadline: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  created_at: string;
  rooms?: { title: string };
  users?: { name: string; avatar_url: string }; // Builder info
}

export function useExpertRequests(expertId?: string) {
  return useQuery({
    queryKey: ['expert_requests', expertId],
    queryFn: async () => {
      if (!expertId) return [];

      const { data, error } = await supabase
        .from('expert_review_requests')
        .select(`
          *,
          rooms ( title ),
          users!builder_id ( name, avatar_url )
        `)
        .eq('expert_id', expertId)
        .order('created_at', { ascending: false });

      if (error && error.code !== '42P01') throw error;
      return (data || []) as unknown as ExpertRequest[];
    },
    enabled: !!expertId,
  });
}
