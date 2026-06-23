-- Migration: 0043_update_roles.sql
-- Description: Update role constraints to allow team_member and expert

ALTER TABLE public.room_observers DROP CONSTRAINT IF EXISTS room_observers_role_check;
ALTER TABLE public.room_observers ADD CONSTRAINT room_observers_role_check CHECK (role IN ('observer', 'collaborator', 'team_member', 'expert'));

ALTER TABLE public.room_invitations DROP CONSTRAINT IF EXISTS room_invitations_role_check;
ALTER TABLE public.room_invitations ADD CONSTRAINT room_invitations_role_check CHECK (role IN ('observer', 'collaborator', 'team_member', 'expert'));
