-- Schema for the Computer Fundamentals Trainer, mirroring the TypeScript
-- domain model in apps/web/src/features/*/types.ts and
-- apps/web/src/shared/types/index.ts.

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------

CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE locale AS ENUM ('en', 'pt-BR', 'de');

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  avatar_url    TEXT,
  locale        locale NOT NULL DEFAULT 'en',
  role          user_role NOT NULL DEFAULT 'user',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bearer-token sessions. Only a SHA-256 of the token is stored.
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_sessions_user ON sessions (user_id);

-- ---------------------------------------------------------------------------
-- Questions
-- ---------------------------------------------------------------------------

CREATE TYPE question_type AS ENUM ('multiple-choice', 'true-false');
CREATE TYPE question_difficulty AS ENUM ('easy', 'medium', 'hard');

CREATE TABLE questions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type             question_type NOT NULL,
  prompt           TEXT NOT NULL,
  difficulty       question_difficulty,
  explanation      TEXT NOT NULL,
  -- true-false only; NULL for multiple-choice
  correct_answer   BOOLEAN,
  created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT correct_answer_only_for_true_false CHECK (
    (type = 'true-false' AND correct_answer IS NOT NULL) OR
    (type = 'multiple-choice' AND correct_answer IS NULL)
  )
);

-- Multiple-choice options (2-5 rows per question, labeled A-E).
CREATE TABLE question_options (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id  UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  -- 'A'..'E'; order within a question is the display order.
  option_key   CHAR(1) NOT NULL CHECK (option_key BETWEEN 'A' AND 'E'),
  label        TEXT NOT NULL,
  is_correct   BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (question_id, option_key)
);

-- Exactly one correct option per multiple-choice question.
CREATE UNIQUE INDEX one_correct_option_per_question
  ON question_options (question_id)
  WHERE is_correct;

-- Free-form tags (e.g. "Networking", "OSI Model"), many-to-many.
CREATE TABLE tags (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE question_tags (
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  tag_id      UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (question_id, tag_id)
);

-- Per-locale overrides; EN content lives on the question itself.
CREATE TABLE question_translations (
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  locale      locale NOT NULL,
  prompt      TEXT,
  explanation TEXT,
  PRIMARY KEY (question_id, locale),
  CHECK (locale <> 'en')
);

CREATE TABLE question_option_translations (
  option_id UUID NOT NULL REFERENCES question_options(id) ON DELETE CASCADE,
  locale    locale NOT NULL,
  label     TEXT NOT NULL,
  PRIMARY KEY (option_id, locale),
  CHECK (locale <> 'en')
);

-- ---------------------------------------------------------------------------
-- Materials (curated learning material)
-- ---------------------------------------------------------------------------

CREATE TYPE material_type AS ENUM ('book', 'video', 'article', 'link');

CREATE TABLE materials (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        material_type NOT NULL,
  title       TEXT NOT NULL,
  url         TEXT NOT NULL,
  author      TEXT,
  description TEXT,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE material_tags (
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  tag_id      UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (material_id, tag_id)
);

-- Optional cross-link: material <-> the questions it supports.
CREATE TABLE material_questions (
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  PRIMARY KEY (material_id, question_id)
);

-- ---------------------------------------------------------------------------
-- Per-user question interactions
-- ---------------------------------------------------------------------------

CREATE TABLE bookmarks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, question_id)
);

CREATE TABLE question_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, question_id)
);

CREATE TABLE question_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE bug_report_status AS ENUM ('open', 'reviewed', 'closed');

CREATE TABLE bug_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message     TEXT NOT NULL,
  status      bug_report_status NOT NULL DEFAULT 'open',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One submitted answer. Feeds both per-question stats and per-user stats.
CREATE TABLE question_answers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id    UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  -- the chosen option_key ('A'..'E') or 'true'/'false'
  answer_value   TEXT NOT NULL,
  is_correct     BOOLEAN NOT NULL,
  -- NULL for standalone feed answers; set when answered as part of a test attempt.
  test_attempt_id UUID,
  answered_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_question_answers_question ON question_answers (question_id);
CREATE INDEX idx_question_answers_user_question ON question_answers (user_id, question_id);

-- ---------------------------------------------------------------------------
-- Custom tests
-- ---------------------------------------------------------------------------

CREATE TYPE test_mode AS ENUM ('practice', 'exam');

CREATE TABLE custom_tests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  timed             BOOLEAN NOT NULL DEFAULT false,
  duration_minutes  INTEGER CHECK (duration_minutes IS NULL OR duration_minutes > 0),
  shuffle_questions BOOLEAN NOT NULL DEFAULT false,
  shuffle_options   BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ordered membership of a test (position = display/shuffle-base order).
CREATE TABLE custom_test_questions (
  test_id     UUID NOT NULL REFERENCES custom_tests(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL,
  PRIMARY KEY (test_id, question_id),
  UNIQUE (test_id, position)
);

CREATE TABLE test_attempts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id      UUID NOT NULL REFERENCES custom_tests(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode         test_mode NOT NULL,
  -- questionId -> chosen option key or boolean, exactly as submitted
  answers      JSONB NOT NULL DEFAULT '{}'::jsonb,
  score        INTEGER NOT NULL DEFAULT 0,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ
);

ALTER TABLE question_answers
  ADD CONSTRAINT fk_question_answers_attempt
  FOREIGN KEY (test_attempt_id) REFERENCES test_attempts(id) ON DELETE CASCADE;

CREATE INDEX idx_test_attempts_test ON test_attempts (test_id);
CREATE INDEX idx_test_attempts_user ON test_attempts (user_id);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

CREATE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_question_notes_updated_at
  BEFORE UPDATE ON question_notes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
