-- Migration: 0006_github_integration.sql
-- Description: Schema for GitHub Integration (accounts, repositories, webhooks, drafts)

CREATE TABLE IF NOT EXISTS public.github_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  github_user_id text NOT NULL,
  github_username text NOT NULL,
  access_token_encrypted text NOT NULL,
  connected_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.repositories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  github_repo_id text NOT NULL,
  github_repo_name text NOT NULL,
  github_owner text NOT NULL,
  is_public boolean NOT NULL DEFAULT true,
  linked_room_id text REFERENCES rooms(id) ON DELETE CASCADE,
  linked_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(linked_room_id)
);

CREATE TABLE IF NOT EXISTS public.github_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  github_event_id text,
  repo_id uuid REFERENCES repositories(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.github_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text REFERENCES rooms(id) ON DELETE CASCADE,
  repo_id uuid REFERENCES repositories(id) ON DELETE CASCADE,
  commit_hash text NOT NULL,
  commit_title text NOT NULL,
  commit_message text,
  commit_url text,
  diff_preview text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.github_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_drafts ENABLE ROW LEVEL SECURITY;

-- Policies for github_accounts
CREATE POLICY "Users can manage their own github accounts"
ON public.github_accounts
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies for repositories
CREATE POLICY "Users can manage their own repositories"
ON public.repositories
FOR ALL TO authenticated
USING (auth.uid() = linked_user_id)
WITH CHECK (auth.uid() = linked_user_id);

-- Policies for github_webhook_events (internal use mostly, but builder can read their own)
CREATE POLICY "Users can read webhook events for their repos"
ON public.github_webhook_events
FOR SELECT TO authenticated
USING (
  repo_id IN (SELECT id FROM public.repositories WHERE linked_user_id = auth.uid())
);

-- Policies for github_drafts
CREATE POLICY "Users can manage their own github drafts"
ON public.github_drafts
FOR ALL TO authenticated
USING (
  room_id IN (SELECT id FROM public.rooms WHERE builder_id = auth.uid())
)
WITH CHECK (
  room_id IN (SELECT id FROM public.rooms WHERE builder_id = auth.uid())
);
