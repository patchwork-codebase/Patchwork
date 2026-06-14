-- Migration: 0026_verified_experts.sql
-- Description: Verified Expert Program — applications table + expert columns on users

-- 1. Add expert columns to public.users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_verified_expert BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS expert_level TEXT,
  ADD COLUMN IF NOT EXISTS expert_domains TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS expert_review_score NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS expert_reviews_completed INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expert_acceptance_rate NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS expert_avg_response_hours INT,
  ADD COLUMN IF NOT EXISTS expert_open_slots INT DEFAULT 3,
  ADD COLUMN IF NOT EXISTS expert_available BOOLEAN DEFAULT TRUE;

-- 2. Create expert_applications table
CREATE TABLE IF NOT EXISTS public.expert_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),

  -- Domain & identity
  domains TEXT[] NOT NULL DEFAULT '{}',
  headline TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  years_experience INT,
  job_title TEXT,
  company TEXT,
  past_companies TEXT,

  -- Links
  linkedin_url TEXT,
  portfolio_url TEXT,
  website TEXT,
  public_work TEXT,

  -- Application details
  reason TEXT,
  monthly_review_capacity INT,
  timezone TEXT,
  languages TEXT[],

  -- Tier (MVP: always bronze)
  verification_level TEXT DEFAULT 'bronze',

  -- Admin fields
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,

  -- Timestamps
  submitted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS on expert_applications
ALTER TABLE public.expert_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own application" ON public.expert_applications;
CREATE POLICY "Users can view their own application" ON public.expert_applications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own application" ON public.expert_applications;
CREATE POLICY "Users can insert their own application" ON public.expert_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own draft application" ON public.expert_applications;
CREATE POLICY "Users can update their own draft application" ON public.expert_applications
  FOR UPDATE USING (auth.uid() = user_id AND status IN ('draft', 'pending'));

DROP POLICY IF EXISTS "Admins can view all applications" ON public.expert_applications;
CREATE POLICY "Admins can view all applications" ON public.expert_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

DROP POLICY IF EXISTS "Admins can update all applications" ON public.expert_applications;
CREATE POLICY "Admins can update all applications" ON public.expert_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- 4. Unique constraint: one active application per user
CREATE UNIQUE INDEX IF NOT EXISTS expert_applications_user_active_idx
  ON public.expert_applications (user_id)
  WHERE status IN ('draft', 'pending', 'approved');

-- 5. Index for admin queue (pending, ordered by submitted_at)
CREATE INDEX IF NOT EXISTS expert_applications_status_idx
  ON public.expert_applications (status, submitted_at DESC);
