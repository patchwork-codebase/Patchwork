-- Migration: 0037_regenerate_invite_token.sql
-- Description: RPC to regenerate a private room's invite token

CREATE OR REPLACE FUNCTION regenerate_invite_token(p_room_id TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_builder_id UUID;
    v_new_token UUID;
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get the builder_id securely
    SELECT builder_id INTO v_builder_id FROM public.rooms WHERE id::text = p_room_id::text;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Room not found';
    END IF;

    -- Only builder can regenerate token
    IF auth.uid()::uuid != v_builder_id::uuid THEN
        RAISE EXCEPTION 'Unauthorized: Only builder can regenerate invite token';
    END IF;

    -- Generate new token
    v_new_token := gen_random_uuid();

    -- Update token
    UPDATE public.rooms SET invite_token = v_new_token WHERE id::text = p_room_id::text;

    RETURN v_new_token;
END;
$$;
