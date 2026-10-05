-- ==========================================
-- Migration 0109: Push for Mentions
-- ==========================================
-- Updates the push notification trigger function to handle 'mention' type

CREATE OR REPLACE FUNCTION notify_push_on_notification_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_name    TEXT;
  v_title         TEXT;
  v_body          TEXT;
  v_edge_func_url TEXT;
BEGIN
  -- Get the actor's display name for the notification body
  SELECT name INTO v_actor_name FROM public.users WHERE id = NEW.actor_id;

  -- Build a human-readable title + body based on the notification type
  CASE NEW.type
    WHEN 'reaction' THEN
      IF (NEW.metadata->>'reaction_type') = 'reply' THEN
        v_title := 'New reply';
        v_body  := COALESCE(v_actor_name, 'Someone') || ' replied to your update in ' ||
                   COALESCE(NEW.metadata->>'room_title', 'a room');
      ELSE
        v_title := 'New reaction';
        v_body  := COALESCE(v_actor_name, 'Someone') || ' reacted to your update in ' ||
                   COALESCE(NEW.metadata->>'room_title', 'a room');
      END IF;

    WHEN 'update_posted' THEN
      v_title := COALESCE(v_actor_name, 'Someone') || ' posted in ' ||
                 COALESCE(NEW.metadata->>'room_title', 'a room');
      v_body  := COALESCE(substring(NEW.metadata->>'update_text' from 1 for 100), 'New update');

    WHEN 'room_follow' THEN
      v_title := 'New observer';
      v_body  := COALESCE(v_actor_name, 'Someone') || ' is now observing ' ||
                 COALESCE(NEW.metadata->>'room_title', 'your room');

    WHEN 'decision_updated' THEN
      v_title := 'Decision updated';
      v_body  := COALESCE(v_actor_name, 'Someone') || ' updated a decision in ' ||
                 COALESCE(NEW.metadata->>'room_title', 'a room');
                 
    WHEN 'new_message' THEN
      v_title := COALESCE(v_actor_name, 'Someone') || ' sent a message';
      v_body  := COALESCE(NEW.metadata->>'message_preview', 'New message in ' || COALESCE(NEW.metadata->>'room_title', 'a room'));

    WHEN 'mention' THEN
      v_title := COALESCE(v_actor_name, 'Someone') || ' mentioned you in ' || COALESCE(NEW.metadata->>'room_title', 'a room');
      v_body  := COALESCE(NEW.metadata->>'message_preview', 'You were mentioned');

    ELSE
      v_title := 'New notification';
      v_body  := 'You have a new notification on Patchwork';
  END CASE;

  -- Replace <project-ref> with your actual Supabase project reference ID
  v_edge_func_url := 'https://oaielnxqahmywdpisomd.supabase.co/functions/v1/send-push-notification';

  -- Fire-and-forget HTTP POST to the Edge Function via pg_net
  PERFORM net.http_post(
    url     := v_edge_func_url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      -- Use the service role key so the Edge Function can read the users table
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body    := jsonb_build_object(
      'user_id', NEW.user_id,
      'title',   v_title,
      'body',    v_body,
      'data',    jsonb_build_object(
        'type',       NEW.type,
        'room_id',    COALESCE(NEW.metadata->>'room_id', ''),
        'room_title', COALESCE(NEW.metadata->>'room_title', ''),
        'update_id',  COALESCE(NEW.metadata->>'update_id', '')
      )
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block the original insert if push delivery fails
  RAISE WARNING '[push] Failed to queue push for notification %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
