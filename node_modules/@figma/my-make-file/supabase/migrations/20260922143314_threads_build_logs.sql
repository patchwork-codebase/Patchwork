-- Migration: threads_build_logs
-- Description: Add parent_update_id to updates table to support threaded build logs

ALTER TABLE public.updates ADD COLUMN parent_update_id TEXT REFERENCES public.updates(id) ON DELETE SET NULL;

-- Index for faster thread retrieval
CREATE INDEX idx_updates_parent_update_id ON public.updates(parent_update_id);
