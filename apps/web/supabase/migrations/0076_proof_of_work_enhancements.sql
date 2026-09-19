-- Migration 0076: Proof of Work Enhancements
-- Adds support for decision trade-off matrices, interactive code diffs, metric impact wins, and project milestone tracking

ALTER TABLE public.updates
  ADD COLUMN IF NOT EXISTS decision_matrix JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS diff_data JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS metric_win JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS milestone_phase VARCHAR(50) DEFAULT NULL;

COMMENT ON COLUMN public.updates.decision_matrix IS 'Stores options evaluated, trade-offs, and selected path for decision/crossroad posts';
COMMENT ON COLUMN public.updates.diff_data IS 'Stores code diff snippets with before/after lines and language metadata';
COMMENT ON COLUMN public.updates.metric_win IS 'Stores benchmark performance wins (e.g. latency reduction, conversion increase)';
COMMENT ON COLUMN public.updates.milestone_phase IS 'Associates update with milestone phases (e.g. ideation, mvp, public_beta, scaling)';

-- Add milestone tracking to rooms
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS current_milestone VARCHAR(50) DEFAULT 'ideation',
  ADD COLUMN IF NOT EXISTS milestone_history JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.rooms.current_milestone IS 'Current milestone phase of the room (ideation, prototype, beta, launched, scaling)';
