-- Migration: 0007_add_phone_to_users.sql
-- Description: Add optional phone country code and phone number to users

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_country_code text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_number text;
