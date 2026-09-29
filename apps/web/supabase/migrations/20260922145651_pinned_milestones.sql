-- Migration: pinned_milestones
-- Description: Add pinned_update_id to users to allow pinning a milestone on their profile

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pinned_update_id TEXT REFERENCES public.updates(id) ON DELETE SET NULL;
