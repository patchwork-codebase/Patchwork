-- Migration: 0089_room_activity_status.sql
-- Description: Automated room activity tracking with last_update_at column, 
-- historical backfill, and automatic trigger on updates.

-- 1. Add last_update_at column to rooms
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS last_update_at TIMESTAMPTZ;

-- 2. Backfill last_update_at with the most recent update's created_at, or room created_at
UPDATE public.rooms r
SET last_update_at = COALESCE(
    (SELECT MAX(created_at) FROM public.updates u WHERE u.room_id::text = r.id::text),
    r.created_at
);

-- 3. Create Trigger Function to update last_update_at whenever an update is inserted
CREATE OR REPLACE FUNCTION public.sync_room_last_update_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.room_id IS NOT NULL THEN
        UPDATE public.rooms
        SET last_update_at = NEW.created_at
        WHERE id::text = NEW.room_id::text;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Attach Trigger to updates table
DROP TRIGGER IF EXISTS on_update_sync_room_activity ON public.updates;
DROP TRIGGER IF EXISTS on_update_sync_room_activity ON updates;
CREATE TRIGGER on_update_sync_room_activity
AFTER INSERT ON public.updates
FOR EACH ROW EXECUTE FUNCTION public.sync_room_last_update_at();

-- 5. Create index for fast sorting by activity
CREATE INDEX IF NOT EXISTS idx_rooms_last_update_at ON public.rooms(last_update_at DESC NULLS LAST);
