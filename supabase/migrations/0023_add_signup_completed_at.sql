-- Migration: 0023_add_signup_completed_at.sql
-- Description: Add onboarding flags to users table

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS signup_completed_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarding_call_scheduled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS observer_room_step_done BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS feed_focus TEXT DEFAULT '';
