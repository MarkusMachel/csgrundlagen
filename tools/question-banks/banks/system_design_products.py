"""System design challenges modelled on well-known products (Spotify, Netflix, ...).

Writes a seed file of type "design" questions. Each reference design is graded
here against its own rules, the same way store.GradeDesign does, so a broken
challenge fails the build instead of the seed.
"""
import json
import sys

KINDS = {"client", "dns", "cdn", "load-balancer", "api-gateway", "service", "worker", "cache", "sql",
         "nosql", "replica", "queue", "object-storage", "search", "rate-limiter", "auth", "websocket",
         "scheduler"}

UNVERIFIED = " The site blocks automated checks; if the link doesn't open, search for its title."

MATERIALS = {
 # already in the database from system-design.json (matched by URL)
 "lb": ("article", "Load balancing (computing)", "https://en.wikipedia.org/wiki/Load_balancing_(computing)", "Wikipedia",
        "How load balancers spread requests across servers and route around failed ones."),
 "cdn": ("article", "Content delivery network", "https://en.wikipedia.org/wiki/Content_delivery_network", "Wikipedia",
         "Serving content from servers close to the user."),
 "cache-aside": ("article", "Cache-Aside pattern", "https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside",
                 "Microsoft Learn", "Load data into a cache on demand to speed up repeated reads."),
 "search-index": ("article", "Search engine indexing", "https://en.wikipedia.org/wiki/Search_engine_indexing", "Wikipedia",
                  "How inverted indexes make text search fast."),
 "websocket": ("article", "WebSocket", "https://en.wikipedia.org/wiki/WebSocket", "Wikipedia",
               "A long-lived two-way connection between browser and server."),
 "valet": ("article", "Valet Key pattern", "https://learn.microsoft.com/en-us/azure/architecture/patterns/valet-key",
           "Microsoft Learn", "Let clients upload and download straight from storage with a limited token."),
 "competing": ("article", "Competing Consumers pattern",
               "https://learn.microsoft.com/en-us/azure/architecture/patterns/competing-consumers", "Microsoft Learn",
               "Several workers take messages from one queue to share the load."),
 "queue-leveling": ("article", "Queue-Based Load Leveling pattern",
                    "https://learn.microsoft.com/en-us/azure/architecture/patterns/queue-based-load-leveling",
                    "Microsoft Learn", "A queue absorbs bursts so the backend works at a steady pace."),
 "ratelimit": ("article", "Rate Limiting pattern",
               "https://learn.microsoft.com/en-us/azure/architecture/patterns/rate-limiting-pattern", "Microsoft Learn",
               "Limit how fast clients can use a service."),
 "replication": ("article", "Replication (computing)", "https://en.wikipedia.org/wiki/Replication_(computing)", "Wikipedia",
                 "Keeping copies of data on several machines."),
 # new
 "spotify-events": ("article", "Spotify's Event Delivery: The Road to the Cloud (Part I)",
                    "https://engineering.atspotify.com/2016/02/spotifys-event-delivery-the-road-to-the-cloud-part-i",
                    "Spotify Engineering", "How Spotify moves billions of play events a day through a queue to storage."),
 "open-connect": ("link", "Netflix Open Connect", "https://openconnect.netflix.com/en/", "Netflix",
                  "Netflix's own CDN: servers inside internet providers' networks."),
 "abr": ("article", "Adaptive bitrate streaming", "https://en.wikipedia.org/wiki/Adaptive_bitrate_streaming", "Wikipedia",
         "Encoding video at several bitrates so the player can switch with the network."),
 "netflix-viewing": ("article", "Scaling Time Series Data Storage, Part I",
                     "https://netflixtechblog.com/scaling-time-series-data-storage-part-i-ec2b6d44ba39",
                     "Netflix Technology Blog", "How Netflix stores viewing history in Cassandra." + UNVERIFIED),
 "ot": ("article", "Operational transformation", "https://en.wikipedia.org/wiki/Operational_transformation", "Wikipedia",
        "The algorithm family behind Google Docs' concurrent editing."),
 "figma": ("article", "How Figma's multiplayer technology works",
           "https://www.figma.com/blog/how-figmas-multiplayer-technology-works/", "Figma",
           "One server per document, WebSockets, and conflict handling in practice."),
 "discord": ("article", "How Discord Stores Trillions of Messages",
             "https://discord.com/blog/how-discord-stores-trillions-of-messages", "Discord",
             "Messages partitioned by channel and time in ScyllaDB."),
 "slack-rtm": ("article", "Real-time Messaging", "https://slack.engineering/real-time-messaging/", "Slack Engineering",
               "Gateway servers, channel servers and how a message reaches every client."),
 "dropbox-sync": ("article", "Rewriting the heart of our sync engine",
                  "https://dropbox.tech/infrastructure/rewriting-the-heart-of-our-sync-engine", "Dropbox",
                  "How Dropbox syncs metadata and file blocks across devices."),
 "cas": ("article", "Content-addressable storage", "https://en.wikipedia.org/wiki/Content-addressable_storage",
         "Wikipedia", "Storing data by the hash of its content, so duplicates are stored once."),
 "waiting-room": ("article", "Cloudflare Waiting Room", "https://developers.cloudflare.com/waiting-room/", "Cloudflare",
                  "Admitting visitors at a rate the origin can handle during traffic spikes."),
 "redis-expire": ("article", "Redis EXPIRE", "https://redis.io/docs/latest/commands/expire/", "Redis",
                  "Keys that delete themselves after a timeout, used for holds and sessions."),
 "pg-locking": ("article", "PostgreSQL: Explicit locking", "https://www.postgresql.org/docs/current/explicit-locking.html",
                "PostgreSQL documentation", "Row locks, SELECT FOR UPDATE and SKIP LOCKED."),
 "stripe-idem": ("article", "Designing robust and predictable APIs with idempotency", "https://stripe.com/blog/idempotency",
                 "Stripe", "Idempotency keys make retried payment requests safe."),
 "outbox": ("article", "Pattern: Transactional outbox",
            "https://microservices.io/patterns/data/transactional-outbox.html", "Chris Richardson",
            "Publishing events reliably together with the database change."),
 "stripe-webhooks": ("article", "Stripe webhooks", "https://docs.stripe.com/webhooks", "Stripe",
                     "Signed event notifications and automatic retries with backoff."),
 "crawler": ("article", "Web crawler", "https://en.wikipedia.org/wiki/Web_crawler", "Wikipedia",
             "URL frontier, politeness and recrawl policies."),
 "robots": ("article", "Robots Exclusion Protocol (RFC 9309)", "https://datatracker.ietf.org/doc/html/rfc9309", "IETF",
            "The robots.txt standard crawlers must respect."),
 "hls": ("article", "HTTP Live Streaming (RFC 8216)", "https://www.rfc-editor.org/rfc/rfc8216", "IETF",
         "Short video segments and playlists served over plain HTTP."),
 "airflow": ("article", "Apache Airflow: Architecture overview",
             "https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/overview.html", "Apache Airflow",
             "Scheduler, executor, workers and the metadata database."),
 "dlq": ("article", "Dead letter queue", "https://en.wikipedia.org/wiki/Dead_letter_queue", "Wikipedia",
         "Where messages go after they fail too many times."),
}


