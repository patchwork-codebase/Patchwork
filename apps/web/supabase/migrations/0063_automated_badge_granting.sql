-- Automated Badge Granting Trigger

-- Function to automatically grant level badges based on reputation points
CREATE OR REPLACE FUNCTION public.check_and_grant_level_badges()
RETURNS TRIGGER AS $$
DECLARE
    badge_rec RECORD;
BEGIN
    -- Only proceed if reputation has increased
    IF NEW.reputation > COALESCE(OLD.reputation, 0) THEN
        FOR badge_rec IN 
            SELECT id, points_required 
            FROM public.badges 
            WHERE badge_type = 'level' AND points_required <= NEW.reputation
        LOOP
            -- Check if user already has this badge
            IF NOT EXISTS (SELECT 1 FROM public.user_badges WHERE user_id = NEW.id AND badge_id = badge_rec.id) THEN
                INSERT INTO public.user_badges (user_id, badge_id, verified, issued_at)
                VALUES (NEW.id, badge_rec.id, true, NOW());
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run the function whenever user reputation is updated
DROP TRIGGER IF EXISTS on_user_reputation_increase ON public.users;
CREATE TRIGGER on_user_reputation_increase
    AFTER UPDATE OF reputation ON public.users
    FOR EACH ROW
    WHEN (NEW.reputation > COALESCE(OLD.reputation, 0))
    EXECUTE FUNCTION public.check_and_grant_level_badges();
