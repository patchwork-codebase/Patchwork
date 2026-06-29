-- Migration: 0058_comprehensive_notifications.sql
-- Description: Implement robust notifications per the user story

-- 1. Add notification preferences to users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS in_app_notifications_enabled BOOLEAN DEFAULT true;

-- 2. Modify handle_new_reaction to notify the Builder AND other thread participants
CREATE OR REPLACE FUNCTION handle_new_reaction()
RETURNS TRIGGER AS $$
DECLARE
    v_builder_id UUID;
    v_room_title TEXT;
    v_participant RECORD;
BEGIN
    -- Get the builder_id and title of the room
    SELECT builder_id, title INTO v_builder_id, v_room_title FROM public.rooms WHERE id = NEW.room_id;
    
    -- Notify the builder if the actor is not the builder
    IF NEW.observer_id != v_builder_id THEN
        BEGIN
            INSERT INTO public.notifications (user_id, actor_id, type, reference_id, metadata)
            VALUES (v_builder_id, NEW.observer_id, 'reaction', NEW.id, jsonb_build_object(
                'reaction_type', NEW.type,
                'reaction_text', NEW.text,
                'room_title', v_room_title,
                'room_id', NEW.room_id,
                'update_id', NEW.update_id
            ));
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to insert notification for builder: %', SQLERRM;
        END;
    END IF;

    -- Also notify other participants in this update's thread (if it's a comment/reply)
    IF NEW.type = 'reply' THEN
        FOR v_participant IN (
            SELECT DISTINCT observer_id 
            FROM public.reactions 
            WHERE update_id = NEW.update_id 
            AND type = 'reply'
            AND observer_id IS NOT NULL
            AND observer_id != NEW.observer_id
            AND observer_id != v_builder_id
        )
        LOOP
            BEGIN
                INSERT INTO public.notifications (user_id, actor_id, type, reference_id, metadata)
                VALUES (v_participant.observer_id, NEW.observer_id, 'reaction', NEW.id, jsonb_build_object(
                    'reaction_type', NEW.type,
                    'reaction_text', NEW.text,
                    'room_title', v_room_title,
                    'room_id', NEW.room_id,
                    'update_id', NEW.update_id
                ));
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING 'Failed to insert notification for participant: %', SQLERRM;
            END;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Create a trigger for ALL updates to notify followers (complementing the decision trigger)
CREATE OR REPLACE FUNCTION handle_new_general_update()
RETURNS TRIGGER AS $$
DECLARE
    v_room_title TEXT;
    v_observer RECORD;
BEGIN
    -- We only handle non-decisions here, because 0034 handles decisions.
    IF NEW.update_type != 'decision' THEN
        SELECT title INTO v_room_title FROM public.rooms WHERE id = NEW.room_id;
        
        -- Iterate over all followers (observers) of this room
        FOR v_observer IN (SELECT observer_id FROM public.room_observers WHERE room_id = NEW.room_id AND observer_id != NEW.author_id)
        LOOP
            INSERT INTO public.notifications (user_id, actor_id, type, reference_id, metadata)
            VALUES (
                v_observer.observer_id,
                NEW.author_id,
                'update_posted',
                NEW.id,
                jsonb_build_object(
                    'room_title', v_room_title,
                    'room_id', NEW.room_id,
                    'update_type', NEW.update_type,
                    'update_text', substring(NEW.content from 1 for 150)
                )
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_general_update ON public.updates;
CREATE TRIGGER on_general_update
    AFTER INSERT ON public.updates
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_general_update();


-- 4. Trigger for when a decision is UPDATED
CREATE OR REPLACE FUNCTION handle_decision_edited()
RETURNS TRIGGER AS $$
DECLARE
    v_room_title TEXT;
    v_observer RECORD;
BEGIN
    -- Only trigger if it's a decision log and the content actually changed
    IF NEW.update_type = 'decision' AND NEW.content != OLD.content THEN
        SELECT title INTO v_room_title FROM public.rooms WHERE id = NEW.room_id;
        
        -- Iterate over all followers
        FOR v_observer IN (SELECT observer_id FROM public.room_observers WHERE room_id = NEW.room_id AND observer_id != NEW.author_id)
        LOOP
            INSERT INTO public.notifications (user_id, actor_id, type, reference_id, metadata)
            VALUES (
                v_observer.observer_id,
                NEW.author_id,
                'decision_updated',
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

DROP TRIGGER IF EXISTS on_decision_edited ON public.updates;
CREATE TRIGGER on_decision_edited
    AFTER UPDATE ON public.updates
    FOR EACH ROW
    EXECUTE FUNCTION handle_decision_edited();
