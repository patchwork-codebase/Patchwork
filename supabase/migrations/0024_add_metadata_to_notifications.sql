-- Migration: 0024_add_metadata_to_notifications.sql
-- Description: Add metadata column to notifications table to support dynamic notification content

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
