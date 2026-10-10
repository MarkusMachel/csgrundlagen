-- Question text supports code snippets as Markdown-style fences:
--
--   ```go
--   func main() {}
--   ```
--
-- and `inline code`. Everything else is plain text with its line breaks kept.
-- The web app renders this format (apps/web/src/shared/ui/RichText.tsx); the
-- columns stay TEXT, so this migration only documents the format and converts
-- existing snippets to it.

COMMENT ON COLUMN questions.prompt IS 'Text; ```lang fenced code blocks and `inline code` are rendered with syntax highlighting.';
COMMENT ON COLUMN questions.explanation IS 'Text; ```lang fenced code blocks and `inline code` are rendered with syntax highlighting.';
COMMENT ON COLUMN question_options.label IS 'Text; ```lang fenced code blocks and `inline code` are rendered with syntax highlighting.';
COMMENT ON COLUMN question_translations.prompt IS 'Same format as questions.prompt.';
COMMENT ON COLUMN question_translations.explanation IS 'Same format as questions.explanation.';
COMMENT ON COLUMN question_option_translations.label IS 'Same format as question_options.label.';

-- Seeded explanations ended in a plain "Go:" or "SQL:" heading followed by the
-- code, running to the end of the text. Turn those into fenced blocks.
UPDATE questions
SET explanation = regexp_replace(explanation, E'\n\nGo:\n\n(.*)$', E'\n\n```go\n\\1\n```')
WHERE explanation ~ E'\n\nGo:\n\n';

UPDATE questions
SET explanation = regexp_replace(explanation, E'\n\nSQL:\n\n(.*)$', E'\n\n```sql\n\\1\n```')
WHERE explanation ~ E'\n\nSQL:\n\n';
