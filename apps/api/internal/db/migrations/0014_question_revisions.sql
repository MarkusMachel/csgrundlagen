-- Question version history: a snapshot of the editable content (the same
-- JSON the admin form submits) for every create, edit and restore, so admins
-- can see who changed what and roll a question back.
CREATE TABLE question_revisions (
  id          BIGSERIAL PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  editor_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('created', 'edited', 'restored', 'original')),
  snapshot    JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_question_revisions_question ON question_revisions (question_id, id DESC);
