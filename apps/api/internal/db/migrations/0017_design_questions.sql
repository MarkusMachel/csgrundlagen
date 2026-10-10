-- System design challenges: draw an architecture from components (load
-- balancer, cache, queue, ...) and get it checked against rules tied to the
-- requirements. The whole challenge (requirements, rules, reference design)
-- is one JSON document; see store/design.go.
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'design';
ALTER TABLE questions ADD COLUMN design JSONB;
