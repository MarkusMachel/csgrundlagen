-- Changing the account email: the new address must be confirmed with a
-- single-use link before it replaces the old one. Like the other tokens, only
-- a SHA-256 of it is stored.
CREATE TABLE email_change_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  new_email  TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ
);

CREATE INDEX idx_email_change_tokens_user ON email_change_tokens (user_id);
