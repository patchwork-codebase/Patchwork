-- Migration: 0034_decision_notifications.sql
-- Description: Trigger to create notifications for room followers when a decision is published

CREATE OR REPLACE FUNCTION handle_new_decision_update()
RETURNS TRIGGER AS $$
DECLARE
    v_room_title TEXT;
    v_observer RECORD;
BEGIN
    -- Only trigger if it's a decision log
    IF NEW.update_type = 'decision' THEN
        -- Get room title
        SELECT title INTO v_room_title FROM public.rooms WHERE id = NEW.room_id;
        
        -- Iterate over all followers (observers) of this room
        FOR v_observer IN (SELECT observer_id FROM public.room_observers WHERE room_id = NEW.room_id AND observer_id != NEW.author_id)
        LOOP
            -- Insert a notification for each observer
            INSERT INTO public.notifications (user_id, actor_id, type, reference_id, metadata)
            VALUES (
                v_observer.observer_id,
                NEW.author_id,
                'decision',
                NEW.id,
                jsonb_build_object(
                    'room_title', v_room_title,
                    'room_id', NEW.room_id,
                    'decision_text', substring(NEW.content from 1 for 150)
                )
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_decision_update ON public.updates;
CREATE TRIGGER on_decision_update
    AFTER INSERT ON public.updates
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_decision_update();
