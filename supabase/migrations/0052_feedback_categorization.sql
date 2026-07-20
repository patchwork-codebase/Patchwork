-- Migration 0052: Add feedback categorization columns to reactions table
-- These columns store heuristic-computed values for feedback analysis
-- so we don't have to recompute them on every render from the client.

ALTER TABLE reactions
  ADD COLUMN IF NOT EXISTS feedback_category text,
  ADD COLUMN IF NOT EXISTS signal_score      integer DEFAULT 0;

-- Add a comment to document the valid categories
COMMENT ON COLUMN reactions.feedback_category IS
  'Heuristic feedback category: Bug | Idea | Critique | Encouragement | Uncategorized';

COMMENT ON COLUMN reactions.signal_score IS
  'Heuristic signal score from 0-100. Scores >= 70 are considered High Signal.';
