-- Migration: 0042_organization_branding.sql
-- Description: Adds organization fields to public.users

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS organization_name text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS organization_logo_url text;
