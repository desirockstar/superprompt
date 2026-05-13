-- Migration: remove grading tables, add complexity fields to prompts
-- Generated manually based on schema changes (AI grading pipeline removed, tier sourced from offline pipeline)

-- Drop tables (order matters due to FK references)
DROP TABLE IF EXISTS "evaluation_scores";
DROP TABLE IF EXISTS "evaluations";
DROP TABLE IF EXISTS "prompt_version_files";
DROP TABLE IF EXISTS "prompt_versions";
DROP TABLE IF EXISTS "rubrics";

-- Drop unused enums
DROP TYPE IF EXISTS "evaluation_status";
DROP TYPE IF EXISTS "grading_trigger";

-- Add complexity columns to prompts (tier from offline pipeline)
ALTER TABLE "prompts" ADD COLUMN IF NOT EXISTS "complexity_score" text;
ALTER TABLE "prompts" ADD COLUMN IF NOT EXISTS "complexity_tier" text;

-- Add index on complexity_tier for filtering
CREATE INDEX IF NOT EXISTS "idx_prompts_complexity_tier" ON "prompts" USING btree ("complexity_tier");