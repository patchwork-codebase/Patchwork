-- Migration: 0044_invite_improvements.sql
-- Description: Adds rate limiting and email normalization to invites, and adds role update RPC.

-- 1. Update invite_user_to_room RPC
CREATE OR REPLACE FUNCTION invite_user_to_room(p_room_id TEXT, p_email TEXT, p_role TEXT DEFAULT 'team_member')
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_room RECORD;
    v_invite_id UUID;
    v_token UUID;
    v_recent_invites INT;
    v_normalized_email TEXT;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    v_normalized_email := lower(trim(p_email));

    -- Rate limiting check: Limit to 50 invites per user per 24 hours
    SELECT COUNT(*) INTO v_recent_invites 
    FROM public.room_invitations 
    WHERE inviter_id = auth.uid() AND created_at > now() - interval '24 hours';
    
    IF v_recent_invites >= 50 THEN
        RAISE EXCEPTION 'Rate limit exceeded: You can only send 50 invites per 24 hours';
    END IF;

    SELECT * INTO v_room FROM public.rooms WHERE id::text = p_room_id::text;
    IF NOT FOUND THEN RAISE EXCEPTION 'Room not found'; END IF;
    IF v_room.builder_id != auth.uid() THEN RAISE EXCEPTION 'Only the builder can invite users'; END IF;
    IF v_room.is_private = false THEN RAISE EXCEPTION 'Invitations are only for private rooms'; END IF;

    -- Revoke existing pending invites for this email
    UPDATE public.room_invitations SET status = 'revoked', updated_at = now() WHERE room_id = p_room_id AND email = v_normalized_email AND status = 'pending';

    -- Insert new invite
    INSERT INTO public.room_invitations (room_id, inviter_id, email, role, status)
    VALUES (p_room_id, auth.uid(), v_normalized_email, p_role, 'pending')
    RETURNING id, token INTO v_invite_id, v_token;

    RETURN v_token;
END;
$$;

-- 2. Create update_room_member_role RPC
CREATE OR REPLACE FUNCTION update_room_member_role(p_room_id TEXT, p_user_id UUID, p_new_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_room RECORD;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    -- Validate role
    IF p_new_role NOT IN ('observer', 'collaborator', 'team_member', 'expert') THEN
        RAISE EXCEPTION 'Invalid role specified';
    END IF;

    -- Verify room ownership
    SELECT * INTO v_room FROM public.rooms WHERE id::text = p_room_id::text;
    IF NOT FOUND THEN RAISE EXCEPTION 'Room not found'; END IF;
    IF v_room.builder_id != auth.uid() THEN RAISE EXCEPTION 'Only the builder can modify roles'; END IF;
    IF p_user_id = auth.uid() THEN RAISE EXCEPTION 'Cannot modify your own role'; END IF;

    -- Update role
    UPDATE public.room_observers 
    SET role = p_new_role 
    WHERE room_id = p_room_id AND observer_id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User is not a member of this room';
    END IF;

    RETURN TRUE;
END;
$$;
