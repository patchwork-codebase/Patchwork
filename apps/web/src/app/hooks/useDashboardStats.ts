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
    enabled: !!userId,
    refetchInterval: 30000
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

      interface ActivityEvent {
        name: string;
        text: string;
        time: string;
        color: string;
        date: Date;
        userId: string;
      }
      const mergedEvents: ActivityEvent[] = [];

      if (reactionsRes.data) {
        reactionsRes.data.forEach((row) => {
          const re = row as { type: string; created_at: string; observer_id: string; users?: { name?: string } | { name?: string }[] };
          const userObj = Array.isArray(re.users) ? re.users[0] : re.users;
          const name = userObj?.name || 'Someone';
          const text = re.type === 'like' ? 'reacted "Like" to your update' : `replied to your update`;
          mergedEvents.push({
            name,
            text,
            time: timeAgo(re.created_at),
            color: 'bg-primary-500',
            date: new Date(re.created_at),
            userId: re.observer_id
          });
        });
      }

      if (observersRes.data) {
        observersRes.data.forEach((row) => {
          const ob = row as { joined_at: string; observer_id: string; users?: { name?: string } | { name?: string }[]; rooms?: { title?: string } | { title?: string }[] };
          const userObj = Array.isArray(ob.users) ? ob.users[0] : ob.users;
          const roomObj = Array.isArray(ob.rooms) ? ob.rooms[0] : ob.rooms;
          const name = userObj?.name || 'Someone';
          const roomTitle = roomObj?.title || 'your room';
          mergedEvents.push({
            name,
            text: `started following your "${roomTitle}" room`,
            time: timeAgo(ob.joined_at),
            color: 'bg-emerald-500',
            date: new Date(ob.joined_at),
            userId: ob.observer_id
          });
        });
      }

      return mergedEvents.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
    },
    enabled: !!userId,
    refetchInterval: 30000
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

      return (data || []).map((row) => {
        const ob = row as { observer_id: string; users?: { name?: string } | { name?: string }[] };
        const userObj = Array.isArray(ob.users) ? ob.users[0] : ob.users;
        const name = userObj?.name || 'Observer';
        const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
        return {
          initials,
          name,
          visits: 'Active',
          bg: 'bg-primary-500/20',
          color: 'text-primary-400',
          userId: ob.observer_id
        };
      });
    },
    enabled: !!roomId
  });
}
