-- ==========================================
-- Migration 0103: New Message Notifications
-- ==========================================
-- Trigger that fires when a new room_message is inserted.
-- It notifies all other room members via the notifications table,
-- which in turn fires the push notification webhook.

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

    -- Notify the builder (if sender is not the builder)
    IF v_builder_id IS NOT NULL AND v_builder_id != NEW.sender_id THEN
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

    -- Notify all observers in the room (except the sender)
    FOR v_recipient IN
        SELECT observer_id FROM public.room_observers
        WHERE room_id::text = NEW.room_id
          AND observer_id != NEW.sender_id
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

DROP TRIGGER IF EXISTS on_room_message_inserted ON public.room_messages;
CREATE TRIGGER on_room_message_inserted
    AFTER INSERT ON public.room_messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_new_message();
