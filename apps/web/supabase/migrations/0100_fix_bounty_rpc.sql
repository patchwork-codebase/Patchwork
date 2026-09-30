-- ==========================================
-- Migration 0100: Fix Bounty RPC
-- ==========================================
-- Fixes the null value in column "builder_name" of relation "rooms" violates not-null constraint error.

CREATE OR REPLACE FUNCTION accept_bounty_application(p_application_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_application RECORD;
    v_update RECORD;
    v_room_id TEXT;
    v_result JSONB;
    v_builder_name TEXT;
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

    -- Get the builder name
    SELECT name INTO v_builder_name FROM public.users WHERE id = v_application.builder_id;

    -- Update application status
    UPDATE public.bounty_applications 
    SET status = 'accepted', updated_at = now() 
    WHERE id = p_application_id;

    -- Create new Room
    INSERT INTO public.rooms (
        title, 
        description,
        builder_id,
        builder_name,
        is_private,
        visibility
    ) VALUES (
        'Bounty: ' || COALESCE(left(v_update.content, 30), 'New Project') || '...',
        'Collaborative room automatically created from a Bounty Match.',
        v_application.builder_id,
        v_builder_name,
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