def rule(id, kind, text, explanation, req=None, mat=None, optional=False, **kw):
    r = {"id": id, "kind": kind, "text": text, "explanation": explanation}
    if req:
        r["requirement"] = req
    if optional:
        r["optional"] = True
    if mat:
        r["materialKey"] = mat
    r.update({k: v if isinstance(v, list) else [v] for k, v in kw.items() if k != "min"})
    if "min" in kw:
        r["min"] = kw["min"]
    return r


def graph(nodes, edges):
    """nodes: 'id:kind:label' strings; edges: 'a>b' or 'a>b,c' strings."""
    ns = []
    for n in nodes:
        id, kind, *label = n.split(":", 2)
        ns.append({"id": id, "kind": kind, **({"label": label[0]} if label else {})})
    es = []
    for e in edges:
        a, bs = e.split(">")
        for f in a.split(","):
            for b in bs.split(","):
                es.append({"from": f, "to": b})
    return {"nodes": ns, "edges": es}


C, G, PERF, RES, SEC = ("System Design", "Distributed Systems & Messaging", "Performance & Memory",
                        "Resilience & Scalability", "Security")

Q = []


def challenge(prompt, tags, difficulty, explanation, requirements, rules, reference):
    mats = sorted({r["materialKey"] for r in rules if "materialKey" in r})
    Q.append({"type": "design", "prompt": prompt, "tags": tags, "difficulty": difficulty,
              "explanation": explanation, "materials": mats,
              "design": {"requirements": [{"id": k, "text": v} for k, v in requirements],
                         "rules": rules, "reference": reference}})


NO_DB = ["sql", "nosql", "cache", "search", "object-storage"]

