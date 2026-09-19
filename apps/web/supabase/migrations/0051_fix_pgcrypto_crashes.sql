-- ============================================================
-- 0051: Fix pgcrypto trigger crashes (ERR_CONNECTION_CLOSED)
-- Replaces encode(digest(..., 'sha256'), 'hex') with built-in md5() 
-- to prevent PostgREST connection crashes when the pgcrypto 
-- extension is not in the public schema or not enabled.
-- ============================================================


-- ============================================================
-- Fix: append_timeline_event
-- ============================================================

CREATE OR REPLACE FUNCTION append_timeline_event(
    p_room_id TEXT,
    p_event_type TEXT,
    p_event_summary TEXT,
    p_event_data JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_room RECORD;
    v_user RECORD;
    v_event_id UUID;
    v_hash TEXT;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    SELECT * INTO v_room FROM public.rooms WHERE id::text = p_room_id::text;
    IF NOT FOUND THEN RAISE EXCEPTION 'Room not found'; END IF;
    IF v_room.builder_id != auth.uid() THEN RAISE EXCEPTION 'Only the builder can append timeline events'; END IF;

    SELECT id, name INTO v_user FROM public.users WHERE id = auth.uid();

    -- Compute a simple hash for integrity (using built-in md5 to avoid pgcrypto crashes)
    v_hash := md5(p_event_type || '|' || p_room_id || '|' || now()::text || '|' || p_event_data::text);

    INSERT INTO public.build_timeline_events (room_id, actor_id, actor_name, event_type, event_summary, event_data, version_hash)
    VALUES (p_room_id, auth.uid(), v_user.name, p_event_type, p_event_summary, p_event_data, v_hash)
    RETURNING id INTO v_event_id;

    RETURN v_event_id;
END;
$$;


-- ============================================================
-- Fix: auto_log_room_created
-- ============================================================

CREATE OR REPLACE FUNCTION auto_log_room_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_builder_name TEXT;
BEGIN
    SELECT name INTO v_builder_name FROM public.users WHERE id = NEW.builder_id;

    INSERT INTO public.build_timeline_events (
        room_id, actor_id, actor_name, event_type, event_summary, event_data, version_hash
    ) VALUES (
        NEW.id,
        NEW.builder_id,
        COALESCE(v_builder_name, NEW.builder_name),
        'room_created',
        'Build Room created: ' || NEW.title,
        jsonb_build_object(
            'title', NEW.title,
            'description', NEW.description,
            'visibility', NEW.visibility::text,
            'tags', NEW.tags
        ),
        md5('room_created|' || NEW.id || '|' || COALESCE(NEW.created_at::text, now()::text))
    );
    RETURN NEW;
END;
$$;
