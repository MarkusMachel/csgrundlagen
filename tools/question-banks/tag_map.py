"""The shared tag list and the mapping from the old per-bank tags onto it.

This mapping produced migration 0004_merge_tags.sql. bankgen applies it to
every generated question, so banks written with old tag names still come out
with the current ones. New banks should use the CANONICAL names directly.
"""
import sys

CS, JS, GO, SQL = "C# & .NET", "JavaScript", "Go", "SQL & Databases"
ASYNC, PERF, ALGO = "Async & Concurrency", "Performance & Memory", "Algorithms & Data Structures"
PATTERNS, ARCH, DIST = "Design Principles & Patterns", "Architecture & DDD", "Distributed Systems & Messaging"
API, SEC, RES = "APIs & HTTP", "Security", "Resilience & Scalability"
SYS, OPS, CAREER = "System Design", "Testing & Operations", "Career & Judgement"
EZ = "ezCater prep"

CANONICAL = [CS, JS, GO, SQL, ASYNC, PERF, ALGO, PATTERNS, ARCH, DIST, API, SEC, RES, SYS, OPS, CAREER, EZ]

# old tag -> canonical tags. Section tags carry a track and a topic; small topic tags fold into their topic.
MAP = {
    # C# / .NET
    "C#": [CS], "Modern C#": [CS], "C# 12": [CS], "LINQ": [CS], "Generics": [CS], "Nullability": [CS],
    "Pattern matching": [CS], "Records": [CS], "Immutability": [CS], "Reflection": [CS],
    "Source generators": [CS], "Serialization": [CS], "Strings": [CS], "Exceptions": [CS], "Hosting": [CS],
    "ASP.NET Core & EF Core": [CS, API], "EF Core": [CS, SQL],
    "Async": [CS, ASYNC], "Async & Concurrency": [CS, ASYNC],
    "Memory & Performance": [CS, PERF],
    "Collections": [CS, ALGO], "Collections & Data Structures": [CS, ALGO],
    # JavaScript
    "JS Core & Types": [JS], "JS Functions, Scope & Prototypes": [JS], "Modern JavaScript": [JS],
    "JS Runtime, Browser & Security": [JS], "JS Async & Event Loop": [JS, ASYNC],
    # Go
    "Go Language & Idioms": [GO], "Go Implementations": [GO], "Go Concurrency": [GO, ASYNC],
    "Algorithms (Go)": [GO, ALGO],
    # SQL and databases
    "SQL": [SQL], "PostgreSQL": [SQL], "SQL, PostgreSQL & EF Core": [SQL], "Database & Data Modeling": [SQL],
    "Aggregation": [SQL], "Joins": [SQL], "Indexing": [SQL], "Normalization": [SQL], "Window functions": [SQL],
    "Data integrity": [SQL], "Modeling": [SQL], "Data access": [SQL], "PostGIS": [SQL], "Data": [SQL],
    # topics
    "Concurrency": [ASYNC], "Synchronization": [ASYNC], "Thread pool": [ASYNC], "Channels": [ASYNC], "Timers": [ASYNC],
    "GC": [PERF], "Span": [PERF], "Runtime": [PERF], "Performance": [PERF], "Resources": [PERF], "Diagnostics": [PERF],
    "Algorithms": [ALGO], "Binary search": [ALGO], "Graphs": [ALGO], "Hashing": [ALGO], "Heaps": [ALGO],
    "Linked lists": [ALGO], "Sliding window": [ALGO], "Sorting": [ALGO], "Stacks": [ALGO], "Tries": [ALGO],
    "Design": [ALGO],  # only used by "design an LRU cache"
    "Design Principles & Patterns": [PATTERNS], "Patterns": [PATTERNS], "SOLID": [PATTERNS],
    "Dependency injection": [PATTERNS],
    "DDD & Application Architecture": [ARCH], "DDD": [ARCH], "Architecture": [ARCH], "CQRS": [ARCH], "Migration": [ARCH],
    "Architecture & Distributed Systems": [DIST], "Distributed Systems": [DIST], "Event-Driven Architecture": [DIST],
    "Messaging": [DIST], "Messaging, Delivery & System Design": [DIST], "Kafka": [DIST], "Sagas": [DIST],
    "Delivery": [DIST], "Consistency": [DIST], "Consensus": [DIST], "Coordination": [DIST], "Ordering": [DIST],
    "Transactions": [DIST], "Event sourcing": [DIST], "Temporal": [DIST], "Idempotency & Durable Execution": [DIST],
    "Idempotency": [DIST], "Integration": [DIST],
    "API & Contract Design": [API], "API design": [API], "HTTP": [API], "Middleware": [API], "Validation": [API],
    "Error handling": [API],
    "Security & API Design": [SEC, API], "Security": [SEC],
    "Resilience & Scalability": [RES], "Resilience": [RES], "Scalability": [RES], "Caching": [RES],
    "Rate limiting": [RES], "Reliability": [RES],
    "System Design & Judgement": [SYS], "System design": [SYS], "Integration Hub Design": [SYS], "Multi-tenancy": [SYS],
    "Testing & Operations": [OPS], "Testing": [OPS], "Observability": [OPS], "Logging": [OPS], "Configuration": [OPS],
    "Ownership & Judgement": [CAREER], "Behavioural": [CAREER], "Leadership": [CAREER], "Decisions": [CAREER],
    EZ: [EZ],
}

assert all(t in CANONICAL for targets in MAP.values() for t in targets)


def mapped(tags):
    """Old tags -> canonical ones (order kept, duplicates dropped). Canonical names pass through."""
    out = []
    for tag in tags:
        # MAP first: an old section tag can share its name with a canonical one
        # ("Async & Concurrency" also meant "C# & .NET" in the .NET banks).
        if tag in MAP:
            targets = MAP[tag]
        elif tag in CANONICAL:
            targets = [tag]
        else:
            sys.exit(f"unknown tag {tag!r}: use one of {CANONICAL}")
        out += [t for t in targets if t not in out]
    return out