challenge(
 "Design music streaming like Spotify", [C, G, PERF], "hard",
 "Audio files sit in object storage and reach listeners through a CDN, so a track starts from a server near them. "
 "The app talks to stateless API instances behind a gateway that checks the session with an auth service. "
 "Track and playlist metadata lives in a database with a cache in front, and catalog search uses a search index. "
 "Every play becomes an event on a queue; workers write the events to an archive for royalty reports and "
 "recommendations, so recording plays never slows playback down.",
 [("play", "A track starts playing in under a second, anywhere in the world"),
  ("catalog", "Users browse and search a catalog of 100 million tracks"),
  ("events", "Every play is recorded for royalties and recommendations without slowing playback"),
  ("signin", "Only signed-in users can stream"),
  ("uptime", "The service keeps working when one server fails")],
 [rule("audio-cdn", "path", "Audio is streamed from a CDN backed by object storage",
       "Audio is most of the traffic. A CDN keeps popular tracks close to listeners and keeps the egress off your servers.",
       "play", "cdn", **{"from": "client", "via": "cdn", "to": "object-storage"}),
  rule("front", "path", "API requests reach the services through a gateway or load balancer",
       "One entry point spreads traffic and routes around failed instances.", "uptime", "lb",
       **{"from": "client", "via": ["api-gateway", "load-balancer"], "to": "service"}),
  rule("instances", "has", "At least two API instances", "One instance is a single point of failure.", "uptime", "lb",
       of="service", min=2),
  rule("auth", "edge", "The gateway or API checks the session with an auth service",
       "Streaming is a paid product: every request must belong to a signed-in user.", "signin",
       **{"from": ["api-gateway", "service"], "to": "auth"}),
  rule("metadata", "edge", "Track and playlist metadata lives in a database",
       "Albums, artists and playlists are structured and must survive restarts.", "catalog",
       **{"from": "service", "to": ["sql", "nosql"]}),
  rule("search", "edge", "Catalog search uses a search index",
       "Typo-tolerant, ranked search over 100 million titles needs an inverted index, not LIKE queries.", "catalog",
       "search-index", **{"from": "service", "to": "search"}),
  rule("events-queue", "edge", "Play events go to a queue, not straight to a database",
       "Billions of events a day would overload a database on the request path; a queue absorbs them.", "events",
       "spotify-events", **{"from": "service", "to": "queue"}),
  rule("events-store", "path", "Workers move events from the queue into storage",
       "Royalty reports and recommendation jobs read the archived events later, in bulk.", "events", "spotify-events",
       **{"from": "queue", "via": "worker", "to": ["object-storage", "nosql", "sql"]}),
  rule("cache", "edge", "Popular metadata is cached", "The same albums and playlists are read millions of times a day.",
       "catalog", "cache-aside", optional=True, **{"from": "service", "to": "cache"}),
  rule("no-direct", "no-edge", "Clients never read storage or databases directly",
       "Audio goes through the CDN and data through the API, which checks access.", None, "cdn",
       **{"from": "client", "to": NO_DB})],
 graph(["c:client:Spotify apps", "gw:api-gateway", "a:auth", "s1:service:api", "s2:service:api",
        "db:sql:catalog & playlists", "k:cache:Redis", "se:search:catalog search", "cdn:cdn:audio CDN",
        "os:object-storage:audio files", "q:queue:play events", "w:worker:event loader",
        "ar:object-storage:event archive"],
       ["c>gw", "gw>a", "gw>s1,s2", "s1,s2>db,k,se,q", "q>w", "w>ar", "c>cdn", "cdn>os"]))

challenge(
 "Design video streaming like Netflix", [C, PERF, RES], "hard",
 "Studios upload huge master files straight to object storage with a pre-signed URL. The upload API puts an "
 "encoding job on a queue, and a pool of encoders writes every resolution and bitrate back to storage, so "
 "players can switch quality as bandwidth changes. Viewers stream the segments from a CDN. The playback API "
 "records viewing positions in a wide-column store so any device can resume, and serves personalised rows from "
 "a cache that a scheduled batch job fills.",
 [("upload", "Studios upload master files of hundreds of gigabytes"),
  ("encode", "Each title is encoded into many resolutions and bitrates"),
  ("play", "Playback starts quickly and adapts to the viewer's bandwidth"),
  ("resume", "Viewers continue where they left off, on any device"),
  ("recs", "The home page shows personalised rows that load instantly")],
 [rule("upload-direct", "edge", "Masters upload straight to object storage",
       "Pushing hundreds of gigabytes through an API server wastes it; a pre-signed URL lets storage take the bytes.",
       "upload", "valet", **{"from": "client", "to": "object-storage"}),
  rule("encode-queue", "edge", "The upload service queues an encoding job",
       "Encoding takes hours; the request returns at once and the work happens in the background.", "encode",
       "queue-leveling", **{"from": "service", "to": "queue"}),
  rule("encoders", "has", "Several encoders work in parallel", "One title becomes dozens of renditions; split the work.",
       "encode", "competing", of="worker", min=2),
  rule("renditions", "path", "Encoders write the renditions back to object storage",
       "Each resolution and bitrate is stored as short segments the player can switch between.", "encode", "abr",
       **{"from": "queue", "via": "worker", "to": "object-storage"}),
  rule("cdn", "path", "Viewers stream from a CDN in front of storage",
       "Video is most of the internet's traffic; Netflix puts caches inside internet providers.", "play",
       "open-connect", **{"from": "client", "via": "cdn", "to": "object-storage"}),
  rule("front", "path", "API calls go through a gateway or load balancer", "Spreads load and hides failed instances.",
       "play", "lb", **{"from": "client", "via": ["api-gateway", "load-balancer"], "to": "service"}),
  rule("history", "edge", "Viewing positions are written to a wide-column store",
       "Millions of small writes a minute, read back by user and time: a good fit for Cassandra-style storage.",
       "resume", "netflix-viewing", **{"from": "service", "to": "nosql"}),
  rule("recs-cache", "edge", "Personalised rows are served from a cache", "Ranking at request time is too slow.",
       "recs", "cache-aside", **{"from": "service", "to": "cache"}),
  rule("recs-batch", "path", "A scheduled job precomputes recommendations",
       "Recommendations change slowly; compute them in batch and store the result.", "recs",
       **{"from": "scheduler", "to": "worker"})],
 graph(["v:client:TV & phone apps", "st:client:studio uploader", "gw:api-gateway", "p1:service:playback API",
        "p2:service:playback API", "up:service:upload API", "os:object-storage:masters & segments",
        "q:queue:encoding jobs", "e1:worker:encoder", "e2:worker:encoder", "cdn:cdn:Open Connect",
        "h:nosql:viewing history", "k:cache:home rows", "sch:scheduler:nightly", "rw:worker:recommender"],
       ["v,st>gw", "gw>p1,p2,up", "st>os", "up>q", "q>e1,e2", "e1,e2>os", "v>cdn", "cdn>os", "p1,p2>h,k",
        "sch>rw", "rw>k", "rw>h"]))

