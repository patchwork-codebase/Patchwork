-- Migration: 0072_performance_and_rbac_indexes.sql
-- Description: Composite performance indexes for RBAC checks, roadmap lookups, and feed queries.

-- Composite index for roadmap_items filtering by builder and room
CREATE INDEX IF NOT EXISTS idx_roadmap_items_composite ON public.roadmap_items (builder_id, room_id, position);

-- Composite index for room_observers role and membership checks
CREATE INDEX IF NOT EXISTS idx_room_observers_lookup_composite ON public.room_observers (room_id, observer_id, role);

-- Composite index for ticket assignees lookup
CREATE INDEX IF NOT EXISTS idx_roadmap_assignees_lookup ON public.roadmap_assignees (user_id, item_id);

-- Index for update reactions lookup
CREATE INDEX IF NOT EXISTS idx_reactions_room_update ON public.reactions (room_id, update_id, observer_id);

-- Index for room updates by room and timestamp
CREATE INDEX IF NOT EXISTS idx_updates_room_created ON public.updates (room_id, created_at DESC);
