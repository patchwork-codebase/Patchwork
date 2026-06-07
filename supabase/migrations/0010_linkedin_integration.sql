-- Migration: 0010_linkedin_integration.sql
-- Description: Schema for LinkedIn Integration

CREATE TABLE IF NOT EXISTS public.linkedin_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  linkedin_user_id text NOT NULL,
  access_token text,
  refresh_token text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.linkedin_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  build_log_id text REFERENCES rooms(id) ON DELETE CASCADE,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'draft', -- draft, published, failed
  linkedin_post_id text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.linkedin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_posts ENABLE ROW LEVEL SECURITY;

-- Policies for linkedin_accounts
CREATE POLICY "Users can manage their own linkedin accounts"
ON public.linkedin_accounts
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies for linkedin_posts
CREATE POLICY "Users can manage their own linkedin posts"
ON public.linkedin_posts
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
