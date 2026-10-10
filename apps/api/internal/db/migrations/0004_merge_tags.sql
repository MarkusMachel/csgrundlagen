-- Merge the ~120 tags the question banks invented independently ("Async",
-- "Async & Concurrency", "JS Async & Event Loop", …) into one shared list:
--
--   tracks: C# & .NET, JavaScript, Go, SQL & Databases
--   topics: Async & Concurrency, Performance & Memory, Algorithms & Data Structures,
--           Design Principles & Patterns, Architecture & DDD,
--           Distributed Systems & Messaging, APIs & HTTP, Security,
--           Resilience & Scalability, System Design, Testing & Operations,
--           Career & Judgement
--   collection: ezCater prep (unchanged)
--
-- A bank's section tag maps to a track and a topic (e.g. "Go Concurrency" ->
-- Go + Async & Concurrency); small topic tags fold into their topic. Questions
-- and materials keep every canonical tag their old tags map to. Any tag not in
-- the mapping (e.g. one an admin created) is left untouched.

CREATE TEMP TABLE tag_merge (old_name TEXT NOT NULL, new_name TEXT NOT NULL) ON COMMIT DROP;

INSERT INTO tag_merge (old_name, new_name) VALUES
  ('API & Contract Design', 'APIs & HTTP'),
  ('API design', 'APIs & HTTP'),
  ('ASP.NET Core & EF Core', 'C# & .NET'),
  ('ASP.NET Core & EF Core', 'APIs & HTTP'),
  ('Aggregation', 'SQL & Databases'),
  ('Algorithms', 'Algorithms & Data Structures'),
  ('Algorithms (Go)', 'Go'),
  ('Algorithms (Go)', 'Algorithms & Data Structures'),
  ('Architecture', 'Architecture & DDD'),
  ('Architecture & Distributed Systems', 'Distributed Systems & Messaging'),
  ('Async', 'C# & .NET'),
  ('Async', 'Async & Concurrency'),
  ('Async & Concurrency', 'C# & .NET'),
  ('Async & Concurrency', 'Async & Concurrency'),
  ('Behavioural', 'Career & Judgement'),
  ('Binary search', 'Algorithms & Data Structures'),
  ('C#', 'C# & .NET'),
  ('C# 12', 'C# & .NET'),
  ('CQRS', 'Architecture & DDD'),
  ('Caching', 'Resilience & Scalability'),
  ('Channels', 'Async & Concurrency'),
  ('Collections', 'C# & .NET'),
  ('Collections', 'Algorithms & Data Structures'),
  ('Collections & Data Structures', 'C# & .NET'),
  ('Collections & Data Structures', 'Algorithms & Data Structures'),
  ('Concurrency', 'Async & Concurrency'),
  ('Configuration', 'Testing & Operations'),
  ('Consensus', 'Distributed Systems & Messaging'),
  ('Consistency', 'Distributed Systems & Messaging'),
  ('Coordination', 'Distributed Systems & Messaging'),
  ('DDD', 'Architecture & DDD'),
  ('DDD & Application Architecture', 'Architecture & DDD'),
  ('Data', 'SQL & Databases'),
  ('Data access', 'SQL & Databases'),
  ('Data integrity', 'SQL & Databases'),
  ('Database & Data Modeling', 'SQL & Databases'),
  ('Decisions', 'Career & Judgement'),
  ('Delivery', 'Distributed Systems & Messaging'),
  ('Dependency injection', 'Design Principles & Patterns'),
  ('Design', 'Algorithms & Data Structures'),
  ('Design Principles & Patterns', 'Design Principles & Patterns'),
  ('Diagnostics', 'Performance & Memory'),
  ('Distributed Systems', 'Distributed Systems & Messaging'),
  ('EF Core', 'C# & .NET'),
  ('EF Core', 'SQL & Databases'),
  ('Error handling', 'APIs & HTTP'),
  ('Event sourcing', 'Distributed Systems & Messaging'),
  ('Event-Driven Architecture', 'Distributed Systems & Messaging'),
  ('Exceptions', 'C# & .NET'),
  ('GC', 'Performance & Memory'),
  ('Generics', 'C# & .NET'),
  ('Go Concurrency', 'Go'),
  ('Go Concurrency', 'Async & Concurrency'),
  ('Go Implementations', 'Go'),
  ('Go Language & Idioms', 'Go'),
  ('Graphs', 'Algorithms & Data Structures'),
  ('HTTP', 'APIs & HTTP'),
  ('Hashing', 'Algorithms & Data Structures'),
  ('Heaps', 'Algorithms & Data Structures'),
  ('Hosting', 'C# & .NET'),
  ('Idempotency', 'Distributed Systems & Messaging'),
  ('Idempotency & Durable Execution', 'Distributed Systems & Messaging'),
  ('Immutability', 'C# & .NET'),
  ('Indexing', 'SQL & Databases'),
  ('Integration', 'Distributed Systems & Messaging'),
  ('Integration Hub Design', 'System Design'),
  ('JS Async & Event Loop', 'JavaScript'),
  ('JS Async & Event Loop', 'Async & Concurrency'),
  ('JS Core & Types', 'JavaScript'),
  ('JS Functions, Scope & Prototypes', 'JavaScript'),
  ('JS Runtime, Browser & Security', 'JavaScript'),
  ('Joins', 'SQL & Databases'),
  ('Kafka', 'Distributed Systems & Messaging'),
  ('LINQ', 'C# & .NET'),
  ('Leadership', 'Career & Judgement'),
  ('Linked lists', 'Algorithms & Data Structures'),
  ('Logging', 'Testing & Operations'),
  ('Memory & Performance', 'C# & .NET'),
  ('Memory & Performance', 'Performance & Memory'),
  ('Messaging', 'Distributed Systems & Messaging'),
  ('Messaging, Delivery & System Design', 'Distributed Systems & Messaging'),
  ('Middleware', 'APIs & HTTP'),
  ('Migration', 'Architecture & DDD'),
  ('Modeling', 'SQL & Databases'),
  ('Modern C#', 'C# & .NET'),
  ('Modern JavaScript', 'JavaScript'),
  ('Multi-tenancy', 'System Design'),
  ('Normalization', 'SQL & Databases'),
  ('Nullability', 'C# & .NET'),
  ('Observability', 'Testing & Operations'),
  ('Ordering', 'Distributed Systems & Messaging'),
  ('Ownership & Judgement', 'Career & Judgement'),
  ('Pattern matching', 'C# & .NET'),
  ('Patterns', 'Design Principles & Patterns'),
  ('Performance', 'Performance & Memory'),
  ('PostGIS', 'SQL & Databases'),
  ('PostgreSQL', 'SQL & Databases'),
  ('Rate limiting', 'Resilience & Scalability'),
  ('Records', 'C# & .NET'),
  ('Reflection', 'C# & .NET'),
  ('Reliability', 'Resilience & Scalability'),
  ('Resilience', 'Resilience & Scalability'),
  ('Resilience & Scalability', 'Resilience & Scalability'),
  ('Resources', 'Performance & Memory'),
  ('Runtime', 'Performance & Memory'),
  ('SOLID', 'Design Principles & Patterns'),
  ('SQL', 'SQL & Databases'),
  ('SQL, PostgreSQL & EF Core', 'SQL & Databases'),
  ('Sagas', 'Distributed Systems & Messaging'),
  ('Scalability', 'Resilience & Scalability'),
  ('Security', 'Security'),
  ('Security & API Design', 'Security'),
  ('Security & API Design', 'APIs & HTTP'),
  ('Serialization', 'C# & .NET'),
  ('Sliding window', 'Algorithms & Data Structures'),
  ('Sorting', 'Algorithms & Data Structures'),
  ('Source generators', 'C# & .NET'),
  ('Span', 'Performance & Memory'),
  ('Stacks', 'Algorithms & Data Structures'),
  ('Strings', 'C# & .NET'),
  ('Synchronization', 'Async & Concurrency'),
  ('System Design & Judgement', 'System Design'),
  ('System design', 'System Design'),
  ('Temporal', 'Distributed Systems & Messaging'),
  ('Testing', 'Testing & Operations'),
  ('Testing & Operations', 'Testing & Operations'),
  ('Thread pool', 'Async & Concurrency'),
  ('Timers', 'Async & Concurrency'),
  ('Transactions', 'Distributed Systems & Messaging'),
  ('Tries', 'Algorithms & Data Structures'),
  ('Validation', 'APIs & HTTP'),
  ('Window functions', 'SQL & Databases'),
  ('ezCater prep', 'ezCater prep');

