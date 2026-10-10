-- Device tracking for signed-in users.
--
-- Every session remembers where it was opened from: the IP address and
-- User-Agent header at sign-in, the latest IP and time it was used, and what
-- the browser reported about itself (screen, time zone, languages, ...;
-- see POST /api/me/device). Users see their own sessions on the Account page
-- and can sign them out; admins see everyone's.
--
-- login_events is the sign-in history: successful logins, sign-ups, failed
-- passwords for known accounts and password resets. Unknown emails are not
-- recorded. Rows older than 90 days, and expired sessions, are purged by the
-- API (store.PurgeExpired).

ALTER TABLE sessions
  ADD COLUMN id           UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  ADD COLUMN ip           TEXT,
  ADD COLUMN user_agent   TEXT,
  ADD COLUMN client_info  JSONB,
  ADD COLUMN last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN last_ip      TEXT;

CREATE TABLE login_events (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL CHECK (kind IN ('login', 'signup', 'login_failed', 'password_reset')),
  ip         TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_login_events_user ON login_events (user_id, created_at DESC);
CREATE INDEX idx_login_events_created ON login_events (created_at);
