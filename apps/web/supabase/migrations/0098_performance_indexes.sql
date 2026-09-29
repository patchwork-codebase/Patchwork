-- Migration: 0098_performance_indexes.sql
-- Description: Add covering indexes to significantly speed up Observer Dashboard and Builder Funnel metrics

-- 1. Updates table indexes (Heavy read for dashboard metrics and feeds)
-- The dashboard heavily queries updates by author_id.
CREATE INDEX IF NOT EXISTS idx_updates_author_created ON public.updates(author_id, created_at DESC);

-- 2. Reactions table indexes (Heavy read for counting insight and support reactions)
-- We query reactions by update_id and type to count "sharp" insights, etc.
CREATE INDEX IF NOT EXISTS idx_reactions_update_type ON public.reactions(update_id, type);
CREATE INDEX IF NOT EXISTS idx_reactions_observer_type ON public.reactions(observer_id, type);

-- 3. Notifications table indexes (Heavy read for the notification bell)
-- We constantly query for unread notifications per user
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

-- 4. Room Decisions (Heavy read for dashboard decision feed)
CREATE INDEX IF NOT EXISTS idx_room_decisions_room_created ON public.room_decisions(room_id, created_at DESC);


-- Run an ANALYZE to update the postgres query planner statistics
ANALYZE public.updates;
ANALYZE public.reactions;
ANALYZE public.notifications;
ANALYZE public.page_views;
