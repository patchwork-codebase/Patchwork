-- Migration: 0079_platform_feedback_admin_rls.sql
-- Description: Allow admins to view platform feedback

DROP POLICY IF EXISTS "Admins can view all feedback" ON public.platform_feedback;
CREATE POLICY "Admins can view all feedback" ON public.platform_feedback
  FOR SELECT USING (
    coalesce(auth.jwt()->'app_metadata'->>'role', auth.jwt()->'user_metadata'->>'role') IN ('admin', 'superadmin')
  );

DROP POLICY IF EXISTS "Admins can update all feedback" ON public.platform_feedback;
CREATE POLICY "Admins can update all feedback" ON public.platform_feedback
  FOR UPDATE USING (
    coalesce(auth.jwt()->'app_metadata'->>'role', auth.jwt()->'user_metadata'->>'role') IN ('admin', 'superadmin')
  );

DROP POLICY IF EXISTS "Admins can delete all feedback" ON public.platform_feedback;
CREATE POLICY "Admins can delete all feedback" ON public.platform_feedback
  FOR DELETE USING (
    coalesce(auth.jwt()->'app_metadata'->>'role', auth.jwt()->'user_metadata'->>'role') IN ('admin', 'superadmin')
  );
