-- Add 'needs_feedback' boolean column to 'updates' table
ALTER TABLE public.updates
ADD COLUMN IF NOT EXISTS needs_feedback BOOLEAN DEFAULT false;
