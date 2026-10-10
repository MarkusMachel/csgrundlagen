-- Spaced repetition: when each user should next see each question they've
-- answered. Updated on every answer (feed, test or review) with a simplified
-- SM-2 (see internal/store/review.go):
--   correct: repetitions + 1; interval 1 day, then 3 days, then interval * ease (max 365 days)
--   wrong:   repetitions reset; due again in 10 minutes; ease drops (min 1.3)
CREATE TABLE review_schedule (
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id      UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  repetitions      INTEGER NOT NULL DEFAULT 0,
  interval_days    DOUBLE PRECISION NOT NULL DEFAULT 0,
  ease             DOUBLE PRECISION NOT NULL DEFAULT 2.5 CHECK (ease >= 1.3),
  due_at           TIMESTAMPTZ NOT NULL,
  last_reviewed_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (user_id, question_id)
);

CREATE INDEX idx_review_schedule_due ON review_schedule (user_id, due_at);

-- Backfill from answer history. The exact SM-2 state can't be recovered, so
-- approximate it: count the trailing run of correct answers as repetitions,
-- lower the ease for questions that were often missed, and make anything last
-- answered wrong due right away (the same questions Weak Spots shows).
WITH ordered AS (
  SELECT user_id, question_id, is_correct, answered_at,
         -- running count of wrong answers, newest first: 0 for the trailing correct streak
         count(*) FILTER (WHERE NOT is_correct)
           OVER (PARTITION BY user_id, question_id ORDER BY answered_at DESC) AS wrong_since
  FROM question_answers
),
per_question AS (
  SELECT user_id, question_id,
         count(*) FILTER (WHERE wrong_since = 0) AS streak,
         count(*) AS answers,
         count(*) FILTER (WHERE is_correct) AS correct,
         max(answered_at) AS last_answered_at
  FROM ordered
  GROUP BY user_id, question_id
),
scheduled AS (
  SELECT user_id, question_id, streak, last_answered_at,
         greatest(1.3, least(2.5, 1.3 + 1.2 * correct::double precision / answers)) AS ease,
         CASE WHEN streak = 0 THEN 0
              WHEN streak = 1 THEN 1
              WHEN streak = 2 THEN 3
              ELSE least(365, 3 * power(greatest(1.3, least(2.5, 1.3 + 1.2 * correct::double precision / answers)), streak - 2))
         END AS interval_days -- capped at a year, like the app
  FROM per_question
)
INSERT INTO review_schedule (user_id, question_id, repetitions, interval_days, ease, due_at, last_reviewed_at)
SELECT user_id, question_id, streak, interval_days, ease,
       CASE WHEN streak = 0 THEN last_answered_at
            ELSE last_answered_at + make_interval(secs => interval_days * 86400) END,
       last_answered_at
FROM scheduled;
