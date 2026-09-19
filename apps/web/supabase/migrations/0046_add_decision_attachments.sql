-- Migration: 0046_add_decision_attachments.sql
-- Description: Add media_url and external_link to room_decisions

ALTER TABLE public.room_decisions
ADD COLUMN IF NOT EXISTS media_url text,
ADD COLUMN IF NOT EXISTS external_link text;
