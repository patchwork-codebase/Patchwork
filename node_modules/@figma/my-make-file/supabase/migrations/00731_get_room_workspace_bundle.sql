-- Migration: 0073_get_room_workspace_bundle.sql
-- Description: Consolidated RPC function for 1-roundtrip hydration of Build Room workspace, member role, and stats.

CREATE OR REPLACE FUNCTION public.get_room_workspace_bundle(
    p_room_id UUID,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_room RECORD;
    v_user_role TEXT := 'none';
    v_is_owner BOOLEAN := FALSE;
    v_is_team_member BOOLEAN := FALSE;
    v_member_count INT := 0;
    v_update_count INT := 0;
    v_result JSONB;
BEGIN
    -- 1. Fetch room details
    SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id;
    IF NOT FOUND THEN
        RETURN JSONB_BUILD_OBJECT('error', 'Room not found');
    END IF;

    -- 2. Check user role if authenticated
    IF p_user_id IS NOT NULL THEN
        IF v_room.builder_id = p_user_id THEN
            v_is_owner := TRUE;
            v_is_team_member := TRUE;
            v_user_role := 'builder';
        ELSE
            SELECT role INTO v_user_role
            FROM public.room_observers
            WHERE room_id = p_room_id AND observer_id = p_user_id;

            IF v_user_role IS NULL THEN
                v_user_role := 'none';
            ELSIF v_user_role IN ('team_member', 'collaborator', 'co_founder', 'org_member', 'expert') THEN
                v_is_team_member := TRUE;
            END IF;
        END IF;
    END IF;

    -- 3. Get team/observer count
    SELECT COUNT(*) INTO v_member_count FROM public.room_observers WHERE room_id = p_room_id;
    SELECT COUNT(*) INTO v_update_count FROM public.updates WHERE room_id = p_room_id;

    -- 4. Build output JSON
    v_result := JSONB_BUILD_OBJECT(
        'id', v_room.id,
        'title', v_room.title,
        'tagline', v_room.tagline,
        'description', v_room.description,
        'builder_id', v_room.builder_id,
        'visibility', COALESCE(v_room.visibility, CASE WHEN v_room.is_private THEN 'private' ELSE 'public' END),
        'status', v_room.status,
        'created_at', v_room.created_at,
        'member_count', v_member_count,
        'update_count', v_update_count,
        'user_role', v_user_role,
        'is_owner', v_is_owner,
        'is_team_member', v_is_team_member
    );

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_room_workspace_bundle(UUID, UUID) TO authenticated, anon;
