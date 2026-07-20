-- Migration: 0060_fix_expert_applications_rls.sql
-- Description: Fix RLS policies for admins on expert_applications to use JWT metadata

DROP POLICY IF EXISTS "Admins can view all applications" ON public.expert_applications;
CREATE POLICY "Admins can view all applications" ON public.expert_applications
  FOR SELECT USING (
    coalesce(auth.jwt()->'app_metadata'->>'role', auth.jwt()->'user_metadata'->>'role') IN ('admin', 'superadmin')
  );

DROP POLICY IF EXISTS "Admins can update all applications" ON public.expert_applications;
CREATE POLICY "Admins can update all applications" ON public.expert_applications
  FOR UPDATE USING (
    coalesce(auth.jwt()->'app_metadata'->>'role', auth.jwt()->'user_metadata'->>'role') IN ('admin', 'superadmin')
  );
