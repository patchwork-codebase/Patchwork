import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../components/auth/AuthContext";
import { toast } from "sonner";
import { RoomMessage } from "../types";

export function useChatMutations(roomId: string | undefined, user: any) {
  const queryClient = useQueryClient();

  const sendMessage = useMutation({
    mutationFn: async ({ content, mediaUrl, mediaType, mentionedUserIds }: { content: string; mediaUrl?: string; mediaType?: string, mentionedUserIds?: string[] }) => {
      if (!roomId || !user) throw new Error("Missing room or user");
      const { data, error } = await supabase
        .from('room_messages')
        .insert({
          room_id: roomId,
          sender_id: user.id,
          content: content,
          media_url: mediaUrl,
          media_type: mediaType,
          mentioned_user_ids: mentionedUserIds,
        })
        .select('*, sender:users!sender_id(id, name, avatar)')
        .single();

      if (error) throw error;
      return data as RoomMessage;
    },
    onMutate: async (newMsg) => {
      // Optimistic update for offline support
      const previousMessages = queryClient.getQueryData<RoomMessage[]>(['room_messages', roomId]);
      
      const optimisticMessage: RoomMessage = {
        id: `temp-${Date.now()}`,
        room_id: roomId!,
        sender_id: user!.id,
        content: newMsg.content,
        media_url: newMsg.mediaUrl,
        media_type: newMsg.mediaType,
        created_at: new Date().toISOString(),
        is_edited: false,
        sender: {
          id: user!.id,
          name: user!.user_metadata?.name || 'You',
          avatar: user!.user_metadata?.avatar_url,
        }
      };

      queryClient.setQueryData(['room_messages', roomId], (old: RoomMessage[] = []) => [...old, optimisticMessage]);

      return { previousMessages, optimisticMessage };
    },
    onError: (err, newMsg, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['room_messages', roomId], context.previousMessages);
      }
      toast.error("Failed to send message. Will retry when online.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['room_messages', roomId] });
    },
  });

  const deleteMessage = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase.from('room_messages').delete().eq('id', messageId);
      if (error) throw error;
      return messageId;
    },
    onSuccess: (messageId) => {
      queryClient.setQueryData(['room_messages', roomId], (old: RoomMessage[] = []) => 
        old.filter(msg => msg.id !== messageId)
      );
    }
  });

  const editMessage = useMutation({
    mutationFn: async ({ messageId, newContent }: { messageId: string, newContent: string }) => {
      const { error } = await supabase
        .from('room_messages')
        .update({ content: newContent, is_edited: true })
        .eq('id', messageId);
      if (error) throw error;
      return { messageId, newContent };
    },
    onSuccess: ({ messageId, newContent }) => {
      queryClient.setQueryData(['room_messages', roomId], (old: RoomMessage[] = []) => 
        old.map(msg => msg.id === messageId ? { ...msg, content: newContent, is_edited: true } : msg)
      );
    }
  });

  const reactToMessage = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string, emoji: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from('message_reactions').insert({
        message_id: messageId,
        user_id: user.id,
        emoji: emoji
      });
      if (error) throw error;
    }
  });

  return {
    sendMessage,
    deleteMessage,
    editMessage,
    reactToMessage
  };
}
