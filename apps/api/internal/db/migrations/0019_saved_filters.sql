-- Named question filters a user saved ("hard Go", "my wrong SQL answers").
-- The filter itself is the web app's filter state as JSON (store.FilterSpec).
CREATE TABLE saved_filters (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 60),
  filters    JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_saved_filters_name ON saved_filters (user_id, lower(name));