challenge(
 "Design real-time collaborative editing like Google Docs", [C, G], "hard",
 "Editors keep a WebSocket open to a gateway, which checks document permissions and forwards each edit to the "
 "collaboration service that owns the document. That service orders concurrent operations (operational "
 "transformation or CRDTs) and appends them to a per-document log, then broadcasts them back. Recently opened "
 "documents stay in a cache. A worker compacts the log into snapshots in object storage, which keeps old "
 "versions restorable and lets large documents open quickly.",
 [("live", "Everyone editing a document sees the others' changes within a fraction of a second"),
  ("conflicts", "Concurrent edits to the same paragraph never lose text"),
  ("history", "Old versions can be viewed and restored"),
  ("share", "Only people the document is shared with can open it"),
  ("open", "Opening a large document is fast")],
 [rule("ws", "path", "Editors connect over WebSockets to a collaboration service",
       "Edits must be pushed both ways continuously; polling would be too slow and too costly.", "live", "websocket",
       **{"from": "client", "via": "websocket", "to": "service"}),
  rule("gateways", "has", "At least two WebSocket servers",
       "Millions of open connections don't fit on one server, and one server would be a single point of failure.",
       "live", "lb", of="websocket", min=2),
  rule("oplog", "edge", "Every operation is appended to a per-document log in a database",
       "One ordered log per document gives each edit a version, so concurrent edits can be transformed and none is lost.",
       "conflicts", "ot", **{"from": "service", "to": ["nosql", "sql"]}),
  rule("acl", "edge", "Permissions are checked before joining a document",
       "A shared link must not let anyone outside the sharing list read the document.", "share",
       **{"from": ["websocket", "api-gateway", "service"], "to": "auth"}),
  rule("snapshots", "path", "Workers compact the log into snapshots in object storage",
       "Replaying years of operations is slow; periodic snapshots are the restore points for version history.",
       "history", "figma", **{"from": "service", "via": "worker", "to": "object-storage"}),
  rule("cache", "edge", "Open documents are kept in a cache", "Active documents are read on every join and reload.",
       "open", "cache-aside", **{"from": "service", "to": "cache"}),
  rule("queue", "edge", "Snapshot work is queued, not done on the edit path",
       "Compaction is heavy; a queue keeps it from slowing typing down.", "open", "queue-leveling", optional=True,
       **{"from": "service", "to": "queue"}),
  rule("no-direct", "no-edge", "Clients never talk to the database or storage",
       "All edits must be ordered and permission-checked by the service.", None,
       **{"from": "client", "to": NO_DB})],
 graph(["c:client:browser", "lb:load-balancer", "g1:websocket:edit gateway", "g2:websocket:edit gateway", "a:auth",
        "s:service:collaboration", "db:nosql:operation log", "k:cache:open documents", "q:queue:compaction jobs",
        "w:worker:snapshotter", "os:object-storage:snapshots"],
       ["c>lb", "lb>g1,g2", "g1,g2>a", "g1,g2>s", "s>db,k,q", "q>w", "w>db", "w>os", "s>w"]))

challenge(
 "Design group chat like Discord or Slack", [C, G, RES], "hard",
 "Clients keep a WebSocket to one of many gateway servers. A message goes to the messages service, which stores "
 "it in a wide-column database partitioned by channel and time, then publishes it on a pub/sub bus; every "
 "gateway with members of that channel pushes it to them. An indexer worker reads the same stream into a "
 "search index. A rate limiter in front stops spam floods.",
 [("deliver", "A message reaches everyone online in the channel within a second"),
  ("scale", "Servers with 100,000 members and millions of concurrent connections"),
  ("store", "History is kept forever and loads newest first"),
  ("search", "Users can search old messages")],
 [rule("ws", "path", "Clients connect through WebSocket gateways", "Messages are pushed, not polled.", "deliver",
       "websocket", **{"from": "client", "via": "websocket", "to": "service"}),
  rule("gateways", "has", "Several gateway servers", "Millions of connections are spread across many gateways.",
       "scale", "slack-rtm", of="websocket", min=2),
  rule("fanout", "path", "Messages fan out to gateways through pub/sub",
       "The sender's gateway doesn't know where the other members are connected; a bus delivers to all of them.",
       "deliver", "slack-rtm", **{"from": "service", "via": "queue", "to": "websocket"}),
  rule("store", "edge", "Messages are stored in a wide-column store",
       "Partitioning by channel and time bucket makes 'latest 50 messages' one fast read, even at trillions of rows.",
       "store", "discord", **{"from": "service", "to": "nosql"}),
  rule("search", "path", "An indexer feeds a search index from the message stream",
       "Searching trillions of messages needs an inverted index, updated asynchronously.", "search", "search-index",
       **{"from": "queue", "via": "worker", "to": "search"}),
  rule("limit", "path", "A rate limiter stops spam floods", "One bot must not be able to flood a channel.", None,
       "ratelimit", optional=True, **{"from": "client", "via": "rate-limiter", "to": "websocket"}),
  rule("no-direct", "no-edge", "Clients never talk to the stores directly",
       "Permissions and ordering are enforced by the service.", None, **{"from": "client", "to": NO_DB})],
 graph(["c:client:apps", "rl:rate-limiter", "lb:load-balancer", "g1:websocket:gateway", "g2:websocket:gateway",
        "s:service:messages", "db:nosql:messages (ScyllaDB)", "q:queue:pub/sub", "ix:worker:indexer",
        "se:search:message search"],
       ["c>rl", "rl>lb", "lb>g1,g2", "g1,g2>s", "s>db,q", "q>g1,g2", "q>ix", "ix>se"]))

