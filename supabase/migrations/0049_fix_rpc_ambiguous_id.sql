-- ============================================================
-- 0049: Fix "column reference id is ambiguous" in RPC functions
-- The RETURNS TABLE column named 'id' clashes with the table's
-- own 'id' column inside RETURN QUERY. Renamed to 'event_id'
-- and 'log_id' respectively to eliminate the ambiguity.
-- Must DROP first because PostgreSQL rejects changing a
-- function's return type via CREATE OR REPLACE.
-- ============================================================

DROP FUNCTION IF EXISTS get_build_timeline(text);
DROP FUNCTION IF EXISTS get_room_access_log(text, integer);


-- ============================================================
-- Fix: get_build_timeline
-- ============================================================

CREATE OR REPLACE FUNCTION get_build_timeline(p_room_id TEXT)
RETURNS TABLE (
    event_id    UUID,
    actor_id    UUID,
    actor_name  TEXT,
    event_type  TEXT,
    event_summary TEXT,
    event_data  JSONB,
    version_hash TEXT,
    created_at  TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_room RECORD;
BEGIN
    SELECT * INTO v_room FROM public.rooms WHERE rooms.id::text = p_room_id::text;
    IF NOT FOUND THEN RAISE EXCEPTION 'Room not found'; END IF;

    -- Access check: builder, room members, or public/unlisted rooms
    IF v_room.visibility NOT IN ('public', 'unlisted') THEN
        IF auth.uid() != v_room.builder_id AND NOT EXISTS (
            SELECT 1 FROM public.room_observers ro
            WHERE ro.room_id::text = p_room_id::text AND ro.observer_id = auth.uid()
        ) THEN
            RAISE EXCEPTION 'Access denied';
        END IF;
    END IF;

    RETURN QUERY
    SELECT
        e.id        AS event_id,
        e.actor_id,
        e.actor_name,
        e.event_type,
        e.event_summary,
        e.event_data,
        e.version_hash,
        e.created_at
    FROM public.build_timeline_events e
    WHERE e.room_id::text = p_room_id::text
    ORDER BY e.created_at ASC;
END;
$$;


-- ============================================================
-- Fix: get_room_access_log
-- ============================================================

CREATE OR REPLACE FUNCTION get_room_access_log(p_room_id TEXT, p_limit INT DEFAULT 100)
RETURNS TABLE (
    log_id      UUID,
    user_id     UUID,
    user_name   TEXT,
    user_email  TEXT,
    action      TEXT,
    metadata    JSONB,
    created_at  TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_builder_id UUID;
BEGIN
    SELECT rooms.builder_id INTO v_builder_id
    FROM public.rooms
    WHERE rooms.id::text = p_room_id::text;

    IF v_builder_id IS NULL THEN RAISE EXCEPTION 'Room not found'; END IF;
    IF v_builder_id != auth.uid() THEN RAISE EXCEPTION 'Only the builder can view the access log'; END IF;

    RETURN QUERY
    SELECT
        l.id        AS log_id,
        l.user_id,
        l.user_name,
        l.user_email,
        l.action,
        l.metadata,
        l.created_at
    FROM public.room_access_log l
    WHERE l.room_id::text = p_room_id::text
    ORDER BY l.created_at DESC
    LIMIT p_limit;
END;
$$;
