-- Migration: 0092_push_notification_webhook.sql
-- Description: Creates a Postgres trigger that calls the send-push-notification
--              Edge Function via pg_net whenever a new notification row is inserted.
--
-- PREREQUISITES:
--   1. The pg_net extension must be enabled (Supabase Dashboard → Database → Extensions → pg_net).
--   2. The `send-push-notification` Edge Function must be deployed.
--   3. Set the EDGE_FUNCTION_URL below to your actual Supabase project URL.
--
-- NOTE: Supabase also supports Database Webhooks via the Dashboard UI (simpler for most cases).
--       Go to: Database → Webhooks → Create a new hook on table "notifications", event "INSERT",
--       pointing to: https://<project-ref>.supabase.co/functions/v1/send-push-notification
--       with the Authorization header set to your service role key.
--       Use this SQL only if you prefer to manage it in code.

-- Enable pg_net if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ── Helper function called by the trigger ────────────────────────────────────

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

-- ── Trigger ──────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS on_notification_insert_send_push ON public.notifications;
CREATE TRIGGER on_notification_insert_send_push
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION notify_push_on_notification_insert();
