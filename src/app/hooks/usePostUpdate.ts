import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../components/auth/AuthContext';
import { toast } from 'sonner';
import { uploadImage } from '../utils/uploadImage';

interface PostUpdatePayload {
  selectedRoomId: string;
  updateContent: string;
  codeSnippet: string;
  mediaPreview: string | null;
  userId: string;
  authorName: string;
}

export function usePostUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      selectedRoomId,
      updateContent,
      codeSnippet,
      mediaPreview,
      userId,
      authorName
    }: PostUpdatePayload) => {
      if ((!updateContent.trim() && !codeSnippet.trim() && !mediaPreview) || !selectedRoomId || !userId) {
        throw new Error("Missing required fields for update.");
      }

      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', selectedRoomId)
        .single();

      if (roomError || !room) {
        throw new Error(roomError?.message || "Room not found");
      }

      const updateId = window.crypto?.randomUUID?.() || `upd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      let uploadedMediaUrl = null;
      if (mediaPreview && mediaPreview.startsWith('data:')) {
        toast.loading("Uploading image...", { id: "upload" });
        try {
          uploadedMediaUrl = await uploadImage(mediaPreview);
          toast.dismiss("upload");
        } catch (error) {
          toast.dismiss("upload");
          throw error;
        }
      }

      const payload = {
        id: updateId,
        room_id: selectedRoomId,
        author_id: userId,
        author_name: authorName,
        content: updateContent.trim(),
        media_url: uploadedMediaUrl,
        code_snippet: codeSnippet.trim() || null,
        created_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from('updates')
        .insert(payload);

      if (insertError) throw insertError;

      await supabase
        .from('rooms')
        .update({
          update_count: (room.update_count || 0) + 1,
          last_update: updateContent.trim().slice(0, 120),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRoomId);

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-updates'] });
      toast.success("Update posted successfully!");
    },
    onError: (err: unknown) => {
      toast.error(`Failed to post update: ${err instanceof Error ? err.message : String(err)}`);
    }
  });
}
