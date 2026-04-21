-- Initial schema migration
-- Generated from Drizzle schema

-- Enums
CREATE TYPE prompt_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE prompt_level AS ENUM ('starter', 'builder', 'pro', 'super');
CREATE TYPE unlock_method AS ENUM ('ad', 'subscription');
CREATE TYPE grading_trigger AS ENUM ('system', 'admin');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due');
CREATE TYPE grading_job_status AS ENUM ('pending', 'running', 'done', 'failed');

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  is_admin BOOLEAN DEFAULT false NOT NULL,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Prompts
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  status prompt_status DEFAULT 'pending' NOT NULL,
  base_path TEXT NOT NULL,
  current_version INTEGER DEFAULT 1 NOT NULL,
  is_multi_version BOOLEAN DEFAULT false NOT NULL,
  search_vector TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_prompts_category ON prompts(category);
CREATE INDEX idx_prompts_status ON prompts(status);

-- Prompt versions
CREATE TABLE prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  needs_grading BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Prompt version files
CREATE TABLE prompt_version_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_version_id UUID NOT NULL REFERENCES prompt_versions(id) ON DELETE CASCADE,
  level prompt_level NOT NULL,
  file_name TEXT NOT NULL
);

-- Ratings
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, prompt_id)
);

-- Unlocks
CREATE TABLE unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  unlocked_via unlock_method NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, prompt_id)
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status subscription_status NOT NULL,
  stripe_subscription_id TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Grading jobs
CREATE TABLE grading_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status grading_job_status DEFAULT 'pending' NOT NULL,
  triggered_by grading_trigger NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Grading history
CREATE TABLE grading_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_version_id UUID NOT NULL REFERENCES prompt_versions(id) ON DELETE CASCADE,
  score TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);