challenge(
 "Design file sync like Dropbox", [C, G], "hard",
 "Clients split files into blocks named by their hash. They ask the metadata API which blocks are new (a block "
 "index in a key-value store makes duplicates free) and upload only those straight to object storage with "
 "pre-signed URLs, so an interrupted upload resumes from the last block. File and folder metadata lives in a "
 "relational database with transactions. Each change is published on a queue, and a notification service "
 "pushes it over a long-lived connection to the user's other devices.",
 [("upload", "Files of many gigabytes upload, and an interrupted upload resumes"),
  ("sync", "A change on one device appears on the user's other devices within seconds"),
  ("dedup", "Identical content is stored only once"),
  ("meta", "Folder listings and file versions are always consistent"),
  ("uptime", "The service keeps working when one server fails")],
 [rule("blocks", "edge", "Clients upload blocks straight to object storage",
       "Big uploads shouldn't pass through API servers; per-block uploads also make resuming trivial.", "upload",
       "valet", **{"from": "client", "to": "object-storage"}),
  rule("metadata", "edge", "Metadata lives in a relational database", "Moves and renames must be atomic.", "meta",
       "dropbox-sync", **{"from": "service", "to": "sql"}),
  rule("dedup", "edge", "Block hashes are indexed in a key-value store",
       "Looking up a block by its hash lets the client skip anything already stored.", "dedup", "cas",
       **{"from": "service", "to": "nosql"}),
  rule("push", "path", "Devices hold a connection to a notification service", "Devices learn about changes at once.",
       "sync", "websocket", **{"from": "client", "via": "websocket", "to": "service"}),
  rule("changes", "path", "Changes are published through a queue to the notifier",
       "The API that saved the change doesn't know where the user's other devices are connected.", "sync",
       **{"from": "service", "via": "queue", "to": "websocket"}),
  rule("front", "path", "API requests go through a load balancer", "Routes around failed instances.", "uptime", "lb",
       **{"from": "client", "via": ["load-balancer", "api-gateway"], "to": "service"}),
  rule("instances", "has", "At least two API instances", "One instance is a single point of failure.", "uptime", "lb",
       of="service", min=2),
  rule("no-db", "no-edge", "Clients never touch the databases", "Only the API may change metadata.", None,
       **{"from": "client", "to": ["sql", "nosql"]})],
 graph(["c:client:desktop & phone", "lb:load-balancer", "s1:service:metadata API", "s2:service:metadata API",
        "db:sql:metadata", "kv:nosql:block index", "os:object-storage:blocks", "q:queue:change events",
        "n:websocket:notifier"],
       ["c>lb", "lb>s1,s2", "s1,s2>db,kv,q", "c>os", "c>n", "n>s1", "q>n"]))

challenge(
 "Design ticket sales for a sold-out concert like Ticketmaster", [C, RES], "hard",
 "A virtual waiting room in front admits fans at the rate the booking service can handle. Seats and orders live "
 "in a relational database, where a conditional update or row lock makes double selling impossible. A chosen "
 "seat is held in Redis with a 10-minute expiry while the fan pays. Payment confirmation goes through a queue to "
 "workers that use idempotency keys, so a double click never charges twice; a scheduler releases holds that "
 "expired without payment.",
 [("spike", "2 million fans arrive in the first minute for 50,000 seats"),
  ("oversell", "A seat is never sold twice"),
  ("hold", "A chosen seat is held for 10 minutes while the fan pays"),
  ("pay", "A retry or double click never charges twice")],
 [rule("waiting-room", "path", "A waiting room admits fans at a safe rate",
       "Letting everyone in at once overloads the database; a waiting room is fairer than random errors.", "spike",
       "waiting-room", **{"from": "client", "via": "rate-limiter", "to": "service"}),
  rule("instances", "has", "At least two booking instances", "Peak traffic needs horizontal capacity.", "spike", "lb",
       of="service", min=2),
  rule("seats", "edge", "Seats and orders are in a relational database",
       "A transaction with a row lock or a conditional UPDATE guarantees one buyer per seat.", "oversell",
       "pg-locking", **{"from": "service", "to": "sql"}),
  rule("holds", "edge", "Seat holds live in a cache with a TTL",
       "An expiring key releases the seat automatically if the fan walks away.", "hold", "redis-expire",
       **{"from": "service", "to": "cache"}),
  rule("payments", "path", "Payments run through a queue and workers",
       "Payment providers are slow and flaky; a queue retries safely, and idempotency keys stop double charges.",
       "pay", "stripe-idem", **{"from": "service", "via": "queue", "to": "worker"}),
  rule("release", "path", "A scheduler releases expired holds", "Seats from abandoned checkouts go back on sale.",
       "hold", optional=True, **{"from": "scheduler", "to": "worker"}),
  rule("cdn", "edge", "Event pages come from a CDN", "Static pages shouldn't touch the booking servers.", None, "cdn",
       optional=True, **{"from": "client", "to": "cdn"}),
  rule("no-direct", "no-edge", "Clients never reach the stores directly", "All bookings go through the service.",
       None, **{"from": "client", "to": NO_DB})],
 graph(["c:client:fans", "cdn:cdn:event pages", "wr:rate-limiter:waiting room", "lb:load-balancer",
        "s1:service:booking", "s2:service:booking", "k:cache:seat holds", "db:sql:seats & orders",
        "q:queue:payments", "w:worker:payment", "sch:scheduler:hold expiry", "rw:worker:release holds"],
       ["c>cdn", "c>wr", "wr>lb", "lb>s1,s2", "s1,s2>k,db,q", "q>w", "w>db", "sch>rw", "rw>db,k"]))

