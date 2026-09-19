import { useQuery } from '@tanstack/react-query';
import { supabase } from '../components/auth/AuthContext';
import { ExpertProfile } from '../components/room/ExpertCard';
import { getAvatarUrl, registerAvatarUrl } from '../utils/helpers';

export function useExperts(searchQuery: string = "", domainFilter: string = "All") {
  return useQuery({
    queryKey: ['experts', searchQuery, domainFilter],
    queryFn: async () => {
      let query = supabase
        .from('users')
        .select('*')
        .eq('is_verified_expert', true);

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data) return [];

      let filteredData = data;
      if (domainFilter && domainFilter !== "All") {
        filteredData = data.filter(user => 
          user.expert_domains && 
          Array.isArray(user.expert_domains) && 
          user.expert_domains.some((d: string) => d.toLowerCase() === domainFilter.toLowerCase())
        );
      }

      const mappedExperts: ExpertProfile[] = filteredData.map(user => {
        const avatarUrl = user.avatar_url || user.avatar;
        registerAvatarUrl(user.id, avatarUrl);
        return {
          id: user.id,
          name: user.name || "Anonymous Expert",
          avatar: avatarUrl || getAvatarUrl(user.id),
          title: user.job_title || user.expert_level || "Verified Expert",
        company: user.company || user.organization_name || "",
        domains: user.expert_domains || ["General"],
        reviewsCompleted: user.expert_reviews_completed || 0,
        rating: user.expert_review_score ? parseFloat(user.expert_review_score) : 5.0,
        activeSlots: user.expert_open_slots !== undefined ? user.expert_open_slots : 3,
        monthlySlots: 10,
        typicalResponseTime: user.expert_avg_response_hours ? `${user.expert_avg_response_hours}h` : "24h"
        };
      });

      // Sort by active slots (available first) then by rating
      mappedExperts.sort((a, b) => {
        if (a.activeSlots > 0 && b.activeSlots <= 0) return -1;
        if (a.activeSlots <= 0 && b.activeSlots > 0) return 1;
        return b.rating - a.rating;
      });

      return mappedExperts;
    }
  });
}
