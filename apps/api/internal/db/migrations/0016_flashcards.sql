-- Flashcards (imported from Anki, or written by hand): the prompt is the
-- front, the explanation is the back, and the learner grades themselves
-- ("I knew it" = true). No extra columns are needed.
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'flashcard';
