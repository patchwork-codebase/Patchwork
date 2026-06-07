-- Migration: 0005_room_observers_rls.sql
-- Description: Enable RLS and add policies for room_observers to fix 403 Forbidden on join room.

ALTER TABLE public.room_observers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read observers
CREATE POLICY "Enable read access for all users" 
ON public.room_observers FOR SELECT 
USING (true);

-- Allow authenticated users to insert their own observer records
CREATE POLICY "Enable insert for authenticated users" 
ON public.room_observers FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = observer_id);

-- Allow users to leave a room (delete their own record)
CREATE POLICY "Enable delete for users based on observer_id" 
ON public.room_observers FOR DELETE 
TO authenticated 
USING (auth.uid() = observer_id);
