-- Seed 50 sample prompts with tags, ratings, views (run this file separately)
ALTER TABLE prompts ADD COLUMN primary_tag TEXT;
ALTER TABLE prompts ADD COLUMN secondary_tags TEXT;
ALTER TABLE prompts ADD COLUMN is_viral BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE prompts ADD COLUMN is_nano BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE prompts ADD COLUMN views INTEGER DEFAULT 0 NOT NULL;

-- Add indexes for tags
CREATE INDEX idx_prompts_primary_tag ON prompts(primary_tag);
CREATE INDEX idx_prompts_is_viral ON prompts(is_viral) WHERE is_viral = true;
CREATE INDEX idx_prompts_is_nano ON prompts(is_nano) WHERE is_nano = true;