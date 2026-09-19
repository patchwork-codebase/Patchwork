-- Automated Achievement Triggers

-- 1. Trigger for "First Room"
CREATE OR REPLACE FUNCTION public.check_first_room_achievement()
RETURNS TRIGGER AS $$
DECLARE
    v_room_count INTEGER;
    v_badge_id UUID;
BEGIN
    -- Check how many rooms the user has created
    SELECT count(*) INTO v_room_count
    FROM public.rooms
    WHERE builder_id = NEW.builder_id;

    IF v_room_count = 1 THEN
        -- Get the badge ID for 'First Room'
        SELECT id INTO v_badge_id FROM public.badges WHERE title = 'First Room' AND badge_type = 'achievement';
        
        IF v_badge_id IS NOT NULL THEN
            -- Check if they already have it
            IF NOT EXISTS (SELECT 1 FROM public.user_badges WHERE user_id = NEW.builder_id AND badge_id = v_badge_id) THEN
                INSERT INTO public.user_badges (user_id, badge_id, verified, issued_at)
                VALUES (NEW.builder_id, v_badge_id, true, NOW());
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_first_room_achievement ON public.rooms;
CREATE TRIGGER on_first_room_achievement
    AFTER INSERT ON public.rooms
    FOR EACH ROW
    EXECUTE FUNCTION public.check_first_room_achievement();


-- 2. Trigger for "Decision Architect"
CREATE OR REPLACE FUNCTION public.check_decision_architect_achievement()
RETURNS TRIGGER AS $$
DECLARE
    v_decision_count INTEGER;
    v_badge_id UUID;
BEGIN
    -- Check how many decisions the user has documented
    SELECT count(*) INTO v_decision_count
    FROM public.room_decisions
    WHERE builder_id = NEW.builder_id;

    IF v_decision_count = 100 THEN
        -- Get the badge ID for 'Decision Architect'
        SELECT id INTO v_badge_id FROM public.badges WHERE title = 'Decision Architect' AND badge_type = 'achievement';
        
        IF v_badge_id IS NOT NULL THEN
            IF NOT EXISTS (SELECT 1 FROM public.user_badges WHERE user_id = NEW.builder_id AND badge_id = v_badge_id) THEN
                INSERT INTO public.user_badges (user_id, badge_id, verified, issued_at)
                VALUES (NEW.builder_id, v_badge_id, true, NOW());
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_decision_architect_achievement ON public.room_decisions;
CREATE TRIGGER on_decision_architect_achievement
    AFTER INSERT ON public.room_decisions
    FOR EACH ROW
    EXECUTE FUNCTION public.check_decision_architect_achievement();
