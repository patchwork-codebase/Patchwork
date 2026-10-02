-- ==========================================
-- Migration 0101: Fix Room Observers Role Constraint
-- ==========================================
-- Ensure 'co_founder' and other roles are allowed in room_observers

ALTER TABLE public.room_observers
    DROP CONSTRAINT IF EXISTS room_observers_role_check;

ALTER TABLE public.room_observers
    ADD CONSTRAINT room_observers_role_check
    CHECK (role IN ('observer', 'collaborator', 'team_member', 'expert', 'investor', 'co_founder', 'org_member', 'sponsor'));
