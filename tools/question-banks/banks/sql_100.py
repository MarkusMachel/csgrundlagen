"""100 SQL and database interview questions (PostgreSQL 16), sections A-J."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # tools/question-banks
from bankgen import build

ADD = "added"
PGD = "PostgreSQL documentation"
WINAND = "Markus Winand"


def pg(path, title, desc, flag=False):
    return ("article", title, "https://www.postgresql.org/docs/current/" + path, PGD, desc, flag)


M = {
 # PostgreSQL documentation
 "pg-commands": pg("sql-commands.html", "SQL commands", "Reference for every SQL command PostgreSQL supports."),
 "pg-select": pg("sql-select.html", "SELECT", "GROUP BY, HAVING, DISTINCT ON and the locking clause."),
 "pg-queries": pg("queries.html", "Queries", "How a query is built from FROM to LIMIT."),
 "pg-comparison": pg("functions-comparison.html", "Comparison functions and operators", "IS NULL, IS DISTINCT FROM and friends."),
 "pg-table-expr": pg("queries-table-expressions.html", "Table expressions", "Joins, aliases, LATERAL and grouping sets."),
 "pg-union": pg("queries-union.html", "Combining queries", "UNION, INTERSECT and EXCEPT."),
 "pg-subquery": pg("functions-subquery.html", "Subquery expressions", "EXISTS, IN, NOT IN, ANY and ALL."),
 "pg-conditional": pg("functions-conditional.html", "Conditional expressions", "CASE, COALESCE and NULLIF."),
 "pg-truncate": pg("sql-truncate.html", "TRUNCATE", "Emptying tables quickly, with CASCADE."),
 "pg-delete": pg("sql-delete.html", "DELETE", "Deleting rows, USING and RETURNING."),
 "pg-window-tutorial": pg("tutorial-window.html", "Window functions tutorial", "Window functions compared with GROUP BY."),
 "pg-window-funcs": pg("functions-window.html", "Window functions", "row_number, rank, dense_rank, lag, lead."),
 "pg-expressions": pg("sql-expressions.html", "Value expressions", "Aggregate expressions, FILTER and window frames."),
 "pg-with": pg("queries-with.html", "WITH queries (CTEs)", "Materialization, recursion and data-modifying CTEs."),
 "pg-matviews": pg("rules-materializedviews.html", "Materialized views", "Stored query results refreshed on demand."),
 "pg-identity": pg("ddl-identity-columns.html", "Identity columns", "The standard replacement for serial."),
 "pg-uuid": pg("datatype-uuid.html", "UUID type", "Storing and generating UUIDs."),
 "pg-constraints": pg("ddl-constraints.html", "Constraints", "NOT NULL, UNIQUE, CHECK, foreign keys and exclusion."),
 "pg-partial": pg("indexes-partial.html", "Partial indexes", "Indexing a subset of rows."),
 "pg-ranges": pg("rangetypes.html", "Range types", "tstzrange, daterange and their operators."),
 "pg-numeric": pg("datatype-numeric.html", "Numeric types", "Integers, numeric and floating point."),
 "pg-datetime": pg("datatype-datetime.html", "Date/time types", "timestamptz versus timestamp."),
 "pg-json": pg("datatype-json.html", "JSON types", "json, jsonb and jsonb indexing."),
 "pg-json-funcs": pg("functions-json.html", "JSON functions and operators", "->, ->>, @>, ? and SQL/JSON path."),
 "pg-ltree": pg("ltree.html", "ltree", "Materialized paths for tree-like data."),
 "pg-index-types": pg("indexes-types.html", "Index types", "B-tree, Hash, GiST, SP-GiST, GIN and BRIN."),
 "pg-multicol": pg("indexes-multicolumn.html", "Multicolumn indexes", "How column order affects which queries an index serves."),
 "pg-ios": pg("indexes-index-only-scans.html", "Index-only scans and covering indexes", "INCLUDE columns and the visibility map."),
 "pg-expr-index": pg("indexes-expressional.html", "Indexes on expressions", "Indexing lower(email) and similar."),
 "pg-stats": pg("monitoring-stats.html", "The cumulative statistics system", "pg_stat_user_tables, pg_stat_user_indexes, pg_stat_activity."),
 "pg-trgm": pg("pgtrgm.html", "pg_trgm", "Trigram matching for substring and fuzzy search."),
 "pg-fts": pg("textsearch.html", "Full text search", "tsvector, tsquery and ranking."),
 "pg-create-index": pg("sql-createindex.html", "CREATE INDEX", "Including building indexes CONCURRENTLY."),
 "pg-explain": pg("using-explain.html", "Using EXPLAIN", "Reading plans, estimated and actual rows."),
 "pg-planner": pg("planner-optimizer.html", "Planner/optimizer", "Scan and join strategies the planner chooses between."),
 "pg-planner-stats": pg("planner-stats.html", "Statistics used by the planner", "pg_stats, histograms and extended statistics."),
 "pg-stat-statements": pg("pgstatstatements.html", "pg_stat_statements", "Per-query execution statistics."),
 "pg-auto-explain": pg("auto-explain.html", "auto_explain", "Logging plans of slow queries automatically."),
 "pg-populate": pg("populate.html", "Populating a database", "Fast bulk loading."),
 "pg-copy": pg("sql-copy.html", "COPY", "Bulk import and export."),
 "pg-prepare": pg("sql-prepare.html", "PREPARE", "Prepared statements, custom and generic plans."),
 "pg-query-config": pg("runtime-config-query.html", "Query planning configuration", "plan_cache_mode and planner settings."),
 "pg-tx": pg("tutorial-transactions.html", "Transactions", "BEGIN, COMMIT and all-or-nothing work."),
 "pg-iso": pg("transaction-iso.html", "Transaction isolation", "Read Committed, Repeatable Read, Serializable and anomalies."),
 "pg-mvcc": pg("mvcc.html", "Concurrency control", "MVCC: readers and writers do not block each other."),
 "pg-locking": pg("explicit-locking.html", "Explicit locking", "Table and row locks, deadlocks, advisory locks."),
 "pg-insert": pg("sql-insert.html", "INSERT ... ON CONFLICT", "Atomic upserts."),
 "pg-merge": pg("sql-merge.html", "MERGE", "Conditional insert, update and delete from a source."),
 "pg-client-config": pg("runtime-config-client.html", "Client connection defaults", "statement_timeout, lock_timeout, idle_in_transaction_session_timeout."),
 "pg-vacuum": pg("routine-vacuuming.html", "Routine vacuuming", "Autovacuum, freezing and wraparound."),
 "pg-reindex": pg("routine-reindex.html", "Routine reindexing", "When and how to rebuild indexes."),
 "pg-wal": pg("wal-intro.html", "Write-ahead logging", "Durability through a sequential log."),
 "pg-wal-config": pg("wal-configuration.html", "WAL configuration", "Checkpoints, max_wal_size, checkpoint_timeout."),
 "pg-ha": pg("high-availability.html", "High availability and replication", "Streaming replication and standbys."),
 "pg-logical-rep": pg("logical-replication.html", "Logical replication", "Publications and subscriptions."),
 "pg-backup": pg("backup.html", "Backup and restore", "pg_dump, file-system backups and archiving."),
 "pg-pitr": pg("continuous-archiving.html", "Continuous archiving and PITR", "Restoring to a point in time."),
 "pg-alter-table": pg("sql-altertable.html", "ALTER TABLE", "Lock levels, NOT VALID and VALIDATE CONSTRAINT."),
 "pg-toast": pg("storage-toast.html", "TOAST", "How large values are stored out of line."),
 "pg-page": pg("storage-page-layout.html", "Database page layout", "8 KB pages and tuple layout."),
 "pg-hot-standby": pg("hot-standby.html", "Hot standby", "Queries on replicas and replay conflicts."),
 "pg-partitioning": pg("ddl-partitioning.html", "Table partitioning", "Range, list and hash partitions and pruning."),
 "pg-rls": pg("ddl-rowsecurity.html", "Row security policies", "Row-level security per role or tenant."),
 "pg-brin": pg("brin.html", "BRIN indexes", "Block range indexes for naturally ordered data."),
 "pg-logical-decoding": pg("logicaldecoding.html", "Logical decoding", "Streaming row changes out of the WAL."),
 "pg-create-matview": pg("sql-creatematerializedview.html", "CREATE MATERIALIZED VIEW", "Defining a materialized view."),
 "pg-refresh": pg("sql-refreshmaterializedview.html", "REFRESH MATERIALIZED VIEW", "Refreshing, CONCURRENTLY with a unique index."),
 "pg-plpgsql": pg("plpgsql.html", "PL/pgSQL", "The procedural language for functions and procedures."),
 "pg-triggers": pg("triggers.html", "Triggers", "Row and statement triggers."),
 "pg-generated": pg("ddl-generated-columns.html", "Generated columns", "Stored columns computed from other columns."),
 "pg-srf": pg("functions-srf.html", "Set returning functions", "generate_series and friends."),
 "pg-aggregates": pg("functions-aggregate.html", "Aggregate functions", "Including ordered-set aggregates such as percentile_cont."),
 "pg-tablefunc": pg("tablefunc.html", "tablefunc (crosstab)", "Pivoting rows into columns."),
 "pg-range-funcs": pg("functions-range.html", "Range functions and operators", "&&, @>, and range arithmetic."),
 "pg12": ("article", "PostgreSQL 12 release notes", "https://www.postgresql.org/docs/12/release-12.html", PGD, "Includes CTE inlining.", False),
 # PostgreSQL wiki
 "dont-do-this": ("article", "Don't Do This", "https://wiki.postgresql.org/wiki/Don%27t_Do_This", "PostgreSQL wiki", "Common mistakes: NOT IN, money, timestamp, varchar(n).", False),
 "slow-query": ("article", "Slow Query Questions", "https://wiki.postgresql.org/wiki/Slow_Query_Questions", "PostgreSQL wiki", "What to gather when a query is slow.", False),
 "slow-counting": ("article", "Slow Counting", "https://wiki.postgresql.org/wiki/Slow_Counting", "PostgreSQL wiki", "Why count(*) scans and what to do instead.", False),
 "conn-count": ("article", "Number Of Database Connections", "https://wiki.postgresql.org/wiki/Number_Of_Database_Connections", "PostgreSQL wiki", "Sizing connection pools.", False),
 "dedupe-wiki": ("article", "Deleting duplicates", "https://wiki.postgresql.org/wiki/Deleting_duplicates", "PostgreSQL wiki", "Removing duplicate rows.", True),
 # Markus Winand
 "utl-anatomy": ("article", "Use The Index, Luke: Anatomy of an index", "https://use-the-index-luke.com/sql/anatomy", WINAND, "B-tree structure and leaf node chains.", False),
 "utl-concat": ("article", "Use The Index, Luke: Concatenated indexes", "https://use-the-index-luke.com/sql/where-clause/the-equals-operator/concatenated-keys", WINAND, "Column order in multicolumn indexes.", False),
 "utl-ios": ("article", "Use The Index, Luke: Index-only scan", "https://use-the-index-luke.com/sql/clustering/index-only-scan-covering-index", WINAND, "Covering indexes.", False),
 "utl-partial": ("article", "Use The Index, Luke: Partial indexes", "https://use-the-index-luke.com/sql/where-clause/partial-and-filtered-indexes", WINAND, "Indexing only the rows you query.", False),
 "utl-functions": ("article", "Use The Index, Luke: Functions in the WHERE clause", "https://use-the-index-luke.com/sql/where-clause/functions", WINAND, "Why wrapping a column hides the index.", False),
 "utl-where": ("article", "Use The Index, Luke: The WHERE clause", "https://use-the-index-luke.com/sql/where-clause", WINAND, "How predicates use indexes.", False),
 "utl-plans": ("article", "Use The Index, Luke: PostgreSQL execution plan operations", "https://use-the-index-luke.com/sql/explain-plan/postgresql/operations", WINAND, "What each plan node means.", False),
 "no-offset": ("article", "We need tool support for keyset pagination", "https://use-the-index-luke.com/no-offset", WINAND, "Why OFFSET is slow and how seek pagination works.", False),
 "modern-sql": ("link", "Modern SQL", "https://modern-sql.com/", WINAND, "Standard SQL features and their support.", False),
 "ms-3vl": ("article", "Modern SQL: Three-valued logic", "https://modern-sql.com/concept/three-valued-logic", WINAND, "True, false and unknown.", False),
 "ms-filter": ("article", "Modern SQL: FILTER", "https://modern-sql.com/feature/filter", WINAND, "Conditional aggregation.", False),
 "ms-over": ("article", "Modern SQL: OVER and window functions", "https://modern-sql.com/feature/over", WINAND, "Window functions explained.", False),
 "ms-lateral": ("article", "Modern SQL: LATERAL", "https://modern-sql.com/feature/lateral", WINAND, "Subqueries that reference earlier FROM items.", True),
 # practice and tools
 "sqlbolt": ("link", "SQLBolt", "https://sqlbolt.com/", "SQLBolt", "Interactive SQL lessons.", False),
 "mode-having": ("article", "Mode SQL tutorial: HAVING", "https://mode.com/sql-tutorial/sql-having", "Mode", "Filtering aggregated results.", False),
 "pgex": ("link", "PG Exercises", "https://pgexercises.com/", "Alisdair Owens", "PostgreSQL practice: joins, aggregates, windows, recursion.", False),
 "leetcode-db": ("link", "LeetCode database problems", "https://leetcode.com/problemset/database/", "LeetCode", "SQL interview exercises.", False),
 "sqlzoo": ("link", "SQLZoo", "https://www.sqlzoo.net/", "SQLZoo", "Interactive SQL tutorials and exercises.", False),
 "dalibo": ("link", "explain.dalibo.com", "https://explain.dalibo.com/", "Dalibo", "Visualizes PostgreSQL plans.", False),
 "hermitage": ("link", "Hermitage", "https://github.com/ept/hermitage", "Martin Kleppmann", "Isolation level tests across databases.", False),
 "jepsen": ("article", "Jepsen: Consistency models", "https://jepsen.io/consistency", "Jepsen", "A map of consistency models.", False),
 "strong-migrations": ("link", "strong_migrations", "https://github.com/ankane/strong_migrations", "Andrew Kane", "Catalog of unsafe migrations and safe alternatives.", False),
 "pgbouncer": ("article", "PgBouncer features", "https://www.pgbouncer.org/features.html", "PgBouncer", "Pool modes and what each supports.", False),
 "pg-repack": ("link", "pg_repack", "https://github.com/reorg/pg_repack", "reorg", "Online table and index rewrite to remove bloat.", False),
 "patroni": ("link", "Patroni", "https://patroni.readthedocs.io/", "Zalando", "High-availability orchestration for PostgreSQL.", False),
 "pgbackrest": ("link", "pgBackRest", "https://pgbackrest.org/", "pgBackRest", "Backup and restore with WAL archiving.", False),
 "postgres-exporter": ("link", "postgres_exporter", "https://github.com/prometheus-community/postgres_exporter", "Prometheus community", "PostgreSQL metrics for Prometheus and Grafana.", False),
 "pg-partman": ("link", "pg_partman", "https://github.com/pgpartman/pg_partman", "pg_partman", "Automated partition management.", False),
 "citus": ("link", "Citus documentation", "https://docs.citusdata.com/", "Citus Data", "Distributed PostgreSQL and multitenancy.", False),
 "timescale": ("link", "TimescaleDB documentation", "https://docs.timescale.com/", "Timescale", "Time-series on PostgreSQL.", True),
 "debezium": ("link", "Debezium", "https://debezium.io/", "Debezium", "Change data capture from the database log.", False),
 "outbox": ("article", "Pattern: Transactional outbox", "https://microservices.io/patterns/data/transactional-outbox.html", "Chris Richardson", "Publishing events reliably with the business change.", False),
 "postgis-docs": ("link", "PostGIS documentation", "https://postgis.net/docs/", "PostGIS", "Spatial types, functions and indexes.", False),
 "postgis-intro": ("article", "Introduction to PostGIS", "https://postgis.net/workshops/postgis-intro/", "PostGIS", "Hands-on spatial SQL workshop.", False),
 "ef-related": ("article", "EF Core: Loading related data", "https://learn.microsoft.com/en-us/ef/core/querying/related-data/", "Microsoft Learn", "Eager, explicit and lazy loading.", False),
 "ef-concurrency": ("article", "EF Core: Handling concurrency conflicts", "https://learn.microsoft.com/en-us/ef/core/saving/concurrency", "Microsoft Learn", "Concurrency tokens and optimistic locking.", False),
 "rogov": ("book", "PostgreSQL 14 Internals", "https://edu.postgrespro.com/postgresql_internals-14_en.pdf", "Egor Rogov", "Free book on MVCC, vacuum, planning and statistics.", False),
 "interdb": ("book", "The Internals of PostgreSQL", "https://www.interdb.jp/pg/", "Hironobu Suzuki", "Free online book on PostgreSQL internals.", False),
 # added
 "normalization": ("article", "Database normalization", "https://en.wikipedia.org/wiki/Database_normalization", "Wikipedia", "Normal forms and update anomalies.", ADD),
 "cmu-445": ("video", "CMU 15-445/645 Intro to Database Systems", "https://15445.courses.cs.cmu.edu/", "Andy Pavlo", "Lectures on storage, indexes, joins and transactions.", ADD),
 "ddia": ("book", "Designing Data-Intensive Applications", "https://dataintensive.net/", "Martin Kleppmann", "Replication, partitioning, transactions and storage engines.", ADD),
}

E, MID, H = "easy", "medium", "hard"
SQL, PERF, ASYNC, ALG = "SQL & Databases", "Performance & Memory", "Async & Concurrency", "Algorithms & Data Structures"
PAT, ARCH, DIST, SEC = "Design Principles & Patterns", "Architecture & DDD", "Distributed Systems & Messaging", "Security"
RES, SYS, OPS, API = "Resilience & Scalability", "System Design", "Testing & Operations", "APIs & HTTP"


def ex(text, code=None, lang="sql"):
    return text if code is None else f"{text}\n\n```{lang}\n{code.strip(chr(10))}\n```"


Q = [
 # ---------------- A. SQL fundamentals ----------------
 ("What are DDL, DML, DQL, DCL and TCL in SQL?", [SQL], E,
  "Structure (CREATE/ALTER), data changes (INSERT/UPDATE), queries (SELECT), access (GRANT), transactions (COMMIT).",
  ["Five storage engines: DDL for disk, DML for memory, DQL for queues, DCL for caches, TCL for temp tables.",
   "Isolation levels, ordered from weakest (DDL) to strongest (TCL).",
   "Index types that PostgreSQL chooses between automatically."],
  ex("DDL defines structure (`CREATE`, `ALTER`, `DROP`). DML changes data (`INSERT`, `UPDATE`, `DELETE`, `MERGE`). DQL queries (`SELECT`). DCL controls access (`GRANT`, `REVOKE`). TCL controls transactions (`BEGIN`, `COMMIT`, `ROLLBACK`, `SAVEPOINT`). In PostgreSQL even DDL is transactional, so a failed migration can roll back completely; in MySQL most DDL commits implicitly."),
  ["pg-commands", "sqlbolt"]),
 ("What is the difference between WHERE and HAVING?", [SQL], E,
  "WHERE filters rows before grouping and can't use aggregates; HAVING filters groups after aggregation.",
  ["HAVING filters rows before grouping and WHERE filters groups afterwards, so aggregates belong in WHERE.",
   "They are synonyms; HAVING is just the older spelling.",
   "HAVING only works with ORDER BY."],
  ex("`WHERE` filters rows before grouping and cannot use aggregates. `HAVING` filters groups after aggregation. Put every condition that can go in `WHERE` there, because it shrinks the data before the expensive grouping.", '''
SELECT customer_id, count(*) AS n, sum(total_cents) AS spent
FROM orders
WHERE status = 'paid'             -- rows first
GROUP BY customer_id
HAVING sum(total_cents) > 100000; -- groups after
'''), ["pg-select", "mode-having"]),
 ("In what order does a SELECT logically execute, and why can't WHERE use a column alias?", [SQL], E,
  "FROM/JOIN, WHERE, GROUP BY, HAVING, windows, SELECT, DISTINCT, ORDER BY, LIMIT: aliases exist only after SELECT.",
  ["SELECT runs first so its aliases exist everywhere; WHERE just can't use them for historical reasons.",
   "Top to bottom exactly as written, starting with SELECT.",
   "ORDER BY runs first so rows can be filtered in sorted order."],
  ex("`FROM` and `JOIN`, then `WHERE`, `GROUP BY`, `HAVING`, window functions, `SELECT` (expressions and aliases), `DISTINCT`, `ORDER BY`, `LIMIT/OFFSET`. That is why an alias works in `ORDER BY` but not in `WHERE`, and why window functions cannot appear in `WHERE` (wrap them in a subquery or CTE). The optimizer may physically reorder work as long as the result is the same."),
  ["pg-queries", "modern-sql"]),
 ("How does NULL behave in SQL comparisons and aggregates?", [SQL], E,
  "NULL = NULL is unknown, WHERE keeps only true; use IS NULL or IS NOT DISTINCT FROM; aggregates skip NULLs.",
  ["NULL = NULL is true, like in most programming languages, and count(col) counts NULLs too.",
   "NULL is stored as 0 or an empty string depending on the column type.",
   "Comparing with NULL raises an error."],
  ex("`NULL` means unknown, so `NULL = NULL` is `NULL`. Conditions are true, false or unknown, and `WHERE` keeps only true. Use `IS NULL` / `IS NOT NULL`, and `IS NOT DISTINCT FROM` for null-safe equality. Aggregates ignore NULLs (`count(col)` counts non-null; `count(*)` counts rows). `NULL` sorts last ascending in PostgreSQL by default.", '''
SELECT NULL = NULL;                    -- NULL
SELECT NULL IS NOT DISTINCT FROM NULL; -- true
SELECT count(*), count(country) FROM customers; -- differ if country has NULLs
'''), ["pg-comparison", "ms-3vl"]),
 ("In a LEFT JOIN, what happens if you filter on the right table in WHERE instead of ON?", [SQL], E,
  "The NULL rows for unmatched left rows fail the filter, so it silently becomes an inner join; put it in ON.",
  ["Nothing changes: the optimizer moves WHERE conditions into ON for outer joins, so both give the same rows.",
   "It becomes a FULL OUTER JOIN.",
   "PostgreSQL rejects the query."],
  ex("`INNER` keeps matching rows, `LEFT` keeps all left rows with NULLs where no match, `RIGHT` mirrors it, `FULL` keeps both sides, `CROSS` is the Cartesian product. A condition on the right table in `WHERE` removes the NULL rows and turns a `LEFT JOIN` into an inner join; put it in `ON` to keep unmatched left rows.", '''
-- all customers, with only their paid orders
SELECT c.id, o.id
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'paid';
'''), ["pg-table-expr", "pgex"]),
 ("What does PostgreSQL's DISTINCT ON do?", [SQL], E,
  "Keeps the first row for each distinct value of the given expression, according to ORDER BY.",
  ["Removes duplicate columns rather than duplicate rows, keeping the first column with each name in the select list.",
   "Same as DISTINCT but faster because it skips sorting.",
   "Creates a unique index on the column for the query."],
  ex("`DISTINCT` removes duplicate result rows. `GROUP BY` collapses rows into groups for aggregation; every non-aggregated column must be in `GROUP BY` (unless functionally dependent on the primary key). `DISTINCT ON (x)` is PostgreSQL-specific: the first row per `x` according to `ORDER BY`.", '''
SELECT DISTINCT ON (customer_id) customer_id, id, created_at
FROM orders
ORDER BY customer_id, created_at DESC;  -- latest order per customer
'''), ["pg-select", "dont-do-this"]),
 ("What is the difference between UNION and UNION ALL?", [SQL], E,
  "UNION removes duplicates (extra sort or hash); UNION ALL just appends and is faster.",
  ["UNION ALL removes duplicates and UNION keeps them; the ALL means all rows are checked against each other.",
   "UNION ALL also includes rows that failed the WHERE clause.",
   "UNION works only on tables with the same name."],
  ex("`UNION` appends and removes duplicates; `UNION ALL` just appends and is faster, so use it unless you need dedupe. `INTERSECT` keeps rows in both; `EXCEPT` keeps rows in the first but not the second. Column counts and compatible types must match.", '''
SELECT id FROM customers
EXCEPT
SELECT customer_id FROM orders;   -- customers without orders
'''), ["pg-union"]),
 ("Why do you often prefer EXISTS over a join when checking that related rows exist?", [SQL], MID,
  "EXISTS is a semi-join: it stops at the first match and never duplicates the outer row.",
  ["A join is always rewritten as a nested loop over every row, while EXISTS is answered from the index alone.",
   "EXISTS caches its result across queries.",
   "Joins cannot use indexes on the right-hand table."],
  ex("`EXISTS` is a semi-join: it stops at the first match and never duplicates the outer row. A join can multiply rows when the right side has several matches, so you may need `DISTINCT`. `IN (subquery)` is equivalent for non-null data and usually gets the same plan; prefer `EXISTS` for readability and NULL-safety.", '''
SELECT c.* FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id AND o.status = 'paid');
'''), ["pg-subquery"]),
 ("How do you compute several conditional counts and sums in one pass over a table?", [SQL], E,
  "Conditional aggregation: count(*) FILTER (WHERE …) or sum(CASE WHEN … THEN x ELSE 0 END).",
  ["Run one query per condition and UNION ALL them, since an aggregate can only have one condition per scan.",
   "Use GROUP BY on every condition column.",
   "Use a window function with PARTITION BY each condition."],
  ex("`CASE` is SQL's if/else and works in `SELECT`, `WHERE`, `ORDER BY` and inside aggregates. Conditional aggregation computes several metrics in one pass; PostgreSQL's `FILTER` clause is the cleaner form.", '''
SELECT
  count(*)                                AS total,
  count(*) FILTER (WHERE status = 'paid') AS paid,
  sum(CASE WHEN status = 'refunded' THEN total_cents ELSE 0 END) AS refunded_cents
FROM orders;
'''), ["pg-conditional", "pg-expressions", "ms-filter"]),
 ("What is the difference between DELETE, TRUNCATE and DROP TABLE in PostgreSQL?", [SQL], E,
  "DELETE removes chosen rows with triggers and leaves dead tuples; TRUNCATE empties fast under a lock; DROP removes the table.",
  ["TRUNCATE can't be rolled back in PostgreSQL and DROP keeps the table definition, unlike DELETE which removes it.",
   "DELETE without WHERE drops the table definition.",
   "They are identical except for speed."],
  ex("`DELETE` removes selected rows, fires row triggers, can use `WHERE`, and leaves dead tuples for vacuum. `TRUNCATE` empties the table by dropping its data files, takes an `ACCESS EXCLUSIVE` lock, ignores row triggers, and is transactional in PostgreSQL. `DROP TABLE` removes the table and its definition. `TRUNCATE ... CASCADE` truncates referencing tables too."),
  ["pg-truncate", "pg-delete"]),

 # ---------------- B. Joins, windows, CTEs ----------------
 ("How do you list each employee with their manager's name from one employees table?", [SQL], E,
  "A self join: join employees to itself with aliases on m.id = e.manager_id, LEFT JOIN to keep the top boss.",
  ["You can't join a table to itself, so copy the managers into a temporary table first and join to that copy.",
   "Use GROUP BY manager_id.",
   "Use UNION between employees and employees."],
  ex("Join the table to itself with aliases. For one level a self join is enough; use a recursive CTE for unlimited depth.", '''
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON m.id = e.manager_id;
'''), ["pgex", "pg-table-expr"]),
 ("Why is NOT IN (subquery) dangerous, and what do you use instead?", [SQL], MID,
  "One NULL in the subquery makes every comparison unknown and the query returns nothing; use NOT EXISTS.",
  ["NOT IN can't use indexes at all, so it is only slow; the results are always the same as NOT EXISTS.",
   "NOT IN is limited to 1000 values.",
   "NOT IN locks the subquery's table."],
  ex("If the subquery returns even one `NULL`, `x NOT IN (...)` is unknown for every row and returns nothing. Use `NOT EXISTS` (null-safe, efficient anti-join) or `LEFT JOIN ... WHERE right.id IS NULL`.", '''
SELECT c.id FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);

SELECT 1 WHERE 1 NOT IN (2, NULL);  -- returns no rows
'''), ["dont-do-this", "pg-subquery"]),
 ("How does a window function differ from GROUP BY?", [SQL], E,
  "It computes over related rows without collapsing them, so every input row stays in the output.",
  ["It collapses each partition into one row like GROUP BY but lets you also select non-aggregated columns.",
   "It only works on date columns.",
   "It runs in a separate transaction."],
  ex("A window function computes a value across a set of related rows (the window) without collapsing them. `GROUP BY` returns one row per group. Syntax: `function() OVER (PARTITION BY ... ORDER BY ... frame)`.", '''
SELECT id, customer_id, total_cents,
       avg(total_cents) OVER (PARTITION BY customer_id) AS customer_avg
FROM orders;
'''), ["pg-window-tutorial", "pgex"]),
 ("With ties, how do ROW_NUMBER, RANK and DENSE_RANK differ?", [SQL], E,
  "ROW_NUMBER is unique (1,2,3), RANK repeats and skips (1,1,3), DENSE_RANK repeats without gaps (1,1,2).",
  ["RANK numbers rows uniquely, ROW_NUMBER repeats ties with gaps, and DENSE_RANK skips every second number.",
   "They are aliases kept for compatibility.",
   "DENSE_RANK only works with numeric columns."],
  ex("`ROW_NUMBER` gives unique numbers (arbitrary among ties), `RANK` gives ties the same rank and skips (1, 1, 3), `DENSE_RANK` gives ties the same rank without gaps (1, 1, 2). Use `DENSE_RANK` for \"nth highest\" questions.", '''
SELECT name, salary,
  row_number() OVER w, rank() OVER w, dense_rank() OVER w
FROM employees
WINDOW w AS (ORDER BY salary DESC);
'''), ["pg-window-funcs", "ms-over"]),
 ("Why can sum(x) OVER (ORDER BY created_at) give tied rows the same running total?", [SQL], MID,
  "The default frame is RANGE … CURRENT ROW, which includes peers; use ROWS for a strict row-by-row total.",
  ["Window sums are computed once per partition and copied to every row, so ties are just a display rounding.",
   "Because sum ignores duplicates in windows.",
   "Because ORDER BY in a window sorts descending by default."],
  ex("With `ORDER BY` the default frame is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`, which treats ties as peers (same total). Use `ROWS` for a strict running total or a moving window, and add a unique tiebreaker.", '''
SELECT created_at, total_cents,
  sum(total_cents) OVER (ORDER BY created_at, id
                         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running,
  avg(total_cents) OVER (ORDER BY created_at, id ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS moving_avg_7
FROM orders;
'''), ["pg-expressions"]),
 ("What do LAG and LEAD do?", [SQL], E,
  "Read a value from the previous or next row in the window, without a self join.",
  ["Lock the previous or next row for update so concurrent writers wait for the current transaction.",
   "Measure replication lag between primary and replica.",
   "Shift a timestamp column by one time zone."],
  ex("They read a value from the previous or next row in the window. Uses: difference from the previous period, time between events, detecting changes.", '''
SELECT id, created_at,
       created_at - lag(created_at) OVER (PARTITION BY customer_id ORDER BY created_at) AS since_prev_order
FROM orders;
'''), ["pg-window-funcs"]),
 ("How do you get the latest 3 orders per customer?", [SQL, PERF], MID,
  "row_number() OVER (PARTITION BY customer ORDER BY created_at DESC) filtered to ≤ 3, or LATERAL … LIMIT 3.",
  ["GROUP BY customer_id with LIMIT 3, which PostgreSQL applies to each group separately.",
   "ORDER BY created_at DESC LIMIT 3 on the whole table.",
   "Use HAVING count(*) <= 3."],
  ex("A window with `row_number()` filtered in an outer query; `DISTINCT ON` for N = 1; or `LATERAL` with `LIMIT`, fastest when there is an index on (group, order).", '''
SELECT * FROM (
  SELECT o.*, row_number() OVER (PARTITION BY customer_id ORDER BY created_at DESC) rn
  FROM orders o) t
WHERE rn <= 3;

SELECT c.id, x.*
FROM customers c
CROSS JOIN LATERAL (SELECT * FROM orders o WHERE o.customer_id = c.id
                    ORDER BY o.created_at DESC LIMIT 3) x;
'''), ["pg-table-expr", "pgex"]),
 ("Are CTEs optimization fences in PostgreSQL?", [SQL, PERF], MID,
  "Not since 12: a side-effect-free CTE used once is inlined; MATERIALIZED / NOT MATERIALIZED force it.",
  ["Yes, always: every CTE is computed once into a temporary table, which is why subqueries are faster.",
   "Only recursive CTEs are inlined.",
   "CTEs are cached across queries in the same session."],
  ex("`WITH name AS (query)` names a subquery. Before PostgreSQL 12 every CTE was materialized (a fence). From 12, a non-recursive, side-effect-free CTE used once is inlined; `MATERIALIZED` or `NOT MATERIALIZED` forces the behavior.", '''
WITH paid AS NOT MATERIALIZED (
  SELECT * FROM orders WHERE status = 'paid'
)
SELECT customer_id, sum(total_cents) FROM paid GROUP BY customer_id;
'''), ["pg-with", "pg12"]),
 ("How does a recursive CTE walk an org chart?", [SQL, ALG], MID,
  "An anchor (the root rows) UNION ALL a step joining the CTE to the table, repeated until no new rows; guard cycles.",
  ["The CTE calls itself once per row in a nested loop until a stack limit is reached, so depth is capped at 32.",
   "It sorts the table by manager_id and reads it in one pass.",
   "It needs a PL/pgSQL loop around it."],
  ex("An anchor query `UNION ALL` a recursive part that refers to the CTE. The engine repeats the recursive step on the newest rows until none are produced. Guard against cycles with a path array or depth limit.", '''
WITH RECURSIVE org AS (
  SELECT id, name, manager_id, 0 AS depth, ARRAY[id] AS path
  FROM employees WHERE manager_id IS NULL
  UNION ALL
  SELECT e.id, e.name, e.manager_id, o.depth + 1, o.path || e.id
  FROM employees e JOIN org o ON e.manager_id = o.id
  WHERE NOT e.id = ANY(o.path)       -- cycle guard
)
SELECT * FROM org ORDER BY path;
'''), ["pg-with", "pgex"]),
 ("What does LATERAL allow in a FROM clause?", [SQL], MID,
  "A subquery that references columns of earlier FROM items, so it runs per outer row (top-N, unnest, jsonb arrays).",
  ["Joining tables from different databases on the same server without a foreign data wrapper.",
   "Running a subquery in parallel workers.",
   "Joining without an ON condition."],
  ex("A `LATERAL` subquery may reference columns of tables listed before it, so it runs once per outer row. Uses: top-N per group, set-returning functions per row (`unnest`, `jsonb_array_elements`), computing a value once and reusing it.", '''
SELECT o.id, i.*
FROM orders o
CROSS JOIN LATERAL jsonb_array_elements('[{"sku":"a"},{"sku":"b"}]'::jsonb) AS i;
'''), ["pg-table-expr", "ms-lateral"]),

 # ---------------- C. Data modeling ----------------
 ("Storing customer_name inside orders violates which normal form, and why?", [SQL, ARCH], MID,
  "3NF: customer_name depends on customer_id, a non-key column, not on the order key (a transitive dependency).",
  ["1NF, because a name is not an atomic value and must be split into first and last name columns.",
   "BCNF only; it is fine in 3NF.",
   "None; names never cause anomalies."],
  ex("1NF: atomic values, no repeating groups. 2NF: no column depends on part of a composite key. 3NF: no column depends on another non-key column. \"The key, the whole key, and nothing but the key.\" BCNF: every determinant is a candidate key. `customer_name` in `orders` depends on `customer_id`, so it violates 3NF."),
  ["normalization", "cmu-445"]),
 ("When is denormalizing a schema justified, and what does it cost?", [SQL, PERF], MID,
  "When reads dominate and indexes aren't enough, or for snapshots; it costs drift, update anomalies and write work.",
  ["Whenever a query has more than two joins, because joins are always slower than reading duplicated columns.",
   "Never; denormalized schemas can't be indexed.",
   "Only for tables under 1000 rows."],
  ex("Denormalize when reads dominate and joins or aggregates are too slow even with indexes, or when you need a historical snapshot. Costs: duplicated data that can drift, update anomalies, more write work. Safer forms: materialized views, summary tables, and snapshot columns that are meant to be copies (price on `order_items`). Measure first."),
  ["pg-matviews", "ddia"]),
 ("Why can random UUIDv4 primary keys hurt insert performance compared with bigint identity or UUIDv7?", [SQL, PERF], MID,
  "Random values scatter inserts across the B-tree (page splits, cache misses); sequential keys append at the end.",
  ["UUIDs are compared as strings, character by character, so every insert compares 36 bytes per index level.",
   "UUID columns can't be indexed with B-trees.",
   "UUIDv4 requires a network call to generate."],
  ex("Prefer a surrogate primary key plus `UNIQUE` on the natural key. `bigint GENERATED ALWAYS AS IDENTITY` is compact and index-friendly. Random UUIDv4 scatters inserts across the index; time-ordered UUIDv7 keeps inserts append-like (native `uuidv7()` in PostgreSQL 18). Use UUIDs when ids come from clients or many services, or must not leak counts.", '''
CREATE TABLE customers (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text NOT NULL UNIQUE
);
'''), ["pg-identity", "pg-uuid"]),
 ("Does PostgreSQL index a foreign key column automatically?", [SQL, PERF], E,
  "No: only the referenced key is indexed; index the referencing column or joins and parent deletes scan the child.",
  ["Yes, every REFERENCES clause creates an index on both sides, so adding one manually duplicates it.",
   "Only when ON DELETE CASCADE is used.",
   "Only for bigint columns."],
  ex("A foreign key guarantees the referenced row exists. Actions: `NO ACTION`/`RESTRICT`, `CASCADE`, `SET NULL`, `SET DEFAULT`. PostgreSQL does not index the referencing column; add an index on every foreign key you join or delete by.", '''
CREATE TABLE orders (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id bigint NOT NULL REFERENCES customers(id) ON DELETE RESTRICT
);
CREATE INDEX ON orders (customer_id);
'''), ["pg-constraints"]),
 ("Why enforce business rules with database constraints and not only in application code?", [SQL, PAT], E,
  "The database sees every writer (APIs, scripts, migrations, people), so it is the only place invariants always hold.",
  ["Constraints are faster than application checks, so the application validation can be removed entirely.",
   "ORMs can't run validation code.",
   "Constraints are needed for backups to work."],
  ex("`NOT NULL`, `UNIQUE`, `PRIMARY KEY`, `FOREIGN KEY`, `CHECK`, and `EXCLUDE`. The database sees every writer, so invariants belong there as well as in application code. Constraints also help the planner and document the model.", '''
ALTER TABLE orders
  ADD CONSTRAINT chk_total CHECK (total_cents >= 0),
  ADD CONSTRAINT chk_status CHECK (status IN ('new','paid','refunded','cancelled'));
'''), ["pg-constraints"]),
 ("How do you model a many-to-many relationship between products and tags?", [SQL], E,
  "A junction table with foreign keys to both, a composite primary key, and an index on the second column.",
  ["A tags text column on products holding a comma-separated list, split in the application when reading.",
   "A product_id array column on tags with no constraints.",
   "Two foreign keys pointing at each other."],
  ex("A junction table with foreign keys to both sides and a composite primary key, plus attributes of the relationship. One-to-one: the child's primary key is also a foreign key to the parent. Index the second column of the composite key for lookups from the other side.", '''
CREATE TABLE product_tags (
  product_id bigint REFERENCES products(id) ON DELETE CASCADE,
  tag_id     bigint REFERENCES tags(id)     ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);
CREATE INDEX ON product_tags (tag_id, product_id);
'''), ["pg-constraints"]),
 ("With soft deletes (deleted_at), how do you keep email unique among active users?", [SQL], MID,
  "A partial unique index: UNIQUE (email) WHERE deleted_at IS NULL.",
  ["A normal UNIQUE constraint on email, because deleted rows are skipped by unique checks automatically.",
   "A CHECK constraint comparing email with other rows.",
   "A trigger that renames deleted emails is the only way."],
  ex("Soft delete adds `deleted_at`; every query must filter it (a view or RLS) and unique constraints must become partial indexes. Audit history: an append-only table fed by triggers or events. Temporal data: `tstzrange` with an exclusion constraint. Decide retention and erasure up front.", '''
CREATE UNIQUE INDEX uq_user_email_active ON users (email) WHERE deleted_at IS NULL;
'''), ["pg-partial", "pg-ranges"]),
 ("Which PostgreSQL types should you use for money and for points in time?", [SQL], E,
  "numeric or integer cents plus a currency for money; timestamptz for time.",
  ["double precision for money because it is fastest, and timestamp without time zone so values never shift.",
   "The money type and text dates.",
   "varchar(20) for both, parsed in the application."],
  ex("Money: `numeric(12,2)` or integer minor units plus a currency code; never `float`. Time: `timestamptz`. Text: `text` (`varchar(n)` only adds a length check). Ids: `bigint` identity or `uuid`. Avoid the `money` type and numbers stored as text.", '''
SELECT 0.1::float8 + 0.2::float8 = 0.3::float8 AS float_ok,      -- false
       0.1::numeric + 0.2::numeric = 0.3::numeric AS numeric_ok; -- true
'''), ["dont-do-this", "pg-numeric", "pg-datetime"]),
 ("When should data go in a jsonb column instead of regular columns?", [SQL], MID,
  "For sparse, variable or external-shaped attributes; data you filter, join, constrain or report on gets columns.",
  ["Always: jsonb is indexed and typed automatically, so it is faster and safer than separate columns.",
   "Never; jsonb can't be indexed.",
   "Only for primary keys."],
  ex("Use columns for data you filter, join, constrain or report on. Use `jsonb` for sparse, variable or externally shaped attributes. Costs: no type or FK enforcement, weak planner statistics, rewriting the whole value on update. Index with GIN or an expression index; promote hot keys to columns.", '''
CREATE INDEX idx_events_payload ON events USING gin (payload jsonb_path_ops);
SELECT * FROM events WHERE payload @> '{"type":"signup"}';
'''), ["pg-json", "pg-json-funcs"]),
 ("What are the main ways to store a tree (hierarchy) in a relational database?", [SQL, ALG], MID,
  "Adjacency list (parent_id + recursive CTE), materialized path (ltree), closure table, nested sets.",
  ["Only adjacency lists work in SQL; every other model needs a graph database.",
   "One table per tree level.",
   "A JSON column with the whole tree, which is the only indexable option."],
  ex("Adjacency list (`parent_id`, simplest, query with recursive CTE), materialized path (`ltree`, fast subtree queries, harder moves), closure table (every ancestor/descendant pair, fast reads, more writes), nested sets (fast reads, expensive updates). Adjacency list plus recursive CTE is the default."),
  ["pg-ltree", "pg-with"]),

 # ---------------- D. Indexes ----------------
 ("Which queries can a B-tree index serve?", [SQL, PERF, ALG], E,
  "=, <, >, BETWEEN, IN, IS NULL, prefix LIKE 'abc%', and ORDER BY in index order.",
  ["Only equality; ranges and ORDER BY always need a sequential scan followed by a sort.",
   "Only LIKE '%abc%' substring searches.",
   "Only queries on primary keys."],
  ex("A balanced tree of sorted keys pointing to rows: lookups cost O(log n) page reads, and leaves are linked so range scans and `ORDER BY` read in order. It supports `=`, `<`, `>`, `BETWEEN`, `IN`, prefix `LIKE 'abc%'` (with the right collation or operator class), and `IS NULL`."),
  ["utl-anatomy", "pg-index-types", "cmu-445"]),
 ("An index on (customer_id, created_at): which queries can use it efficiently?", [SQL, PERF], MID,
  "customer_id = ?, and customer_id = ? with a created_at range or sort; not created_at alone.",
  ["Any query on either column, because PostgreSQL scans composite indexes column by column independently.",
   "Only queries filtering on both columns with equality.",
   "Only created_at queries, since the last column is the sort key."],
  ex("The index is sorted by the first column, then the second within it, so it serves leftmost prefixes. Put equality columns first, then the range or sort column.", '''
CREATE INDEX idx_orders_cust_created ON orders (customer_id, created_at DESC);
'''), ["utl-concat", "pg-multicol"]),
 ("What does INCLUDE add to a PostgreSQL index?", [SQL, PERF], MID,
  "Non-key payload columns, so the index covers the query for an index-only scan without widening the search key.",
  ["Extra key columns that are searched after the first ones, the same as listing them in the column list.",
   "Rows from another table, like a join index.",
   "A filter predicate, like a partial index."],
  ex("If an index contains every column the query needs, the engine answers from the index. In PostgreSQL that also needs a current visibility map (vacuumed). `INCLUDE` adds payload columns without widening the key.", '''
CREATE INDEX idx_orders_cust_inc ON orders (customer_id) INCLUDE (total_cents);
EXPLAIN SELECT customer_id, total_cents FROM orders WHERE customer_id = 7; -- Index Only Scan
'''), ["pg-ios", "utl-ios"]),
 ("When is a partial index the right tool?", [SQL, PERF], MID,
  "When queries target a small, well-defined subset (open jobs, active rows), or uniqueness among non-deleted rows.",
  ["When the table is too large for one index, so the index is split into parts across several disks.",
   "When the column has mostly unique values.",
   "When queries never use WHERE."],
  ex("An index on a subset of rows defined by `WHERE`: smaller, cheaper to maintain, ideal for skewed data. The query's condition must imply the index predicate for the planner to use it.", '''
CREATE INDEX idx_orders_open ON orders (created_at) WHERE status = 'new';
'''), ["pg-partial", "utl-partial"]),
 ("Why can't WHERE date(created_at) = '2026-10-01' use an index on created_at, and how do you fix it?", [SQL, PERF], MID,
  "Wrapping the column in a function hides it from the index; compare the raw column to a half-open range.",
  ["date() is volatile so PostgreSQL never caches it; mark it IMMUTABLE and the index on created_at will be used.",
   "Indexes on timestamptz only support equality.",
   "The literal must be cast to timestamp first."],
  ex("A sargable predicate lets the engine use an index. Functions on the column hide it. Rewrite to a range on the raw column, or create an expression index matching the expression exactly.", '''
SELECT * FROM orders WHERE created_at >= '2026-10-01' AND created_at < '2026-10-02';
CREATE INDEX idx_customers_lower_email ON customers (lower(email));
'''), ["pg-expr-index", "utl-functions"]),
 ("Which PostgreSQL index type fits jsonb containment, full-text or array searches?", [SQL, PERF], MID,
  "GIN, which indexes many values per row.",
  ["BRIN, because it summarizes each block of rows and works well for any value with many elements in it.",
   "Hash, because containment is an equality test.",
   "A plain B-tree on the whole value."],
  ex("B-tree (default, ordering and equality). Hash (equality only). GIN (many values per row: arrays, `jsonb`, full-text, trigrams). GiST (geometry, ranges, nearest neighbor, exclusion). SP-GiST (tries, quadtrees). BRIN (tiny, for huge naturally ordered tables)."),
  ["pg-index-types"]),
 ("The planner ignores your index. What are common reasons?", [SQL, PERF], MID,
  "Seq scan is cheaper for many rows, stale stats, function or type cast on the column, leading wildcard, wrong column order.",
  ["Indexes are only used after a server restart, or after REINDEX has been run once since the table was created.",
   "The index name is too long.",
   "The query uses lowercase keywords."],
  ex("Reasons: small table or low selectivity (seq scan is cheaper and the planner is right); stale statistics (`ANALYZE`); a function or cast on the column; a type mismatch; a leading wildcard; wrong composite order; `OR` across columns; collation or operator class mismatch. Check with `EXPLAIN`."),
  ["slow-query", "utl-where"]),
 ("What does every extra index cost, and how do you find unused ones?", [SQL, PERF, OPS], MID,
  "Write work, disk, cache and lost HOT updates; find idx_scan = 0 in pg_stat_user_indexes (not backing a constraint).",
  ["Nothing on writes, only disk; unused indexes are dropped automatically by autovacuum after 30 days.",
   "They slow down SELECTs only.",
   "Indexes cost only during CREATE INDEX."],
  ex("Every index adds work to each `INSERT`, indexed `UPDATE` and `DELETE`, uses disk and cache, and can block HOT updates.", '''
SELECT schemaname, relname, indexrelname, idx_scan, pg_size_pretty(pg_relation_size(indexrelid))
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
'''), ["pg-stats"]),
 ("How do you make ILIKE '%silva%' searches fast in PostgreSQL?", [SQL, PERF], MID,
  "pg_trgm with a GIN or GiST trigram index (or full-text search for word-based queries).",
  ["A B-tree index with text_pattern_ops, which supports wildcards at both ends of the pattern.",
   "A hash index on lower(name).",
   "It can't be indexed; cache the results instead."],
  ex("A B-tree cannot help with a leading wildcard. Use `pg_trgm` with GIN/GiST, full-text search for words, `text_pattern_ops` for prefix search, or a search engine for heavy needs.", '''
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_customers_name_trgm ON customers USING gin (name gin_trgm_ops);
SELECT * FROM customers WHERE name ILIKE '%silva%';
'''), ["pg-trgm", "pg-fts"]),
 ("How do you add an index to a busy production table without blocking writes?", [SQL, OPS], MID,
  "CREATE INDEX CONCURRENTLY outside a transaction; if it fails, drop the INVALID index and retry.",
  ["Run CREATE INDEX inside a transaction with SERIALIZABLE isolation so writers keep going.",
   "Create it on a replica; it is copied to the primary automatically.",
   "Disable autovacuum while it builds."],
  ex("`CREATE INDEX` blocks writes. `CONCURRENTLY` doesn't, takes longer, can't run in a transaction, and leaves an `INVALID` index on failure. Set `lock_timeout`, build in a quiet period, watch disk and I/O. `REINDEX CONCURRENTLY` rebuilds similarly.", '''
CREATE INDEX CONCURRENTLY idx_orders_created ON orders (created_at);
SELECT indexrelid::regclass FROM pg_index WHERE NOT indisvalid; -- failed builds
'''), ["pg-create-index", "strong-migrations"]),

 # ---------------- E. Query performance ----------------
 ("What do you look for in EXPLAIN (ANALYZE, BUFFERS) output?", [SQL, PERF], MID,
  "Estimated vs actual rows gaps, seq scans on big tables, sorts spilling to disk, huge loop counts, where time goes.",
  ["Only the total cost on the top line; actual times are unreliable and should be ignored.",
   "The order of tables in FROM.",
   "Whether the query uses uppercase keywords."],
  ex("`EXPLAIN` shows the plan with estimates. `EXPLAIN (ANALYZE, BUFFERS)` runs it and adds actual time, rows, loops and buffers. Read inside out. `ANALYZE` really executes writes, so wrap those in `BEGIN; ... ROLLBACK;`.", '''
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE customer_id = 7 ORDER BY created_at DESC LIMIT 10;
'''), ["pg-explain", "dalibo", "utl-plans"]),
 ("What is a bitmap heap scan good for?", [SQL, PERF], MID,
  "Medium selectivity: collect row locations from one or more indexes, sort by page, read each page once.",
  ["Scanning tables stored as bitmaps, which is how PostgreSQL stores boolean columns.",
   "Only for primary-key lookups returning one row.",
   "Reading the whole table in parallel."],
  ex("Sequential scan: read the whole table. Index scan: walk the index and fetch rows one by one. Index-only scan: answer from the index. Bitmap scan: collect locations from indexes, sort by page, read pages once; good for medium selectivity and for combining indexes with `AND`/`OR`."),
  ["pg-planner"]),
 ("When does the planner prefer a hash join over a nested loop?", [SQL, PERF, ALG], MID,
  "For large unsorted inputs with an equality join: hash the smaller side and probe it with the other.",
  ["Whenever an index exists on the inner table, because hashing reuses the index's internal hash values.",
   "Only for joins on text columns.",
   "Only when work_mem is set to zero."],
  ex("Nested loop: probe the inner side per outer row; great with an index and few outer rows. Hash join: build a hash table of the smaller input; good for large unsorted equality joins; spills if `work_mem` is too small. Merge join: sort both sides and merge; good when inputs are already sorted."),
  ["pg-planner", "cmu-445"]),
 ("Two columns like city and zip are correlated and the planner badly underestimates rows. What helps?", [SQL, PERF], H,
  "CREATE STATISTICS (dependencies) on the columns, then ANALYZE, so it stops treating them as independent.",
  ["A composite index on both columns, because the planner reads row estimates from index sizes.",
   "VACUUM FULL on the table.",
   "Setting random_page_cost to zero."],
  ex("The planner estimates rows from `pg_stats`. Stale or insufficient statistics produce bad plans. `ANALYZE` refreshes them; raise the statistics target for skewed columns; `CREATE STATISTICS` for correlated columns.", '''
ANALYZE orders;
CREATE STATISTICS st_city_zip (dependencies) ON city, zip FROM addresses;
'''), ["pg-planner-stats", "rogov"]),
 ("What is the N+1 query problem and how do you fix it?", [SQL, PERF], E,
  "One query for a list then one per item (often ORM lazy loading); fix with a join, eager loading or one batched query.",
  ["A query that returns one row too many because of an off-by-one LIMIT, fixed with LIMIT n-1.",
   "Opening one more connection than the pool allows.",
   "A join between N+1 tables."],
  ex("Loading a list (1 query) and then one query per item (N), usually via lazy loading. Fix with a join or eager loading (`Include` in EF Core), a batched query, or a data loader; confirm with query logs or `pg_stat_statements`.", '''
SELECT * FROM order_items WHERE order_id = ANY ($1::bigint[]);
'''), ["ef-related"]),
 ("Why is OFFSET pagination slow on deep pages, and what replaces it?", [SQL, PERF, API], MID,
  "OFFSET still reads and discards earlier rows; keyset pagination seeks after the last seen sort key via an index.",
  ["OFFSET sorts the whole table on every page; adding an index on the sort column makes deep pages free.",
   "OFFSET disables indexes; use LIMIT alone.",
   "It isn't slow; only the network is."],
  ex("`OFFSET n` reads and discards n rows, and results shift when rows are inserted. Keyset pagination remembers the last sort key and asks for rows after it, so every page costs the same. Use a unique tiebreaker and a row-value comparison.", '''
SELECT id, created_at FROM orders
WHERE (created_at, id) < ($1, $2)
ORDER BY created_at DESC, id DESC LIMIT 20;
'''), ["no-offset"]),
 ("How do you find which queries to optimize first in production PostgreSQL?", [SQL, PERF, OPS], MID,
  "Rank pg_stat_statements by total time (calls × mean), then EXPLAIN ANALYZE the top ones with real parameters.",
  ["Optimize the single slowest query in the log first, since total time is dominated by the worst outlier.",
   "Run VACUUM FULL on every table.",
   "Add an index to every column."],
  ex("Find (`pg_stat_statements`, `log_min_duration_statement`, `auto_explain`), reproduce with `EXPLAIN (ANALYZE, BUFFERS)`, diagnose, fix, verify. Rank by total time, not only the slowest single query.", '''
SELECT query, calls, round(total_exec_time) AS total_ms, round(mean_exec_time::numeric, 2) AS mean_ms
FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;
'''), ["pg-stat-statements", "pg-auto-explain"]),
 ("Why is count(*) slow on a large PostgreSQL table?", [SQL, PERF], MID,
  "MVCC: visibility depends on the transaction, so there is no stored exact count and it must scan.",
  ["PostgreSQL recounts every column of every row, so count(id) is much faster than count(*).",
   "count(*) takes an exclusive lock and waits for writers.",
   "Because count(*) ignores indexes by design."],
  ex("Each row's visibility depends on the transaction, so there's no single exact count. Options: an estimate (`pg_class.reltuples`), a trigger-maintained counter, caching, a smaller filter, or a UI without totals.", '''
SELECT reltuples::bigint AS estimate FROM pg_class WHERE relname = 'orders';
'''), ["slow-counting", "pg-ios"]),
 ("What is the fastest way to load millions of rows into PostgreSQL?", [SQL, PERF], MID,
  "COPY (or the driver's copy API), with indexes and foreign keys added after, then ANALYZE.",
  ["One INSERT per row with autocommit, so each row is durable and a failure loses only one row.",
   "Many parallel connections each inserting one row at a time.",
   "INSERT ... SELECT from a CSV file path."],
  ex("Use `COPY`, not row-by-row inserts. Otherwise batch many rows per statement in one transaction. For big loads: create indexes and FKs after, consider unlogged staging tables, then `ANALYZE`. For upserts, stage then `ON CONFLICT` or `MERGE`.", '''
COPY customers (name, country) FROM '/data/customers.csv' WITH (FORMAT csv, HEADER);
'''), ["pg-populate", "pg-copy"]),
 ("Why can a prepared statement suddenly get a bad plan for some parameter values?", [SQL, PERF], H,
  "After a few runs PostgreSQL may switch to a generic plan, which is wrong for skewed values; see plan_cache_mode.",
  ["Prepared statements are planned once at server start, before any statistics exist for the table.",
   "Parameters are always treated as text, so indexes are skipped.",
   "Prepared statements can't use indexes."],
  ex("A prepared statement is parsed once and run with parameters (and prevents SQL injection). PostgreSQL plans the first executions with real values (custom plans) and may switch to a generic plan; skewed data can make it bad. Behind a transaction-mode pooler, protocol-level prepared statements need pooler support.", '''
PREPARE by_cust (bigint) AS SELECT * FROM orders WHERE customer_id = $1;
EXECUTE by_cust(7);
'''), ["pg-prepare", "pg-query-config", "pgbouncer"]),

 # ---------------- F. Transactions and concurrency ----------------
 ("What does ACID stand for?", [SQL], E,
  "Atomicity, Consistency, Isolation, Durability.",
  ["Availability, Concurrency, Indexing, Distribution: the four properties a database cluster must provide.",
   "Atomicity, Caching, Isolation, Denormalization.",
   "Asynchronous, Consistent, Indexed, Durable."],
  ex("Atomicity: all or nothing. Consistency: valid state to valid state (constraints hold). Isolation: concurrent transactions don't see each other's partial work, to a degree set by the isolation level. Durability: committed data survives crashes (WAL flushed)."),
  ["pg-tx", "ddia"]),
 ("What is PostgreSQL's default isolation level, and what must you do under SERIALIZABLE?", [SQL, ASYNC], MID,
  "Read Committed; under Serializable, retry the whole transaction on serialization failures (SQLSTATE 40001).",
  ["Serializable is the default, and conflicts block until the other transaction commits, so no retries are needed.",
   "Read Uncommitted; nothing special.",
   "Repeatable Read; disable autocommit."],
  ex("Default is Read Committed: each statement sees data committed before it started. Repeatable Read is snapshot isolation. Serializable uses SSI and aborts dangerous patterns with a serialization failure the application must retry. Read Uncommitted behaves as Read Committed.", '''
BEGIN ISOLATION LEVEL SERIALIZABLE;
-- ...
COMMIT;  -- may fail with SQLSTATE 40001: retry the whole transaction
'''), ["pg-iso", "hermitage", "jepsen"]),
 ("Two on-call doctors each check that someone else is on call, then both go off duty. Which anomaly is this?", [SQL, ASYNC], H,
  "Write skew: each read overlapping data, then wrote different rows, together breaking the invariant.",
  ["A dirty read, because each transaction saw the other's uncommitted update to the on-call row.",
   "A lost update on a single row.",
   "A deadlock."],
  ex("Dirty read: uncommitted data. Non-repeatable read: a row changes between reads. Phantom: a query returns different rows. Lost update: read-then-write overwrites. Write skew: decisions on overlapping reads with writes to different rows. Fixes: `FOR UPDATE`, atomic updates, constraints, or Serializable."),
  ["pg-iso", "ddia"]),
 ("How does MVCC let readers and writers avoid blocking each other in PostgreSQL?", [SQL, ASYNC], MID,
  "Updates write new row versions stamped with xmin/xmax; each transaction reads versions visible to its snapshot.",
  ["Readers take shared locks that writers ignore, and writers overwrite rows in place after copying them to a log.",
   "Reads go to a replica while writes go to the primary.",
   "All queries run single-threaded in commit order."],
  ex("Updates create a new row version and mark the old one (`xmin` created it, `xmax` deleted it). Each transaction reads the versions visible to its snapshot. Old versions are dead tuples cleaned by `VACUUM`: the price of MVCC is bloat and vacuum work."),
  ["pg-mvcc", "interdb"]),
 ("How do several workers take jobs from a PostgreSQL table without picking the same job or blocking each other?", [SQL, ASYNC, DIST], MID,
  "SELECT … FOR UPDATE SKIP LOCKED LIMIT 1 inside the claiming UPDATE.",
  ["SELECT … FOR UPDATE NOWAIT and retry the same row in a loop until it succeeds.",
   "Use SERIALIZABLE and let them collide.",
   "Give each worker its own copy of the table."],
  ex("`FOR UPDATE` locks selected rows until the transaction ends. `NOWAIT` fails immediately. `SKIP LOCKED` skips locked rows, which makes a table a job queue.", '''
WITH next AS (
  SELECT id FROM jobs WHERE status = 'queued'
  ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED
)
UPDATE jobs SET status = 'running' FROM next WHERE jobs.id = next.id RETURNING jobs.*;
'''), ["pg-locking", "pg-select"]),
 ("How do you prevent deadlocks between transactions?", [SQL, ASYNC], MID,
  "Lock rows and tables in a consistent order, keep transactions short, and retry the one PostgreSQL aborts.",
  ["Raise deadlock_timeout so PostgreSQL waits long enough for the other transaction to finish first.",
   "Use more indexes.",
   "Run all transactions at Read Uncommitted."],
  ex("Two transactions each hold a lock the other needs; PostgreSQL detects it after `deadlock_timeout` and aborts one. Prevent: consistent lock order, short transactions, no user interaction inside, lock what you need up front, retry. `log_lock_waits` helps investigate."),
  ["pg-locking"]),
 ("How do you implement optimistic locking in SQL?", [SQL, ASYNC], MID,
  "A version column checked in the UPDATE's WHERE; zero rows affected means a conflict to reload or report (409).",
  ["SELECT … FOR UPDATE when the user opens the edit form, held until they press save.",
   "Use SERIALIZABLE and never check affected rows.",
   "An advisory lock per user."],
  ex("Read the version with the row; update conditionally on it. If zero rows are affected, someone else changed it. No locks are held across user think time; good for low contention.", '''
UPDATE products
SET stock = stock - 1, version = version + 1
WHERE id = $1 AND version = $2;   -- 0 rows updated = conflict
'''), ["ef-concurrency"]),
 ("How do you make a payment insert safe against retried requests in PostgreSQL?", [SQL, API, DIST], MID,
  "A unique idempotency key with INSERT … ON CONFLICT (key) DO NOTHING, which is atomic and race-free.",
  ["SELECT first to see whether the key exists, then INSERT if not; both run in Read Committed so it is atomic.",
   "Retry until the insert succeeds twice.",
   "Disable retries in the client."],
  ex("An upsert inserts or updates if the row exists. `ON CONFLICT` is atomic, unlike select-then-insert. With a unique idempotency key, retries and replayed messages are safe. `MERGE` (15+) handles more complex logic.", '''
INSERT INTO payments (idempotency_key, order_id, amount_cents)
VALUES ($1, $2, $3)
ON CONFLICT (idempotency_key) DO NOTHING
RETURNING id;   -- no row returned means it already existed
'''), ["pg-insert", "pg-merge"]),
 ("What are PostgreSQL advisory locks used for?", [SQL, ASYNC], MID,
  "App-defined locks keyed by a number, e.g. only one worker runs a job; use the transaction-level variant behind poolers.",
  ["Locks the planner suggests in EXPLAIN output, which you apply with a hint comment.",
   "Locks on rows that are only advisory, so writers can ignore them.",
   "Read-only locks on system catalogs."],
  ex("Application-defined locks not tied to rows. Session locks last until released; `pg_advisory_xact_lock` releases at commit. Use for single-runner jobs or serializing per business key. Prefer the transaction-level variant with transaction-mode poolers.", '''
SELECT pg_try_advisory_xact_lock(hashtext('nightly-report'));  -- true if acquired
'''), ["pg-locking"]),
 ("Why are sessions stuck \"idle in transaction\" harmful?", [SQL, OPS], MID,
  "They hold a snapshot (vacuum can't clean, bloat grows), may hold locks that block DDL, and use a connection.",
  ["They are harmless: idle sessions use no resources and PostgreSQL rolls them back after a minute.",
   "They make the WAL unreadable.",
   "They disable indexes on the tables they read."],
  ex("An open transaction holds its snapshot, blocking cleanup of newer dead rows, can hold locks blocking writers and DDL, and uses a connection. Defend with `idle_in_transaction_session_timeout`, `statement_timeout`, `lock_timeout`, short transactions, and monitoring.", '''
SELECT pid, state, now() - xact_start AS xact_age, query
FROM pg_stat_activity
WHERE state IN ('idle in transaction', 'active') ORDER BY xact_start LIMIT 10;
'''), ["pg-client-config", "pg-stats"]),

 # ---------------- G. Internals and operations ----------------
 ("What does VACUUM do in PostgreSQL?", [SQL, OPS], MID,
  "Makes dead tuples' space reusable, updates the visibility map, and freezes old transaction ids.",
  ["Returns all free space to the operating system and rewrites the table, which is why it locks it exclusively.",
   "Deletes rows older than a retention period.",
   "Rebuilds every index from scratch."],
  ex("`VACUUM` marks dead-row space reusable, updates the visibility map (enabling index-only scans), and freezes old xids. Autovacuum runs it and `ANALYZE` in the background. Tune busy tables per table. `VACUUM FULL` rewrites under an exclusive lock: avoid on live systems.", '''
ALTER TABLE orders SET (autovacuum_vacuum_scale_factor = 0.02, autovacuum_analyze_scale_factor = 0.02);
'''), ["pg-vacuum", "rogov"]),
 ("What causes table bloat and how do you remove it online?", [SQL, OPS], H,
  "Heavy updates/deletes, long transactions, lagging autovacuum, stale slots; fix the cause, then pg_repack or REINDEX CONCURRENTLY.",
  ["Large TOAST values; fix it by running VACUUM FULL during peak hours so it finishes fastest.",
   "Too many indexes; drop all of them.",
   "Bloat only affects replicas."],
  ex("Dead tuples and empty space vacuum can't reclaim or return. Causes: update/delete churn, long transactions holding snapshots, autovacuum behind, abandoned replication slots. Fixes: remove the cause, tune autovacuum, `REINDEX CONCURRENTLY`, `pg_repack`; lower `fillfactor` for HOT updates."),
  ["pg-repack", "pg-reindex"]),
 ("What is transaction ID wraparound, and how do you watch for it?", [SQL, OPS], H,
  "32-bit xids wrap after ~2 billion; vacuum must freeze old rows. Monitor age(datfrozenxid) per database.",
  ["Serial primary keys overflowing int4; switch them to bigint and the problem disappears.",
   "Timestamps rolling over in 2038.",
   "The WAL file counter resetting."],
  ex("Transaction ids are 32-bit and compared in a circle, so old rows would appear to be in the future. Vacuum freezes them; if it falls behind, PostgreSQL forces aggressive vacuums and in the worst case refuses writes.", '''
SELECT datname, age(datfrozenxid) FROM pg_database ORDER BY 2 DESC;
'''), ["pg-vacuum"]),
 ("What are the write-ahead log and checkpoints for?", [SQL, OPS], MID,
  "Changes are logged sequentially and flushed at commit for durability; checkpoints flush dirty pages so recovery replays less.",
  ["The WAL stores query history for auditing, and checkpoints are saved backups taken every five minutes.",
   "The WAL caches query results.",
   "Checkpoints mark where replicas must resync from scratch."],
  ex("Changes are appended to a log and flushed at commit; data pages are written later. After a crash the server replays the WAL. Checkpoints trade write smoothness against recovery time (`max_wal_size`, `checkpoint_timeout`). The WAL also feeds replication and PITR. `synchronous_commit = off` risks losing the last commits, not corruption."),
  ["pg-wal", "pg-wal-config"]),
 ("How does physical (streaming) replication differ from logical replication?", [SQL, DIST], H,
  "Physical copies WAL for the whole cluster to read-only standbys; logical publishes row changes per table across versions.",
  ["Physical replication sends SQL statements, logical replication copies the data files byte for byte.",
   "Logical replication is only for backups.",
   "They are two names for the same feature."],
  ex("Streaming replication copies WAL byte for byte: whole cluster, same major version, read-only replicas for HA and read scaling. Logical replication publishes row changes per table: different versions or schemas, CDC, zero-downtime upgrades. Abandoned slots can fill the disk. Sync waits for the standby; async doesn't."),
  ["pg-ha", "pg-logical-rep", "patroni"]),
 ("What do you need for point-in-time recovery in PostgreSQL?", [SQL, OPS], H,
  "A physical base backup plus continuous WAL archiving, replayed up to the chosen moment.",
  ["Daily pg_dump files; restore the latest one and the database returns to the exact moment you choose.",
   "A streaming replica, which keeps every past version of each row.",
   "VACUUM disabled so old rows remain."],
  ex("`pg_dump` is portable but slow to restore. Physical backups (`pg_basebackup`, pgBackRest, Barman) plus continuous WAL archiving allow PITR: restore the base backup and replay WAL to a moment, such as before an accidental `DELETE`. Define RPO and RTO and test restores regularly."),
  ["pg-backup", "pg-pitr", "pgbackrest"]),
 ("Why put PgBouncer in front of PostgreSQL, and what does transaction mode change?", [SQL, PERF, RES], H,
  "Each connection is a process, so pooling multiplexes clients; transaction mode frees the server connection after each transaction.",
  ["PgBouncer caches query results, and transaction mode makes every statement its own transaction.",
   "It encrypts traffic, which PostgreSQL can't.",
   "It replicates writes to standbys."],
  ex("PostgreSQL uses a process per connection; a pooler multiplexes many clients onto few server connections. Session mode holds a connection per session; transaction mode only during a transaction (session state like `SET`, session advisory locks and some prepared statements need care); statement mode is rare. Size the pool near the database's cores."),
  ["pgbouncer", "conn-count"]),
 ("Which PostgreSQL metrics do you monitor?", [SQL, OPS], MID,
  "Query time, sessions and waits, locks, cache hits, dead tuples and autovacuum, replication and slot lag, disk, xid age.",
  ["CPU only, because every PostgreSQL problem shows up first as high CPU usage on the host.",
   "Only the number of tables.",
   "Only the size of the last backup."],
  ex("Throughput and latency (`pg_stat_statements`), sessions and wait events, locks, cache hit ratio and I/O, dead tuples and last autovacuum, bloat, replication and slot lag, WAL growth, disk, connections, xid age, checkpoints. Alert on trends.", '''
SELECT relname, n_live_tup, n_dead_tup, last_autovacuum FROM pg_stat_user_tables ORDER BY n_dead_tup DESC LIMIT 10;
'''), ["pg-stats", "postgres-exporter"]),
 ("How do you add a NOT NULL rule to a big live table without a long lock?", [SQL, OPS], H,
  "Add CHECK (col IS NOT NULL) NOT VALID, backfill in batches, then VALIDATE CONSTRAINT under a weaker lock.",
  ["ALTER COLUMN SET NOT NULL in a SERIALIZABLE transaction, which validates rows without locking.",
   "Drop and recreate the table.",
   "Add the constraint on a replica first."],
  ex("A waiting `ALTER` blocks everything behind it, so set `lock_timeout` and retry. `ADD COLUMN` with a constant default is instant; build indexes `CONCURRENTLY`; add FKs `NOT VALID` then validate. Expand and contract: add, dual-write, backfill, switch reads, remove old.", '''
SET lock_timeout = '3s';
ALTER TABLE orders ADD COLUMN currency text;
ALTER TABLE orders ADD CONSTRAINT chk_cur CHECK (currency IS NOT NULL) NOT VALID;
ALTER TABLE orders VALIDATE CONSTRAINT chk_cur; -- weaker lock
'''), ["strong-migrations", "pg-alter-table"]),
 ("What are TOAST and fillfactor in PostgreSQL?", [SQL, PERF], H,
  "TOAST compresses large values and moves them out of line; fillfactor leaves page space so updates stay HOT.",
  ["TOAST is the transaction log and fillfactor controls how full the WAL segments get before rotation.",
   "TOAST is a backup format; fillfactor sets the default for NULL values.",
   "Both are index types."],
  ex("Data lives in 8 KB pages and a row can't span pages, so large values are compressed and moved to a TOAST table; that is why `SELECT *` on wide rows is expensive. `fillfactor` leaves free space so updates stay on the same page (HOT), reducing index churn."),
  ["pg-toast", "pg-page"]),

 # ---------------- H. Scaling and architecture ----------------
 ("A user saves a form and the next page, read from a replica, shows old data. How do you handle it?", [SQL, DIST], MID,
  "Replication lag: route that user's reads to the primary for a short window (read-your-writes), and monitor lag.",
  ["Make every replica synchronous, which removes lag entirely at no cost to write latency.",
   "Clear the browser cache.",
   "Restart the replica."],
  ex("Replicas apply changes asynchronously, so a read after a write may be stale. Route read-your-writes traffic to the primary briefly, use session or token routing, accept staleness where harmless, monitor lag. Long replica queries can conflict with replay (`hot_standby_feedback`)."),
  ["pg-hot-standby", "ddia"]),
 ("What do you gain from range-partitioning an events table by month?", [SQL, PERF, RES], H,
  "Partition pruning, cheap retention by dropping old partitions, smaller indexes; the PK must include the key.",
  ["Every query becomes faster automatically, and unique constraints no longer need the partition key.",
   "Rows are spread across servers.",
   "Indexes are no longer needed."],
  ex("Benefits: pruning, cheap retention (`DROP`/`DETACH`), smaller indexes, parallel maintenance. Caveats: PK and unique indexes must include the partition key, too many partitions slow planning, it's not a substitute for indexes.", '''
CREATE TABLE events (
  id bigint GENERATED ALWAYS AS IDENTITY,
  created_at timestamptz NOT NULL,
  payload jsonb,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);
CREATE TABLE events_2026_10 PARTITION OF events
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
'''), ["pg-partitioning", "pg-partman"]),
 ("When is sharding a database justified?", [SQL, SYS, RES], H,
  "When writes or storage outgrow one machine after indexes, caching, replicas, partitioning and bigger hardware.",
  ["As early as possible, because resharding later is impossible and cross-shard queries are free.",
   "Whenever there are more than ten tables.",
   "When reads are slow, since replicas can't help reads."],
  ex("Splitting data across nodes by a shard key scales writes and storage but adds cross-shard queries and transactions, resharding, hot shards and operational cost. Exhaust simpler steps first; pick a key that keeps related data together (tenant id); consider Citus or Vitess."),
  ["citus", "ddia"]),
 ("When should you not cache database results?", [SQL, PERF, SYS], MID,
  "When staleness breaks correctness, such as balances or stock reservations.",
  ["When the data changes rarely, because the cache will never be invalidated.",
   "When the query is slow.",
   "When the table has an index."],
  ex("Cache-aside: read the cache, on miss read the database and fill; invalidate or update on write; TTLs; protect against stampedes. Database-side: materialized views and summary tables. Be explicit about acceptable staleness per query."),
  ["pg-matviews", "ddia"]),
 ("Why is column-oriented storage better for analytics than row storage?", [SQL, PERF], MID,
  "Analytics scan many rows but few columns; columnar storage reads only those columns and compresses well.",
  ["Column stores keep each row in one place, so single-row lookups by id are faster than in row stores.",
   "Column stores don't need disk.",
   "Row stores can't run aggregates."],
  ex("OLTP: many small transactions on few rows; row storage and indexes. OLAP: large scans over many rows and few columns; columnar storage compresses and reads only needed columns. Run heavy analytics on a replica or a warehouse fed by CDC, not the primary."),
  ["ddia"]),
 ("In a shared-schema multitenant database, how should indexes and keys treat tenant_id?", [SQL, SEC, ARCH], H,
  "Lead indexes with tenant_id, include it in unique keys and foreign keys, and consider row-level security.",
  ["Put tenant_id last in every index so queries for all tenants stay fast, and filter it in application code.",
   "Leave it out of indexes; it has low cardinality.",
   "Store tenant_id only in a separate mapping table."],
  ex("Models: shared tables with `tenant_id` (cheapest, needs strict filtering, ideally RLS), schema per tenant, database per tenant (strongest isolation). With a shared schema, lead indexes with `tenant_id`, include it in unique keys and FKs, test for leaks, and handle noisy neighbors.", '''
CREATE TABLE campaigns (tenant_id bigint NOT NULL, id bigint NOT NULL, name text, PRIMARY KEY (tenant_id, id));
'''), ["pg-rls", "citus"]),
 ("Which index type suits a huge append-only time-series table queried by time range?", [SQL, PERF], MID,
  "BRIN: a tiny index of block ranges, effective because rows are physically ordered by time.",
  ["A hash index on the timestamp, since time-range queries are equality tests on each second.",
   "GIN on the timestamp.",
   "No index; partition pruning is enough for every query."],
  ex("Append-only inserts, queries by time range and entity. Partition by time, use BRIN or (entity, time) B-trees, drop old partitions, pre-aggregate rollups, compress cold data. TimescaleDB automates much of this."),
  ["pg-brin", "timescale"]),
 ("Where does a single-primary PostgreSQL with synchronous replication sit in CAP terms?", [SQL, DIST], H,
  "It favours consistency: during a partition it can refuse writes rather than accept divergent ones.",
  ["It favours availability: writes always succeed and conflicts are merged after the partition heals.",
   "CAP doesn't apply to relational databases.",
   "It is both fully consistent and fully available during partitions."],
  ex("Synchronous replication favours consistency over availability during a partition. Async replicas are available but may be stale. Multi-leader and leaderless systems favour availability and need conflict resolution. Know your guarantees: linearizable writes on the primary, read-your-writes only from it."),
  ["jepsen", "ddia"]),
 ("What problem does the transactional outbox pattern solve?", [SQL, DIST], MID,
  "The dual write: the change and its event row commit together, then a relay or CDC publishes the event.",
  ["Slow inserts: rows go into an outbox table first and are copied to the real table in batches later.",
   "Message ordering across partitions.",
   "Duplicate deliveries, so consumers no longer need idempotency."],
  ex("CDC streams committed changes out of the database (logical decoding, Debezium). The outbox writes the business change and an event row in one transaction; a relay publishes it, avoiding the dual-write problem. Consumers must be idempotent because delivery is at least once.", '''
BEGIN;
UPDATE orders SET status = 'paid' WHERE id = 42;
INSERT INTO outbox (aggregate_id, type, payload) VALUES (42, 'OrderPaid', '{"id":42}');
COMMIT;
'''), ["outbox", "debezium", "pg-logical-decoding"]),
 ("Which database scaling step comes first?", [SQL, RES, SYS], MID,
  "Measure and fix queries and indexes, before pooling, caching, bigger hardware, replicas, partitioning or sharding.",
  ["Shard by customer id, since the other steps only delay the inevitable and make sharding harder later.",
   "Add read replicas.",
   "Move to a NoSQL database."],
  ex("1) Fix queries and indexes. 2) Pooling. 3) Cache read-heavy data. 4) Scale up. 5) Read replicas. 6) Partition large tables. 7) Offload analytics. 8) Archive cold data. 9) Shard or move workloads to specialized stores. Each step costs more than the last."),
  ["ddia"]),

 # ---------------- I. Advanced features ----------------
 ("What is the difference between a view and a materialized view?", [SQL], E,
  "A view reruns its query every time; a materialized view stores the result and is stale until refreshed.",
  ["A materialized view reruns its query every time, while a view stores rows and must be refreshed.",
   "Views can't be queried with WHERE.",
   "Only materialized views can join tables."],
  ex("A view stores a query and runs it each time. A materialized view stores the result and is refreshed on demand. `REFRESH ... CONCURRENTLY` avoids blocking readers but needs a unique index.", '''
CREATE MATERIALIZED VIEW daily_sales AS
  SELECT date_trunc('day', created_at) AS day, sum(total_cents) AS cents FROM orders GROUP BY 1;
CREATE UNIQUE INDEX ON daily_sales (day);
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales;
'''), ["pg-create-matview", "pg-refresh"]),
 ("When are triggers and stored functions appropriate?", [SQL, PAT], MID,
  "For data integrity and audit (updated_at, history); keep business workflows in application code.",
  ["For all business logic, because code in the database is always faster and easier to test and version.",
   "Never; PostgreSQL triggers are deprecated.",
   "Only for sending emails."],
  ex("Functions put reusable logic near the data; procedures can `COMMIT` inside (11+); triggers react to changes. Costs: hidden logic, harder testing and debugging, cascades and performance surprises.", '''
CREATE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
'''), ["pg-plpgsql", "pg-triggers"]),
 ("In PostgreSQL jsonb, what is the difference between -> and ->>?", [SQL], E,
  "-> returns jsonb (object or element); ->> returns the value as text.",
  ["-> returns text and ->> returns jsonb, which is why comparisons with strings need ->.",
   "->> follows a nested path; -> reads one key.",
   "They are identical."],
  ex("`->` returns jsonb, `->>` text, `#>` a path, `@>` containment, `?` key exists, plus SQL/JSON path. Index with GIN (`jsonb_path_ops` for `@>`) or an expression index on one key.", '''
SELECT payload->>'email' FROM events WHERE payload @> '{"type":"signup"}';
CREATE INDEX idx_events_type ON events ((payload->>'type'));
'''), ["pg-json-funcs", "pg-json"]),
 ("How do you set up PostgreSQL full-text search on articles?", [SQL], MID,
  "A generated tsvector column with a GIN index, queried with @@ and websearch_to_tsquery, ranked with ts_rank.",
  ["A B-tree on body with LIKE '%word%', which PostgreSQL rewrites into a full-text search automatically.",
   "A hash index on title.",
   "Store each word in its own row."],
  ex("Documents become `tsvector` (stemmed lexemes), queries `tsquery`; `@@` matches; `ts_rank` scores. For typo tolerance and facets, a search engine.", '''
ALTER TABLE articles ADD COLUMN tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(body,''))) STORED;
CREATE INDEX idx_articles_tsv ON articles USING gin (tsv);
SELECT title FROM articles WHERE tsv @@ websearch_to_tsquery('english', 'postgres index');
'''), ["pg-fts", "pg-generated"]),
 ("In PostGIS, how do you find stores within 5 km efficiently?", [SQL, PERF], MID,
  "ST_DWithin on a GiST-indexed geography column, not ST_Distance(...) < 5000.",
  ["ST_Distance(...) < 5000 on a B-tree index, since distances are plain numbers.",
   "Compare latitude and longitude with BETWEEN only.",
   "Load all stores and filter in the application."],
  ex("`geometry` is planar (fast, units by SRID); `geography` is on the spheroid in meters. SRID 4326 is WGS84 lon/lat. Index with GiST; `ST_DWithin` is index-assisted, `ST_Distance < x` isn't; `<->` orders by nearest.", '''
CREATE INDEX idx_stores_geog ON stores USING gist (location);   -- geography(Point, 4326)
SELECT name FROM stores
WHERE ST_DWithin(location, ST_MakePoint(-34.88, -8.05)::geography, 5000);
'''), ["postgis-docs", "postgis-intro"]),
 ("Why use GENERATED ALWAYS AS IDENTITY instead of serial?", [SQL], E,
  "It is standard SQL, the sequence belongs to the column, and ALWAYS blocks accidental manual ids.",
  ["serial is faster but limited to 32 767 rows, while identity columns have no limit at all.",
   "Identity columns are random, so they don't leak counts.",
   "serial was removed in PostgreSQL 16."],
  ex("Identity columns are the standard replacement for `serial`: the sequence is owned by the column and `ALWAYS` prevents manual ids. A generated column (`GENERATED ALWAYS AS (...) STORED`) computes values from other columns."),
  ["pg-identity", "pg-generated"]),
 ("What is row-level security, and who bypasses it by default?", [SQL, SEC], MID,
  "Table policies decide which rows each role sees or changes; table owners and superusers bypass it unless forced.",
  ["A column permission system; only the postgres user is subject to it, so app roles are unaffected.",
   "Encryption of each row with its own key.",
   "A replication filter."],
  ex("Policies on a table decide row visibility, enforced in the database. Common for multitenancy with a session variable per request. Owners and superusers bypass unless `FORCE ROW LEVEL SECURITY`; test the overhead.", '''
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON campaigns
  USING (tenant_id = current_setting('app.tenant_id')::bigint);
'''), ["pg-rls"]),
 ("What does GROUP BY ROLLUP (country, status) return?", [SQL], MID,
  "Totals per (country, status), per country, and a grand total, in one query.",
  ["Every combination of country and status including per-status totals, the same as CUBE.",
   "Only the grand total.",
   "One row per country, with status ignored."],
  ex("`ROLLUP (a, b)` gives (a, b), (a), and the grand total; `CUBE` every combination; `GROUPING SETS` exactly the listed ones. `GROUPING()` tells subtotal rows from real NULLs.", '''
SELECT country, status, sum(total_cents)
FROM orders o JOIN customers c ON c.id = o.customer_id
GROUP BY ROLLUP (country, status);
'''), ["pg-table-expr"]),
 ("How do you prevent double bookings of a room at the database level?", [SQL, ASYNC], H,
  "An EXCLUDE USING gist (room_id WITH =, period WITH &&) constraint on a tstzrange column.",
  ["A UNIQUE constraint on (room_id, start_time), which also rejects overlapping intervals.",
   "Check for overlaps in the application before inserting.",
   "A trigger that sleeps until other inserts finish."],
  ex("Range types represent intervals with operators like `&&` (overlap). An exclusion constraint forbids overlapping ranges for the same resource, race-free.", '''
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE bookings (
  room_id int, period tstzrange,
  EXCLUDE USING gist (room_id WITH =, period WITH &&)
);
'''), ["pg-ranges", "pg-constraints"]),
 ("How do you move old orders into an archive table in a single statement?", [SQL], MID,
  "A data-modifying CTE: DELETE … RETURNING * feeding INSERT INTO orders_archive.",
  ["INSERT … SELECT then DELETE in two statements is the only way, since a CTE can't modify data.",
   "ALTER TABLE orders MOVE TO orders_archive.",
   "COPY the rows out and back in."],
  ex("`RETURNING` gives back affected rows in one round trip. A data-modifying CTE chains writes. `generate_series` produces numbers or dates for calendars, gap-filling and test data.", '''
WITH moved AS (
  DELETE FROM orders WHERE created_at < now() - interval '2 years' RETURNING *
)
INSERT INTO orders_archive SELECT * FROM moved;

SELECT d::date FROM generate_series('2026-10-01'::date, '2026-10-07', '1 day') d;
'''), ["pg-with", "pg-srf"]),

 # ---------------- J. Coding and scenarios ----------------
 ("How do you delete duplicate customers by email, keeping the lowest id?", [SQL], MID,
  "Rank rows with row_number() OVER (PARTITION BY email ORDER BY id), delete rank > 1, then add UNIQUE (email).",
  ["DELETE FROM customers WHERE email IN (SELECT email … HAVING count(*) > 1), which keeps one row per email.",
   "SELECT DISTINCT into the same table.",
   "Add the UNIQUE constraint; it removes duplicates."],
  ex("Find duplicates with `GROUP BY ... HAVING count(*) > 1`; to delete, rank within each group and delete rank > 1. Add a unique constraint afterwards.", '''
DELETE FROM customers c
USING (
  SELECT id, row_number() OVER (PARTITION BY email ORDER BY id) AS rn FROM customers
) d
WHERE c.id = d.id AND d.rn > 1;

ALTER TABLE customers ADD CONSTRAINT uq_customers_email UNIQUE (email);
'''), ["leetcode-db", "dedupe-wiki"]),
 ("How do you get the second-highest salary in each department, handling ties?", [SQL], MID,
  "dense_rank() OVER (PARTITION BY dept_id ORDER BY salary DESC) and keep rank 2.",
  ["row_number() per department and keep row 2, which skips tied salaries correctly.",
   "max(salary) - 1 per department.",
   "ORDER BY salary DESC LIMIT 1 OFFSET 1 across the whole table."],
  ex("`DENSE_RANK` handles ties. For a single value `DISTINCT` plus `OFFSET` also works, but ranking generalizes to groups.", '''
SELECT dept_id, name, salary
FROM (SELECT *, dense_rank() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS r FROM employees) t
WHERE r = 2;
'''), ["pg-window-tutorial", "leetcode-db"]),
 ("How do you find the longest streak of consecutive order days (gaps and islands)?", [SQL, ALG], H,
  "Subtract row_number() from each distinct date: consecutive days share the same value, so group by it.",
  ["Self join each day to the next with LEFT JOIN and count NULLs, which gives the streak length directly.",
   "Use lag() and sum the differences.",
   "Sort by date and take max - min."],
  ex("Number the distinct days and subtract the row number from the date: consecutive days produce the same constant, which identifies an island.", '''
WITH d AS (
  SELECT DISTINCT customer_id, created_at::date AS day FROM orders
), g AS (
  SELECT customer_id, day,
         day - (row_number() OVER (PARTITION BY customer_id ORDER BY day))::int AS grp
  FROM d
)
SELECT customer_id, min(day) AS streak_start, max(day) AS streak_end, count(*) AS days
FROM g GROUP BY customer_id, grp
ORDER BY days DESC LIMIT 1;
'''), ["ms-over"]),
 ("How do you find moments when an account's running balance went negative?", [SQL], MID,
  "sum(amount) OVER (PARTITION BY account ORDER BY posted_at, id) in a subquery, filtered balance < 0 outside.",
  ["WHERE sum(amount) OVER (...) < 0 directly, since window functions can be filtered in WHERE.",
   "GROUP BY account HAVING sum(amount) < 0.",
   "A trigger on every insert is the only way."],
  ex("A window sum per account ordered by time with a deterministic tiebreaker, filtered in an outer query (windows can't appear in `WHERE`).", '''
SELECT * FROM (
  SELECT account_id, posted_at, amount_cents,
         sum(amount_cents) OVER (PARTITION BY account_id ORDER BY posted_at, id) AS balance
  FROM ledger
) t WHERE balance < 0;
'''), ["pg-expressions"]),
 ("How do you pivot order totals into one column per status for each month?", [SQL], MID,
  "Group by month and use sum(total) FILTER (WHERE status = …) per column (or crosstab).",
  ["GROUP BY month, status, which returns one column per status automatically.",
   "PIVOT (status), a PostgreSQL keyword.",
   "One query per status joined with UNION."],
  ex("Conditional aggregation with `FILTER` is portable and readable; `crosstab` from `tablefunc` is the PostgreSQL alternative with a fixed column list.", '''
SELECT date_trunc('month', created_at) AS month,
       sum(total_cents) FILTER (WHERE status = 'paid')     AS paid,
       sum(total_cents) FILTER (WHERE status = 'refunded') AS refunded
FROM orders GROUP BY 1 ORDER BY 1;
'''), ["pg-tablefunc", "ms-filter"]),
 ("How do you compute the median and 95th percentile of order totals in PostgreSQL?", [SQL], MID,
  "percentile_cont(0.5) and percentile_cont(0.95) WITHIN GROUP (ORDER BY total_cents).",
  ["avg(total_cents) for the median and max(total_cents) * 0.95 for the 95th percentile.",
   "median(total_cents), a built-in aggregate.",
   "ntile(100) in WHERE."],
  ex("Ordered-set aggregates: `percentile_cont` interpolates, `percentile_disc` returns an actual value.", '''
SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY total_cents) AS median,
       percentile_cont(0.95) WITHIN GROUP (ORDER BY total_cents) AS p95
FROM orders;
'''), ["pg-aggregates"]),
 ("When do two intervals [a.start, a.end) and [b.start, b.end) overlap?", [SQL, ALG], E,
  "When a.start < b.end AND b.start < a.end (with range types, a && b).",
  ["When a.start = b.start or a.end = b.end, since overlapping intervals always share an endpoint.",
   "When a.start BETWEEN b.start AND b.end only.",
   "When a.end > b.end."],
  ex("Two ranges overlap when `a.start < b.end AND b.start < a.end`; with range types use `&&`. To merge, sort by start and begin a new group whenever a start is after the running maximum end.", '''
SELECT a.id, b.id
FROM bookings a JOIN bookings b
  ON a.room_id = b.room_id AND a.id < b.id AND a.period && b.period;
'''), ["pg-range-funcs"]),
 ("How do you find customers who bought all of products 1, 2 and 3?", [SQL], MID,
  "Filter to those products, group by customer, and keep HAVING count(DISTINCT product_id) = 3.",
  ["WHERE product_id = 1 AND product_id = 2 AND product_id = 3 on order_items.",
   "WHERE product_id IN (1, 2, 3) alone.",
   "INTERSECT of three full table scans with no filter."],
  ex("Relational division: count distinct matching products per customer and compare with the set size, or use double `NOT EXISTS`.", '''
SELECT o.customer_id
FROM orders o JOIN order_items i ON i.order_id = o.id
WHERE i.product_id IN (1, 2, 3)
GROUP BY o.customer_id
HAVING count(DISTINCT i.product_id) = 3;
'''), ["sqlzoo", "pgex"]),
 ("A query that was fast now takes 10 seconds. What is your method?", [SQL, PERF, OPS], H,
  "Clarify what changed, EXPLAIN ANALYZE with real parameters, narrow (stats, plan flip, locks, bloat), mitigate, then prevent.",
  ["Add indexes on every column in the query and restart the server, then check whether it got faster.",
   "Increase the statement timeout.",
   "Rewrite it as a stored procedure."],
  ex("(1) Clarify: since when, which parameters, what changed. (2) Measure: `EXPLAIN (ANALYZE, BUFFERS)`, compare plans. (3) Narrow: bad estimates, plan flip, missing or bloated index, lock waits, I/O, more rows, generic plan, long transaction blocking vacuum. (4) Mitigate: `ANALYZE`, index concurrently, rewrite, cancel the blocker. (5) Prevent: latency monitoring and realistic-volume tests."),
  ["slow-query", "pg-explain"]),
 ("Designing orders, payments and inventory tables: how do you stop overselling and double charging?", [SQL, SYS], H,
  "CHECK (stock >= 0) with an atomic UPDATE stock = stock - n, and a UNIQUE idempotency_key on payments.",
  ["Read the stock in the application, compare, then write the new value; payments are deduplicated by amount.",
   "Lock the whole products table on every order.",
   "Store stock in a cache and sync nightly."],
  ex("State the invariants first, then enforce them with keys and constraints, and make writes idempotent and transactional.", '''
CREATE TABLE products (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sku text NOT NULL UNIQUE,
  stock int NOT NULL CHECK (stock >= 0)
);
CREATE TABLE payments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id bigint NOT NULL REFERENCES orders(id),
  idempotency_key text NOT NULL UNIQUE,
  amount_cents bigint NOT NULL CHECK (amount_cents > 0)
);
-- reserve stock atomically: fails the CHECK instead of overselling
UPDATE products SET stock = stock - $2 WHERE id = $1;
'''), ["pg-constraints"]),
]

assert len(Q) == 100, len(Q)

# Length balance (same approach as the by-level banks).
CLAUSES = [
    ", which is how PostgreSQL behaves by default",
    ", and the same holds in MySQL and SQL Server",
    ", so no extra configuration is needed",
    ", which is what the documentation recommends",
    ", and it is the cheapest option in practice",
    ", which most teams rely on in production",
]
KEEP_LONGEST = 24
gaps = sorted(range(len(Q)), key=lambda i: len(Q[i][3]) - max(len(w) for w in Q[i][4]))
for n, i in enumerate(gaps[: len(Q) - KEEP_LONGEST]):
    prompt, tags, diff, correct, wrong, expl, keys = Q[i]
    lead = wrong[0].rstrip(".")
    k = n
    while len(lead) + 1 <= len(correct):
        lead += CLAUSES[k % len(CLAUSES)]
        k += 1
    Q[i] = (prompt, tags, diff, correct, [lead + ".", *wrong[1:]], expl, keys)

build("100 SQL and database interview questions (PostgreSQL)", M, Q, sys.argv[1],
      strip_backticks=False, canonical_tags=True)
