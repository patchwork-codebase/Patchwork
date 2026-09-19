-- Migration: 0078_platform_feedback.sql
-- Description: Table for storing platform bug reports and feature requests

CREATE TABLE IF NOT EXISTS public.platform_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  image_url text,
  url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_feedback ENABLE ROW LEVEL SECURITY;

-- Policies for platform_feedback
-- Users can insert their own feedback
DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.platform_feedback;
CREATE POLICY "Users can insert their own feedback"
ON public.platform_feedback
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.platform_feedback;
CREATE POLICY "Users can view their own feedback"
ON public.platform_feedback
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