challenge(
 "Design a payments API like Stripe", [C, G, SEC], "hard",
 "Merchants call the API through a rate limiter and a gateway that validates their API key. The payments "
 "service stores an idempotency key with each request in the same transaction as the charge, so a retry returns "
 "the first result. Money movements are rows in an append-only double-entry ledger, replicated to a standby. "
 "Events are written to an outbox and published on a queue; webhook workers deliver them, and a scheduler "
 "retries failed deliveries with backoff.",
 [("idem", "A retried request never creates a second charge"),
  ("ledger", "Every money movement is recorded and survives a database failure"),
  ("webhooks", "Merchants are notified of events, with retries if their server is down"),
  ("keys", "Only merchants with a valid API key can create charges"),
  ("limit", "One merchant's burst can't take the API down for others")],
 [rule("gateway", "path", "Requests pass through an API gateway", "One place to authenticate and route.", "keys",
       **{"from": "client", "via": "api-gateway", "to": "service"}),
  rule("keys", "edge", "The gateway validates API keys with an auth service", "No key, no charge.", "keys",
       **{"from": ["api-gateway", "service"], "to": "auth"}),
  rule("limit", "path", "A rate limiter in front of the API", "Per-merchant limits isolate noisy neighbours.",
       "limit", "ratelimit", **{"from": "client", "via": "rate-limiter", "to": "service"}),
  rule("idem", "edge", "Charges and idempotency keys are in a relational database",
       "A unique key stored in the same transaction as the charge makes retries safe.", "idem", "stripe-idem",
       **{"from": "service", "to": "sql"}),
  rule("standby", "edge", "The ledger database replicates to a standby",
       "Losing committed payments is not acceptable; a synchronous standby takes over.", "ledger", "replication",
       **{"from": "sql", "to": "replica"}),
  rule("events", "path", "Events go through a queue to webhook workers",
       "Written to an outbox in the payment's transaction, then published, so no event is lost or invented.",
       "webhooks", "outbox", **{"from": "service", "via": "queue", "to": "worker"}),
  rule("retries", "path", "A scheduler retries failed webhooks",
       "Merchant servers go down; retries with exponential backoff over days.", "webhooks", "stripe-webhooks",
       **{"from": "scheduler", "to": "worker"}),
  rule("no-direct", "no-edge", "Merchants never reach the database", "All writes are validated by the service.",
       None, **{"from": "client", "to": ["sql", "replica", "cache", "nosql"]})],
 graph(["c:client:merchant server", "rl:rate-limiter", "gw:api-gateway", "a:auth", "s1:service:payments",
        "s2:service:payments", "db:sql:ledger & idempotency keys", "r:replica:standby", "q:queue:events",
        "w:worker:webhook sender", "sch:scheduler:webhook retries"],
       ["c>rl", "rl>gw", "gw>a", "gw>s1,s2", "s1,s2>db,q", "db>r", "q>w", "sch>w", "w>db"]))

challenge(
 "Design a web crawler and search engine like Google", [C, G, PERF], "hard",
 "A scheduler decides which URLs are due and feeds a URL frontier queue. Many crawler workers take URLs from it, "
 "check per-host timing and cached robots.txt in a shared cache to stay polite, store the raw pages in object "
 "storage and push newly found links back onto the frontier. Indexer workers build an inverted index from the "
 "pages. A query service behind a load balancer answers searches from the index and caches popular queries.",
 [("crawl", "Crawl billions of pages and recrawl popular ones often"),
  ("polite", "Never hit one site too fast, and respect robots.txt"),
  ("store", "Keep the raw pages so the index can be rebuilt"),
  ("query", "Answer searches in under 200 ms")],
 [rule("frontier", "path", "A scheduler feeds a URL frontier queue that crawlers consume",
       "The frontier decides what to fetch next and how often to come back.", "crawl", "crawler",
       **{"from": "scheduler", "via": "queue", "to": "worker"}),
  rule("crawlers", "has", "Many crawler workers", "Billions of pages need thousands of parallel fetches.", "crawl",
       "competing", of="worker", min=2),
  rule("polite", "edge", "Crawlers share per-host timing and robots.txt in a cache",
       "Every crawler must know when a host was last hit and what it allows.", "polite", "robots",
       **{"from": "worker", "to": "cache"}),
  rule("raw", "edge", "Raw pages are stored in object storage", "Re-indexing must not mean re-crawling.", "store",
       **{"from": "worker", "to": "object-storage"}),
  rule("index", "edge", "Indexers build a search index", "An inverted index maps words to pages.", "query",
       "search-index", **{"from": "worker", "to": "search"}),
  rule("front", "path", "Searches go through a load balancer to a query service", "Spreads the load.", "query", "lb",
       **{"from": "client", "via": ["load-balancer", "api-gateway"], "to": "service"}),
  rule("serve", "edge", "The query service reads the index", "Answers come from the index, never from crawling.",
       "query", **{"from": "service", "to": "search"}),
  rule("cache", "edge", "Popular queries are cached", "A small share of queries is most of the traffic.", "query",
       "cache-aside", optional=True, **{"from": "service", "to": "cache"}),
  rule("no-direct", "no-edge", "Users never query the index directly", "The service ranks and filters results.",
       None, **{"from": "client", "to": NO_DB})],
 graph(["sch:scheduler:recrawl planner", "q:queue:URL frontier", "w1:worker:crawler", "w2:worker:crawler",
        "k:cache:host timing & robots.txt", "os:object-storage:raw pages", "pq:queue:fetched pages",
        "ix:worker:indexer", "se:search:inverted index", "c:client:browser", "lb:load-balancer",
        "s:service:query"],
       ["sch>q", "q>w1,w2", "w1,w2>k,os,pq,q", "pq>ix", "ix>os,se", "c>lb", "lb>s", "s>se,k"]))

