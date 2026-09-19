-- Extended Achievement Triggers

-- 1. Seed the "Shipped!" badge
INSERT INTO public.badges (title, description, badge_type, icon_name, color_theme, points_required)
VALUES ('Shipped!', 'Successfully shipped a product from a build room.', 'achievement', 'Rocket', 'emerald', 0)
ON CONFLICT (title) DO NOTHING;

-- 2. Trigger for "Shipped!" Badge
CREATE OR REPLACE FUNCTION public.check_room_shipped_achievement()
RETURNS TRIGGER AS $$
DECLARE
    v_badge_id UUID;
BEGIN
    -- Check if status changed to 'shipped' or 'completed'
    IF NEW.status IN ('shipped', 'completed') AND OLD.status NOT IN ('shipped', 'completed') THEN
        -- Get the badge ID for 'Shipped!'
        SELECT id INTO v_badge_id FROM public.badges WHERE title = 'Shipped!' AND badge_type = 'achievement';
        
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

DROP TRIGGER IF EXISTS on_room_shipped_achievement ON public.rooms;
CREATE TRIGGER on_room_shipped_achievement
    AFTER UPDATE OF status ON public.rooms
    FOR EACH ROW
    EXECUTE FUNCTION public.check_room_shipped_achievement();
