-- Automated Point Triggers

-- 1. Trigger for Rooms (room_created = +50 points)
CREATE OR REPLACE FUNCTION public.handle_room_created_points()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.reputation_events (user_id, room_id, action_type, points, metadata)
    VALUES (NEW.builder_id, NEW.id, 'room_created', 50, jsonb_build_object('room_title', NEW.title));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_room_created_points ON public.rooms;
CREATE TRIGGER on_room_created_points
    AFTER INSERT ON public.rooms
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_room_created_points();


-- 2. Trigger for Updates (update_posted = +10 points)
CREATE OR REPLACE FUNCTION public.handle_update_posted_points()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.author_id IS NOT NULL THEN
        INSERT INTO public.reputation_events (user_id, room_id, action_type, points, metadata)
        VALUES (NEW.author_id, NEW.room_id, 'update_posted', 10, jsonb_build_object('update_id', NEW.id));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_update_posted_points ON public.updates;
CREATE TRIGGER on_update_posted_points
    AFTER INSERT ON public.updates
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_update_posted_points();


-- 3. Trigger for Decisions (decision_documented = +15 points)
CREATE OR REPLACE FUNCTION public.handle_decision_documented_points()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.builder_id IS NOT NULL THEN
        INSERT INTO public.reputation_events (user_id, room_id, action_type, points, metadata)
        VALUES (NEW.builder_id, NEW.room_id, 'decision_documented', 15, jsonb_build_object('decision_id', NEW.id, 'type', NEW.type));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_decision_documented_points ON public.room_decisions;
CREATE TRIGGER on_decision_documented_points
    AFTER INSERT ON public.room_decisions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_decision_documented_points();
