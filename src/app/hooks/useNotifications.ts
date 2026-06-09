import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../components/auth/AuthContext';

export interface NotificationMetadata {
  reaction_type?: string;
  reaction_text?: string;
  room_title?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: 'reaction' | 'room_follow';
  reference_id: string;
  read: boolean;
  metadata: NotificationMetadata;
  created_at: string;
  actor?: {
    name: string;
  };
}

export function useNotifications(userId?: string) {
  const queryClient = useQueryClient();

  // Fetch notifications
  const query = useQuery<Notification[], Error>({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:users!notifications_actor_id_fkey(name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  // Mark all as read mutation
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });

  // Real-time subscription
  useEffect(() => {
    if (!userId) return;

    const channelName = `notifications-${userId}`;

    // Remove any stale channel with the same name before subscribing.
    // This prevents the "cannot add postgres_changes callbacks after subscribe()" error
    // that occurs in React StrictMode or when the effect re-fires before cleanup runs.
    const existing = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`);
    if (existing) {
      supabase.removeChannel(existing);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  // Dynamic Favicon for unread notifications
  const unreadCount = query.data?.filter(n => !n.read).length || 0;

  useEffect(() => {
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) return;
    
    if (unreadCount > 0) {
      const svg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="patchworkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#6C5CE7" />
            <stop offset="100%" stop-color="#8B7CF8" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="120" fill="url(#patchworkGrad)" />
        <g stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" transform="translate(100, 100) scale(13)">
          <path d="m15 12-8.373 8.373a1 1 0 1 1-1.414-1.414L13.586 10.586"/>
          <path d="m18 13.4-9-9"/>
          <path d="M12 4.4 14.6 2l3.4 3.4L15.6 8z"/>
          <path d="M18.4 10.6 21 8l-3.4-3.4L15 7.2"/>
        </g>
        <circle cx="420" cy="92" r="70" fill="#f43f5e" stroke="#0A0910" stroke-width="24" />
      </svg>`;
      link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    } else {
      link.href = '/icon.svg';
    }
  }, [unreadCount]);

  return {
    ...query,
    markAllAsRead,
  };
}
