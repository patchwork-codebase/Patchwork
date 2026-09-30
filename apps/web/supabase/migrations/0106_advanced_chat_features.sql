-- ==========================================
-- Migration 0106: Advanced Chat Features
-- ==========================================
-- Adds support for read receipts, media attachments, edited messages, and reactions.

-- 1. Add new columns to room_messages
ALTER TABLE public.room_messages 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT,
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false;

-- 2. Update room_messages RLS to allow updates (for editing, deleting, and marking as read)
-- Users can update messages if they sent them (to edit) OR if they are the recipient (to mark as read)
DROP POLICY IF EXISTS "Users can update messages in their rooms" ON public.room_messages;
CREATE POLICY "Users can update messages in their rooms" ON public.room_messages
FOR UPDATE USING (
    -- Sender can update their own message (to edit it)
    auth.uid()::uuid = sender_id
    OR 
    -- Or room members can update it (only to set read_at, which we enforce in app logic or trigger, 
    -- but for RLS we just check if they are in the room)
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

-- Users can delete their own messages
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.room_messages;
CREATE POLICY "Users can delete their own messages" ON public.room_messages
FOR DELETE USING (
    auth.uid()::uuid = sender_id
);

-- 3. Create message_reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.room_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(message_id, user_id, emoji) -- A user can only react with a specific emoji once per message
);

-- Enable RLS on message_reactions
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Reactions RLS Policies
CREATE POLICY "Users can view reactions in their rooms" ON public.message_reactions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.room_messages rm
        WHERE rm.id = message_reactions.message_id
        AND (
            EXISTS (
                SELECT 1 FROM public.rooms 
                WHERE id::text = rm.room_id 
                AND builder_id::uuid = auth.uid()::uuid
            )
            OR EXISTS (
                SELECT 1 FROM public.room_observers 
                WHERE room_id::text = rm.room_id 
                AND observer_id::uuid = auth.uid()::uuid
            )
        )
    )
);

CREATE POLICY "Users can add reactions" ON public.message_reactions
FOR INSERT WITH CHECK (
    auth.uid()::uuid = user_id
);

CREATE POLICY "Users can remove their own reactions" ON public.message_reactions
FOR DELETE USING (
    auth.uid()::uuid = user_id
);

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;

-- 4. Create chat_media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat_media', 'chat_media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS for chat_media
-- Anyone can read (since it's a public bucket, URLs are unguessable UUIDs)
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'chat_media' );

-- Authenticated users can insert
CREATE POLICY "Authenticated users can upload chat media" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'chat_media' AND auth.role() = 'authenticated'
);

-- Users can delete their own media
CREATE POLICY "Users can delete their own chat media" ON storage.objects FOR DELETE USING (
    bucket_id = 'chat_media' AND auth.uid() = owner
);
