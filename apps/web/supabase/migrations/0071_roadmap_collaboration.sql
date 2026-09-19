-- Migration: 0071_roadmap_collaboration.sql
-- Description: Adds team collaboration features to roadmap (assignees, comments, labels, due_date, priority)

-- 1. Add new columns to roadmap_items
ALTER TABLE public.roadmap_items
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS labels TEXT[] DEFAULT '{}';

-- 2. Create roadmap_assignees table
CREATE TABLE IF NOT EXISTS public.roadmap_assignees (
    item_id UUID NOT NULL REFERENCES public.roadmap_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (item_id, user_id)
);

-- 3. Create roadmap_comments table
CREATE TABLE IF NOT EXISTS public.roadmap_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.roadmap_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE public.roadmap_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_comments ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- roadmap_assignees
-- Anyone can view assignees
CREATE POLICY "Allow public read access to roadmap_assignees" ON public.roadmap_assignees FOR SELECT USING (true);

-- Only builder or collaborators can insert/delete assignees
CREATE POLICY "Allow builders and collaborators to manage assignees" ON public.roadmap_assignees
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.roadmap_items ri
        LEFT JOIN public.room_observers ro ON ro.room_id = ri.room_id
        WHERE ri.id = item_id 
        AND (ri.builder_id = auth.uid() OR (ro.observer_id = auth.uid() AND ro.role = 'collaborator'))
    )
);

-- roadmap_comments
CREATE POLICY "Allow public read access to roadmap_comments" ON public.roadmap_comments FOR SELECT USING (true);

CREATE POLICY "Allow room members to create comments" ON public.roadmap_comments
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.roadmap_items ri
        LEFT JOIN public.room_observers ro ON ro.room_id = ri.room_id
        WHERE ri.id = item_id 
        AND (ri.builder_id = auth.uid() OR ro.observer_id = auth.uid())
    )
);

CREATE POLICY "Allow users to update own comments" ON public.roadmap_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow users to delete own comments" ON public.roadmap_comments FOR DELETE USING (auth.uid() = user_id);

-- 6. Notifications for Assignments
CREATE OR REPLACE FUNCTION notify_roadmap_assignment()
RETURNS TRIGGER AS $$
DECLARE
    v_actor_id UUID;
    v_room_id TEXT;
    v_room_title TEXT;
    v_item_title TEXT;
BEGIN
    -- The actor is the one making the assignment (auth.uid())
    v_actor_id := auth.uid();
    
    -- We don't notify if the user assigned themselves (which might happen)
    IF v_actor_id IS NOT NULL AND v_actor_id != NEW.user_id THEN
        -- Get room info and item info
        SELECT r.id, r.title, ri.title INTO v_room_id, v_room_title, v_item_title
        FROM public.roadmap_items ri
        LEFT JOIN public.rooms r ON r.id = ri.room_id
        WHERE ri.id = NEW.item_id;

        IF v_room_id IS NOT NULL THEN
            INSERT INTO public.notifications (user_id, actor_id, type, reference_id, metadata)
            VALUES (
                NEW.user_id,
                v_actor_id,
                'roadmap_assignment',
                NEW.item_id,
                jsonb_build_object(
                    'room_title', v_room_title,
                    'room_id', v_room_id,
                    'item_title', v_item_title
                )
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_roadmap_assignment
    AFTER INSERT ON public.roadmap_assignees
    FOR EACH ROW
    EXECUTE FUNCTION notify_roadmap_assignment();

-- 7. Add Realtime for new tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'roadmap_assignees'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.roadmap_assignees;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'roadmap_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.roadmap_comments;
  END IF;
END $$;
