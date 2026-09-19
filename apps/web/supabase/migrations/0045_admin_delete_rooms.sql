-- Migration: 0045_admin_delete_rooms.sql
-- Description: Allow admins to delete any room

DROP POLICY IF EXISTS "Admins can delete any room" ON public.rooms;

CREATE POLICY "Admins can delete any room" ON public.rooms
FOR DELETE USING (
  coalesce(auth.jwt()->'app_metadata'->>'role', auth.jwt()->'user_metadata'->>'role') IN ('admin', 'superadmin')
);
