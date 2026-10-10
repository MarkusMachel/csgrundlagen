-- GDPR: which privacy policy each user accepted, and a log of their consent
-- choices (Art. 7(1): consent must be demonstrable).
--
-- Consent categories (the web app's consent dialog):
--   preferences     remember theme and language in the browser
--   device_details  store what the browser reports about itself (time zone,
--                   screen, languages) on the session; see POST /api/me/device
-- Essential storage (the sign-in token) and security records (session IP and
-- User-Agent, sign-in history) don't need consent and are always on.

ALTER TABLE users
  ADD COLUMN privacy_version     TEXT,
  ADD COLUMN privacy_accepted_at TIMESTAMPTZ;

CREATE TABLE consent_records (
  id             BIGSERIAL PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  policy_version TEXT NOT NULL,
  preferences    BOOLEAN NOT NULL,
  device_details BOOLEAN NOT NULL,
  ip             TEXT,
  user_agent     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_consent_records_user ON consent_records (user_id, created_at DESC);

-- Device details collected before consent existed are dropped.
UPDATE sessions SET client_info = NULL;
