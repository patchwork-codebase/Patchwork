-- Migration: 0088_add_username_to_users.sql
-- Description: Add unique username column to users table with collision-resistant automated backfill

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'username'
    ) THEN
        ALTER TABLE public.users ADD COLUMN username TEXT;
    END IF;
END $$;

-- 1. Backfill existing users with collision-safe unique usernames using row_number / substring of id
WITH numbered_users AS (
    SELECT 
        id,
        COALESCE(
            NULLIF(LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9_]', '', 'g')), ''),
            'builder'
        ) AS base_username,
        ROW_NUMBER() OVER (
            PARTITION BY COALESCE(NULLIF(LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9_]', '', 'g')), ''), 'builder') 
            ORDER BY created_at ASC
        ) AS rn
    FROM public.users
    WHERE username IS NULL
)
UPDATE public.users u
SET username = CASE 
    WHEN nu.rn = 1 THEN nu.base_username
    ELSE nu.base_username || '_' || SUBSTRING(nu.id::text, 1, 4)
END
FROM numbered_users nu
WHERE u.id = nu.id AND u.username IS NULL;

-- 2. Fallback for any leftover nulls
UPDATE public.users 
SET username = 'builder_' || SUBSTRING(id::text, 1, 8)
WHERE username IS NULL;

-- 3. Now that every row has a guaranteed unique username, add UNIQUE constraint and index
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_username_key'
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_username_key UNIQUE (username);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
