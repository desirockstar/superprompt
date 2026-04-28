-- Migration 003: New Evaluation System
-- Replaces gradingHistory/gradingJobs with new evaluation tables

-- Drop old tables (if they exist)
DROP TABLE IF EXISTS evaluation_scores;
DROP TABLE IF EXISTS evaluations;
DROP TABLE IF EXISTS rubrics;
DROP TABLE IF EXISTS grading_history;
DROP TABLE IF EXISTS grading_jobs;

-- Create new enum
DO $$ BEGIN
  CREATE TYPE evaluation_status AS ENUM ('pending', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Rubrics table (config-driven)
CREATE TABLE rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT UNIQUE NOT NULL,
  criteria JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evaluations table (main)
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID UNIQUE NOT NULL,
  category TEXT NOT NULL,
  level TEXT NOT NULL,
  overall_score FLOAT,
  overall_feedback TEXT,
  rubric JSONB,
  status evaluation_status DEFAULT 'completed' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evaluation_scores table (per-criterion)
CREATE TABLE evaluation_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  criterion_name TEXT NOT NULL,
  score FLOAT NOT NULL,
  feedback TEXT
);

-- Index for idempotency
CREATE UNIQUE INDEX idx_evaluations_prompt ON evaluations(prompt_id);

-- Seed default rubric
INSERT INTO rubrics (id, category, criteria) 
VALUES (
  gen_random_uuid(), 
  'general', 
  '[{"name": "clarity", "weight": 0.4}, {"name": "specificity", "weight": 0.3}, {"name": "usability", "weight": 0.3}]'
);