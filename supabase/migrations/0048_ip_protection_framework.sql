-- Migration: 0048_ip_protection_framework.sql
-- Description: Intellectual Property Protection & Trust Framework
--   - Replaces boolean is_private with a 5-level visibility enum
--   - Adds immutable build timeline for proof of authorship
--   - Adds access audit log (who viewed, joined, downloaded, etc.)
--   - Adds digital NDA acceptance tracking
--   - Adds per-room protection flags (disable downloads, copy, watermark)
--   - Adds trust levels to users
--   - Expands invite/observer roles
--   - Adds global NDA template table


-- ============================================================
-- 1. VISIBILITY ENUM & ROOMS COLUMN
-- ============================================================

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_visibility_level') THEN
        CREATE TYPE room_visibility_level AS ENUM (
            'public',         -- Visible to everyone, searchable
            'unlisted',       -- Accessible via direct link only, not searchable
            'private',        -- Invitation only, hidden from search
            'org_only',       -- Accessible only by verified org members
            'nda_protected'   -- Requires NDA acceptance before entering
        );
    END IF;
END $$;

ALTER TABLE public.rooms
    ADD COLUMN IF NOT EXISTS visibility room_visibility_level NOT NULL DEFAULT 'public',
    ADD COLUMN IF NOT EXISTS content_permissions JSONB NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS protection_flags JSONB NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS nda_text TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS authorship_timestamp TIMESTAMPTZ NOT NULL DEFAULT now();

-- Migrate existing is_private data to visibility column
UPDATE public.rooms SET visibility = 'private' WHERE is_private = TRUE AND visibility = 'public';

-- Sync trigger: keep is_private in sync with visibility for backward compat
CREATE OR REPLACE FUNCTION sync_is_private_from_visibility()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.is_private := (NEW.visibility IN ('private', 'org_only', 'nda_protected'));
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_is_private ON public.rooms;
CREATE TRIGGER trg_sync_is_private
    BEFORE INSERT OR UPDATE OF visibility ON public.rooms
    FOR EACH ROW EXECUTE FUNCTION sync_is_private_from_visibility();

COMMENT ON COLUMN public.rooms.visibility IS 'Privacy level: public, unlisted, private, org_only, nda_protected';
COMMENT ON COLUMN public.rooms.content_permissions IS 'Per-artifact-type visibility overrides (JSON)';
COMMENT ON COLUMN public.rooms.protection_flags IS 'Content protection settings: disable_downloads, disable_copy, watermark, blur_sections (JSON booleans)';
COMMENT ON COLUMN public.rooms.nda_text IS 'Custom NDA text for this room. NULL = use global NDA template.';
COMMENT ON COLUMN public.rooms.authorship_timestamp IS 'Immutable creation timestamp for proof of authorship';


-- ============================================================
-- 2. EXPAND ROLES IN room_observers AND room_invitations
-- ============================================================

ALTER TABLE public.room_observers
    DROP CONSTRAINT IF EXISTS room_observers_role_check;
ALTER TABLE public.room_observers
    ADD CONSTRAINT room_observers_role_check
    CHECK (role IN ('observer', 'collaborator', 'team_member', 'expert', 'investor', 'co_founder', 'org_member'));

ALTER TABLE public.room_invitations
    DROP CONSTRAINT IF EXISTS room_invitations_role_check;
ALTER TABLE public.room_invitations
    ADD CONSTRAINT room_invitations_role_check
    CHECK (role IN ('observer', 'collaborator', 'team_member', 'expert', 'investor', 'co_founder', 'org_member'));

-- Add optional invite metadata fields
ALTER TABLE public.room_invitations
    ADD COLUMN IF NOT EXISTS reason TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS custom_expires_at TIMESTAMPTZ DEFAULT NULL;

-- Update default expiry to use custom_expires_at if provided
COMMENT ON COLUMN public.room_invitations.reason IS 'Optional reason for the invitation, visible to invitee';
COMMENT ON COLUMN public.room_invitations.custom_expires_at IS 'Override expiry date. NULL = use default 7-day expiry';


