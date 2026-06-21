-- Migration: 0038_fix_observer_count.sql
-- Description: Backfill observer_count from room_observers table,
-- and add a trigger to keep it automatically in sync.

-- 1. One-time backfill: update observer_count to match actual rows in room_observers
UPDATE public.rooms r
SET observer_count = (
  SELECT COUNT(*)::int
  FROM public.room_observers ro
  WHERE ro.room_id::text = r.id::text
);

-- 2. Create trigger function to keep observer_count in sync
CREATE OR REPLACE FUNCTION public.sync_observer_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.rooms
    SET observer_count = COALESCE(observer_count, 0) + 1
    WHERE id::text = NEW.room_id::text;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.rooms
    SET observer_count = GREATEST(COALESCE(observer_count, 0) - 1, 0)
    WHERE id::text = OLD.room_id::text;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Attach the trigger to room_observers
DROP TRIGGER IF EXISTS on_observer_change ON public.room_observers;
CREATE TRIGGER on_observer_change
AFTER INSERT OR DELETE ON public.room_observers
FOR EACH ROW EXECUTE FUNCTION public.sync_observer_count();