challenge(
 "Design live streaming with chat like Twitch", [C, PERF, G], "hard",
 "The streamer sends one high-quality stream to an ingest service near them. Transcoder workers turn it into "
 "several qualities and write short segments and playlists to storage, and viewers fetch them through a CDN, "
 "so a million viewers cost the origin almost nothing and stay a few seconds behind. Chat is separate: viewers "
 "hold WebSockets to chat gateways, and a pub/sub bus fans each message out to every gateway.",
 [("ingest", "Streamers send one high-quality stream"),
  ("qualities", "Viewers can choose from several qualities"),
  ("latency", "Viewers are only a few seconds behind the streamer"),
  ("scale", "A single stream can have a million viewers"),
  ("chat", "Viewers chat live with each other")],
 [rule("ingest", "path", "Streams reach an ingest service through a load balancer",
       "Ingest servers are spread out so streamers connect to one close by.", "ingest", "lb",
       **{"from": "client", "via": ["load-balancer", "dns"], "to": "service"}),
  rule("transcode", "edge", "Ingest hands the stream to transcoders", "Each quality is a separate encode.",
       "qualities", "abr", **{"from": "service", "to": "worker"}),
  rule("segments", "edge", "Transcoders write short segments to storage",
       "Two-second segments and a playlist keep viewers close to live.", "latency", "hls",
       **{"from": "worker", "to": "object-storage"}),
  rule("cdn", "path", "Viewers watch through a CDN", "A million viewers must not hit the origin.", "scale", "cdn",
       **{"from": "client", "via": "cdn", "to": "object-storage"}),
  rule("chat-ws", "path", "Chat runs over WebSockets", "Messages are pushed instantly.", "chat", "websocket",
       **{"from": "client", "via": "websocket", "to": "service"}),
  rule("chat-fanout", "path", "Chat messages fan out through pub/sub",
       "Viewers of one channel are spread over many gateways.", "chat", "slack-rtm",
       **{"from": "service", "via": "queue", "to": "websocket"}),
  rule("no-origin", "no-edge", "Viewers never read the origin storage directly", "That would bypass the CDN.", None,
       "cdn", **{"from": "client", "to": "object-storage"})],
 graph(["st:client:streamer (OBS)", "v:client:viewers", "lb:load-balancer", "ing:service:ingest",
        "t1:worker:transcoder", "t2:worker:transcoder", "os:object-storage:segments", "cdn:cdn",
        "g1:websocket:chat gateway", "g2:websocket:chat gateway", "cs:service:chat", "q:queue:chat pub/sub"],
       ["st>lb", "lb>ing", "ing>t1,t2", "t1,t2>os", "v>cdn", "cdn>os", "v>g1,g2", "g1,g2>cs", "cs>q", "q>g1,g2"]))