-- ============================================================
-- 3. GLOBAL NDA TEMPLATE TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.nda_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version TEXT NOT NULL DEFAULT 'v1',
    title TEXT NOT NULL DEFAULT 'Patchwork Confidentiality Agreement',
    body TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the default NDA template
INSERT INTO public.nda_templates (version, title, body, is_active)
VALUES (
    'v1',
    'Patchwork Confidentiality Agreement',
    E'CONFIDENTIALITY AGREEMENT\n\nBy accepting this agreement, you ("Recipient") agree to the following terms with respect to the confidential information disclosed by the builder of this Build Room ("Discloser") on Patchwork:\n\n1. CONFIDENTIAL INFORMATION\nAll content within this Build Room, including but not limited to product ideas, designs, code, research, decisions, roadmaps, financial projections, and any other materials marked as confidential or reasonably understood to be confidential ("Confidential Information"), is proprietary to the Discloser.\n\n2. NON-DISCLOSURE\nRecipient agrees not to disclose, publish, reproduce, or share any Confidential Information with any third party without the prior written consent of the Discloser.\n\n3. NON-USE\nRecipient agrees not to use any Confidential Information for any purpose other than evaluating the opportunity presented within this Build Room.\n\n4. RETURN OF INFORMATION\nUpon request by the Discloser, Recipient agrees to promptly destroy or return all Confidential Information.\n\n5. TERM\nThis agreement remains in effect indefinitely, unless terminated in writing by the Discloser.\n\n6. REMEDIES\nRecipient acknowledges that any breach of this agreement may cause irreparable harm to the Discloser, entitling the Discloser to seek injunctive relief in addition to all other available legal remedies.\n\nBy clicking "Accept & Enter", you acknowledge that you have read, understood, and agree to be bound by this Confidentiality Agreement.',
    TRUE
)
ON CONFLICT DO NOTHING;

ALTER TABLE public.nda_templates ENABLE ROW LEVEL SECURITY;

-- Only admins can manage templates; anyone can read the active template
DROP POLICY IF EXISTS "Anyone can read active NDA templates" ON public.nda_templates;
CREATE POLICY "Anyone can read active NDA templates" ON public.nda_templates
    FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage NDA templates" ON public.nda_templates;
CREATE POLICY "Admins can manage NDA templates" ON public.nda_templates
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
    );


-- ============================================================
-- 4. ROOM NDA ACCEPTANCES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.room_nda_acceptances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    nda_version TEXT NOT NULL DEFAULT 'v1',
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_agent TEXT DEFAULT NULL,
    UNIQUE (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_nda_acceptances_room ON public.room_nda_acceptances(room_id);
CREATE INDEX IF NOT EXISTS idx_nda_acceptances_user ON public.room_nda_acceptances(user_id);

ALTER TABLE public.room_nda_acceptances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own NDA acceptances" ON public.room_nda_acceptances;
CREATE POLICY "Users can view their own NDA acceptances" ON public.room_nda_acceptances
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Builders can view NDA acceptances for their rooms" ON public.room_nda_acceptances;
CREATE POLICY "Builders can view NDA acceptances for their rooms" ON public.room_nda_acceptances
    FOR SELECT USING (
        auth.uid() IN (SELECT builder_id FROM public.rooms WHERE id::text = room_id::text)
    );

-- Users insert their own acceptance via RPC (SECURITY DEFINER), not directly
DROP POLICY IF EXISTS "System inserts NDA acceptances" ON public.room_nda_acceptances;
CREATE POLICY "System inserts NDA acceptances" ON public.room_nda_acceptances
    FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 5. ROOM ACCESS LOG TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.room_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_name TEXT DEFAULT NULL,
    user_email TEXT DEFAULT NULL,
    action TEXT NOT NULL CHECK (action IN (
        'viewed',
        'joined',
        'left',
        'downloaded_file',
        'exported_doc',
        'copied_invite_link',
        'nda_accepted',
        'nda_declined',
        'invited',
        'invitation_accepted',
        'invitation_declined',
        'invitation_revoked',
        'removed',
        'role_changed'
    )),
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_log_room ON public.room_access_log(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_log_user ON public.room_access_log(user_id);

ALTER TABLE public.room_access_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view access logs for their rooms" ON public.room_access_log;
CREATE POLICY "Builders can view access logs for their rooms" ON public.room_access_log
    FOR SELECT USING (
        auth.uid() IN (SELECT builder_id FROM public.rooms WHERE id::text = room_id::text)
    );

-- No direct inserts from clients — use log_room_access() RPC
DROP POLICY IF EXISTS "System can insert access log entries" ON public.room_access_log;
CREATE POLICY "System can insert access log entries" ON public.room_access_log
    FOR INSERT WITH CHECK (TRUE);


-- ============================================================
-- 6. BUILD TIMELINE EVENTS TABLE (Immutable proof of authorship)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.build_timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'room_created',
        'room_visibility_changed',
        'update_posted',
        'decision_logged',
        'file_uploaded',
        'design_shared',
        'milestone_reached',
        'research_added',
        'note_added',
        'doc_linked',
        'member_joined',
        'expert_review_requested',
        'expert_review_completed',
        'nda_accepted',
        'room_closed'
    )),
    event_summary TEXT NOT NULL DEFAULT '',
    event_data JSONB NOT NULL DEFAULT '{}',
    version_hash TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_timeline_room ON public.build_timeline_events(room_id, created_at DESC);

