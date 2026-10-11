-- A user's answers by time, with what the progress page counts, so building
-- it reads only this index (activity per day, totals, per-tag counts).
CREATE INDEX idx_question_answers_user_time
  ON question_answers (user_id, answered_at) INCLUDE (question_id, is_correct);
