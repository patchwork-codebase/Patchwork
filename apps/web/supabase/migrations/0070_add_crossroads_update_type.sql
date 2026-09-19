-- Migration: 0070_add_crossroads_update_type.sql
-- Description: Updates the check constraint on updates.update_type to allow 'crossroad'

ALTER TABLE public.updates DROP CONSTRAINT IF EXISTS updates_update_type_check;

ALTER TABLE public.updates ADD CONSTRAINT updates_update_type_check 
CHECK (update_type IN ('general', 'decision', 'scrap', 'pivot', 'blocker', 'insight', 'open_question', 'shipped', 'crossroad'));
