-- Safe additive migration for databases that already applied 001_initial.sql.
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_active boolean NOT NULL DEFAULT true;
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS completed_at timestamptz;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_progress' AND column_name = 'completed_weeks')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_progress' AND column_name = 'week_number') THEN
    ALTER TABLE user_progress RENAME TO user_progress_legacy;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS user_progress (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_number integer NOT NULL CHECK (week_number BETWEEN 1 AND 16),
  completion_status text NOT NULL DEFAULT 'started' CHECK (completion_status IN ('started', 'completed')),
  completed_lesson_count integer NOT NULL DEFAULT 0 CHECK (completed_lesson_count >= 0),
  total_lesson_count integer NOT NULL DEFAULT 0 CHECK (total_lesson_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, week_number)
);

INSERT INTO user_progress (user_id, week_number, completion_status, total_lesson_count)
SELECT users.id, weeks.week_number, 'started', 3
FROM users CROSS JOIN generate_series(1, 16) AS weeks(week_number)
ON CONFLICT (user_id, week_number) DO NOTHING;

DO $$
BEGIN
  IF to_regclass('public.user_progress_legacy') IS NOT NULL THEN
    INSERT INTO user_progress (user_id, week_number, completion_status, completed_lesson_count, total_lesson_count)
    SELECT legacy.user_id, completed_week, 'completed', 3, 3
    FROM user_progress_legacy AS legacy CROSS JOIN unnest(legacy.completed_weeks) AS completed_week
    ON CONFLICT (user_id, week_number) DO UPDATE SET completion_status = 'completed', completed_lesson_count = 3, updated_at = now();
    INSERT INTO lesson_progress (user_id, lesson_id, status, completed_at)
    SELECT legacy.user_id, checkpoint, 'completed', now()
    FROM user_progress_legacy AS legacy CROSS JOIN unnest(legacy.completed_checkpoints) AS checkpoint
    ON CONFLICT (user_id, lesson_id) DO NOTHING;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS sessions (sid varchar NOT NULL PRIMARY KEY, sess json NOT NULL, expire timestamp(6) NOT NULL);
CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_solution_journals_user_created ON solution_journals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_problem_attempts_user_created ON problem_attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_queue_user_due ON review_queue(user_id, due_at);
