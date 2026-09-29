-- Migration: 0091_add_fcm_token.sql
-- Description: Add fcm_token column to users table for Firebase Cloud Messaging push notifications.
--              The NotificationService in the Flutter app syncs this token on login/token refresh.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- Index for efficient server-side lookups when sending pushes
CREATE INDEX IF NOT EXISTS idx_users_fcm_token
  ON public.users (fcm_token)
  WHERE fcm_token IS NOT NULL;

-- Allow users to update their own FCM token (RLS)
-- Note: CREATE POLICY does not support IF NOT EXISTS; drop first to make idempotent.
DROP POLICY IF EXISTS "Users can update own fcm_token" ON public.users;
CREATE POLICY "Users can update own fcm_token"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
