-- Migration: 0035_reaction_notification_links.sql
-- Description: Add room_id and update_id to reaction notification metadata so they can be deep linked

-- 1. Update the reaction trigger to include room_id and update_id
CREATE OR REPLACE FUNCTION handle_new_reaction()
RETURNS TRIGGER AS $$
DECLARE
    v_builder_id UUID;
    v_room_title TEXT;
BEGIN
    -- Get the builder_id and title of the room
    SELECT builder_id, title INTO v_builder_id, v_room_title FROM public.rooms WHERE id = NEW.room_id;
    
    -- Only create notification if the actor is not the builder
    IF NEW.observer_id != v_builder_id THEN
        INSERT INTO public.notifications (user_id, actor_id, type, reference_id, metadata)
        VALUES (v_builder_id, NEW.observer_id, 'reaction', NEW.id, jsonb_build_object(
            'reaction_type', NEW.type,
            'reaction_text', NEW.text,
            'room_title', v_room_title,
            'room_id', NEW.room_id,
            'update_id', NEW.update_id
        ));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Backfill existing reaction notifications with the necessary IDs
UPDATE public.notifications n
SET metadata = n.metadata || jsonb_build_object(
    'room_id', r.room_id,
    'update_id', r.update_id
)
FROM public.reactions r
WHERE n.type = 'reaction'
AND n.reference_id = r.id;
