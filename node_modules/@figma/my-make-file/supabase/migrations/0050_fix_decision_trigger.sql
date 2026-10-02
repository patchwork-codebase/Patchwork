-- ============================================================
-- 0050: Fix auto_log_decision_logged trigger
-- The trigger was referencing NEW.author_id instead of NEW.builder_id
-- and NEW.decision instead of NEW.description, causing 400 Bad Request
-- errors when inserting into room_decisions.
-- ============================================================

CREATE OR REPLACE FUNCTION auto_log_decision_logged()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_actor_name TEXT;
BEGIN
    SELECT name INTO v_actor_name FROM public.users WHERE id = NEW.builder_id;

    INSERT INTO public.build_timeline_events (
        room_id, actor_id, actor_name, event_type, event_summary, event_data
    ) VALUES (
        NEW.room_id,
        NEW.builder_id,
        COALESCE(v_actor_name, 'Builder'),
        'decision_logged',
        'Decision logged: ' || left(COALESCE(NEW.title, NEW.description, ''), 100),
        jsonb_build_object(
            'decision_id', NEW.id,
            'title', NEW.title,
            'decision_preview', left(COALESCE(NEW.description, ''), 200)
        )
    );
    RETURN NEW;
END;
$$;
