-- Unfinished test attempts, saved as the user answers so a test can be
-- resumed later or on another device. One draft per test and user; it is
-- removed when the attempt is submitted.
CREATE TABLE test_attempt_drafts (
  test_id       UUID NOT NULL REFERENCES custom_tests(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode          test_mode NOT NULL,
  -- the "retry incorrect only" subset, or NULL for the whole test
  question_ids  JSONB,
  answers       JSONB NOT NULL DEFAULT '{}'::jsonb,
  shuffle_seed  BIGINT NOT NULL,
  started_at    TIMESTAMPTZ NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (test_id, user_id)
);
