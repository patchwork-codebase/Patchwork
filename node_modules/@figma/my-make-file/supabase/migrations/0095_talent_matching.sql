-- ==========================================
-- Migration 0095: Talent Matching & Bounties
-- ==========================================

-- 1. Create bounty_applications table
CREATE TABLE IF NOT EXISTS public.bounty_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    update_id TEXT NOT NULL REFERENCES public.updates(id) ON DELETE CASCADE,
    builder_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    observer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    pitch_text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(update_id, builder_id) -- A builder can only apply once per bounty
);

-- 2. Enable RLS
ALTER TABLE public.bounty_applications ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Builders can read their own applications, Observers can read applications submitted to them
CREATE POLICY "Users can view relevant applications" ON public.bounty_applications
FOR SELECT USING (
    auth.uid()::uuid = builder_id::uuid OR auth.uid()::uuid = observer_id::uuid
);

-- Builders can insert applications (where they are the builder)
CREATE POLICY "Builders can insert applications" ON public.bounty_applications
FOR INSERT WITH CHECK (
    auth.uid()::uuid = builder_id::uuid
);

-- Observers can update applications (to accept/reject) if they own the update
CREATE POLICY "Observers can update applications" ON public.bounty_applications
FOR UPDATE USING (
    auth.uid()::uuid = observer_id::uuid
);

-- 4. RPC to securely handle the Match (creates room, adds observer)
CREATE OR REPLACE FUNCTION accept_bounty_application(
    p_application_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_application RECORD;
    v_update RECORD;
    v_room_id TEXT;
    v_result JSONB;
BEGIN
    -- Get application
    SELECT * INTO v_application FROM public.bounty_applications WHERE id = p_application_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found';
    END IF;

    -- Ensure caller is the observer who posted the bounty
    IF auth.uid()::uuid != v_application.observer_id::uuid THEN
        RAISE EXCEPTION 'Unauthorized: Only the bounty creator can accept matches';
    END IF;

    -- Get original update to name the room
    SELECT * INTO v_update FROM public.updates WHERE id = v_application.update_id;

    -- Update application status
    UPDATE public.bounty_applications 
    SET status = 'accepted', updated_at = now() 
    WHERE id = p_application_id;

    -- Create new Room
    INSERT INTO public.rooms (
        title, 
        description,
        builder_id,
        is_private,
        visibility
    ) VALUES (
        'Bounty: ' || COALESCE(left(v_update.content, 30), 'New Project') || '...',
        'Collaborative room automatically created from a Bounty Match.',
        v_application.builder_id,
        true, -- Make it private by default for collaboration
        'private'
    ) RETURNING id INTO v_room_id;

    -- Add Observer to the Room as a Sponsor/Co-founder
    INSERT INTO public.room_observers (
        room_id,
        observer_id,
        role
    ) VALUES (
        v_room_id,
        v_application.observer_id,
        'co_founder'
    );

    -- Log the match in timeline
    INSERT INTO public.build_timeline_events (
        room_id, actor_id, actor_name, event_type, event_summary
    ) VALUES (
        v_room_id::text,
        v_application.observer_id,
        'System',
        'room_created',
        'Talent Match Accepted. Collaboration started!'
    );

    v_result := jsonb_build_object(
        'success', true,
        'room_id', v_room_id
    );

    RETURN v_result;
END;
$$;
