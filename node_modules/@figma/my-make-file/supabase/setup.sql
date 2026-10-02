-- ============================================================================
-- SQL SETUP: ROW-LEVEL SECURITY (RLS) POLICIES & DATABASE INDEXING
-- ============================================================================
-- Copy and run this script in your Supabase SQL Editor to secure the database 
-- and optimize query execution speeds as the dataset scales.
-- ============================================================================

--------------------------------------------------------------------------------
-- 1. ROW-LEVEL SECURITY (RLS) ENFORCEMENT & POLICIES (P0)
--------------------------------------------------------------------------------

-- Enable RLS on core tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- users table policies
DROP POLICY IF EXISTS "Allow public read access to users" ON public.users;
CREATE POLICY "Allow public read access to users" ON public.users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.users;
CREATE POLICY "Allow users to update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.users;
CREATE POLICY "Allow users to insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- rooms table policies
DROP POLICY IF EXISTS "Allow public read access to rooms" ON public.rooms;
CREATE POLICY "Allow public read access to rooms" ON public.rooms
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated builders to create rooms" ON public.rooms;
CREATE POLICY "Allow authenticated builders to create rooms" ON public.rooms
  FOR INSERT WITH CHECK (auth.uid() = builder_id);

DROP POLICY IF EXISTS "Allow builders to update their own rooms" ON public.rooms;
CREATE POLICY "Allow builders to update their own rooms" ON public.rooms
  FOR UPDATE USING (auth.uid() = builder_id);

DROP POLICY IF EXISTS "Allow builders to delete their own rooms" ON public.rooms;
CREATE POLICY "Allow builders to delete their own rooms" ON public.rooms
  FOR DELETE USING (auth.uid() = builder_id);

-- updates table policies
DROP POLICY IF EXISTS "Allow public read access to updates" ON public.updates;
CREATE POLICY "Allow public read access to updates" ON public.updates
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated builders to post updates to their rooms" ON public.updates;
CREATE POLICY "Allow authenticated builders to post updates to their rooms" ON public.updates
  FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Allow builders to update their own updates" ON public.updates;
CREATE POLICY "Allow builders to update their own updates" ON public.updates
  FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Allow builders to delete their own updates" ON public.updates;
CREATE POLICY "Allow builders to delete their own updates" ON public.updates
  FOR DELETE USING (auth.uid() = author_id);

-- reactions table policies (likes and replies)
DROP POLICY IF EXISTS "Allow public read access to reactions" ON public.reactions;
CREATE POLICY "Allow public read access to reactions" ON public.reactions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert reactions" ON public.reactions;
CREATE POLICY "Allow authenticated users to insert reactions" ON public.reactions
  FOR INSERT WITH CHECK (auth.uid() = observer_id);

DROP POLICY IF EXISTS "Allow users to update their own reactions" ON public.reactions;
CREATE POLICY "Allow users to update their own reactions" ON public.reactions
  FOR UPDATE USING (auth.uid() = observer_id);

DROP POLICY IF EXISTS "Allow users to delete their own reactions" ON public.reactions;
CREATE POLICY "Allow users to delete their own reactions" ON public.reactions
  FOR DELETE USING (auth.uid() = observer_id);


--------------------------------------------------------------------------------
-- 2. DATABASE PERFORMANCE INDEXES (P1)
--------------------------------------------------------------------------------

-- Rooms indexes
CREATE INDEX IF NOT EXISTS idx_rooms_builder_id ON public.rooms(builder_id);

-- Updates indexes
CREATE INDEX IF NOT EXISTS idx_updates_room_id ON public.updates(room_id);
CREATE INDEX IF NOT EXISTS idx_updates_author_id ON public.updates(author_id);

-- Reactions indexes (crucial for feed joins on likes/replies)
CREATE INDEX IF NOT EXISTS idx_reactions_update_id ON public.reactions(update_id);
CREATE INDEX IF NOT EXISTS idx_reactions_room_id ON public.reactions(room_id);
CREATE INDEX IF NOT EXISTS idx_reactions_observer_id ON public.reactions(observer_id);


--------------------------------------------------------------------------------
-- 3. VALIDATION CHECK CONSTRAINTS & REFERENTIAL INTEGRITY (P0/P3)
--------------------------------------------------------------------------------

