-- Migration: Add level to prompt_versions
-- Add tier assignment column for AI grading

ALTER TABLE prompt_versions 
ADD COLUMN level prompt_level;