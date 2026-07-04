import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../components/auth/AuthContext';
import { Badge, UserBadge, ReputationEvent, BuilderLevel } from '../types/pow';

export function useProofOfWork(userId?: string) {
  const queryClient = useQueryClient();

  // Fetch all global badges (definitions)
  const { data: allBadges, isLoading: loadingBadges } = useQuery({
    queryKey: ['badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('points_required', { ascending: true });
      if (error) throw error;
      return data as Badge[];
    }
  });

  // Fetch specific user's earned badges
  const { data: userBadges, isLoading: loadingUserBadges } = useQuery({
    queryKey: ['user_badges', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('user_badges')
        .select('*, badge:badges(*)')
        .eq('user_id', userId)
        .order('issued_at', { ascending: false });
      if (error) throw error;
      return data as UserBadge[];
    },
    enabled: !!userId
  });

  // Fetch recent reputation events (Timeline)
  const { data: reputationEvents, isLoading: loadingEvents } = useQuery({
    queryKey: ['reputation_events', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('reputation_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as ReputationEvent[];
    },
    enabled: !!userId
  });

  // Derived calculations for Level
  const calculateLevel = (userPoints: number, badges?: Badge[]): BuilderLevel | null => {
    if (!badges) return null;
    const levelBadges = badges.filter(b => b.badge_type === 'level').sort((a, b) => a.points_required - b.points_required);
    
    let currentLevel = levelBadges[0];
    let nextLevel: Badge | undefined = undefined;

    for (let i = 0; i < levelBadges.length; i++) {
      if (userPoints >= levelBadges[i].points_required) {
        currentLevel = levelBadges[i];
        nextLevel = levelBadges[i + 1];
      } else {
        break;
      }
    }

    if (!nextLevel) {
      return {
        currentLevel,
        progress: 100,
        pointsToNext: 0
      };
    }

    const pointsIntoLevel = userPoints - currentLevel.points_required;
    const pointsNeededForNext = nextLevel.points_required - currentLevel.points_required;
    const progress = Math.min(100, Math.max(0, (pointsIntoLevel / pointsNeededForNext) * 100));

    return {
      currentLevel,
      nextLevel,
      progress,
      pointsToNext: nextLevel.points_required - userPoints
    };
  };

  // Mutation to add a reputation event
  const addReputationEvent = useMutation({
    mutationFn: async ({ action_type, points, room_id, metadata }: { action_type: string, points: number, room_id?: string, metadata?: any }) => {
      if (!userId) throw new Error("No user ID");
      const { data, error } = await supabase
        .from('reputation_events')
        .insert({
          user_id: userId,
          action_type,
          points,
          room_id,
          metadata
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reputation_events', userId] });
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    }
  });

  return {
    allBadges,
    userBadges,
    reputationEvents,
    loading: loadingBadges || loadingUserBadges || loadingEvents,
    calculateLevel,
    addReputationEvent
  };
}