-- Validation: Enforce strict role options and name rules on users table
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS chk_users_role;
ALTER TABLE public.users ADD CONSTRAINT chk_users_role CHECK (role IN ('builder', 'observer'));

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS chk_users_name;
ALTER TABLE public.users ADD CONSTRAINT chk_users_name CHECK (char_length(name) >= 2);

-- Referential Cascades: Automatically clean up child records when a room is deleted
ALTER TABLE public.updates DROP CONSTRAINT IF EXISTS updates_room_id_fkey;
ALTER TABLE public.updates ADD CONSTRAINT updates_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;

ALTER TABLE public.reactions DROP CONSTRAINT IF EXISTS reactions_room_id_fkey;
ALTER TABLE public.reactions ADD CONSTRAINT reactions_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;

ALTER TABLE public.room_observers DROP CONSTRAINT IF EXISTS room_observers_room_id_fkey;
ALTER TABLE public.room_observers ADD CONSTRAINT room_observers_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;


--------------------------------------------------------------------------------
-- 4. EMAIL VERIFICATION RPC FUNCTION (SECURITY DEFINER)
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION verify_email_token(token_val text)
RETURNS json AS $$
DECLARE
  token_record RECORD;
BEGIN
  -- 1. Find the token
  SELECT * INTO token_record
  FROM email_verification_tokens
  WHERE token = token_val;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired token');
  END IF;

  IF token_record.used THEN
    RETURN json_build_object('success', false, 'error', 'Token already used');
  END IF;

  IF token_record.expires_at < NOW() THEN
    RETURN json_build_object('success', false, 'error', 'Token expired');
  END IF;

  -- 2. Mark token as used
  UPDATE email_verification_tokens
  SET used = true
  WHERE id = token_record.id;

  -- 3. Update auth.users table directly (confirm email)
  UPDATE auth.users
  SET email_confirmed_at = NOW(),
      updated_at = NOW()
  WHERE id = token_record.user_id;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


--------------------------------------------------------------------------------
-- 5. ENABLE REAL-TIME REPLICATION FOR CORE TABLES
--------------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'updates'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.updates;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'reactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'room_observers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.room_observers;
  END IF;
END $$;


--------------------------------------------------------------------------------
-- 6. SCHEMATIC CORRECTIONS (FOREIGN KEYS, MISSING COLUMNS, REPLICA IDENTITIES)
--------------------------------------------------------------------------------

-- Add missing columns to room_observers
ALTER TABLE public.room_observers ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.room_observers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add missing foreign key relationships to users (enables PostgREST joins like users(name))
ALTER TABLE public.reactions DROP CONSTRAINT IF EXISTS reactions_observer_id_fkey;
ALTER TABLE public.reactions ADD CONSTRAINT reactions_observer_id_fkey FOREIGN KEY (observer_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.room_observers DROP CONSTRAINT IF EXISTS room_observers_observer_id_fkey;
ALTER TABLE public.room_observers ADD CONSTRAINT room_observers_observer_id_fkey FOREIGN KEY (observer_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Enable Replica Identity Full to support real-time replication of updates/deletes
ALTER TABLE public.rooms REPLICA IDENTITY FULL;
ALTER TABLE public.updates REPLICA IDENTITY FULL;
ALTER TABLE public.reactions REPLICA IDENTITY FULL;
ALTER TABLE public.room_observers REPLICA IDENTITY FULL;


--------------------------------------------------------------------------------
-- 7. ORPHANED MEDIA STORAGE CLEANUP TRIGGER
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION delete_orphaned_media()
RETURNS TRIGGER AS $$
DECLARE
  file_path text;
BEGIN
  IF OLD.media_url IS NOT NULL THEN
    -- Extract file path from public storage URLs
    file_path := substring(OLD.media_url from '/storage/v1/object/public/[^/]+/(.+)$');
    IF file_path IS NOT NULL THEN
      DELETE FROM storage.objects WHERE bucket_id = 'media' AND name = file_path;
    END IF;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_delete_orphaned_media_updates ON public.updates;
CREATE TRIGGER trigger_delete_orphaned_media_updates
AFTER DELETE ON public.updates
FOR EACH ROW EXECUTE FUNCTION delete_orphaned_media();



