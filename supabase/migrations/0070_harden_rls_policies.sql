-- Migration to Harden RLS Policies and Enforce NDA logic
-- This strictly blocks updates, timeline events, and reviews from being viewed via API 
-- if a room is NDA-protected and the user hasn't explicitly signed the NDA.

-- 1. Helper Function to securely check if the current user can view a room's content
CREATE OR REPLACE FUNCTION can_view_room_content(p_room_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_visibility TEXT;
    v_builder_id UUID;
    v_is_observer BOOLEAN;
BEGIN
    IF auth.uid() IS NULL THEN RETURN FALSE; END IF;

    -- 0. Admins and Superadmins have full read access
    IF coalesce(auth.jwt()->'app_metadata'->>'role', auth.jwt()->'user_metadata'->>'role') IN ('admin', 'superadmin') THEN
        RETURN TRUE;
    END IF;

    SELECT visibility, builder_id INTO v_visibility, v_builder_id 
    FROM public.rooms WHERE id::text = p_room_id::text;

    IF NOT FOUND THEN RETURN FALSE; END IF;

    -- 1. The builder can always view their own room's content
    IF auth.uid()::uuid = v_builder_id::uuid THEN RETURN TRUE; END IF;

    -- 2. Check if the user is in the room's observer list
    SELECT EXISTS(
        SELECT 1 FROM public.room_observers 
        WHERE room_id::text = p_room_id::text AND observer_id::uuid = auth.uid()::uuid
    ) INTO v_is_observer;

    -- 3. If NDA protected, they MUST have signed the NDA
    IF v_visibility = 'nda_protected' THEN
        RETURN EXISTS(
            SELECT 1 FROM public.room_nda_acceptances 
            WHERE room_id::text = p_room_id::text AND user_id::uuid = auth.uid()::uuid
        );
    END IF;

    -- 4. If public or unlisted, it's viewable by anyone
    IF v_visibility IN ('public', 'unlisted') THEN 
        RETURN TRUE; 
    END IF;

    -- 5. If strictly private or org_only, they must be an observer
    IF v_visibility IN ('private', 'org_only') THEN
        RETURN v_is_observer;
    END IF;

    RETURN FALSE;
END;
$$;

-- 2. Harden the Updates Table (Insert & Select)
DROP POLICY IF EXISTS "Users can insert their own updates" ON public.updates;
CREATE POLICY "Users can insert their own updates" ON public.updates
FOR INSERT WITH CHECK (
    auth.uid()::uuid = author_id::uuid AND (
        auth.uid()::uuid = (SELECT builder_id::uuid FROM public.rooms WHERE id::text = updates.room_id::text)
        OR auth.uid()::uuid IN (
            SELECT observer_id::uuid FROM public.room_observers 
            WHERE room_id::text = updates.room_id::text 
            AND role IN ('team_member', 'collaborator', 'co_founder')
        )
    )
);

DROP POLICY IF EXISTS "Public updates are viewable by everyone" ON public.updates;
CREATE POLICY "Updates are viewable based on strict room access" ON public.updates
FOR SELECT USING (
    can_view_room_content(room_id::text)
);

-- 3. Harden the Timeline Feed
DROP POLICY IF EXISTS "Builders can view their room timeline" ON public.build_timeline_events;
DROP POLICY IF EXISTS "Room members can view timeline" ON public.build_timeline_events;
DROP POLICY IF EXISTS "Public room timeline is visible to all" ON public.build_timeline_events;
CREATE POLICY "Timeline events are viewable based on strict room access" ON public.build_timeline_events
FOR SELECT USING (
    can_view_room_content(room_id::text)
);

-- 4. Harden the Expert Reviews (if public, still respect room access)
DROP POLICY IF EXISTS "Allow public read access to public reviews" ON public.expert_reviews;
CREATE POLICY "Reviews are viewable based on strict room access" ON public.expert_reviews
FOR SELECT USING (
    can_view_room_content(room_id::text) OR auth.uid() = expert_id
);
