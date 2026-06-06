-- ============================================================================
-- SQL SETUP: NOTIFICATIONS
-- ============================================================================

-- 1. Create the notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('reaction', 'room_follow')),
    reference_id UUID NOT NULL,
    read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- 2. Create Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- 3. Triggers to auto-create notifications

-- Trigger function for reactions
CREATE OR REPLACE FUNCTION handle_new_reaction()
RETURNS TRIGGER AS $$
DECLARE
    v_builder_id UUID;
    v_room_title TEXT;
BEGIN
    -- Get the builder_id and title of the room
    SELECT builder_id, title INTO v_builder_id, v_room_title FROM public.rooms WHERE id = NEW.room_id;
    
    -- Only create notification if the actor is not the builder
    IF NEW.observer_id != v_builder_id THEN
        INSERT INTO public.notifications (user_id, actor_id, type, reference_id, metadata)
        VALUES (v_builder_id, NEW.observer_id, 'reaction', NEW.id, jsonb_build_object(
            'reaction_type', NEW.type,
            'reaction_text', NEW.text,
            'room_title', v_room_title
        ));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_on_reaction_created ON public.reactions;
CREATE TRIGGER trigger_on_reaction_created
    AFTER INSERT ON public.reactions
    FOR EACH ROW EXECUTE FUNCTION handle_new_reaction();

-- Trigger function for room_observers
CREATE OR REPLACE FUNCTION handle_new_room_observer()
RETURNS TRIGGER AS $$
DECLARE
    v_builder_id UUID;
    v_room_title TEXT;
BEGIN
    -- Get the builder_id and title of the room
    SELECT builder_id, title INTO v_builder_id, v_room_title FROM public.rooms WHERE id = NEW.room_id;
    
    -- Only create notification if the actor is not the builder
    IF NEW.observer_id != v_builder_id THEN
        INSERT INTO public.notifications (user_id, actor_id, type, reference_id, metadata)
        VALUES (v_builder_id, NEW.observer_id, 'room_follow', NEW.id, jsonb_build_object(
            'room_title', v_room_title
        ));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_on_room_observer_created ON public.room_observers;
CREATE TRIGGER trigger_on_room_observer_created
    AFTER INSERT ON public.room_observers
    FOR EACH ROW EXECUTE FUNCTION handle_new_room_observer();

-- 4. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
