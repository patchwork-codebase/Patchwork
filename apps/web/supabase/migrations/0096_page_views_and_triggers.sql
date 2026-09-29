-- 0096_page_views_and_triggers.sql

-- 1. Page Views Table for Real Funnel Tracking
CREATE TABLE IF NOT EXISTS public.page_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable for anonymous views
    target_type TEXT NOT NULL CHECK (target_type IN ('profile', 'update', 'room')),
    target_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast analytics queries
CREATE INDEX IF NOT EXISTS idx_page_views_target ON public.page_views(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_page_views_viewer ON public.page_views(viewer_id);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a page view
CREATE POLICY "Anyone can insert page views"
    ON public.page_views FOR INSERT
    WITH CHECK (true);

-- Anyone can read page views (for dashboard aggregation)
CREATE POLICY "Anyone can read page views"
    ON public.page_views FOR SELECT
    USING (true);


-- 2. Push Notification Trigger for Bounty Applications (Pitches)
CREATE OR REPLACE FUNCTION notify_observer_on_pitch()
RETURNS trigger AS $$
DECLARE
    v_observer_id UUID;
    v_builder_name TEXT;
    v_update_content TEXT;
BEGIN
    -- Only trigger on new pending applications
    IF NEW.status = 'pending' THEN
        -- Get the observer ID from the update that the bounty is attached to
        SELECT author_id, content INTO v_observer_id, v_update_content 
        FROM public.updates 
        WHERE id = NEW.update_id;

        -- Get the builder's name
        SELECT name INTO v_builder_name 
        FROM public.users 
        WHERE id = NEW.builder_id;

        -- Insert a notification using the existing trigger_push_notification function
        IF v_observer_id IS NOT NULL THEN
            PERFORM trigger_push_notification(
                v_observer_id,
                'New Pitch Received! 🎯',
                v_builder_name || ' wants to build your idea: "' || substring(v_update_content from 1 for 30) || '..."',
                '{"type": "bounty_pitch", "update_id": "' || NEW.update_id || '"}'::jsonb
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_bounty_pitch_created ON public.bounty_applications;
CREATE TRIGGER on_bounty_pitch_created
    AFTER INSERT ON public.bounty_applications
    FOR EACH ROW
    EXECUTE FUNCTION notify_observer_on_pitch();


-- 3. Push Notification Trigger for Reactions
CREATE OR REPLACE FUNCTION notify_author_on_reaction()
RETURNS trigger AS $$
DECLARE
    v_author_id UUID;
    v_update_content TEXT;
BEGIN
    -- Get the author ID of the update being reacted to
    SELECT author_id, content INTO v_author_id, v_update_content 
    FROM public.updates 
    WHERE id = NEW.update_id;

    -- Don't notify if reacting to own update
    IF v_author_id IS NOT NULL AND v_author_id != NEW.observer_id THEN
        PERFORM trigger_push_notification(
            v_author_id,
            'New Reaction',
            NEW.observer_name || ' reacted ' || NEW.text || ' to your update',
            '{"type": "reaction", "update_id": "' || NEW.update_id || '"}'::jsonb
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_reaction_created ON public.reactions;
CREATE TRIGGER on_reaction_created
    AFTER INSERT ON public.reactions
    FOR EACH ROW
    EXECUTE FUNCTION notify_author_on_reaction();
