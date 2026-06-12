import { useQuery } from '@tanstack/react-query';
import { supabase } from '../components/auth/AuthContext';
import { timeAgo } from '../utils/helpers';

export function useDashboardStats(userId?: string) {
  return useQuery({
    queryKey: ['dashboard-stats', userId],
    queryFn: async () => {
      if (!userId) return { reactions: [], observers: [] };
      
      const [reactionsRes, observersRes] = await Promise.all([
        supabase
          .from('reactions')
          .select('*, rooms!inner(builder_id)')
          .eq('rooms.builder_id', userId),
        supabase
          .from('room_observers')
          .select('room_id, observer_id, joined_at, rooms!inner(builder_id)')
          .eq('rooms.builder_id', userId)
      ]);

      if (reactionsRes.error) throw reactionsRes.error;
      if (observersRes.error) throw observersRes.error;

      return {
        reactions: reactionsRes.data || [],
        observers: observersRes.data || []
      };
    },
    enabled: !!userId
  });
}

export function useRecentActivity(userId?: string) {
  return useQuery({
    queryKey: ['recent-activity', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const [reactionsRes, observersRes] = await Promise.all([
        supabase
          .from('reactions')
          .select('created_at, type, observer_id, update_id, users(name), rooms!inner(builder_id)')
          .eq('rooms.builder_id', userId)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('room_observers')
          .select('joined_at, observer_id, room_id, rooms!inner(title, builder_id), users(name)')
          .eq('rooms.builder_id', userId)
          .order('joined_at', { ascending: false })
          .limit(5)
      ]);

      const mergedEvents: any[] = [];

      if (reactionsRes.data) {
        reactionsRes.data.forEach((re: any) => {
          const name = re.users?.name || 'Someone';
          const text = re.type === 'like' ? 'reacted "Like" to your update' : `replied to your update`;
          mergedEvents.push({
            name,
            text,
            time: timeAgo(re.created_at),
            color: 'bg-[#6C5CE7]',
            date: new Date(re.created_at)
          });
        });
      }

      if (observersRes.data) {
        observersRes.data.forEach((ob: any) => {
          const name = ob.users?.name || 'Someone';
          const roomTitle = ob.rooms?.title || 'your room';
          mergedEvents.push({
            name,
            text: `started following your "${roomTitle}" room`,
            time: timeAgo(ob.joined_at),
            color: 'bg-emerald-500',
            date: new Date(ob.joined_at)
          });
        });
      }

      return mergedEvents.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
    },
    enabled: !!userId
  });
}

export function useRoomObservers(roomId?: string) {
  return useQuery({
    queryKey: ['room-observers', roomId],
    queryFn: async () => {
      if (!roomId) return [];
      
      const { data, error } = await supabase
        .from('room_observers')
        .select('room_id, observer_id, joined_at, users(name)')
        .eq('room_id', roomId);

      if (error) throw error;

      return (data || []).map((ob: any) => {
        const name = ob.users?.name || 'Observer';
        const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
        return {
          initials,
          name,
          visits: 'Active',
          bg: 'bg-[#6C5CE7]/20',
          color: 'text-[#8B7CF8]'
        };
      });
    },
    enabled: !!roomId
  });
}
