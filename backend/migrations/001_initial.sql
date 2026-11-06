CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  username text NOT NULL UNIQUE,
  email citext NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz,
  account_active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS user_progress (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_number integer NOT NULL CHECK (week_number BETWEEN 1 AND 16),
  completion_status text NOT NULL DEFAULT 'started' CHECK (completion_status IN ('started', 'completed')),
  completed_lesson_count integer NOT NULL DEFAULT 0 CHECK (completed_lesson_count >= 0),
  total_lesson_count integer NOT NULL DEFAULT 0 CHECK (total_lesson_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, week_number)
);

CREATE TABLE IF NOT EXISTS lesson_progress (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id text NOT NULL,
  status text NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'completed')),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS problem_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id text NOT NULL,
  status text NOT NULL DEFAULT 'attempted',
  code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS solution_journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_id integer NOT NULL,
  entry text NOT NULL,
  mood text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS review_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id text NOT NULL,
  due_at timestamptz NOT NULL,
  interval_days integer NOT NULL DEFAULT 1,
  UNIQUE (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS mock_interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz
);

CREATE TABLE IF NOT EXISTS sessions (
  sid varchar NOT NULL PRIMARY KEY,
  sess json NOT NULL,
  expire timestamp(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);

CREATE INDEX IF NOT EXISTS idx_solution_journals_user_created ON solution_journals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_problem_attempts_user_created ON problem_attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_queue_user_due ON review_queue(user_id, due_at);
