-- ==========================================
-- Migration 0108: Room Messages Mentions
-- ==========================================

-- 1. Add the mentioned_user_ids column to room_messages
ALTER TABLE public.room_messages 
ADD COLUMN IF NOT EXISTS mentioned_user_ids UUID[] DEFAULT '{}'::UUID[];

-- 2. Update the trigger to handle mentions
CREATE OR REPLACE FUNCTION notify_on_new_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_sender_name   TEXT;
    v_room_title    TEXT;
    v_recipient     RECORD;
    v_builder_id    UUID;
BEGIN
    -- Get sender name
    SELECT name INTO v_sender_name FROM public.users WHERE id = NEW.sender_id;

    -- Get room title and builder
    SELECT title, builder_id INTO v_room_title, v_builder_id
    FROM public.rooms WHERE id::text = NEW.room_id;

    -- 1. Notify mentioned users first
    IF NEW.mentioned_user_ids IS NOT NULL AND array_length(NEW.mentioned_user_ids, 1) > 0 THEN
        FOR v_recipient IN SELECT unnest(NEW.mentioned_user_ids) AS user_id LOOP
            IF v_recipient.user_id != NEW.sender_id THEN
                INSERT INTO public.notifications (user_id, actor_id, type, metadata)
                VALUES (
                    v_recipient.user_id,
                    NEW.sender_id,
                    'mention',
                    jsonb_build_object(
                        'room_id',    NEW.room_id,
                        'room_title', COALESCE(v_room_title, 'a room'),
                        'message_preview', left(NEW.content, 80)
                    )
                );
            END IF;
        END LOOP;
    END IF;

    -- 2. Notify the builder (if sender is not the builder AND not already mentioned)
    IF v_builder_id IS NOT NULL AND v_builder_id != NEW.sender_id AND (NEW.mentioned_user_ids IS NULL OR NOT (v_builder_id = ANY(NEW.mentioned_user_ids))) THEN
        INSERT INTO public.notifications (user_id, actor_id, type, metadata)
        VALUES (
            v_builder_id,
            NEW.sender_id,
            'new_message',
            jsonb_build_object(
                'room_id',    NEW.room_id,
                'room_title', COALESCE(v_room_title, 'a room'),
                'message_preview', left(NEW.content, 80)
            )
        );
    END IF;

    -- 3. Notify all observers in the room (except the sender AND those already mentioned)
    FOR v_recipient IN
        SELECT observer_id FROM public.room_observers
        WHERE room_id::text = NEW.room_id
          AND observer_id != NEW.sender_id
          AND (NEW.mentioned_user_ids IS NULL OR NOT (observer_id = ANY(NEW.mentioned_user_ids)))
    LOOP
        INSERT INTO public.notifications (user_id, actor_id, type, metadata)
        VALUES (
            v_recipient.observer_id,
            NEW.sender_id,
            'new_message',
            jsonb_build_object(
                'room_id',    NEW.room_id,
                'room_title', COALESCE(v_room_title, 'a room'),
                'message_preview', left(NEW.content, 80)
            )
        );
    END LOOP;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[message_trigger] Failed for message %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;
