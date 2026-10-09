-- Migration: 0113_endorse_simulation_response.sql
-- Description: Robust simulation reputation engine and security definer RPC for endorsements.

-- 1. SECURITY DEFINER RPC to endorse responses and award 100 rep to respondent
CREATE OR REPLACE FUNCTION public.endorse_simulation_response(p_response_id UUID)
RETURNS VOID AS $$
DECLARE
    v_update_id TEXT;
    v_respondent UUID;
    v_already BOOLEAN;
BEGIN
    SELECT sr.update_id, sr.user_id, COALESCE(sr.is_featured, false)
    INTO v_update_id, v_respondent, v_already
    FROM public.simulation_responses sr
    WHERE sr.id = p_response_id;

    IF v_update_id IS NULL THEN
        RAISE EXCEPTION 'Response not found';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.updates u
        WHERE u.id = v_update_id AND u.author_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Only the challenge creator can endorse responses';
    END IF;

    IF v_already THEN
        RETURN;
    END IF;

    UPDATE public.simulation_responses SET is_featured = true WHERE id = p_response_id;

    INSERT INTO public.reputation_events (user_id, action_type, points, metadata)
    VALUES (
        v_respondent,
        'featured_simulation_rationale',
        100,
        jsonb_build_object('update_id', v_update_id, 'endorsed_by', auth.uid())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.endorse_simulation_response(UUID) TO authenticated;


-- 2. Trigger on simulation responses (awards 75 rep if defense/rationale provided, 50 rep if choice only)
CREATE OR REPLACE FUNCTION public.handle_simulation_response_reward()
RETURNS TRIGGER AS $$
DECLARE
    v_has_defense BOOLEAN;
    v_points INTEGER;
    v_action_type TEXT;
BEGIN
    v_has_defense := (NEW.rationale IS NOT NULL AND length(trim(NEW.rationale)) > 0);
    v_points := CASE WHEN v_has_defense THEN 75 ELSE 50 END;
    v_action_type := CASE WHEN v_has_defense THEN 'simulation_defense_submitted' ELSE 'simulation_choice_submitted' END;

    INSERT INTO public.reputation_events (
        user_id,
        action_type,
        points,
        metadata
    ) VALUES (
        NEW.user_id,
        v_action_type,
        v_points,
        jsonb_build_object(
            'update_id', NEW.update_id,
            'selected_option_id', NEW.selected_option_id,
            'defense_provided', v_has_defense
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_simulation_response_reward ON public.simulation_responses;
CREATE TRIGGER on_simulation_response_reward
    AFTER INSERT ON public.simulation_responses
    FOR EACH ROW EXECUTE FUNCTION public.handle_simulation_response_reward();


-- 3. Trigger for creating a community challenge (+100 rep for senior builders)
CREATE OR REPLACE FUNCTION public.handle_simulation_created_reward()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.update_type = 'simulation' AND NEW.author_id IS NOT NULL THEN
        INSERT INTO public.reputation_events (
            user_id,
            room_id,
            action_type,
            points,
            metadata
        ) VALUES (
            NEW.author_id,
            NEW.room_id,
            'created_simulation_challenge',
            100,
            jsonb_build_object('update_id', NEW.id, 'title', NEW.content)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_simulation_created_reward ON public.updates;
CREATE TRIGGER on_simulation_created_reward
    AFTER INSERT ON public.updates
    FOR EACH ROW EXECUTE FUNCTION public.handle_simulation_created_reward();
