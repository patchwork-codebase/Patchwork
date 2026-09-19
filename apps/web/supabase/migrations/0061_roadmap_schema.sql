-- Migration for Roadmap features: Sprints, Roadmap Items, and Dependencies

CREATE TABLE IF NOT EXISTS public.sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.roadmap_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  room_id TEXT REFERENCES public.rooms(id) ON DELETE SET NULL,
  sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'later' CHECK (status IN ('now', 'next', 'later', 'completed')),
  position NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.roadmap_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.roadmap_items(id) ON DELETE CASCADE,
  depends_on_item_id UUID NOT NULL REFERENCES public.roadmap_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT diff_items CHECK (item_id != depends_on_item_id)
);

-- Enable RLS
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_dependencies ENABLE ROW LEVEL SECURITY;

-- Sprints policies
CREATE POLICY "Allow public read access to sprints" ON public.sprints FOR SELECT USING (true);
CREATE POLICY "Allow builders to insert sprints" ON public.sprints FOR INSERT WITH CHECK (auth.uid() = builder_id);
CREATE POLICY "Allow builders to update own sprints" ON public.sprints FOR UPDATE USING (auth.uid() = builder_id);
CREATE POLICY "Allow builders to delete own sprints" ON public.sprints FOR DELETE USING (auth.uid() = builder_id);

-- Roadmap Items policies
CREATE POLICY "Allow public read access to roadmap_items" ON public.roadmap_items FOR SELECT USING (true);
CREATE POLICY "Allow builders to insert roadmap_items" ON public.roadmap_items FOR INSERT WITH CHECK (auth.uid() = builder_id);
CREATE POLICY "Allow builders to update own roadmap_items" ON public.roadmap_items FOR UPDATE USING (auth.uid() = builder_id);
CREATE POLICY "Allow builders to delete own roadmap_items" ON public.roadmap_items FOR DELETE USING (auth.uid() = builder_id);

-- Roadmap Dependencies policies (indirect auth check via item_id's builder_id)
CREATE POLICY "Allow public read access to roadmap_dependencies" ON public.roadmap_dependencies FOR SELECT USING (true);

CREATE POLICY "Allow builders to insert dependencies for own items" ON public.roadmap_dependencies
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.roadmap_items WHERE id = item_id AND builder_id = auth.uid())
  );

CREATE POLICY "Allow builders to delete dependencies for own items" ON public.roadmap_dependencies
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.roadmap_items WHERE id = item_id AND builder_id = auth.uid())
  );

-- Function to update 'updated_at' on updates
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_sprints
BEFORE UPDATE ON public.sprints
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_roadmap_items
BEFORE UPDATE ON public.roadmap_items
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sprints_builder_id ON public.sprints(builder_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_builder_id ON public.roadmap_items(builder_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_room_id ON public.roadmap_items(room_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_sprint_id ON public.roadmap_items(sprint_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_deps_item_id ON public.roadmap_dependencies(item_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_deps_depends_on ON public.roadmap_dependencies(depends_on_item_id);

-- Add to Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'roadmap_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.roadmap_items;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'sprints'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sprints;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'roadmap_dependencies'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.roadmap_dependencies;
  END IF;
END $$;
