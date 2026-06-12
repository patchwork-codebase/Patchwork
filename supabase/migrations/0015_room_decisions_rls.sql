-- Migration: 0015_room_decisions_rls.sql
-- Description: Enable RLS and add policies for room_decisions

ALTER TABLE public.room_decisions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view decisions
CREATE POLICY "Decisions are viewable by everyone"
ON public.room_decisions
FOR SELECT TO authenticated
USING (true);

-- Allow builders to insert/update decisions for their own rooms
CREATE POLICY "Builders can manage decisions for their rooms"
ON public.room_decisions
FOR ALL TO authenticated
USING (
  room_id IN (SELECT id FROM public.rooms WHERE builder_id = auth.uid())
)
WITH CHECK (
  room_id IN (SELECT id FROM public.rooms WHERE builder_id = auth.uid())
);
