-- Migration: 0021_fix_notifications_schema.sql
-- Description: Change reference_id to TEXT and fix room_observers trigger which referenced non-existent NEW.id

-- 1. Change reference_id to TEXT since reactions.id and rooms.id are both TEXT
ALTER TABLE public.notifications ALTER COLUMN reference_id TYPE TEXT USING reference_id::text;

-- 2. Fix the room_observers trigger to use NEW.room_id instead of NEW.id (since room_observers has no id column)
CREATE OR REPLACE FUNCTION handle_new_room_observer()
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
        VALUES (v_builder_id, NEW.observer_id, 'room_follow', NEW.room_id, jsonb_build_object(
            'room_title', v_room_title
        ));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
