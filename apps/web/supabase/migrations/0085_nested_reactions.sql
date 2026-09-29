-- Migration to support nested reactions (e.g. replies to replies, likes on replies)

ALTER TABLE reactions 
ADD COLUMN parent_id TEXT REFERENCES reactions(id) ON DELETE CASCADE;
