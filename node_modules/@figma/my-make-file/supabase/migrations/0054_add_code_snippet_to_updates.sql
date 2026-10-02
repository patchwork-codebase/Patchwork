-- Add code_snippet column to updates table
ALTER TABLE IF EXISTS updates ADD COLUMN IF NOT EXISTS code_snippet text;
