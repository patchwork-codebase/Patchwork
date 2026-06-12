-- Migration: 0013_linear_integration.sql
-- Description: Schema for Linear Integration (accounts, issues)

CREATE TABLE IF NOT EXISTS public.linear_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  access_token text NOT NULL,
  connected_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.linear_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  linear_issue_id text NOT NULL,
  title text NOT NULL,
  description text,
  state text NOT NULL,
  url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, linear_issue_id)
);

-- Enable RLS
ALTER TABLE public.linear_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linear_issues ENABLE ROW LEVEL SECURITY;

-- Policies for linear_accounts
CREATE POLICY "Users can manage their own linear accounts"
ON public.linear_accounts
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies for linear_issues
CREATE POLICY "Linear issues are viewable by everyone"
ON public.linear_issues
FOR SELECT TO authenticated
USING (true);

-- Builders can manage linear issues for their rooms
CREATE POLICY "Builders can manage linear issues for their rooms"
ON public.linear_issues
FOR ALL TO authenticated
USING (
  room_id IN (SELECT id FROM public.rooms WHERE builder_id = auth.uid())
)
WITH CHECK (
  room_id IN (SELECT id FROM public.rooms WHERE builder_id = auth.uid())
);
