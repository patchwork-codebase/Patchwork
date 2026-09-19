-- Fix text = uuid errors by adding explicit casts

-- 1. Fix the RLS policies on updates
DROP POLICY IF EXISTS "Users can insert their own updates" ON public.updates;
CREATE POLICY "Users can insert their own updates" ON public.updates
FOR INSERT WITH CHECK (auth.uid()::uuid = author_id::uuid);

DROP POLICY IF EXISTS "Users can update their own updates" ON public.updates;
CREATE POLICY "Users can update their own updates" ON public.updates
FOR UPDATE USING (auth.uid()::uuid = author_id::uuid);

DROP POLICY IF EXISTS "Users can delete their own updates" ON public.updates;
CREATE POLICY "Users can delete their own updates" ON public.updates
FOR DELETE USING (auth.uid()::uuid = author_id::uuid);

DROP POLICY IF EXISTS "Public updates are viewable by everyone" ON public.updates;
CREATE POLICY "Public updates are viewable by everyone" ON public.updates
FOR SELECT USING (
    room_id::text IN (SELECT id::text FROM public.rooms WHERE is_private = false)
);

-- 2. Fix the auto_log_update_posted trigger explicit casts
CREATE OR REPLACE FUNCTION auto_log_update_posted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
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
    RETURN NEW;
END;
$$;

-- 3. Fix on_decision_update trigger explicit casts
CREATE OR REPLACE FUNCTION handle_new_decision_update()
RETURNS TRIGGER AS $$
DECLARE
    v_room_title TEXT;
    v_observer RECORD;
BEGIN
    -- Only trigger if it's a decision log
    IF NEW.update_type::text = 'decision' THEN
        -- Get room title
        SELECT title INTO v_room_title FROM public.rooms WHERE id::text = NEW.room_id::text;
        
        -- Iterate over all followers (observers) of this room
        FOR v_observer IN (SELECT observer_id FROM public.room_observers WHERE room_id::text = NEW.room_id::text AND observer_id::uuid != NEW.author_id::uuid)
        LOOP
            -- Insert a notification for each observer
            INSERT INTO public.notifications (user_id, actor_id, type, reference_id, metadata)
            VALUES (
                v_observer.observer_id::uuid,
                NEW.author_id::uuid,
                'decision',
                NEW.id::text,
                jsonb_build_object(
                    'room_title', v_room_title,
                    'room_id', NEW.room_id::text,
                    'decision_text', substring(NEW.content::text from 1 for 150)
                )
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fix increment_reputation_on_update trigger explicit casts
CREATE OR REPLACE FUNCTION increment_reputation_on_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.update_type::text = 'scrap' THEN
    UPDATE profiles SET reputation = reputation + 10 WHERE id::uuid = NEW.author_id::uuid;
  ELSE
    UPDATE profiles SET reputation = reputation + 5 WHERE id::uuid = NEW.author_id::uuid;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


