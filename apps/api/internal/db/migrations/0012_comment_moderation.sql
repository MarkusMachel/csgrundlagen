-- Comment moderation: readers report comments, admins hide or delete them.
-- A hidden comment is shown only to admins (and still counts as the author's
-- data for export and deletion).
ALTER TABLE question_comments
  ADD COLUMN hidden_at TIMESTAMPTZ,
  ADD COLUMN hidden_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE comment_reports (
  id          BIGSERIAL PRIMARY KEY,
  comment_id  UUID NOT NULL REFERENCES question_comments(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL CHECK (reason IN ('spam', 'offensive', 'misleading', 'other')),
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  UNIQUE (comment_id, user_id)
);

CREATE INDEX idx_comment_reports_open ON comment_reports (comment_id) WHERE resolved_at IS NULL;