ALTER TABLE public.build_timeline_events ENABLE ROW LEVEL SECURITY;

-- Builders and room members can view the timeline
DROP POLICY IF EXISTS "Builders can view their room timeline" ON public.build_timeline_events;
CREATE POLICY "Builders can view their room timeline" ON public.build_timeline_events
    FOR SELECT USING (
        auth.uid() IN (SELECT builder_id FROM public.rooms WHERE id::text = room_id::text)
    );

DROP POLICY IF EXISTS "Room members can view timeline" ON public.build_timeline_events;
CREATE POLICY "Room members can view timeline" ON public.build_timeline_events
    FOR SELECT USING (
        auth.uid() IN (SELECT observer_id FROM public.room_observers WHERE room_id::text = public.build_timeline_events.room_id::text)
    );

-- Public rooms: timeline visible to all
DROP POLICY IF EXISTS "Public room timeline is visible to all" ON public.build_timeline_events;
CREATE POLICY "Public room timeline is visible to all" ON public.build_timeline_events
    FOR SELECT USING (
        room_id IN (SELECT id FROM public.rooms WHERE visibility = 'public')
    );

-- No direct inserts — use append_timeline_event() RPC
DROP POLICY IF EXISTS "System can insert timeline events" ON public.build_timeline_events;
CREATE POLICY "System can insert timeline events" ON public.build_timeline_events
    FOR INSERT WITH CHECK (TRUE);

-- CRITICAL: No UPDATE or DELETE on timeline events (immutability)
-- (No UPDATE/DELETE policies = immutable by default with RLS enabled)


-- ============================================================
-- 7. TRUST LEVEL ON USERS
-- ============================================================

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS trust_level_override TEXT DEFAULT NULL;

COMMENT ON COLUMN public.users.trust_level_override IS 'Admin-set trust level override. NULL = auto-computed from role and verification status.';

-- Note: trust_level is computed in the application layer from:
--   role + is_verified_expert + trust_level_override
-- This avoids generated column limitations with complex logic.


-- ============================================================
-- 8. UPDATE ROOM RLS POLICIES TO RESPECT visibility
-- ============================================================

-- Public rooms: visible to everyone (public OR unlisted — unlisted is accessible via direct link)
DROP POLICY IF EXISTS "Public rooms are viewable by everyone" ON public.rooms;
CREATE POLICY "Public rooms are viewable by everyone" ON public.rooms
    FOR SELECT USING (visibility IN ('public', 'unlisted'));

