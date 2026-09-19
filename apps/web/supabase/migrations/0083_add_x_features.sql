-- Migration: 0083_add_x_features.sql
-- Purpose: Support for View Counts, Bookmarks, and Quote Updates.

-- 1. View Counts
-- Add view_count to updates table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'updates' AND column_name = 'view_count') THEN
        ALTER TABLE public.updates ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- 2. Quote Updates
-- Add quoted_update_id to updates table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'updates' AND column_name = 'quoted_update_id') THEN
        ALTER TABLE public.updates ADD COLUMN quoted_update_id TEXT REFERENCES public.updates(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Update Bookmarks Table (Named update_bookmarks to avoid conflict with room bookmarks)
CREATE TABLE IF NOT EXISTS public.update_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    update_id TEXT NOT NULL REFERENCES public.updates(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, update_id) -- A user can only bookmark an update once
);

-- RLS for Update Bookmarks
ALTER TABLE public.update_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own update bookmarks"
    ON public.update_bookmarks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own update bookmarks"
    ON public.update_bookmarks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own update bookmarks"
    ON public.update_bookmarks FOR DELETE
    USING (auth.uid() = user_id);
