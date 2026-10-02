-- ==========================================
-- Migration 0105: Fix Room Messages RLS
-- ==========================================
-- Refactors the room_messages RLS policies to use EXISTS for better reliability

DROP POLICY IF EXISTS "Users can view messages in their rooms" ON public.room_messages;
CREATE POLICY "Users can view messages in their rooms" ON public.room_messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.rooms 
        WHERE id::text = room_messages.room_id 
        AND builder_id::uuid = auth.uid()::uuid
    )
    OR EXISTS (
        SELECT 1 FROM public.room_observers 
        WHERE room_id::text = room_messages.room_id 
        AND observer_id::uuid = auth.uid()::uuid
    )
);

DROP POLICY IF EXISTS "Users can insert messages in their rooms" ON public.room_messages;
CREATE POLICY "Users can insert messages in their rooms" ON public.room_messages
FOR INSERT WITH CHECK (
    auth.uid()::uuid = sender_id AND (
        EXISTS (
            SELECT 1 FROM public.rooms 
            WHERE id::text = room_messages.room_id 
            AND builder_id::uuid = auth.uid()::uuid
        )
        OR EXISTS (
            SELECT 1 FROM public.room_observers 
            WHERE room_id::text = room_messages.room_id 
            AND observer_id::uuid = auth.uid()::uuid
        )
    )
);
