-- Migration: add update_type to updates table
-- Update types: decision, scrap, pivot, blocker, insight, open_question, shipped, general

ALTER TABLE public.updates 
  ADD COLUMN IF NOT EXISTS update_type TEXT NOT NULL DEFAULT 'general'
  CHECK (update_type IN ('general', 'decision', 'scrap', 'pivot', 'blocker', 'insight', 'open_question', 'shipped'));

CREATE INDEX IF NOT EXISTS idx_updates_type ON public.updates(update_type);

COMMENT ON COLUMN public.updates.update_type IS 'Structured tag for the kind of update: general, decision, scrap, pivot, blocker, insight, open_question, shipped';
