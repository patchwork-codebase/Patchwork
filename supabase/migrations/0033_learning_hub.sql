-- Migration: 0033_learning_hub.sql
-- Description: Adds tables for Learning Hub curation, bookmarking, and newsletter subscriptions

-- 1. Newsletter Subscribers
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    source TEXT DEFAULT 'learning_hub',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for newsletter_subscribers (Public can insert, only admins can view)
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own subscription" ON public.newsletter_subscribers FOR SELECT USING (auth.jwt() ->> 'email' = email);

-- 2. Bookmarks
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, room_id)
);

-- RLS for bookmarks
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own bookmarks" ON public.bookmarks FOR ALL USING (auth.uid() = user_id);

-- 3. Learning Hub Features (Curation)
CREATE TABLE IF NOT EXISTS public.learning_hub_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE UNIQUE,
    editorial_note TEXT,
    is_build_of_the_month BOOLEAN DEFAULT false,
    featured_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for learning_hub_features (Public read, admin write)
ALTER TABLE public.learning_hub_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view learning hub features" ON public.learning_hub_features FOR SELECT USING (true);
-- Note: Assuming you manage inserts via Supabase dashboard or an admin portal.

-- 4. Seed data (optional: feature a few random existing active public rooms)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM public.rooms WHERE status = 'active' AND is_private = false LIMIT 3 LOOP
        INSERT INTO public.learning_hub_features (room_id, editorial_note)
        VALUES (
            r.id, 
            'This build log is a masterclass in iterating quickly and documenting product decisions.'
        ) ON CONFLICT DO NOTHING;
    END LOOP;
END $$;
