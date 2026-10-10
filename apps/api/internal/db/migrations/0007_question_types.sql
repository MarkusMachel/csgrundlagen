-- More question types:
--   multi-select  pick all that apply: several options are correct
--   ordering      put the options in order: question_options.correct_position
--   output        predict what a snippet prints: code + code_language + expected_output
--
-- The checks compare type::text because a new enum value can't be used in the
-- transaction that adds it.

ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'multi-select';
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'ordering';
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'output';

ALTER TABLE questions
  ADD COLUMN code            TEXT,
  ADD COLUMN code_language   TEXT,
  ADD COLUMN expected_output TEXT;

COMMENT ON COLUMN questions.code IS 'output questions: the snippet to predict (and run, for js/go).';
COMMENT ON COLUMN questions.code_language IS 'output questions: fence tag of code, e.g. js, go.';
COMMENT ON COLUMN questions.expected_output IS 'output questions: what the snippet prints; compared ignoring trailing whitespace.';

ALTER TABLE questions DROP CONSTRAINT correct_answer_only_for_true_false;
ALTER TABLE questions
  ADD CONSTRAINT correct_answer_only_for_true_false
    CHECK ((type::text = 'true-false') = (correct_answer IS NOT NULL)),
  ADD CONSTRAINT output_fields_only_for_output
    CHECK ((type::text = 'output') = (code IS NOT NULL AND code_language IS NOT NULL AND expected_output IS NOT NULL));

-- Multi-select questions have several correct options, so "exactly one
-- correct option" is now checked per type by the API instead of an index.
DROP INDEX one_correct_option_per_question;

ALTER TABLE question_options ADD COLUMN correct_position INTEGER CHECK (correct_position >= 0);
COMMENT ON COLUMN question_options.correct_position IS 'ordering questions: 0-based position in the correct order; NULL otherwise.';
