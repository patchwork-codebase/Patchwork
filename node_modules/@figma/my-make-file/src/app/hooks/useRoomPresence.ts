import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../components/auth/AuthContext';
import { getAvatarUrl } from '../utils/helpers';

export interface PresenceUser {
  id: string;
  name: string;
  avatar_url?: string;
}

export function useRoomPresence(roomId: string | undefined, user: any) {
  const [viewers, setViewers] = useState<PresenceUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, PresenceUser>>({});
  const typingTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    if (!roomId) return;

    const channelName = `room_presence:${roomId}`;
    
    // Clean up existing to prevent StrictMode double-subscriptions
    const existing = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`);
    if (existing) supabase.removeChannel(existing);

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user?.id || `anon_${Math.random().toString(36).substr(2, 9)}`,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const activeUsers: PresenceUser[] = [];
        for (const presences of Object.values(state)) {
          const p = presences[0] as any;
          if (p && p.user_id) {
            activeUsers.push({
              id: p.user_id,
              name: p.name,
              avatar_url: p.avatar_url,
            });
          }
        }
        
        // Deduplicate (if multiple tabs open)
        const uniqueViewers = activeUsers.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
        setViewers(uniqueViewers);
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.isTyping) {
          setTypingUsers(prev => ({
            ...prev,
            [payload.user_id]: {
              id: payload.user_id,
              name: payload.name,
              avatar_url: payload.avatar_url,
            }
          }));

          // Auto-clear typing indicator after 5 seconds of inactivity
          if (typingTimeouts.current[payload.user_id]) {
            clearTimeout(typingTimeouts.current[payload.user_id]);
          }
          typingTimeouts.current[payload.user_id] = setTimeout(() => {
            setTypingUsers(prev => {
              const next = { ...prev };
              delete next[payload.user_id];
              return next;
            });
          }, 5000);
        } else {
          setTypingUsers(prev => {
            const next = { ...prev };
            delete next[payload.user_id];
            return next;
          });
          if (typingTimeouts.current[payload.user_id]) {
            clearTimeout(typingTimeouts.current[payload.user_id]);
          }
        }
      });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED' && user) {
        await channel.track({
          user_id: user.id,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown User',
          avatar_url: user.user_metadata?.avatar_url || getAvatarUrl(user.id),
          online_at: new Date().toISOString(),
        });
      }
    });

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
      // Clean up timeouts
      Object.values(typingTimeouts.current).forEach(clearTimeout);
    };
  }, [roomId, user]);

  const sendTypingEvent = useCallback((isTyping: boolean) => {
    if (!roomId || !user) return;
    const channelName = `room_presence:${roomId}`;
    const channel = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`);
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          isTyping,
          user_id: user.id,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown User',
          avatar_url: user.user_metadata?.avatar_url || getAvatarUrl(user.id),
        },
      });
    }
  }, [roomId, user]);

  return { viewers, typingUsers: Object.values(typingUsers), sendTypingEvent };
}
