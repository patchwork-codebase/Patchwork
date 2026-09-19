-- Migration: 0075_github_linear_integrations.sql
-- Description: Add provider and secret_token columns to room_integrations and create webhook payload handler function.

-- 1. Create table if not exists
--    NOTE: rooms.id is TEXT, so room_id must be TEXT to match the FK
CREATE TABLE IF NOT EXISTS public.room_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    builder_id UUID,
    platform TEXT,
    url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add provider, secret_token, is_active, metadata columns safely if missing
ALTER TABLE public.room_integrations ADD COLUMN IF NOT EXISTS builder_id UUID;
ALTER TABLE public.room_integrations ALTER COLUMN builder_id DROP NOT NULL;

ALTER TABLE public.room_integrations ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE public.room_integrations ALTER COLUMN url DROP NOT NULL;

ALTER TABLE public.room_integrations ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE public.room_integrations ADD COLUMN IF NOT EXISTS secret_token TEXT DEFAULT encode(gen_random_bytes(16), 'hex');
ALTER TABLE public.room_integrations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.room_integrations ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.room_integrations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Populate provider from platform if null
UPDATE public.room_integrations SET provider = platform WHERE provider IS NULL AND platform IS NOT NULL;
UPDATE public.room_integrations SET secret_token = encode(gen_random_bytes(16), 'hex') WHERE secret_token IS NULL;

-- 3. Create indexes safely
CREATE INDEX IF NOT EXISTS idx_room_integrations_room_id ON public.room_integrations (room_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_room_integrations_room_provider ON public.room_integrations (room_id, provider);

-- 4. RLS Policies
ALTER TABLE public.room_integrations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'room_integrations' AND policyname = 'Room owners can manage integrations'
    ) THEN
        CREATE POLICY "Room owners can manage integrations" ON public.room_integrations
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.rooms r
                    WHERE r.id = room_integrations.room_id
                    AND r.builder_id = auth.uid()
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'room_integrations' AND policyname = 'Team members can view integrations'
    ) THEN
        CREATE POLICY "Team members can view integrations" ON public.room_integrations
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.room_observers o
                    WHERE o.room_id = room_integrations.room_id
                    AND o.observer_id = auth.uid()
                    AND o.role IN ('team_member', 'collaborator', 'co_founder', 'org_member', 'expert')
                )
            );
    END IF;
END $$;

-- 5. Webhook Payload Handler Function
--    Schema reality:
--      rooms.id          TEXT  (not UUID)
--      rooms.builder_id  UUID
--      updates.id        TEXT  (not UUID)
--      updates.room_id   TEXT
--      updates.author_id UUID

-- Drop the old UUID-parameter overload if it exists (from a prior migration run)
DROP FUNCTION IF EXISTS public.process_integration_webhook(UUID, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.process_integration_webhook(
    p_room_id TEXT,
    p_provider TEXT,
    p_content TEXT,
    p_author_name TEXT DEFAULT 'GitHub Bot',
    p_media_url TEXT DEFAULT NULL,
    p_code_snippet TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_update_id TEXT := gen_random_uuid()::text;
    v_builder_id UUID;
BEGIN
    -- rooms.id is TEXT, builder_id is UUID
    SELECT builder_id INTO v_builder_id
    FROM public.rooms
    WHERE id = p_room_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Room not found: %', p_room_id;
    END IF;

    -- updates.id = TEXT, room_id = TEXT, author_id = UUID
    INSERT INTO public.updates (
        id,
        room_id,
        author_id,
        author_name,
        content,
        update_type,
        media_url,
        code_snippet,
        created_at
    ) VALUES (
        v_update_id,
        p_room_id,
        v_builder_id,
        p_author_name,
        p_content,
        'shipped',
        p_media_url,
        p_code_snippet,
        NOW()
    );

    -- rooms.id is TEXT
    UPDATE public.rooms
    SET update_count = COALESCE(update_count, 0) + 1,
        last_update = SUBSTRING(p_content FROM 1 FOR 120),
        updated_at = NOW()
    WHERE id = p_room_id;

    RETURN v_update_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_integration_webhook(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, anon;
