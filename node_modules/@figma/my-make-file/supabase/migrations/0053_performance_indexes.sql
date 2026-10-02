-- Migration 0053: Add performance indexes for high-frequency queries
-- These indexes resolve N+1 slow queries on room feeds and global timeline

CREATE INDEX IF NOT EXISTS idx_reactions_room_id ON reactions(room_id);
CREATE INDEX IF NOT EXISTS idx_updates_room_id ON updates(room_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status_updated ON rooms(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_room_observers_lookup ON room_observers(room_id, observer_id);
