-- Migration: 0003_welcome_emails_log.sql
-- Description: Create table to log welcome emails and ensure idempotency.

CREATE TABLE IF NOT EXISTS public.welcome_emails_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_welcome_email UNIQUE (user_id)
);

-- Enable RLS (only service role or matching users can interact, though it's mainly for edge functions)
ALTER TABLE public.welcome_emails_log ENABLE ROW LEVEL SECURITY;

-- Allow edge functions (service_role) full access implicitly,
-- but just in case we query from client, allow users to see their own logs
DROP POLICY IF EXISTS "Allow users to read their own email logs" ON public.welcome_emails_log;
CREATE POLICY "Allow users to read their own email logs" 
  ON public.welcome_emails_log
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Optional: Allow users to insert their own 'pending' record (if called from client, though edge function is safer)
DROP POLICY IF EXISTS "Allow users to insert their own email logs" ON public.welcome_emails_log;
CREATE POLICY "Allow users to insert their own email logs" 
  ON public.welcome_emails_log
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
