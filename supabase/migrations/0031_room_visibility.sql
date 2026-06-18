-- Migration: add visibility (is_private) to rooms table
-- Private rooms are only accessible via direct link (Pro tier)

ALTER TABLE public.rooms 
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_rooms_is_private ON public.rooms(is_private);

COMMENT ON COLUMN public.rooms.is_private IS 'When true, room is not shown in public feed and is only accessible via direct link (Pro tier)';
