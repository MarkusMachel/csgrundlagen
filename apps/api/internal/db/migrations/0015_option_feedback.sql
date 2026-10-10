-- Feedback for wrong answers: an option can explain why it is wrong and
-- point to the material that clears up that misconception. Neither is sent
-- with the question (it would give away which options are wrong); they come
-- back in the answer result.
ALTER TABLE question_options
  ADD COLUMN feedback    TEXT,
  ADD COLUMN material_id UUID REFERENCES materials(id) ON DELETE SET NULL;
