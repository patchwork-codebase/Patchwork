-- Migration: 0069_crossroads_schema.sql
-- Description: Adds crossroad_data to updates and creates crossroad_votes table

-- 1. Add crossroad_data to updates table
ALTER TABLE updates ADD COLUMN IF NOT EXISTS crossroad_data JSONB;

-- 2. Create crossroad_votes table
CREATE TABLE IF NOT EXISTS crossroad_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    update_id TEXT NOT NULL REFERENCES updates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    option_title TEXT NOT NULL,
    rationale TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(update_id, user_id) -- One vote per user per crossroad
);

-- 3. Enable RLS on crossroad_votes
ALTER TABLE crossroad_votes ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for crossroad_votes
-- Anyone can view votes
CREATE POLICY "Crossroad votes are viewable by everyone" ON crossroad_votes
    FOR SELECT USING (true);

-- Authenticated users can insert their own votes
CREATE POLICY "Users can insert their own crossroad votes" ON crossroad_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update their own votes
CREATE POLICY "Users can update their own crossroad votes" ON crossroad_votes
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Authenticated users can delete their own votes
CREATE POLICY "Users can delete their own crossroad votes" ON crossroad_votes
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_crossroad_votes_update_id ON crossroad_votes(update_id);
CREATE INDEX IF NOT EXISTS idx_crossroad_votes_user_id ON crossroad_votes(user_id);