INSERT INTO tags (name)
VALUES
  ('C# & .NET'),
  ('JavaScript'),
  ('Go'),
  ('SQL & Databases'),
  ('Async & Concurrency'),
  ('Performance & Memory'),
  ('Algorithms & Data Structures'),
  ('Design Principles & Patterns'),
  ('Architecture & DDD'),
  ('Distributed Systems & Messaging'),
  ('APIs & HTTP'),
  ('Security'),
  ('Resilience & Scalability'),
  ('System Design'),
  ('Testing & Operations'),
  ('Career & Judgement'),
  ('ezCater prep')
ON CONFLICT (name) DO NOTHING;

INSERT INTO question_tags (question_id, tag_id)
SELECT qt.question_id, new_tag.id
FROM question_tags qt
JOIN tags old_tag ON old_tag.id = qt.tag_id
JOIN tag_merge m ON m.old_name = old_tag.name
JOIN tags new_tag ON new_tag.name = m.new_name
ON CONFLICT DO NOTHING;

INSERT INTO material_tags (material_id, tag_id)
SELECT mt.material_id, new_tag.id
FROM material_tags mt
JOIN tags old_tag ON old_tag.id = mt.tag_id
JOIN tag_merge m ON m.old_name = old_tag.name
JOIN tags new_tag ON new_tag.name = m.new_name
ON CONFLICT DO NOTHING;

-- Drop the merged tags (their links cascade); canonical names stay.
DELETE FROM tags t
WHERE EXISTS (SELECT 1 FROM tag_merge m WHERE m.old_name = t.name)
  AND NOT EXISTS (SELECT 1 FROM tag_merge m WHERE m.new_name = t.name);
