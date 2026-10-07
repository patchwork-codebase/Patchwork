-- Migration: 0111_builder_pm_onboarding.sql
-- Add Builder PM onboarding attributes, career status, and simulation tracking

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS specialisation TEXT,
  ADD COLUMN IF NOT EXISTS career_status TEXT,
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS seniority TEXT,
  ADD COLUMN IF NOT EXISTS pm_level TEXT,
  ADD COLUMN IF NOT EXISTS simulation_onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS simulation_tier TEXT;

-- Helper trigger to ensure organization_name is populated from company_name and pm_level from seniority
CREATE OR REPLACE FUNCTION sync_user_company_org()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.company_name IS NOT NULL AND (NEW.organization_name IS NULL OR NEW.organization_name = '') THEN
    NEW.organization_name := NEW.company_name;
  END IF;
  IF NEW.seniority IS NOT NULL AND (NEW.pm_level IS NULL OR NEW.pm_level = '') THEN
    NEW.pm_level := NEW.seniority;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_user_company_org ON public.users;
CREATE TRIGGER trg_sync_user_company_org
BEFORE INSERT OR UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION sync_user_company_org();
