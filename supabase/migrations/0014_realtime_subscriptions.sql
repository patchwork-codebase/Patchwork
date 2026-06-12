-- Migration: 0014_realtime_subscriptions.sql
-- Description: Enable real-time subscriptions for rooms, updates, reactions, room_decisions, and linear_issues

-- Ensure the tables are in the supabase_realtime publication
DO $$
BEGIN
  -- We don't drop the publication, we just add to it if it exists.
  -- Supabase already creates this publication by default.
  
  -- Add rooms
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'rooms') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
  END IF;

  -- Add updates
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'updates') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.updates;
  END IF;

  -- Add reactions
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'reactions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions;
  END IF;

  -- Add room_decisions
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'room_decisions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.room_decisions;
  END IF;

  -- Add linear_issues
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'linear_issues') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.linear_issues;
  END IF;
END $$;
