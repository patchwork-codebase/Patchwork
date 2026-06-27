-- Fix auto_log_update_posted trigger to avoid referencing non-existent columns "draft" and "type"
CREATE OR REPLACE FUNCTION auto_log_update_posted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO public.build_timeline_events (
        room_id, actor_id, actor_name, event_type, event_summary, event_data
    ) VALUES (
        NEW.room_id,
        NEW.author_id,
        NEW.author_name,
        'update_posted',
        'Update posted: ' || left(NEW.content, 100),
        jsonb_build_object(
            'update_id', NEW.id,
            'content_preview', left(NEW.content, 200)
        )
    );
    RETURN NEW;
END;
$$;
