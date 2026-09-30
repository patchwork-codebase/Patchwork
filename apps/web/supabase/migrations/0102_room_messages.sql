-- ==========================================
-- Migration 0102: Room Messages (Chat)
-- ==========================================
-- Creates the table and RLS policies for real-time room chats

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.room_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT NOT NULL,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Users can view messages if they are the room builder OR an observer in the room
CREATE POLICY "Users can view messages in their rooms" ON public.room_messages
FOR SELECT USING (
    auth.uid()::uuid = (SELECT builder_id::uuid FROM public.rooms WHERE id::text = room_messages.room_id)
    OR auth.uid()::uuid IN (
        SELECT observer_id::uuid FROM public.room_observers 
        WHERE room_id::text = room_messages.room_id
    )
);

-- Users can insert messages if they are the room builder OR an observer in the room
CREATE POLICY "Users can insert messages in their rooms" ON public.room_messages
FOR INSERT WITH CHECK (
    auth.uid()::uuid = sender_id AND (
        auth.uid()::uuid = (SELECT builder_id::uuid FROM public.rooms WHERE id::text = room_messages.room_id)
        OR auth.uid()::uuid IN (
            SELECT observer_id::uuid FROM public.room_observers 
            WHERE room_id::text = room_messages.room_id
        )
    )
);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