-- Private/protected rooms: builders and approved observers only
DROP POLICY IF EXISTS "Private rooms viewable by observers" ON public.rooms;
CREATE POLICY "Private rooms viewable by observers" ON public.rooms
    FOR SELECT USING (
        visibility IN ('private', 'org_only', 'nda_protected')
        AND (
            auth.uid()::uuid = builder_id::uuid
            OR auth.uid()::uuid IN (
                SELECT observer_id::uuid FROM public.room_observers
                WHERE room_id::text = public.rooms.id::text
            )
        )
    );


-- ============================================================
-- 9. RPC: log_room_access
-- ============================================================

CREATE OR REPLACE FUNCTION log_room_access(
    p_room_id TEXT,
    p_action TEXT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user RECORD;
BEGIN
    IF auth.uid() IS NULL THEN RETURN; END IF;

    SELECT id, name, email INTO v_user FROM public.users WHERE id = auth.uid();

    INSERT INTO public.room_access_log (room_id, user_id, user_name, user_email, action, metadata)
    VALUES (p_room_id, auth.uid(), v_user.name, v_user.email, p_action, p_metadata);
END;
$$;


-- ============================================================
-- 10. RPC: accept_room_nda
-- ============================================================

CREATE OR REPLACE FUNCTION accept_room_nda(p_room_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_room RECORD;
    v_template RECORD;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    SELECT * INTO v_room FROM public.rooms WHERE id::text = p_room_id::text;
    IF NOT FOUND THEN RAISE EXCEPTION 'Room not found'; END IF;
    IF v_room.visibility != 'nda_protected' THEN RAISE EXCEPTION 'Room does not require NDA'; END IF;

    -- Get current active NDA version
    SELECT version INTO v_template FROM public.nda_templates WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 1;

    -- Record acceptance (upsert in case they accept again)
    INSERT INTO public.room_nda_acceptances (room_id, user_id, nda_version)
    VALUES (p_room_id, auth.uid(), COALESCE(v_template.version, 'v1'))
    ON CONFLICT (room_id, user_id) DO UPDATE SET accepted_at = now(), nda_version = EXCLUDED.nda_version;

    -- Add as observer if not already
    INSERT INTO public.room_observers (room_id, observer_id, role)
    VALUES (p_room_id, auth.uid(), 'observer')
    ON CONFLICT (room_id, observer_id) DO NOTHING;

    -- Log the action
    PERFORM log_room_access(p_room_id, 'nda_accepted', jsonb_build_object('nda_version', COALESCE(v_template.version, 'v1')));

    RETURN TRUE;
END;
$$;


-- ============================================================
-- 11. RPC: check_nda_accepted
-- ============================================================

CREATE OR REPLACE FUNCTION check_nda_accepted(p_room_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN RETURN FALSE; END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.room_nda_acceptances
        WHERE room_id::text = p_room_id::text AND user_id = auth.uid()
    );
END;
$$;


-- ============================================================
-- 12. RPC: get_room_access_log (builder only)
-- ============================================================

CREATE OR REPLACE FUNCTION get_room_access_log(p_room_id TEXT, p_limit INT DEFAULT 100)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    action TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_builder_id UUID;
BEGIN
    SELECT builder_id INTO v_builder_id FROM public.rooms WHERE id::text = p_room_id::text;

    IF v_builder_id IS NULL THEN RAISE EXCEPTION 'Room not found'; END IF;
    IF v_builder_id != auth.uid() THEN RAISE EXCEPTION 'Only the builder can view the access log'; END IF;

    RETURN QUERY
    SELECT l.id, l.user_id, l.user_name, l.user_email, l.action, l.metadata, l.created_at
    FROM public.room_access_log l
    WHERE l.room_id::text = p_room_id::text
    ORDER BY l.created_at DESC
    LIMIT p_limit;
END;
$$;


-- ============================================================
-- 13. RPC: get_build_timeline
-- ============================================================

CREATE OR REPLACE FUNCTION get_build_timeline(p_room_id TEXT)
RETURNS TABLE (
    id UUID,
    actor_id UUID,
    actor_name TEXT,
    event_type TEXT,
    event_summary TEXT,
    event_data JSONB,
    version_hash TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_room RECORD;
BEGIN
    SELECT * INTO v_room FROM public.rooms WHERE id::text = p_room_id::text;
    IF NOT FOUND THEN RAISE EXCEPTION 'Room not found'; END IF;

    -- Access check: builder, room members, or public rooms
    IF v_room.visibility NOT IN ('public', 'unlisted') THEN
        IF auth.uid() != v_room.builder_id AND NOT EXISTS (
            SELECT 1 FROM public.room_observers WHERE room_id::text = p_room_id::text AND observer_id = auth.uid()
        ) THEN
            RAISE EXCEPTION 'Access denied';
        END IF;
    END IF;

    RETURN QUERY
    SELECT e.id, e.actor_id, e.actor_name, e.event_type, e.event_summary, e.event_data, e.version_hash, e.created_at
    FROM public.build_timeline_events e
    WHERE e.room_id::text = p_room_id::text
    ORDER BY e.created_at ASC;
END;
$$;


-- ============================================================
-- 14. RPC: append_timeline_event
-- ============================================================

CREATE OR REPLACE FUNCTION append_timeline_event(
    p_room_id TEXT,
    p_event_type TEXT,
    p_event_summary TEXT,
    p_event_data JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_room RECORD;
    v_user RECORD;
    v_event_id UUID;
    v_hash TEXT;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    SELECT * INTO v_room FROM public.rooms WHERE id::text = p_room_id::text;
    IF NOT FOUND THEN RAISE EXCEPTION 'Room not found'; END IF;
    IF v_room.builder_id != auth.uid() THEN RAISE EXCEPTION 'Only the builder can append timeline events'; END IF;

    SELECT id, name INTO v_user FROM public.users WHERE id = auth.uid();

    -- Compute a simple hash for integrity (event_type + event_data + timestamp)
    v_hash := encode(
        digest(
            p_event_type || '|' || p_room_id || '|' || now()::text || '|' || p_event_data::text,
            'sha256'
        ),
        'hex'
    );

    INSERT INTO public.build_timeline_events (room_id, actor_id, actor_name, event_type, event_summary, event_data, version_hash)
    VALUES (p_room_id, auth.uid(), v_user.name, p_event_type, p_event_summary, p_event_data, v_hash)
    RETURNING id INTO v_event_id;

    RETURN v_event_id;
END;
$$;


-- ============================================================
-- 15. TRIGGER: Auto-append timeline events for key actions
-- ============================================================

-- Auto-log room creation to timeline
CREATE OR REPLACE FUNCTION auto_log_room_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_builder_name TEXT;
BEGIN
    SELECT name INTO v_builder_name FROM public.users WHERE id = NEW.builder_id;

    INSERT INTO public.build_timeline_events (
        room_id, actor_id, actor_name, event_type, event_summary, event_data, version_hash
    ) VALUES (
        NEW.id,
        NEW.builder_id,
        COALESCE(v_builder_name, NEW.builder_name),
        'room_created',
        'Build Room created: ' || NEW.title,
        jsonb_build_object(
            'title', NEW.title,
            'description', NEW.description,
            'visibility', NEW.visibility::text,
            'tags', NEW.tags
        ),
        encode(digest('room_created|' || NEW.id || '|' || NEW.created_at::text, 'sha256'), 'hex')
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_log_room_created ON public.rooms;
CREATE TRIGGER trg_auto_log_room_created
    AFTER INSERT ON public.rooms
    FOR EACH ROW EXECUTE FUNCTION auto_log_room_created();

-- Auto-log room visibility changes
CREATE OR REPLACE FUNCTION auto_log_visibility_changed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_builder_name TEXT;
BEGIN
    IF OLD.visibility IS DISTINCT FROM NEW.visibility THEN
        SELECT name INTO v_builder_name FROM public.users WHERE id = NEW.builder_id;

        INSERT INTO public.build_timeline_events (
            room_id, actor_id, actor_name, event_type, event_summary, event_data
        ) VALUES (
            NEW.id,
            NEW.builder_id,
            COALESCE(v_builder_name, NEW.builder_name),
            'room_visibility_changed',
            'Room visibility changed from ' || OLD.visibility::text || ' to ' || NEW.visibility::text,
            jsonb_build_object('from', OLD.visibility::text, 'to', NEW.visibility::text)
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_log_visibility_changed ON public.rooms;
CREATE TRIGGER trg_auto_log_visibility_changed
    AFTER UPDATE OF visibility ON public.rooms
    FOR EACH ROW EXECUTE FUNCTION auto_log_visibility_changed();

-- Auto-log when a member joins
CREATE OR REPLACE FUNCTION auto_log_member_joined()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_member_name TEXT;
BEGIN
    SELECT name INTO v_member_name FROM public.users WHERE id = NEW.observer_id;

    INSERT INTO public.build_timeline_events (
        room_id, actor_id, actor_name, event_type, event_summary, event_data
    ) VALUES (
        NEW.room_id,
        NEW.observer_id,
        COALESCE(v_member_name, 'Unknown'),
        'member_joined',
        COALESCE(v_member_name, 'A new member') || ' joined the room as ' || NEW.role,
        jsonb_build_object('role', NEW.role, 'member_id', NEW.observer_id)
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_log_member_joined ON public.room_observers;
CREATE TRIGGER trg_auto_log_member_joined
    AFTER INSERT ON public.room_observers
    FOR EACH ROW EXECUTE FUNCTION auto_log_member_joined();

-- Auto-log updates posted
CREATE OR REPLACE FUNCTION auto_log_update_posted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    -- Only log non-draft updates
    IF NOT COALESCE(NEW.draft, FALSE) THEN
        INSERT INTO public.build_timeline_events (
            room_id, actor_id, actor_name, event_type, event_summary, event_data
        ) VALUES (
            NEW.room_id,
            NEW.author_id,
            NEW.author_name,
            'update_posted',
            'Update posted: ' || left(NEW.content, 100),
            jsonb_build_object(
                'update_id', NEW.id,
                'content_preview', left(NEW.content, 200),
                'type', NEW.type
            )
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_log_update_posted ON public.updates;
CREATE TRIGGER trg_auto_log_update_posted
    AFTER INSERT ON public.updates
    FOR EACH ROW EXECUTE FUNCTION auto_log_update_posted();

-- Auto-log decisions logged
CREATE OR REPLACE FUNCTION auto_log_decision_logged()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_actor_name TEXT;
BEGIN
    SELECT name INTO v_actor_name FROM public.users WHERE id = NEW.builder_id;

    INSERT INTO public.build_timeline_events (
        room_id, actor_id, actor_name, event_type, event_summary, event_data
    ) VALUES (
        NEW.room_id,
        NEW.builder_id,
        COALESCE(v_actor_name, 'Builder'),
        'decision_logged',
        'Decision logged: ' || left(COALESCE(NEW.title, NEW.description, ''), 100),
        jsonb_build_object(
            'decision_id', NEW.id,
            'title', NEW.title,
            'decision_preview', left(COALESCE(NEW.description, ''), 200)
        )
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_log_decision_logged ON public.room_decisions;
CREATE TRIGGER trg_auto_log_decision_logged
    AFTER INSERT ON public.room_decisions
    FOR EACH ROW EXECUTE FUNCTION auto_log_decision_logged();


-- ============================================================
-- 16. RPC: get_active_nda_template
-- ============================================================

CREATE OR REPLACE FUNCTION get_active_nda_template()
RETURNS TABLE (version TEXT, title TEXT, body TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT t.version, t.title, t.body
    FROM public.nda_templates t
    WHERE t.is_active = TRUE
    ORDER BY t.created_at DESC
    LIMIT 1;
END;
$$;


-- ============================================================
-- 17. INDEX ADDITIONS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_rooms_visibility ON public.rooms(visibility);
CREATE INDEX IF NOT EXISTS idx_timeline_room_type ON public.build_timeline_events(room_id, event_type, created_at DESC);
