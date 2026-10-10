-- Admins can block accounts: a blocked user is signed out everywhere and
-- can't sign in until unblocked.
ALTER TABLE users ADD COLUMN blocked_at TIMESTAMPTZ;
