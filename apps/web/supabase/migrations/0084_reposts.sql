-- Migration to support Repost (Retweet) and Quote (Repost with thoughts) features

-- Add repost_id to link to the original update being shared
ALTER TABLE updates
ADD COLUMN repost_id TEXT REFERENCES updates(id) ON DELETE SET NULL;

-- Add is_repost_only to distinguish between an instant repost (true) and a quote with thoughts (false)
ALTER TABLE updates
ADD COLUMN is_repost_only BOOLEAN DEFAULT false;

-- Create an index to quickly fetch all reposts of a specific update
CREATE INDEX IF NOT EXISTS idx_updates_repost_id ON updates(repost_id);
