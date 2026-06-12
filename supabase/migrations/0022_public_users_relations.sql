-- Migration: 0022_public_users_relations.sql
-- Description: Change foreign keys from auth.users to public.users to allow PostgREST joins

-- 1. Rooms
ALTER TABLE public.rooms
  DROP CONSTRAINT IF EXISTS rooms_builder_id_fkey,
  ADD CONSTRAINT rooms_builder_id_fkey FOREIGN KEY (builder_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 2. Updates
ALTER TABLE public.updates
  DROP CONSTRAINT IF EXISTS updates_author_id_fkey,
  ADD CONSTRAINT updates_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- 3. Reactions
ALTER TABLE public.reactions
  DROP CONSTRAINT IF EXISTS reactions_observer_id_fkey,
  ADD CONSTRAINT reactions_observer_id_fkey FOREIGN KEY (observer_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- 4. Room Observers
ALTER TABLE public.room_observers
  DROP CONSTRAINT IF EXISTS room_observers_observer_id_fkey,
  ADD CONSTRAINT room_observers_observer_id_fkey FOREIGN KEY (observer_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 5. Integrations
ALTER TABLE public.github_accounts
  DROP CONSTRAINT IF EXISTS github_accounts_user_id_fkey,
  ADD CONSTRAINT github_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.linkedin_accounts
  DROP CONSTRAINT IF EXISTS linkedin_accounts_user_id_fkey,
  ADD CONSTRAINT linkedin_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.linear_accounts
  DROP CONSTRAINT IF EXISTS linear_accounts_user_id_fkey,
  ADD CONSTRAINT linear_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.notion_accounts
  DROP CONSTRAINT IF EXISTS notion_accounts_user_id_fkey,
  ADD CONSTRAINT notion_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
