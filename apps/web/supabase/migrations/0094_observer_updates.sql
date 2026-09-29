-- Observer Updates Migration
-- Allows observers to post updates (e.g. Shoutouts, Requests) without a room_id

-- 1. Make room_id nullable and add update_category
ALTER TABLE public.updates ALTER COLUMN room_id DROP NOT NULL;
ALTER TABLE public.updates ADD COLUMN IF NOT EXISTS update_category TEXT DEFAULT 'milestone';

-- 2. Update INSERT policy to allow null room_id for authored updates
DROP POLICY IF EXISTS "Users can insert their own updates" ON public.updates;
CREATE POLICY "Users can insert their own updates" ON public.updates
FOR INSERT WITH CHECK (
    auth.uid()::uuid = author_id::uuid AND (
        room_id IS NULL OR
        auth.uid()::uuid = (SELECT builder_id::uuid FROM public.rooms WHERE id::text = updates.room_id::text)
        OR auth.uid()::uuid IN (
            SELECT observer_id::uuid FROM public.room_observers 
            WHERE room_id::text = updates.room_id::text 
            AND role IN ('team_member', 'collaborator', 'co_founder')
        )
    )
);

-- 3. Update SELECT policy to allow viewing global (null room_id) updates
DROP POLICY IF EXISTS "Updates are viewable based on strict room access" ON public.updates;
CREATE POLICY "Updates are viewable based on strict room access" ON public.updates
FOR SELECT USING (
    room_id IS NULL OR can_view_room_content(room_id::text)
);

-- 4. Safely handle timeline trigger for null room_id
CREATE OR REPLACE FUNCTION auto_log_update_posted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NEW.room_id IS NOT NULL THEN
        INSERT INTO public.build_timeline_events (
            room_id, actor_id, actor_name, event_type, event_summary, event_data
        ) VALUES (
            NEW.room_id::text,
            NEW.author_id::uuid,
            NEW.author_name::text,
            'update_posted',
            'Update posted: ' || left(NEW.content::text, 100),
            jsonb_build_object(
                'update_id', NEW.id::text,
                'content_preview', left(NEW.content::text, 200)
            )
        );
    END IF;
    RETURN NEW;
END;
$$;

-- 5. Update update_type check constraint
ALTER TABLE public.updates DROP CONSTRAINT IF EXISTS updates_update_type_check;
ALTER TABLE public.updates ADD CONSTRAINT updates_update_type_check 
CHECK (update_type IN ('general', 'decision', 'scrap', 'pivot', 'blocker', 'insight', 'open_question', 'shipped', 'crossroad', 'spotlight', 'rfb'));
