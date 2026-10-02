-- Add UPDATE and DELETE policies for room_messages so users can edit/delete their own messages
DROP POLICY IF EXISTS "Users can update their own messages" ON public.room_messages;
CREATE POLICY "Users can update their own messages" ON public.room_messages
    FOR UPDATE
    USING (auth.uid() = sender_id)
    WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can delete their own messages" ON public.room_messages;
CREATE POLICY "Users can delete their own messages" ON public.room_messages
    FOR DELETE
    USING (auth.uid() = sender_id);
