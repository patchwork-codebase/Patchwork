import { useState, useEffect, useRef } from "react";
import { supabase } from "../components/auth/AuthContext";
import { RoomMessage, Conversation } from "../types";
import { toast } from "sonner";

import { useQuery, useQueryClient } from "@tanstack/react-query";

export function useChatRoom(roomId: string | undefined) {
  const { data: room } = useQuery({
    queryKey: ['chat_room', roomId],
    queryFn: async () => {
      const { data, error } = await supabase.from('rooms').select('*').eq('id', roomId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!roomId,
  });

  return { room };
}


export function useChatParticipants(roomId: string | undefined) {
  const { data: participants = [] } = useQuery({
    queryKey: ['chat_participants', roomId],
    queryFn: async () => {
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('builder_id')
        .eq('id', roomId)
        .single();
        
      if (roomError) throw roomError;

      const { data: observers, error: obsError } = await supabase
        .from('room_observers')
        .select('observer_id')
        .eq('room_id', roomId);
        
      if (obsError) throw obsError;

      const userIds = new Set<string>();
      if (room?.builder_id) userIds.add(room.builder_id);
      observers?.forEach(o => userIds.add(o.observer_id));

      if (userIds.size === 0) return [];

      const { data: profiles, error: profError } = await supabase
        .from('users')
        .select('id, name, username, avatar, is_verified_expert, organization_logo_url')
        .in('id', Array.from(userIds));

      if (profError) throw profError;

      return profiles.map(p => ({
        id: p.id,
        display: (p.username || p.name || 'User').replace(/\s+/g, ''),
        full_name: p.name || 'User',
        avatar: p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || 'User')}`,
        is_verified_expert: !!p.is_verified_expert,
        organization_logo_url: p.organization_logo_url || null,
      }));
    },
    enabled: !!roomId,
  });

  return { participants };
}

export function useChatMessages(roomId: string | undefined, user: any) {
  const queryClient = useQueryClient();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const channelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['room_messages', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('room_messages')
        .select('*, sender:users!sender_id(id, name, avatar)')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      return data as RoomMessage[];
    },
    enabled: !!roomId && !!user,
  });

  useEffect(() => {
    if (!roomId || !user) return;
    
    // Setup realtime subscription for messages
    const messageChannel = supabase.channel(`room:${roomId}`);
    
    messageChannel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'room_messages',
        filter: `room_id=eq.${roomId}`
      }, async (payload) => {
        // Trigger a refetch to ensure we get relations cleanly 
        // (alternatively we could manually update the query cache here)
        queryClient.invalidateQueries({ queryKey: ['room_messages', roomId] });
        
        // Remove typing indicator if it was an insert
        if (payload.eventType === 'INSERT') {
           setTypingUsers(prev => prev.filter(name => name !== 'Someone'));
           // Mark as read if it's not ours
           if (payload.new.sender_id !== user.id) {
             supabase.from('room_messages').update({ read_at: new Date().toISOString() }).eq('id', payload.new.id).then();
           }
        }
      })
      .subscribe();
      
    // Setup presence channel for cross-platform typing indicators
    const presenceChannel = supabase.channel(`presence-chat:${roomId}`);
    channelRef.current = presenceChannel;
    
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const currentlyTyping: string[] = [];
        
        for (const id in state) {
          const presences: any[] = state[id];
          for (const presence of presences) {
            if (presence.userId !== user.id && presence.typing) {
              currentlyTyping.push(presence.userName || 'Someone');
            }
          }
        }
        setTypingUsers(currentlyTyping);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ userId: user.id, userName: user.user_metadata?.name || 'Someone', typing: false });
        }
      });

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(presenceChannel);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [roomId, user, queryClient]);

  return { messages, isLoading, typingUsers, channelRef, typingTimeoutRef };
}

export function useConversations(user: any) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchConversations = async () => {
      try {
        const { data: builderRooms, error: bError } = await supabase
          .from('rooms')
          .select('id, title, is_private')
          .eq('builder_id', user.id);
          
        if (bError) throw bError;

        const { data: observerRooms, error: oError } = await supabase
          .from('room_observers')
          .select('room_id, rooms(id, title, is_private)')
          .eq('observer_id', user.id);
          
        if (oError) throw oError;

        const allRoomsMap = new Map<string, any>();
        
        builderRooms?.forEach(r => allRoomsMap.set(r.id, r));
        observerRooms?.forEach((r: any) => {
          if (r.rooms) allRoomsMap.set(r.room_id, r.rooms);
        });

        const uniqueRooms = Array.from(allRoomsMap.values());

        const convos = await Promise.all(
          uniqueRooms.map(async (room) => {
            const { data: msgs } = await supabase
              .from('room_messages')
              .select('content, created_at, sender:users!sender_id(name, avatar)')
              .eq('room_id', room.id)
              .order('created_at', { ascending: false })
              .limit(1);

            return {
              ...room,
              last_message: msgs && msgs.length > 0 ? msgs[0] : null
            };
          })
        );

        convos.sort((a, b) => {
          const aTime = a.last_message?.created_at;
          const bTime = b.last_message?.created_at;
          if (!aTime && !bTime) return 0;
          if (!aTime) return 1;
          if (!bTime) return -1;
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        });

        setConversations(convos);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load conversations");
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [user]);

  return { conversations, isLoading };
}

