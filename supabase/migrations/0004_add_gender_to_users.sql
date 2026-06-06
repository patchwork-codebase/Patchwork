-- Migration: 0004_add_gender_to_users.sql
-- Description: Add gender column to the users table.

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS gender TEXT;
