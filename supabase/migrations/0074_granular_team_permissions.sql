-- Migration: 0074_granular_team_permissions.sql
-- Description: Add granular permissions column to room_observers table for fine-grained role control

ALTER TABLE public.room_observers 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{
  "can_manage_tickets": true,
  "can_post_updates": true,
  "can_manage_docs": true,
  "can_invite_members": false
}'::jsonb;

-- Helper RPC to update member permissions
CREATE OR REPLACE FUNCTION public.update_member_permissions(
    p_room_id UUID,
    p_user_id UUID,
    p_permissions JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if auth user is room builder/owner
    IF NOT EXISTS (SELECT 1 FROM public.rooms WHERE id = p_room_id AND builder_id = auth.uid()) THEN
        RAISE EXCEPTION 'Only the Build Room owner can update member permissions';
    END IF;

    UPDATE public.room_observers
    SET permissions = p_permissions
    WHERE room_id = p_room_id AND observer_id = p_user_id;

    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_member_permissions(UUID, UUID, JSONB) TO authenticated;