challenge(
 "Design a distributed job scheduler like Airflow", [C, G, RES], "medium",
 "Users define jobs through an API that stores definitions and runs in a relational database. Two or more "
 "schedulers claim due runs from that database with row locks (SELECT ... FOR UPDATE SKIP LOCKED), so a run is "
 "started once even if a scheduler crashes. Claimed runs go on a queue to a pool of workers, which record each "
 "attempt in the database and ship logs to object storage. Runs that keep failing move to a dead-letter queue.",
 [("schedule", "Millions of jobs start at their scheduled time, to the minute"),
  ("once", "A run starts once, even if a scheduler crashes or two run at the same time"),
  ("retry", "Failed runs retry and end in a dead-letter queue after too many attempts"),
  ("status", "Users see each run's status and logs")],
 [rule("api", "path", "Users manage jobs through an API behind a load balancer", "One entry point.", "status", "lb",
       **{"from": "client", "via": ["load-balancer", "api-gateway"], "to": "service"}),
  rule("store", "edge", "Jobs and runs live in a relational database", "Runs and their state need transactions.",
       "status", "airflow", **{"from": "service", "to": "sql"}),
  rule("schedulers", "has", "At least two schedulers", "One scheduler is a single point of failure.", "once",
       of="scheduler", min=2),
  rule("claim", "edge", "Schedulers claim due runs from the database",
       "Row locks with SKIP LOCKED let several schedulers share the work without starting a run twice.", "once",
       "pg-locking", **{"from": "scheduler", "to": "sql"}),
  rule("dispatch", "path", "Runs go through a queue to workers", "Workers scale separately from schedulers.",
       "schedule", "queue-leveling", **{"from": "scheduler", "via": "queue", "to": "worker"}),
  rule("workers", "has", "A pool of workers", "Jobs run in parallel.", "schedule", "competing", of="worker", min=2),
  rule("attempts", "edge", "Workers record each attempt", "Retries need to know how many attempts were made.",
       "retry", **{"from": "worker", "to": "sql"}),
  rule("dlq", "has", "A separate dead-letter queue", "Poison jobs must stop retrying and wait for a person.",
       "retry", "dlq", of="queue", min=2),
  rule("logs", "edge", "Workers ship logs to object storage", "Logs are large and read rarely.", "status",
       **{"from": "worker", "to": "object-storage"})],
 graph(["c:client:web UI & CLI", "lb:load-balancer", "s:service:jobs API", "db:sql:jobs & runs",
        "sc1:scheduler", "sc2:scheduler", "q:queue:ready runs", "dq:queue:dead letters", "w1:worker",
        "w2:worker", "os:object-storage:logs"],
       ["c>lb", "lb>s", "s>db", "sc1,sc2>db,q", "q>w1,w2", "w1,w2>db,os,dq"]))


# ---- checks (mirror store.DesignSpec.validate and store.GradeDesign) ----

def grade(spec, g):
    kind = {n["id"]: n["kind"] for n in g["nodes"]}
    out = {}
    for e in g["edges"]:
        out.setdefault(e["from"], []).append(e["to"])

    def of(kinds):
        return [n["id"] for n in g["nodes"] if n["kind"] in kinds]

    def reaches(starts, pred):
        seen, queue = set(), [t for s in starts for t in out.get(s, [])]
        while queue:
            i = queue.pop(0)
            if i in seen:
                continue
            seen.add(i)
            if pred(i):
                return True
            queue += out.get(i, [])
        return False

    def edge(f, t):
        return any(kind[e["from"]] in f and kind[e["to"]] in t for e in g["edges"])

    res = []
    for r in spec["rules"]:
        k = r["kind"]
        if k == "has":
            ok = len(of(r["of"])) >= max(r.get("min", 1), 1)
        elif k == "edge":
            ok = edge(r["from"], r["to"])
        elif k == "no-edge":
            ok = not edge(r["from"], r["to"])
        elif not r.get("via"):
            ok = reaches(of(r["from"]), lambda i: kind[i] in r["to"])
        else:
            ok = any(reaches(of(r["from"]), lambda i, v=v: i == v) and reaches([v], lambda i: kind[i] in r["to"])
                     for v in of(r["via"]))
        res.append((r["id"], ok))
    return res


def check():
    used = set()
    prompts = [q["prompt"] for q in Q]
    assert len(prompts) == len(set(prompts)), "duplicate prompt"
    for q in Q:
        d = q["design"]
        reqs = {r["id"] for r in d["requirements"]}
        ids = [r["id"] for r in d["rules"]]
        assert len(ids) == len(set(ids)), (q["prompt"], "duplicate rule id")
        for r in d["rules"]:
            for key in ("of", "from", "to", "via"):
                assert set(r.get(key, [])) <= KINDS, (q["prompt"], r["id"], key)
            assert r.get("requirement") is None or r["requirement"] in reqs, (q["prompt"], r["id"])
            if "materialKey" in r:
                assert r["materialKey"] in MATERIALS, (q["prompt"], r["materialKey"])
                used.add(r["materialKey"])
        covered = {r.get("requirement") for r in d["rules"] if not r.get("optional")}
        assert reqs <= covered, (q["prompt"], "requirement without a required rule", reqs - covered)
        nodes = {n["id"] for n in d["reference"]["nodes"]}
        assert len(nodes) == len(d["reference"]["nodes"]), (q["prompt"], "duplicate node id")
        assert all(n["kind"] in KINDS for n in d["reference"]["nodes"]), q["prompt"]
        assert all(e["from"] in nodes and e["to"] in nodes for e in d["reference"]["edges"]), q["prompt"]
        failed = [i for i, ok in grade(d, d["reference"]) if not ok]
        assert not failed, (q["prompt"], "reference fails", failed)
    unused = set(MATERIALS) - used
    assert not unused, f"unused materials: {unused}"


check()
mats = [{"key": k, "type": t, "title": ti, "url": u, "author": a, "description": de}
        for k, (t, ti, u, a, de) in MATERIALS.items()]
with open(sys.argv[1], "w") as f:
    json.dump({"name": "System design: product-scale challenges", "materials": mats, "questions": Q}, f, indent=2,
              ensure_ascii=False)
print(f"System design: product-scale challenges: {len(Q)} challenges, "
      f"{sum(len(q['design']['rules']) for q in Q)} rules, {len(mats)} materials")
