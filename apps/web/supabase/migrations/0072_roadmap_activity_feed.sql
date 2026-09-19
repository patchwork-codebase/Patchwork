-- Migration: 0072_roadmap_activity_feed.sql
-- Description: Adds triggers to log roadmap actions to the room activity feed (updates table)

CREATE OR REPLACE FUNCTION log_roadmap_activity()
RETURNS TRIGGER AS $$
DECLARE
    v_room_id TEXT;
    v_actor_name TEXT;
    v_action_text TEXT;
BEGIN
    IF auth.uid() IS NULL THEN RETURN NEW; END IF;

    -- Get actor name
    SELECT name INTO v_actor_name FROM public.users WHERE id = auth.uid();
    
    IF TG_TABLE_NAME = 'roadmap_items' THEN
        v_room_id := NEW.room_id;
        IF v_room_id IS NULL THEN RETURN NEW; END IF;

        IF TG_OP = 'INSERT' THEN
            v_action_text := 'created roadmap task "' || NEW.title || '"';
        ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
            v_action_text := 'moved roadmap task "' || NEW.title || '" to ' || upper(NEW.status);
        ELSE
            RETURN NEW;
        END IF;

        INSERT INTO public.updates (id, room_id, author_id, author_name, content, update_type)
        VALUES (gen_random_uuid()::text, v_room_id, auth.uid(), v_actor_name, v_actor_name || ' ' || v_action_text, 'milestone');
        
        RETURN NEW;
    END IF;
    
    IF TG_TABLE_NAME = 'roadmap_assignees' THEN
        -- Get room id and item title
        SELECT room_id, title INTO v_room_id, v_action_text FROM public.roadmap_items WHERE id = NEW.item_id;
        IF v_room_id IS NULL THEN RETURN NEW; END IF;
        
        -- Get assignee name
        DECLARE v_assignee_name TEXT;
        BEGIN
            SELECT name INTO v_assignee_name FROM public.users WHERE id = NEW.user_id;
            INSERT INTO public.updates (id, room_id, author_id, author_name, content, update_type)
            VALUES (gen_random_uuid()::text, v_room_id, auth.uid(), v_actor_name, v_actor_name || ' assigned ' || v_assignee_name || ' to "' || v_action_text || '"', 'milestone');
        END;
        
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for roadmap_items
DROP TRIGGER IF EXISTS on_roadmap_items_activity ON public.roadmap_items;
CREATE TRIGGER on_roadmap_items_activity
    AFTER INSERT OR UPDATE ON public.roadmap_items
    FOR EACH ROW
    EXECUTE FUNCTION log_roadmap_activity();

-- Trigger for roadmap_assignees
DROP TRIGGER IF EXISTS on_roadmap_assignees_activity ON public.roadmap_assignees;
CREATE TRIGGER on_roadmap_assignees_activity
    AFTER INSERT ON public.roadmap_assignees
    FOR EACH ROW
    EXECUTE FUNCTION log_roadmap_activity();
