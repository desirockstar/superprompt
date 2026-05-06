-- Add preview column to prompts table
-- Stores the first ~200 chars of prompt content for card display
-- Eliminates filesystem reads on the listing/search page

ALTER TABLE prompts ADD COLUMN IF NOT EXISTS preview text;
