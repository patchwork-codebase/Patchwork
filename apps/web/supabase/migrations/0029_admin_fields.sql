-- Add admin specific fields to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS admin_note text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS suspended boolean DEFAULT false;
