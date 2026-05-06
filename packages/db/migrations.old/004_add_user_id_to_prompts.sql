-- Add user_id column to prompts table
ALTER TABLE prompts ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add index for user lookups
CREATE INDEX idx_prompts_user_id ON prompts(user_id);