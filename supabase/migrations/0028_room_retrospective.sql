-- Add retrospective_note column to rooms table
-- Allows builders to write a one-time retrospective after closing a room

ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS retrospective_note text DEFAULT null;
