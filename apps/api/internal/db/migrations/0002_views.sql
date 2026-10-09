-- Read-only views mirroring the aggregates the mock API computes on the fly
-- (see apps/web/src/mocks/handlers/questions.ts, apps/web/src/features/weak-spots/weakness.ts).
-- Handy for browsing in DBeaver without hand-rolling the same joins each time.

-- Per-question answer distribution (powers the Stats tab on a question).
CREATE VIEW question_answer_stats AS
SELECT
  question_id,
  answer_value,
  count(*) AS answer_count,
  round(100.0 * count(*) / sum(count(*)) OVER (PARTITION BY question_id), 1) AS percentage
FROM question_answers
GROUP BY question_id, answer_value;

-- Per-user, per-question performance (drives the Weak Spots queue).
-- "Weak" = accuracy below 60% with >= 2 attempts, OR the most recent attempt was wrong
-- (same rule as WEAK_ACCURACY_THRESHOLD / WEAK_MIN_ATTEMPTS in
-- apps/web/src/features/weak-spots/weakness.ts).
CREATE VIEW user_question_stats AS
SELECT
  user_id,
  question_id,
  count(*) AS times_answered,
  count(*) FILTER (WHERE is_correct) AS times_correct,
  max(answered_at) AS last_answered_at,
  (array_agg(is_correct ORDER BY answered_at DESC))[1] AS last_answer_correct
FROM question_answers
GROUP BY user_id, question_id;

CREATE VIEW weak_spots AS
SELECT *
FROM user_question_stats
WHERE
  NOT last_answer_correct
  OR (times_answered >= 2 AND times_correct::numeric / times_answered < 0.6);

-- Platform-wide admin stats (mirrors GET /api/admin/stats).
CREATE VIEW admin_stats_totals AS
SELECT
  (SELECT count(*) FROM questions)        AS total_questions,
  (SELECT count(*) FROM materials)        AS total_materials,
  (SELECT count(*) FROM users)            AS total_users,
  (SELECT count(*) FROM question_answers) AS total_answers_submitted,
  (SELECT count(*) FROM custom_tests)     AS total_tests,
  (SELECT count(*) FROM test_attempts)    AS total_test_attempts,
  (SELECT count(*) FROM bookmarks)        AS total_bookmarks,
  (SELECT count(*) FROM bug_reports)      AS total_bug_reports;

CREATE VIEW admin_questions_by_type AS
SELECT type, count(*) AS count FROM questions GROUP BY type;

CREATE VIEW admin_questions_by_difficulty AS
SELECT coalesce(difficulty::text, 'unspecified') AS difficulty, count(*) AS count
FROM questions GROUP BY difficulty;

CREATE VIEW admin_materials_by_type AS
SELECT type, count(*) AS count FROM materials GROUP BY type;

CREATE VIEW admin_answers_by_tag AS
SELECT t.name AS tag, count(qa.*) AS count
FROM question_answers qa
JOIN question_tags qt ON qt.question_id = qa.question_id
JOIN tags t ON t.id = qt.tag_id
GROUP BY t.name
ORDER BY count DESC;
