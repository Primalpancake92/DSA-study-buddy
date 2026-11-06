CREATE TABLE IF NOT EXISTS user_problem_progress (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id text NOT NULL,
  status text NOT NULL DEFAULT 'not-started' CHECK (status IN ('not-started', 'attempted', 'solved', 'review-needed')),
  attempts_count integer NOT NULL DEFAULT 0 CHECK (attempts_count BETWEEN 0 AND 10000),
  notes text NOT NULL DEFAULT '' CHECK (length(notes) <= 4000),
  last_attempted_at timestamptz,
  solved_at timestamptz,
  review_stage smallint NOT NULL DEFAULT 0 CHECK (review_stage BETWEEN 0 AND 2),
  next_review_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, problem_id)
);
CREATE INDEX IF NOT EXISTS idx_problem_progress_review ON user_problem_progress(user_id, next_review_at) WHERE next_review_at IS NOT NULL;
