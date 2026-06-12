-- Migration: 0017_notion_integration.sql
-- Description: Schema for Notion Integration

CREATE TABLE IF NOT EXISTS public.notion_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  workspace_name text,
  workspace_icon text,
  bot_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.notion_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notion accounts"
ON public.notion_accounts
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.room_notion_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text REFERENCES public.rooms(id) ON DELETE CASCADE,
  update_id text REFERENCES public.updates(id) ON DELETE CASCADE,
  page_id text NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  icon text,
  added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.room_notion_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room notion docs are viewable by everyone"
ON public.room_notion_docs
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Builders can manage notion docs for their rooms"
ON public.room_notion_docs
FOR ALL TO authenticated
USING (
  room_id IN (SELECT id FROM public.rooms WHERE builder_id = auth.uid())
)
WITH CHECK (
  room_id IN (SELECT id FROM public.rooms WHERE builder_id = auth.uid())
);

-- Enable realtime for room_notion_docs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'room_notion_docs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.room_notion_docs;
  END IF;
END $$;
