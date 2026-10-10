-- Self-service accounts: password reset links. Like sessions, only a SHA-256
-- of the token is stored; a token works once and expires after an hour.
CREATE TABLE password_reset_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ
);

CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens (user_id);
