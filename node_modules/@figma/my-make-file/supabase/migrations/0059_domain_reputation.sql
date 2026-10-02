-- Migration: Add domain_reputation to profiles

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS domain_reputation jsonb NOT NULL DEFAULT '{}'::jsonb;
