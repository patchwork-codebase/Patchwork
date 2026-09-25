import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../components/auth/AuthContext';
import { toast } from 'sonner';
import { uploadImage } from '../utils/uploadImage';

interface PostUpdatePayload {
  selectedRoomId: string;
  updateContent: string;
  codeSnippet: string;
  mediaPreview: string | null;
  mediaPreviews?: string[];
  updateType?: string;
  pollData?: {
    question: string;
    options: string[];
    durationDays: number;
  } | null;
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
      mediaPreviews = [],
      updateType = 'insight',
      pollData = null,
      userId,
      authorName
    }: PostUpdatePayload) => {
      const allPreviews = [...(mediaPreviews.length > 0 ? mediaPreviews : (mediaPreview ? [mediaPreview] : []))];
      if ((!updateContent.trim() && !codeSnippet.trim() && allPreviews.length === 0 && !pollData) || !selectedRoomId || !userId) {
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

      const uploadedMediaUrls: string[] = [];
      if (allPreviews.length > 0) {
        toast.loading(`Uploading media (1/${allPreviews.length})...`, { id: "upload" });
        try {
          for (let i = 0; i < allPreviews.length; i++) {
            const preview = allPreviews[i];
            if (preview.startsWith('data:')) {
              const url = await uploadImage(preview);
              uploadedMediaUrls.push(url);
            } else if (preview.startsWith('http')) {
              uploadedMediaUrls.push(preview);
            }
          }
          toast.dismiss("upload");
        } catch (error) {
          toast.dismiss("upload");
          throw error;
        }
      }

      const primaryMediaUrl = uploadedMediaUrls.length > 0 ? uploadedMediaUrls[0] : null;

      const payload: Record<string, any> = {
        id: updateId,
        room_id: selectedRoomId,
        author_id: userId,
        author_name: authorName,
        content: updateContent.trim(),
        update_type: updateType,
        media_url: primaryMediaUrl,
        media_urls: uploadedMediaUrls.length > 0 ? uploadedMediaUrls : null,
        code_snippet: codeSnippet.trim() || null,
        created_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from('updates')
        .insert(payload);

      if (insertError) throw insertError;

      if (pollData && pollData.question.trim() && pollData.options.length >= 2) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (pollData.durationDays || 3));

        const { data: pollRow, error: pollError } = await supabase
          .from('polls')
          .insert({
            update_id: updateId,
            question: pollData.question.trim(),
            expires_at: expiresAt.toISOString(),
          })
          .select('id')
          .single();

        if (pollError) throw pollError;

        if (pollRow?.id) {
          const optionsPayload = pollData.options
            .map(opt => opt.trim())
            .filter(opt => opt.length > 0)
            .map(opt => ({
              poll_id: pollRow.id,
              option_text: opt,
            }));

          const { error: optionsError } = await supabase
            .from('poll_options')
            .insert(optionsPayload);

          if (optionsError) throw optionsError;
        }
      }

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
      queryClient.invalidateQueries({ queryKey: ['feed-updates-v2'] });
      toast.success("Update posted successfully!");
    },
    onError: (err: unknown) => {
      const errorMessage = err instanceof Error ? err.message : (err as any)?.message || JSON.stringify(err);
      toast.error(`Failed to post update: ${errorMessage}`);
    }
  });
}
