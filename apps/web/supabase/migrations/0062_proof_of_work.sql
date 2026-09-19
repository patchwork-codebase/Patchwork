-- Proof of Work & Builder Reputation Schema

-- 1. Reputation Events Table (Immutable ledger of points earned)
CREATE TABLE IF NOT EXISTS public.reputation_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    room_id TEXT REFERENCES public.rooms(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    points INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fast aggregation of user scores
CREATE INDEX idx_reputation_events_user_id ON public.reputation_events(user_id);

-- 2. Badges Table (Global definitions of achievable badges)
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    badge_type TEXT NOT NULL, -- 'level', 'achievement', 'recognition'
    icon_name TEXT,           -- Lucide icon name or image URL
    color_theme TEXT,         -- e.g., 'emerald', 'amber', 'indigo'
    points_required INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insert initial levels as badges
INSERT INTO public.badges (title, description, badge_type, icon_name, color_theme, points_required)
VALUES 
('Explorer', 'Started the journey.', 'level', 'Compass', 'slate', 0),
('Maker', 'Creating and building.', 'level', 'Hammer', 'blue', 100),
('Builder', 'Consistently shipping.', 'level', 'Box', 'indigo', 500),
('Creator', 'Designing complex solutions.', 'level', 'Brush', 'purple', 1000),
('Leader', 'Guiding teams and products.', 'level', 'Flag', 'emerald', 2500),
('Expert', 'Recognized domain authority.', 'level', 'Star', 'amber', 5000),
('Master Builder', 'Exceptional consistent contributions.', 'level', 'Crown', 'orange', 10000),
('Legend', 'A pillar of the community.', 'level', 'Zap', 'red', 25000)
ON CONFLICT (title) DO NOTHING;

-- Insert some achievement badges
INSERT INTO public.badges (title, description, badge_type, icon_name, color_theme, points_required)
VALUES 
('Decision Architect', '100 Decisions documented.', 'achievement', 'GitMerge', 'indigo', 0),
('First Room', 'Created your first build room.', 'achievement', 'PlusCircle', 'emerald', 0),
('Top Mentor', 'Recognized for helping others build.', 'recognition', 'Award', 'amber', 0)
ON CONFLICT (title) DO NOTHING;

-- 3. User Badges Table (Badges earned by users)
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
    evidence_url TEXT,
    verified BOOLEAN DEFAULT true,
    issued_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (user_id, badge_id) -- A user can earn a specific badge only once (for most cases)
);

-- Function to handle automated point allocation and update user reputation
CREATE OR REPLACE FUNCTION public.handle_reputation_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the users table's total reputation
    UPDATE public.users 
    SET reputation = COALESCE(reputation, 0) + NEW.points
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run the function whenever a reputation event occurs
DROP TRIGGER IF EXISTS on_reputation_event ON public.reputation_events;
CREATE TRIGGER on_reputation_event
    AFTER INSERT ON public.reputation_events
    FOR EACH ROW EXECUTE FUNCTION public.handle_reputation_event();

-- RLS Policies
ALTER TABLE public.reputation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Badges are visible to everyone
CREATE POLICY "Badges are viewable by everyone" ON public.badges
    FOR SELECT USING (true);

-- User badges are visible to everyone
CREATE POLICY "User badges are viewable by everyone" ON public.user_badges
    FOR SELECT USING (true);

-- Reputation events are viewable by everyone (for timeline)
CREATE POLICY "Reputation events are viewable by everyone" ON public.reputation_events
    FOR SELECT USING (true);
