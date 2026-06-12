-- Description: Enforce Row Level Security on core tables (rooms, updates, reactions)

-- 1. Rooms Table RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public rooms are viewable by everyone" ON public.rooms;
CREATE POLICY "Public rooms are viewable by everyone" ON public.rooms
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own rooms" ON public.rooms;
CREATE POLICY "Users can insert their own rooms" ON public.rooms
FOR INSERT WITH CHECK (auth.uid() = builder_id);

DROP POLICY IF EXISTS "Users can update their own rooms" ON public.rooms;
CREATE POLICY "Users can update their own rooms" ON public.rooms
FOR UPDATE USING (auth.uid() = builder_id);

DROP POLICY IF EXISTS "Users can delete their own rooms" ON public.rooms;
CREATE POLICY "Users can delete their own rooms" ON public.rooms
FOR DELETE USING (auth.uid() = builder_id);


-- 2. Updates Table RLS
ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public updates are viewable by everyone" ON public.updates;
CREATE POLICY "Public updates are viewable by everyone" ON public.updates
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own updates" ON public.updates;
CREATE POLICY "Users can insert their own updates" ON public.updates
FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update their own updates" ON public.updates;
CREATE POLICY "Users can update their own updates" ON public.updates
FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete their own updates" ON public.updates;
CREATE POLICY "Users can delete their own updates" ON public.updates
FOR DELETE USING (auth.uid() = author_id);


-- 3. Reactions Table RLS
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reactions are viewable by everyone" ON public.reactions;
CREATE POLICY "Public reactions are viewable by everyone" ON public.reactions
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own reactions" ON public.reactions;
CREATE POLICY "Users can insert their own reactions" ON public.reactions
FOR INSERT WITH CHECK (auth.uid() = observer_id);

DROP POLICY IF EXISTS "Users can update their own reactions" ON public.reactions;
CREATE POLICY "Users can update their own reactions" ON public.reactions
FOR UPDATE USING (auth.uid() = observer_id);

DROP POLICY IF EXISTS "Users can delete their own reactions" ON public.reactions;
CREATE POLICY "Users can delete their own reactions" ON public.reactions
FOR DELETE USING (auth.uid() = observer_id);
