import { useQuery } from '@tanstack/react-query';
import { supabase } from '../components/auth/AuthContext';

export function useSummarizeArtifact(url: string) {
  return useQuery({
    queryKey: ['summarize-artifact', url],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('summarize-artifact', {
        body: { url }
      });
      
      if (error) throw error;
      if (!data?.success || !data?.summary) {
        throw new Error("Failed to generate AI summary for this artifact.");
      }
      
      return data.summary as string;
    },
    staleTime: Infinity, // Summaries shouldn't change often, cache them indefinitely
    retry: 1
  });
}
