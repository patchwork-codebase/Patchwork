-- Fix the manual handle_official_room_notification_fanout trigger

CREATE OR REPLACE FUNCTION handle_official_room_notification_fanout()
RETURNS TRIGGER AS $$
DECLARE
  -- Change UUID to TEXT to prevent text = uuid errors
  v_official_room_id TEXT := '0b28954f-80d4-4a6f-a6a3-cfc0174615e7'; 
  v_user_id UUID;
BEGIN
  -- Only proceed if the inserted update/decision is for the official room
  IF NEW.room_id::text = v_official_room_id THEN
    -- Fan out notification to all active users
    FOR v_user_id IN SELECT id FROM public.users
    LOOP
      -- Avoid sending a notification to the author themselves
      IF v_user_id::uuid != NEW.author_id::uuid THEN
        INSERT INTO public.notifications (
          user_id,
          actor_id,
          type,
          reference_id,
          read,
          metadata,
          created_at
        ) VALUES (
          v_user_id::uuid,
          NEW.author_id::uuid,
          'room_update', 
          NEW.id::text,
          false,
          jsonb_build_object(
            'room_id', NEW.room_id::text,
            'update_id', NEW.id::text,
            'room_title', 'Patchwork Official'
          ),
          now()
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
