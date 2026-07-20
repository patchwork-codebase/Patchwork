-- Extended Point Triggers for Gamification

-- 1. Product Discovery Complete
CREATE OR REPLACE FUNCTION public.handle_discovery_completed_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Only award points if status changed to 'converted' from something else
    IF NEW.status = 'converted' AND OLD.status IS DISTINCT FROM 'converted' THEN
        INSERT INTO public.reputation_events (user_id, action_type, points, metadata)
        VALUES (NEW.builder_id, 'discovery_completed', 100, jsonb_build_object('project_id', NEW.id, 'title', NEW.title));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_discovery_completed_points ON public.discovery_projects;
CREATE TRIGGER on_discovery_completed_points
    AFTER UPDATE OF status ON public.discovery_projects
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_discovery_completed_points();


-- 2. Expert Reviews Received & Given
CREATE OR REPLACE FUNCTION public.handle_expert_review_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Points for the builder who got reviewed
    IF NEW.builder_id IS NOT NULL THEN
        INSERT INTO public.reputation_events (user_id, room_id, action_type, points, metadata)
        VALUES (NEW.builder_id, NEW.room_id, 'expert_review_received', 75, jsonb_build_object('review_id', NEW.id, 'expert_id', NEW.expert_id));
    END IF;

    -- Points for the expert who provided the review
    IF NEW.expert_id IS NOT NULL THEN
        INSERT INTO public.reputation_events (user_id, room_id, action_type, points, metadata)
        VALUES (NEW.expert_id, NEW.room_id, 'expert_review_given', 25, jsonb_build_object('review_id', NEW.id, 'builder_id', NEW.builder_id));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_expert_review_points ON public.expert_reviews;
CREATE TRIGGER on_expert_review_points
    AFTER INSERT ON public.expert_reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_expert_review_points();


-- 3. Community Support (Reactions)
CREATE OR REPLACE FUNCTION public.handle_reaction_support_points()
RETURNS TRIGGER AS $$
DECLARE
    v_builder_id UUID;
BEGIN
    -- Ensure the person reacting is NOT the builder of the room to prevent self-farming
    SELECT builder_id INTO v_builder_id FROM public.rooms WHERE id = NEW.room_id;
    
    IF NEW.observer_id IS NOT NULL AND NEW.observer_id != v_builder_id THEN
        INSERT INTO public.reputation_events (user_id, room_id, action_type, points, metadata)
        VALUES (NEW.observer_id, NEW.room_id, 'community_support', 5, jsonb_build_object('reaction_id', NEW.id, 'type', NEW.type));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_reaction_support_points ON public.reactions;
CREATE TRIGGER on_reaction_support_points
    AFTER INSERT ON public.reactions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_reaction_support_points();


-- 4. Shipped Product Points
CREATE OR REPLACE FUNCTION public.handle_room_shipped_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Only award points if status changed to 'shipped' or 'completed' from something else
    IF NEW.status IN ('shipped', 'completed') AND OLD.status NOT IN ('shipped', 'completed') THEN
        INSERT INTO public.reputation_events (user_id, room_id, action_type, points, metadata)
        VALUES (NEW.builder_id, NEW.id, 'product_shipped', 500, jsonb_build_object('room_title', NEW.title));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_room_shipped_points ON public.rooms;
CREATE TRIGGER on_room_shipped_points
    AFTER UPDATE OF status ON public.rooms
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_room_shipped_points();
