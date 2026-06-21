-- Migration: 0039_team_invitations_and_requests.sql
-- Description: Adds role to room_observers, and creates tables for room invitations and join requests (private rooms only).

-- 1. Add role to room_observers
ALTER TABLE public.room_observers ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'observer' CHECK (role IN ('observer', 'collaborator'));

-- 2. Create room_invitations table
CREATE TABLE IF NOT EXISTS public.room_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'collaborator' CHECK (role IN ('observer', 'collaborator')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'revoked')),
    token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure a user can only have one pending invite per room per email
CREATE UNIQUE INDEX IF NOT EXISTS unique_pending_room_invite ON public.room_invitations(room_id, email) WHERE status = 'pending';

-- 3. Create room_join_requests table
CREATE TABLE IF NOT EXISTS public.room_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure a user can only have one pending join request per room
CREATE UNIQUE INDEX IF NOT EXISTS unique_pending_join_request ON public.room_join_requests(room_id, user_id) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.room_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_join_requests ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Room Invitations RLS
CREATE POLICY "Builders can view invites for their rooms" ON public.room_invitations
FOR SELECT USING (auth.uid() IN (SELECT builder_id FROM public.rooms WHERE id::text = room_id::text));

CREATE POLICY "Builders can insert invites for their private rooms" ON public.room_invitations
FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT builder_id FROM public.rooms WHERE id::text = room_id::text AND is_private = true)
);

CREATE POLICY "Builders can update invites for their rooms" ON public.room_invitations
FOR UPDATE USING (auth.uid() IN (SELECT builder_id FROM public.rooms WHERE id::text = room_id::text));

CREATE POLICY "Users can view their own invites" ON public.room_invitations
FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.users WHERE email = public.room_invitations.email)
);

-- Room Join Requests RLS
CREATE POLICY "Builders can view join requests for their rooms" ON public.room_join_requests
FOR SELECT USING (auth.uid() IN (SELECT builder_id FROM public.rooms WHERE id::text = room_id::text));

CREATE POLICY "Users can view their own join requests" ON public.room_join_requests
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert join requests" ON public.room_join_requests
FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND (SELECT is_private FROM public.rooms WHERE id::text = room_id::text) = true
    AND NOT EXISTS (SELECT 1 FROM public.room_observers WHERE room_id::text = public.room_join_requests.room_id::text AND observer_id = auth.uid())
);

CREATE POLICY "Builders can update join requests" ON public.room_join_requests
FOR UPDATE USING (auth.uid() IN (SELECT builder_id FROM public.rooms WHERE id::text = room_id::text));

-- 5. RPC Functions

CREATE OR REPLACE FUNCTION invite_user_to_room(p_room_id TEXT, p_email TEXT, p_role TEXT DEFAULT 'collaborator')
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_room RECORD;
    v_invite_id UUID;
    v_token UUID;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    SELECT * INTO v_room FROM public.rooms WHERE id::text = p_room_id::text;
    IF NOT FOUND THEN RAISE EXCEPTION 'Room not found'; END IF;
    IF v_room.builder_id != auth.uid() THEN RAISE EXCEPTION 'Only the builder can invite users'; END IF;
    IF v_room.is_private = false THEN RAISE EXCEPTION 'Invitations are only for private rooms'; END IF;

    -- Revoke existing pending invites for this email
    UPDATE public.room_invitations SET status = 'revoked', updated_at = now() WHERE room_id = p_room_id AND email = p_email AND status = 'pending';

    -- Insert new invite
    INSERT INTO public.room_invitations (room_id, inviter_id, email, role, status)
    VALUES (p_room_id, auth.uid(), p_email, p_role, 'pending')
    RETURNING id, token INTO v_invite_id, v_token;

    RETURN v_token;
END;
$$;

CREATE OR REPLACE FUNCTION accept_room_invitation(p_token UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invite RECORD;
    v_user_email TEXT;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    SELECT email INTO v_user_email FROM public.users WHERE id = auth.uid();

    SELECT * INTO v_invite FROM public.room_invitations WHERE token = p_token AND status = 'pending' AND expires_at > now();
    IF NOT FOUND THEN RAISE EXCEPTION 'Invalid or expired invitation'; END IF;

    IF v_invite.email != v_user_email THEN RAISE EXCEPTION 'This invitation was sent to a different email address'; END IF;

    -- Add to room observers
    INSERT INTO public.room_observers (room_id, observer_id, role)
    VALUES (v_invite.room_id, auth.uid(), v_invite.role)
    ON CONFLICT (room_id, observer_id) DO UPDATE SET role = EXCLUDED.role;

    -- Update invite status
    UPDATE public.room_invitations SET status = 'accepted', updated_at = now() WHERE id = v_invite.id;

    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION get_invitation_by_token(p_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invite RECORD;
    v_room RECORD;
BEGIN
    SELECT * INTO v_invite FROM public.room_invitations WHERE token = p_token AND status = 'pending' AND expires_at > now();
    IF NOT FOUND THEN RETURN NULL; END IF;

    SELECT id, title, builder_id, builder_name INTO v_room FROM public.rooms WHERE id = v_invite.room_id;

    RETURN jsonb_build_object(
        'email', v_invite.email,
        'role', v_invite.role,
        'room_id', v_room.id,
        'room_title', v_room.title,
        'builder_name', v_room.builder_name
    );
END;
$$;

CREATE OR REPLACE FUNCTION request_to_join_room(p_room_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_room RECORD;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    SELECT * INTO v_room FROM public.rooms WHERE id::text = p_room_id::text;
    IF NOT FOUND THEN RAISE EXCEPTION 'Room not found'; END IF;
    IF v_room.is_private = false THEN RAISE EXCEPTION 'Can only request to join private rooms'; END IF;
    IF v_room.builder_id = auth.uid() THEN RAISE EXCEPTION 'You are the builder'; END IF;

    IF EXISTS (SELECT 1 FROM public.room_observers WHERE room_id = p_room_id AND observer_id = auth.uid()) THEN
        RAISE EXCEPTION 'You are already in this room';
    END IF;

    IF EXISTS (SELECT 1 FROM public.room_join_requests WHERE room_id = p_room_id AND user_id = auth.uid() AND status = 'pending') THEN
        RAISE EXCEPTION 'You already have a pending request';
    END IF;

    INSERT INTO public.room_join_requests (room_id, user_id, status)
    VALUES (p_room_id, auth.uid(), 'pending');

    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION review_join_request(p_request_id UUID, p_status TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_request RECORD;
    v_room RECORD;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
    IF p_status NOT IN ('approved', 'declined') THEN RAISE EXCEPTION 'Invalid status'; END IF;

    SELECT * INTO v_request FROM public.room_join_requests WHERE id = p_request_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;

    SELECT * INTO v_room FROM public.rooms WHERE id = v_request.room_id;
    IF v_room.builder_id != auth.uid() THEN RAISE EXCEPTION 'Only the builder can review requests'; END IF;

    UPDATE public.room_join_requests SET status = p_status, updated_at = now() WHERE id = p_request_id;

    IF p_status = 'approved' THEN
        INSERT INTO public.room_observers (room_id, observer_id, role)
        VALUES (v_request.room_id, v_request.user_id, 'observer')
        ON CONFLICT (room_id, observer_id) DO NOTHING;
    END IF;

    RETURN TRUE;
END;
$$;
