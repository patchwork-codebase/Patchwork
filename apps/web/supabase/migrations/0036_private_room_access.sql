-- Migration: 0036_private_room_access.sql
-- Description: Implement implicit observer access model for private rooms

-- 1. Add columns to rooms table
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS invite_token UUID DEFAULT gen_random_uuid();
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS whitelisted_domains TEXT[] DEFAULT '{}';

-- 2. Create the RPC function to join a private room
;
CREATE OR REPLACE FUNCTION join_private_room(p_room_id TEXT, p_invite_token UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_room RECORD;
    v_user_email TEXT;
    v_user_domain TEXT;
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Get the room securely (bypassing RLS because of SECURITY DEFINER)
    SELECT * INTO v_room FROM public.rooms WHERE id::text = p_room_id::text;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- If room is not private, no need to join
    IF v_room.is_private = FALSE THEN
        RETURN TRUE;
    END IF;

    -- If user is the builder, they already have access
    IF auth.uid() = v_room.builder_id THEN
        RETURN TRUE;
    END IF;

    -- Check if already an observer
    IF EXISTS (SELECT 1 FROM public.room_observers WHERE room_id::text = p_room_id::text AND observer_id::uuid = auth.uid()::uuid) THEN
        RETURN TRUE;
    END IF;

    -- 1. Check Invite Token
    IF p_invite_token IS NOT NULL AND p_invite_token::uuid = v_room.invite_token::uuid THEN
        -- Token matches, add observer
        INSERT INTO public.room_observers (room_id, observer_id) VALUES (p_room_id, auth.uid());
        RETURN TRUE;
    END IF;

    -- 2. Check Domain Whitelist
    IF array_length(v_room.whitelisted_domains, 1) > 0 THEN
        -- Get the user's email from users table
        SELECT email INTO v_user_email FROM public.users WHERE id::uuid = auth.uid()::uuid;
        
        IF v_user_email IS NOT NULL THEN
            -- Extract domain
            v_user_domain := split_part(v_user_email, '@', 2);
            
            -- Check if domain is in whitelist
            IF v_user_domain = ANY(v_room.whitelisted_domains) THEN
                INSERT INTO public.room_observers (room_id, observer_id) VALUES (p_room_id, auth.uid());
                RETURN TRUE;
            END IF;
        END IF;
    END IF;

    -- No match
    RETURN FALSE;
END;
$$;

-- 3. Update RLS Policies

-- ROOMS
DROP POLICY IF EXISTS "Public rooms are viewable by everyone" ON public.rooms;
DROP POLICY IF EXISTS "Public rooms are viewable by everyone" ON public.rooms;
CREATE POLICY "Public rooms are viewable by everyone" ON public.rooms
FOR SELECT USING (is_private = false);

DROP POLICY IF EXISTS "Private rooms viewable by observers" ON public.rooms;
DROP POLICY IF EXISTS "Private rooms viewable by observers" ON public.rooms;
CREATE POLICY "Private rooms viewable by observers" ON public.rooms
FOR SELECT USING (
    is_private = true 
    AND (
        auth.uid()::uuid = builder_id::uuid 
        OR auth.uid()::uuid IN (SELECT observer_id::uuid FROM public.room_observers WHERE room_id::text = public.rooms.id::text)
    )
);

-- UPDATES
DROP POLICY IF EXISTS "Public updates are viewable by everyone" ON public.updates;
DROP POLICY IF EXISTS "Public updates are viewable by everyone" ON public.updates;
CREATE POLICY "Public updates are viewable by everyone" ON public.updates
FOR SELECT USING (
    room_id IN (SELECT id FROM public.rooms WHERE is_private = false)
);

DROP POLICY IF EXISTS "Private updates viewable by observers" ON public.updates;
DROP POLICY IF EXISTS "Private updates viewable by observers" ON public.updates;
CREATE POLICY "Private updates viewable by observers" ON public.updates
FOR SELECT USING (
    room_id::text IN (SELECT id::text FROM public.rooms WHERE is_private = true)
    AND (
        auth.uid()::uuid = author_id::uuid 
        OR auth.uid()::uuid IN (SELECT observer_id::uuid FROM public.room_observers WHERE room_id::text = public.updates.room_id::text)
    )
);

-- REACTIONS
DROP POLICY IF EXISTS "Public reactions are viewable by everyone" ON public.reactions;
DROP POLICY IF EXISTS "Public reactions are viewable by everyone" ON public.reactions;
CREATE POLICY "Public reactions are viewable by everyone" ON public.reactions
FOR SELECT USING (
    room_id IN (SELECT id FROM public.rooms WHERE is_private = false)
);

DROP POLICY IF EXISTS "Private reactions viewable by observers" ON public.reactions;
DROP POLICY IF EXISTS "Private reactions viewable by observers" ON public.reactions;
CREATE POLICY "Private reactions viewable by observers" ON public.reactions
FOR SELECT USING (
    room_id::text IN (SELECT id::text FROM public.rooms WHERE is_private = true)
    AND (
        auth.uid()::uuid IN (SELECT builder_id::uuid FROM public.rooms WHERE id::text = public.reactions.room_id::text)
        OR auth.uid()::uuid IN (SELECT observer_id::uuid FROM public.room_observers WHERE room_id::text = public.reactions.room_id::text)
    )
);

-- DECISIONS
DROP POLICY IF EXISTS "Public decisions are viewable by everyone" ON public.room_decisions;
DROP POLICY IF EXISTS "Public decisions are viewable by everyone" ON public.room_decisions;
CREATE POLICY "Public decisions are viewable by everyone" ON public.room_decisions
FOR SELECT USING (
    room_id IN (SELECT id FROM public.rooms WHERE is_private = false)
);

DROP POLICY IF EXISTS "Private decisions viewable by observers" ON public.room_decisions;
DROP POLICY IF EXISTS "Private decisions viewable by observers" ON public.room_decisions;
CREATE POLICY "Private decisions viewable by observers" ON public.room_decisions
FOR SELECT USING (
    room_id::text IN (SELECT id::text FROM public.rooms WHERE is_private = true)
    AND (
        auth.uid()::uuid IN (SELECT builder_id::uuid FROM public.rooms WHERE id::text = public.room_decisions.room_id::text)
        OR auth.uid()::uuid IN (SELECT observer_id::uuid FROM public.room_observers WHERE room_id::text = public.room_decisions.room_id::text)
    )
);

-- NOTION DOCS
DROP POLICY IF EXISTS "Public docs are viewable by everyone" ON public.room_notion_docs;
DROP POLICY IF EXISTS "Public docs are viewable by everyone" ON public.room_notion_docs;
CREATE POLICY "Public docs are viewable by everyone" ON public.room_notion_docs
FOR SELECT USING (
    room_id IN (SELECT id FROM public.rooms WHERE is_private = false)
);

DROP POLICY IF EXISTS "Private docs viewable by observers" ON public.room_notion_docs;
DROP POLICY IF EXISTS "Private docs viewable by observers" ON public.room_notion_docs;
CREATE POLICY "Private docs viewable by observers" ON public.room_notion_docs
FOR SELECT USING (
    room_id::text IN (SELECT id::text FROM public.rooms WHERE is_private = true)
    AND (
        auth.uid()::uuid IN (SELECT builder_id::uuid FROM public.rooms WHERE id::text = public.room_notion_docs.room_id::text)
        OR auth.uid()::uuid IN (SELECT observer_id::uuid FROM public.room_observers WHERE room_id::text = public.room_notion_docs.room_id::text)
    )
);
