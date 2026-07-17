-- Add builder_type column to users table for admin verification tracking
-- This column stores a JSON object with verification status, type, date, verified_by, and history

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS builder_type TEXT DEFAULT NULL;

-- Simple index on the column (safe — no JSON casting on existing rows)
CREATE INDEX IF NOT EXISTS idx_users_builder_type
  ON public.users (builder_type)
  WHERE builder_type IS NOT NULL;
