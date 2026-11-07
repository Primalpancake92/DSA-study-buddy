-- Persistence IDs 1–16 retain their meaning; Arrays receives ID 17 but appears
-- second in the syllabus. Do not shift any existing users' week numbers.
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_week_number_check;
ALTER TABLE user_progress ADD CONSTRAINT user_progress_week_number_check
    CHECK (week_number BETWEEN 1 AND 17);

INSERT INTO user_progress (user_id, week_number, total_lesson_count)
SELECT id, 17, 0 FROM users
ON CONFLICT (user_id, week_number) DO NOTHING;

-- Exact concept-level mappings only. Keep original rows as historical evidence;
-- mixed reading sections and aggregate Week 1 completion do not establish that
-- every lesson of the new Arrays module has been completed.
INSERT INTO lesson_progress (user_id, lesson_id, status, completed_at, updated_at)
SELECT user_id, regexp_replace(lesson_id, '^w1-', 'w17-'), status, completed_at, updated_at
FROM lesson_progress
WHERE lesson_id IN (
    'w1-array-method-contracts', 'w1-reference-copy-depth',
    'w1-scan-and-removal', 'w1-prefix-suffix-products',
    'w1-contains-duplicate-practice', 'w1-product-practice',
    'w1-stock-running-minimum'
)
ON CONFLICT (user_id, lesson_id) DO NOTHING;
