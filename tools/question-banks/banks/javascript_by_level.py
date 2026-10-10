"""The JavaScript / Node.js interview guide by level (Junior, Mid, Senior). Level -> difficulty."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # tools/question-banks
from bankgen import build

ADD = "added"
EX, NODE, MDN, PRISMA = "Express", "Node.js", "MDN Web Docs", "Prisma"

M = {
 # from the guide's reading list
 "ex-routing": ("article", "Express: Routing", "https://expressjs.com/en/guide/routing.html", EX, "Route methods, paths, parameters and routers.", False),
 "ex-errors": ("article", "Express: Error handling", "https://expressjs.com/en/guide/error-handling.html", EX, "Error middleware and async errors.", False),
 "node-learn": ("link", "Node.js: Learn", "https://nodejs.org/en/learn", NODE, "Official Node.js guides.", False),
 "node-bp": ("link", "Node.js Best Practices", "https://github.com/goldbergyoni/nodebestpractices", "Yoni Goldberg", "A large, maintained list of Node.js practices.", False),
 "zod": ("link", "Zod", "https://zod.dev/", "Zod", "TypeScript-first schema validation.", False),
 "pino": ("link", "Pino", "https://getpino.io/", "Pino", "Fast structured JSON logger for Node.", False),
 "prisma": ("link", "Prisma documentation", "https://www.prisma.io/docs", PRISMA, "Schema, migrations and the Prisma client.", False),
 "bogard": ("article", "Vertical slice architecture", "https://www.jimmybogard.com/vertical-slice-architecture/", "Jimmy Bogard", "Organizing by feature instead of layer.", False),
 "richardson": ("article", "Richardson Maturity Model", "https://martinfowler.com/articles/richardsonMaturityModel.html", "Martin Fowler", "Levels of RESTfulness in practice.", False),
 "cqrs": ("article", "CQRS", "https://martinfowler.com/bliki/CQRS.html", "Martin Fowler", "Separate models for reading and writing.", ADD),
 "ddia": ("book", "Designing Data-Intensive Applications", "https://dataintensive.net/", "Martin Kleppmann", "Consistency, replication, partitioning and messaging in depth.", ADD),
 "msio": ("link", "microservices.io pattern language", "https://microservices.io/patterns/index.html", "Chris Richardson", "Outbox, saga, gateway and other patterns.", False),
 # added standard references
 "ex-middleware": ("article", "Express: Using middleware", "https://expressjs.com/en/guide/using-middleware.html", EX, "App-level, router-level and error middleware.", ADD),
 "ex-writing-mw": ("article", "Express: Writing middleware", "https://expressjs.com/en/guide/writing-middleware.html", EX, "next(), short-circuiting and configurable middleware.", ADD),
 "ex-5": ("article", "Express: Migrating to Express 5", "https://expressjs.com/en/guide/migrating-5.html", EX, "Rejected promises now reach the error handler.", ADD),
 "mdn-status": ("article", "HTTP response status codes", "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status", MDN, "What each status code means.", ADD),
 "rfc9457": ("article", "Problem Details for HTTP APIs (RFC 9457)", "https://datatracker.ietf.org/doc/html/rfc9457", "IETF", "A standard error body for HTTP APIs.", False),
 "pino-http": ("link", "pino-http", "https://github.com/pinojs/pino-http", "Pino", "Request logging middleware with redaction.", ADD),
 "als": ("article", "Asynchronous context tracking (AsyncLocalStorage)", "https://nodejs.org/api/async_context.html", NODE, "Request-scoped context without passing parameters.", ADD),
 "node-env": ("article", "How to read environment variables from Node.js", "https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs", NODE, "process.env and --env-file.", ADD),
 "node-signals": ("article", "process: signal events", "https://nodejs.org/api/process.html#signal-events", NODE, "SIGTERM, SIGHUP and graceful shutdown.", ADD),
 "node-uncaught": ("article", "process: 'uncaughtException' event", "https://nodejs.org/api/process.html#event-uncaughtexception", NODE, "Why the process should exit after one.", ADD),
 "prisma-migrate": ("article", "Prisma Migrate", "https://www.prisma.io/docs/orm/prisma-migrate", PRISMA, "Code First migrations from schema.prisma.", ADD),
 "prisma-introspect": ("article", "Introspection (prisma db pull)", "https://www.prisma.io/docs/orm/prisma-schema/introspection", PRISMA, "Generating the schema from an existing database.", ADD),
 "prisma-relations": ("article", "One-to-many relations", "https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/one-to-many-relations", PRISMA, "Relation fields and foreign keys.", ADD),
 "prisma-tx": ("article", "Transactions and batch queries", "https://www.prisma.io/docs/orm/prisma-client/queries/transactions", PRISMA, "$transaction and interactive transactions.", ADD),
 "nest-lifecycle": ("article", "NestJS: Request lifecycle", "https://docs.nestjs.com/faq/request-lifecycle", "NestJS", "Middleware, guards, interceptors, pipes and filters in order.", ADD),
 "helmet": ("link", "Helmet", "https://helmetjs.github.io/", "Helmet", "Security headers middleware for Express.", ADD),
 "multer": ("link", "Multer", "https://github.com/expressjs/multer", EX, "Multipart form and file upload middleware.", ADD),
 "node-cluster": ("article", "Cluster", "https://nodejs.org/api/cluster.html", NODE, "Running several Node processes to use all cores.", ADD),
 "bullmq": ("link", "BullMQ", "https://docs.bullmq.io/", "Taskforce.sh", "Redis-backed queues and jobs for Node.", ADD),
 "rfc9110": ("article", "HTTP Semantics (RFC 9110)", "https://datatracker.ietf.org/doc/html/rfc9110", "IETF", "Methods and status codes, including 204 and 404.", False),
 "sunset": ("article", "The Sunset HTTP Header Field (RFC 8594)", "https://datatracker.ietf.org/doc/html/rfc8594", "IETF", "Announcing when an endpoint goes away.", ADD),
 "versioning": ("article", "Google API design guide: Versioning", "https://cloud.google.com/apis/design/versioning", "Google Cloud", "Major versions and compatibility.", False),
 "monolith-first": ("article", "Monolith First", "https://martinfowler.com/bliki/MonolithFirst.html", "Martin Fowler", "Start with a monolith; split when boundaries are clear.", False),
 "gateway": ("article", "Pattern: API Gateway / Backends for Frontends", "https://microservices.io/patterns/apigateway.html", "microservices.io", "One entry point in front of services.", ADD),
 "normalization": ("article", "Database normalization", "https://en.wikipedia.org/wiki/Database_normalization", "Wikipedia", "Normal forms and update anomalies.", ADD),
 "explain": ("article", "Using EXPLAIN", "https://www.postgresql.org/docs/current/using-explain.html", "PostgreSQL documentation", "Reading query plans and actual row counts.", False),
 "use-the-index": ("link", "Use The Index, Luke!", "https://use-the-index-luke.com/", "Markus Winand", "How indexes work, for developers.", False),
 "cap": ("article", "CAP theorem", "https://en.wikipedia.org/wiki/CAP_theorem", "Wikipedia", "Consistency, availability and partition tolerance.", False),
 "eventual": ("article", "Eventually Consistent", "https://www.allthingsdistributed.com/2008/12/eventually_consistent.html", "Werner Vogels", "What eventual consistency means in practice.", ADD),
 "dist-lock": ("article", "How to do distributed locking", "https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html", "Martin Kleppmann", "Why leases need fencing tokens.", False),
 "pg-locking": ("article", "Explicit locking", "https://www.postgresql.org/docs/current/explicit-locking.html", "PostgreSQL documentation", "Row locks and advisory locks.", False),
 "pg-rls": ("article", "Row security policies", "https://www.postgresql.org/docs/current/ddl-rowsecurity.html", "PostgreSQL documentation", "Enforcing tenant isolation in the database.", ADD),
 "tenancy-models": ("article", "Tenancy models for a multitenant solution", "https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/tenancy-models", "Microsoft Learn", "Shared, schema and database per tenant.", False),
 "cache-aside": ("article", "Cache-Aside pattern", "https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside", "Microsoft Learn", "Load on miss, invalidate on write.", False),
 "graphql": ("link", "Learn GraphQL", "https://graphql.org/learn/", "GraphQL Foundation", "Queries, schemas and resolvers.", ADD),
 "grpc-node": ("link", "gRPC: Node quick start", "https://grpc.io/docs/languages/node/quickstart/", "gRPC", "Protobuf services in Node.", ADD),
 "load-leveling": ("article", "Queue-Based Load Leveling pattern", "https://learn.microsoft.com/en-us/azure/architecture/patterns/queue-based-load-leveling", "Microsoft Learn", "Absorbing spikes with a queue.", False),
 "delivery": ("article", "Message Delivery Guarantees", "https://docs.confluent.io/kafka/design/delivery-semantics.html", "Confluent", "At-most-once, at-least-once and exactly-once.", False),
 "idempotent-consumer": ("article", "Pattern: Idempotent consumer", "https://microservices.io/patterns/communication-style/idempotent-consumer.html", "microservices.io", "Handling duplicate messages safely.", False),
 "clean": ("article", "The Clean Architecture", "https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html", "Robert C. Martin", "Concentric layers and the dependency rule.", False),
 "rule-of-three": ("article", "Rule of three (computer programming)", "https://en.wikipedia.org/wiki/Rule_of_three_(computer_programming)", "Wikipedia", "Refactor duplication on the third occurrence.", ADD),
}

J, MID, S = "easy", "medium", "hard"
JS, API, OPS, SQL, ARCH = "JavaScript", "APIs & HTTP", "Testing & Operations", "SQL & Databases", "Architecture & DDD"
DIST, RES, PAT, SYS, SEC, ASYNC = ("Distributed Systems & Messaging", "Resilience & Scalability", "Design Principles & Patterns",
                                   "System Design", "Security", "Async & Concurrency")


def ex(text, code=None, lang="js"):
    return text if code is None else f"{text}\n\n```{lang}\n{code.strip(chr(10))}\n```"


Q = [
 # ---------------- Junior ----------------
 ("How do you handle POST, PUT and DELETE in an Express app?", [JS, API], J,
  "One handler per method and path, express.json() for bodies, and the right status: 201 with Location, 200/204, 204, or 404.",
  ["Handle every verb in app.all() and branch on req.method, since Express can only register one handler per path.",
   "Use app.get with a ?method= query parameter for writes.",
   "Return 200 for everything so clients don't need to check status."],
  ex("Register a handler per method and path, parse the body with `express.json()`, and return the right status: `201` (plus `Location`) for create, `200` or `204` for update, `204` for delete, `404` if missing.", r'''
import express from "express";
const app = express();
app.use(express.json());

app.post("/items", (req, res) => {
  const item = items.create(req.body);
  res.status(201).location(`/items/${item.id}`).json(item);
});
app.put("/items/:id", (req, res) => res.json(items.replace(req.params.id, req.body)));
app.delete("/items/:id", (req, res) => { items.remove(req.params.id); res.sendStatus(204); });
'''), ["ex-routing"]),
 ("How do you handle errors globally in Express, and what changed in Express 5?", [JS, API], J,
  "A four-argument (err, req, res, next) middleware registered last; Express 5 sends rejected async handlers there automatically.",
  ["Wrap app.listen in try/catch; Express 5 removed error middleware in favour of process-level handlers.",
   "Register the error middleware first so it can catch everything after it.",
   "Use window.onerror on the server."],
  ex("Register an error-handling middleware last; it has four parameters `(err, req, res, next)`. In Express 5 a rejected promise or thrown error in any handler reaches it. In Express 4 you must wrap async handlers and call `next(err)`.", r'''
app.use((err, req, res, next) => {
  req.log?.error(err);
  res.status(err.status ?? 500).json({ error: { message: err.expose ? err.message : "Internal error" } });
});
'''), ["ex-errors", "ex-5"]),
 ("How do you validate request input in a Node.js API?", [JS, API, SEC], J,
  "Validate req.body against a schema (Zod, Joi, Ajv) at the edge, return 400/422 with field errors, pass only parsed data on.",
  ["Trust req.body when the client is your own front end, since it already validated the form before sending it.",
   "Use TypeScript types, which validate request bodies at runtime.",
   "Check for the presence of fields with if (req.body) only."],
  ex("Never trust `req.body`. Validate against a schema (Zod, Joi, Ajv) at the edge, return `400` or `422` with field errors, and pass only validated data inward.", r'''
import { z } from "zod";
const CreateItem = z.object({ name: z.string().min(1), price: z.number().positive() });
const parsed = CreateItem.safeParse(req.body);
if (!parsed.success) return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
'''), ["zod"]),
 ("What makes a good Express route that takes a DTO, validates it and returns a custom error?", [JS, API], J,
  "Parse with a schema, return a stable error shape (code, message, details) with 422, and never leak stack traces.",
  ["Send err.stack back to the client so front-end developers can debug faster, with status 200 to keep caches happy.",
   "Throw a string so Express formats the error.",
   "Return 500 for any invalid input."],
  ex("A strong answer also says: a stable error shape (code, message, details), no stack traces to clients.", r'''
app.post("/items", (req, res) => {
  const r = CreateItem.safeParse(req.body);
  if (!r.success) {
    return res.status(422).json({
      error: { code: "VALIDATION_FAILED", message: "Invalid item", details: r.error.flatten().fieldErrors },
    });
  }
  res.status(201).json(items.create(r.data));
});
'''), ["zod", "rfc9457"]),
 ("How do you return different HTTP status codes from an Express handler?", [JS, API], J,
  "res.status(code).json(body): 200, 201, 204, 400/422, 401, 403, 404, 409, 429 and 500 for their specific meanings.",
  ["Express picks the status from the body type: objects give 200, strings give 201 and empty bodies give 404.",
   "Set res.code = 404 before res.send().",
   "Status codes can only be set in error middleware."],
  ex("`res.status(code).json(body)`. Common set: `200` OK, `201` created, `204` no content, `400/422` bad input, `401` unauthenticated, `403` forbidden, `404` not found, `409` conflict, `429` too many requests, `500` server fault."), ["mdn-status"]),
 ("In Express, what is the difference between app and express.Router, and when do you use each?", [JS, API], J,
  "app is the whole application; a Router is a mountable mini-app with its own routes and middleware, one per feature.",
  ["Router is the older API replaced by app in Express 5, so new code should register every route on app directly.",
   "app handles GET requests and Router handles POST requests.",
   "Routers run in a separate process for isolation."],
  ex("`app` is the whole application (settings, listen). A `Router` is a mountable mini-application with its own routes and middleware. Use one router per feature and mount it: `app.use(\"/items\", itemsRouter)`. (In NestJS the closer idea is plain controllers versus controllers with extra framework base classes; NestJS keeps controllers as decorated classes.)"), ["ex-routing"]),
 ("How do you centralize error handling in an Express codebase?", [JS, PAT], J,
  "Throw an AppError carrying status and code anywhere, and map it in the single error middleware; business code never touches res.",
  ["Handle errors in every route with res.status(...).json(...), so each handler controls its own error format.",
   "Log errors to console and let Express crash.",
   "Return null from services and check it in each route."],
  ex("Define an `AppError` class carrying `status` and `code`, throw it anywhere, and map it in the one error middleware. Business code never touches `res`.", r'''
class AppError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; this.expose = true; }
}
throw new AppError(404, "ITEM_NOT_FOUND", "Item not found");
'''), ["ex-errors"]),
 ("What is structured logging in Node.js, and why use it?", [JS, OPS], J,
  "JSON log objects with fields (level, msg, requestId, userId) that machines can filter, aggregate and trace across services.",
  ["Logging with console.log in a fixed order, which is faster than JSON and easier to search across services.",
   "Writing logs into the database inside each transaction.",
   "Logging only errors, never info or debug."],
  ex("Logs as JSON objects with fields (`level`, `time`, `msg`, `requestId`, `userId`, `durationMs`) instead of free text. Machines can filter, aggregate and alert on them; one request can be traced across lines and services.", r'''
import pino from "pino";
const logger = pino();
logger.info({ requestId, orderId }, "order created");
'''), ["pino"]),
 ("How do you write Node.js logs to a file, and what's better in containers?", [JS, OPS], J,
  "A Pino destination or Winston file transport with rotation; in containers, write JSON to stdout and let the platform collect it.",
  ["Use fs.writeFileSync on every log call, which is the standard approach and keeps logs in order under load.",
   "Node writes logs to /var/log automatically.",
   "Use console.error, which writes to a file by default."],
  ex("Pino: `pino(pino.destination(\"app.log\"))` or a transport. Winston: `new winston.transports.File({ filename })`. In containers the better practice is to write JSON to stdout and let the platform collect and rotate it; files need rotation (`logrotate`, `pino-roll`)."), ["pino"]),
 ("How does an Express middleware stop the request from continuing?", [JS, API], J,
  "It sends a response without calling next(), or calls next(err) to jump to the error handler.",
  ["It calls next(false), which tells Express to skip the remaining middleware and close the socket.",
   "It returns false from the middleware function.",
   "It calls res.end() and then next() so logging still runs."],
  ex("Do not call `next()`; send a response, or call `next(err)` to jump to the error handler.", r'''
const requireAuth = (req, res, next) => {
  if (!req.headers.authorization) return res.status(401).json({ error: "unauthenticated" });
  next();
};
'''), ["ex-writing-mw"]),
 ("How do you pass data between Express middleware, including deep in the call stack?", [JS, API], J,
  "res.locals or a typed req property between middleware; AsyncLocalStorage for request context deep in the call stack.",
  ["Global variables, because Node handles one request at a time on its single thread.",
   "Cookies set on the response and read back by later middleware.",
   "process.env, which is request-scoped."],
  ex("Use `res.locals` (request-scoped) or attach a typed property such as `req.user`. For deep call stacks without passing parameters, use `AsyncLocalStorage` (request id, tenant id).", r'''
import { AsyncLocalStorage } from "node:async_hooks";
export const ctx = new AsyncLocalStorage();
app.use((req, res, next) => ctx.run({ requestId: crypto.randomUUID() }, next));
'''), ["als", "ex-middleware"]),
 ("How should a Node.js service read configuration such as a connection string?", [JS], J,
  "Read process.env once at startup in one config module, validate it (e.g. Zod), freeze it, and import that object.",
  ["Read process.env.X directly in each handler, so changes to the environment apply without restarts.",
   "Hard-code values and use git branches per environment.",
   "Store configuration in localStorage."],
  ex("Read `process.env` once at startup in a single config module, validate it, freeze it, and import the config object everywhere. Do not scatter `process.env.X` through handlers.", r'''
const Env = z.object({ DATABASE_URL: z.string().url(), PORT: z.coerce.number().default(3000) });
export const config = Object.freeze(Env.parse(process.env));
'''), ["zod", "node-env"]),
 ("How do you access environment variables in Node.js?", [JS, OPS], J,
  "process.env.NAME (always strings, so convert and validate); --env-file or dotenv in development, secrets from the platform.",
  ["process.env returns typed values such as numbers and booleans, so no conversion is needed.",
   "Node reads .env automatically in every environment.",
   "Use require('env') to load them."],
  ex("`process.env.NAME` (always strings, so convert and validate). Load a `.env` file in development with `node --env-file=.env app.js` (Node 20.6+) or `dotenv`. Production values come from the platform or a secret store; never commit secrets."), ["node-env", "node-learn"]),
 ("How can a Node.js service reload configuration without restarting?", [JS, OPS], J,
  "Env vars need a restart; for file or remote config, watch it or handle SIGHUP, validate, then swap the reference atomically.",
  ["Re-read process.env in a setInterval, since the operating system updates a running process's environment.",
   "Call require.cache.clear() and re-import everything.",
   "Node reloads configuration automatically on SIGTERM."],
  ex("Environment variables need a restart. For file or remote config: watch the file (`fs.watch`) or listen for `SIGHUP`, validate the new config, then atomically swap the reference. Feature flags and a config service avoid restarts altogether.", r'''
let config = load();
process.on("SIGHUP", () => { try { config = load(); } catch (e) { logger.error(e); } });
'''), ["node-signals"]),
 ("What are the three ways a Node.js app can read configuration over time (like .NET's IOptions variants)?", [JS], J,
  "Once at startup (frozen constant), per request (a getter that rereads), or a live watcher that swaps a shared reference.",
  ["Synchronously, asynchronously, or via callbacks, which is how Node reads every configuration source.",
   "From JSON, YAML or TOML only.",
   "Through require, import or fetch."],
  ex("Three read strategies: a value read once at startup (frozen constant, like `IOptions`), a value read per request (a getter that rereads, like `IOptionsSnapshot`), and a live watcher that updates a shared reference and notifies subscribers (like `IOptionsMonitor`). Choose by how often it changes and whether in-flight requests may see a change mid-way."), ["node-bp"]),
 ("What is the difference between Code First and Database First with a Node ORM like Prisma?", [JS, SQL], J,
  "Code First: schema.prisma plus prisma migrate create the database. Database First: prisma db pull generates the schema.",
  ["Code First generates SQL from TypeScript types at runtime; Database First means writing raw SQL without an ORM.",
   "They're Prisma's two pricing tiers.",
   "Database First is only available for MongoDB."],
  ex("Code First: you define models in code, and migrations create or update the database (Prisma `schema.prisma` and `prisma migrate dev`). Database First: the database is the source of truth and you generate models from it (`prisma db pull`, `sequelize-auto`). Code First suits new services; Database First suits legacy or DBA-owned schemas."), ["prisma-migrate", "prisma-introspect"]),
 ("How do you define a one-to-many relationship in Prisma?", [JS, SQL], J,
  "The many side holds the foreign key field plus @relation; the one side has a list field. Index the foreign key.",
  ["Give both models a list field and Prisma creates a join table, the same way it models many-to-many.",
   "Store the child ids as a JSON array on the parent.",
   "Use a @oneToMany attribute on the parent model."],
  ex("The \"many\" side holds the foreign key. Index the foreign key.", r'''
model Author { id Int @id @default(autoincrement())
               name String
               posts Post[] }
model Post   { id Int @id @default(autoincrement())
               title String
               authorId Int
               author Author @relation(fields: [authorId], references: [id]) }
''', "prisma"), ["prisma-relations", "prisma"]),

 # ---------------- Mid ----------------
 ("In Node.js, what's the difference between constructor (factory) injection and method injection?", [JS, PAT], MID,
  "Factories receive dependencies once; method injection passes them per call, fitting per-call things like a transaction.",
  ["Method injection means monkey-patching module exports at runtime, which is the idiomatic way to inject in Node.",
   "Node has no dependency injection, so modules must import their dependencies directly.",
   "Constructor injection only works with TypeScript decorators."],
  ex("Constructor injection passes dependencies once when the object or factory is created; method injection passes them per call. JS usually uses factory functions or class constructors; method injection fits things that vary per call (a transaction, a request context).", r'''
const createOrderService = ({ repo, mailer }) => ({
  async place(order, tx) { await repo.save(order, tx); await mailer.send(order); },
});
'''), ["node-bp"]),
 ("What happens to a request in Express from arrival to response (and in NestJS)?", [JS, API], MID,
  "Middleware runs in registration order, the matching route handler responds; errors skip to error middleware; finish fires after.",
  ["Express runs all route handlers in parallel and sends whichever response finishes first.",
   "Error middleware runs before route handlers to catch errors early.",
   "Each request gets a new Node process."],
  ex("Server receives the request, it passes through middleware in registration order, a matching route handler runs, the response is sent. A thrown error or `next(err)` skips to error middleware. After sending, the `finish` and `close` events fire (useful for logging duration). In NestJS the order is middleware, guards, interceptors, pipes, handler, interceptors, exception filters."), ["ex-middleware", "nest-lifecycle"]),
 ("What are the Node.js equivalents of .NET action filters?", [JS, API], MID,
  "Route-level middleware (auth, validation), Fastify lifecycle hooks, or NestJS guards, pipes and interceptors.",
  ["Express has no equivalent, so cross-cutting logic must be copied into every route handler.",
   "process.on('request') listeners.",
   "Array.prototype.filter applied to the response body."],
  ex("Route-level middleware: `router.post(\"/items\", requireAuth, validate(CreateItem), handler)`. Fastify has lifecycle hooks (`preHandler`, `onSend`); NestJS has guards, pipes and interceptors. Use them for cross-cutting concerns: auth, validation, timing, caching."), ["ex-middleware", "nest-lifecycle"]),
 ("How do you log HTTP requests and responses in a Node.js API?", [JS, OPS, SEC], MID,
  "pino-http or morgan: method, path, status, duration, request id; redact secrets and skip bodies by default.",
  ["Log req and res objects in full with console.log, including bodies and headers, for complete audit trails.",
   "Log only the URL so logs stay small.",
   "Write a middleware that stores every request in Redis forever."],
  ex("Use `pino-http` or `morgan`. Log method, path, status, duration, request id, and user id. Redact secrets (`authorization`, passwords, tokens) and avoid logging bodies by default (privacy and volume); sample or log bodies only for failures.", r'''
import pinoHttp from "pino-http";
app.use(pinoHttp({ redact: ["req.headers.authorization"] }));
'''), ["pino-http"]),
 ("In Express, what are req.params, req.query, req.body and form data?", [JS, API], MID,
  "Path segments, query string, parsed payload (express.json / urlencoded), and multer for file uploads; all untrusted.",
  ["They're the same object exposed under four names for backward compatibility.",
   "req.params holds headers and req.query holds cookies.",
   "req.body is parsed automatically without any middleware."],
  ex("`params` come from the path (`/items/:id`), `query` from the query string, `body` from the payload (`express.json()` for JSON, `express.urlencoded()` for HTML forms, `multer` for file uploads). All are untrusted strings or objects: validate and convert each."), ["ex-routing", "multer"]),
 ("Why does middleware order matter in Express, and what's a typical order?", [JS, API], MID,
  "It runs in registration order: helmet and CORS, request id and logging, parsers, auth, rate limit, routes, 404, error handler.",
  ["Express sorts middleware by priority internally, so registration order only matters for performance.",
   "Error handlers must be registered first.",
   "Body parsers must run after the routes."],
  ex("Middleware runs in registration order. Typical order: security headers (`helmet`) and CORS, request id and logging, body parsers, auth, rate limit, routes, 404 handler, error handler. Wrong order gives bugs such as reading `req.body` before the parser, or auth running after a route."), ["ex-middleware", "helmet"]),
 ("What's the difference between app-level, router-level and error middleware in Express?", [JS, API], MID,
  "app.use applies to everything, router middleware to one router, and error middleware (4 params) only runs on errors.",
  ["App-level middleware only runs once at startup, router-level runs per request, and error middleware runs on 404s.",
   "They're interchangeable; the names describe file locations.",
   "Error middleware runs on every request after the response."],
  ex("App-level (`app.use`) applies to everything; router-level applies to one router; error middleware has four parameters and runs only when an error is passed. Scope middleware as narrowly as correctness allows."), ["ex-middleware"]),
 ("How should a Node.js process handle uncaughtException and unhandledRejection?", [JS, RES], MID,
  "Log, flush and exit non-zero so a supervisor restarts a clean process; also handle SIGTERM for graceful shutdown.",
  ["Log the error and keep serving requests, because exiting the process would drop every in-flight request.",
   "Ignore them; Node retries the failed code automatically.",
   "Convert them into 500 responses for the current request."],
  ex("Log, flush and exit with a non-zero code; let the supervisor (Kubernetes, systemd, PM2) restart a clean process. Continuing after an uncaught exception risks corrupt state. Also handle `SIGTERM` for graceful shutdown (stop accepting, finish in-flight requests, close DB)."), ["node-uncaught", "node-signals"]),
 ("How do you inject dependencies into a custom Express middleware?", [JS, PAT], MID,
  "Write a factory that takes the dependencies and returns the middleware, so it stays testable and global-free.",
  ["Attach dependencies to globalThis at startup, which every middleware can read without imports.",
   "Express injects services by parameter name automatically.",
   "Import the dependency inside the middleware on every request."],
  ex("Write a factory that takes dependencies and returns the middleware. This keeps it testable and avoids globals.", r'''
const rateLimit = ({ store, limit }) => async (req, res, next) => {
  if (await store.hit(req.ip) > limit) return res.sendStatus(429);
  next();
};
app.use(rateLimit({ store: redisStore, limit: 100 }));
'''), ["ex-writing-mw"]),
 ("For an Express API, when do you return 404 and when 204?", [API], MID,
  "404 when the addressed resource doesn't exist; 204 for success with no body; an empty collection is 200 with [].",
  ["204 when the resource doesn't exist and 404 when a list is empty, since both mean 'nothing found'.",
   "Always 200, with an error field when needed.",
   "404 for every DELETE so clients refresh."],
  ex("`404`: the resource does not exist (GET, PUT or DELETE by id of something unknown). `204`: the request succeeded and there is intentionally no body (successful DELETE or PUT). An empty collection is `200` with `[]`, not 404."), ["rfc9110"]),
 ("How do you handle a needed breaking change in a Node.js API?", [API], MID,
  "Avoid it with additive changes; if unavoidable, ship a new version, keep the old one, announce dates, watch usage, use contract tests.",
  ["Ship it in a patch release and bump the npm package version, which notifies every API consumer automatically.",
   "Change the old endpoint in place and document it in the README.",
   "Breaking changes are fine if the response stays JSON."],
  ex("Avoid it. Prefer additive, backward compatible changes (new optional fields, new endpoints). If a break is unavoidable: ship a new version, keep the old one running, announce deprecation with dates (`Deprecation` and `Sunset` headers), watch usage, and use contract tests with consumers."), ["sunset", "versioning"]),
 ("What's the most common way to version a Node.js REST API?", [API], MID,
  "In the URL path (/v1/items): visible, cacheable, simple to route; headers or a query parameter are the alternatives.",
  ["In the request body, because GET requests in Express can't carry version information any other way.",
   "In the package.json version field.",
   "With a cookie named api-version."],
  ex("URL path (`/v1/items`), because it is visible, cacheable and simple to route. Alternatives: a header (`Accept: application/vnd.api.v2+json`) or a query parameter. Pick one and be consistent."), ["versioning"]),
 ("Why map objects by hand between layers in a Node.js service?", [JS, PAT], MID,
  "Explicit conversion functions are type-safe and debuggable, and stop internal fields like password hashes from leaking.",
  ["Spreading the database row into the response is safer, since it keeps every field the client might need.",
   "Manual mapping is required because JSON.stringify can't serialize classes.",
   "It improves V8's garbage collection."],
  ex("Writing explicit functions that convert between layers (request DTO to domain model to DB row to response DTO). It is verbose but type-safe, easy to debug, and stops internal fields (password hash, internal ids) from leaking. Avoid magic auto-mappers unless the shapes are truly identical.", r'''
const toItemDto = (row) => ({ id: row.id, name: row.name, price: row.price_cents / 100 });
'''), ["node-bp"]),
 ("Where do most Express APIs sit on the Richardson Maturity Model?", [API], MID,
  "Level 2: resources with proper HTTP verbs and status codes; level 3 adds hypermedia links (HATEOAS).",
  ["Level 3, because Express adds hypermedia links to JSON responses automatically when routers are used.",
   "Level 0, since JSON APIs can't be RESTful.",
   "Level 1, because Express doesn't support DELETE."],
  ex("Four levels of REST adoption: 0 one endpoint, one verb (RPC over HTTP); 1 resources with their own URLs; 2 correct HTTP verbs and status codes; 3 hypermedia (HATEOAS: responses carry links to next actions). Most production APIs sit at level 2."), ["richardson"]),
 ("For a Node.js team, what separates a monolith, a modular monolith and microservices?", [ARCH, SYS], MID,
  "Modular monolith: one deployable with strict module boundaries and no cross-module DB access; microservices deploy and own data separately.",
  ["A modular monolith uses npm workspaces, while microservices use separate git repositories but share one database.",
   "Microservices are monoliths running in cluster mode.",
   "They only differ in the number of Express routers."],
  ex("Monolith: one deployable, usually tangled. Modular monolith: one deployable with strict module boundaries and no cross-module database access; cheap to run and a good default. Microservices: independently deployable services with their own data, giving team and scaling independence at the price of network failures, distributed data and operational cost. Split only when a boundary and a reason are clear."), ["monolith-first"]),
 ("What does an API gateway do in front of Node.js services, and what's the risk?", [API, SYS], MID,
  "Routes and handles auth, rate limits, TLS, aggregation, caching; risks are a single point of failure and creeping business logic.",
  ["It replaces each service's database with a shared cache and runs the business rules centrally for consistency.",
   "It compiles TypeScript for the services at request time.",
   "It's only needed for WebSocket traffic."],
  ex("A single entry point in front of services: routing, authentication, rate limiting, TLS, request aggregation, caching and observability. It spares clients from knowing the internal topology. Risks: a single point of failure and a place where business logic wrongly accumulates."), ["gateway"]),
 ("In a Node.js app's database, what is normalization and when do you denormalize?", [SQL], MID,
  "Store each fact once to avoid update anomalies; denormalize deliberately for read-heavy paths and keep copies in sync.",
  ["Normalization means converting rows to JSON documents; denormalize when you need foreign keys.",
   "It's lowercasing all string columns.",
   "Normalization is done automatically by Prisma migrations."],
  ex("Normalization removes duplicated data into separate tables to avoid update anomalies. Denormalize deliberately for read performance (reporting, search, read models, hot lists) and keep copies in sync through events or triggers; measure first."), ["normalization"]),
 ("Why do indexes speed up a Node.js app's queries, and what does adding too many cost?", [SQL], MID,
  "A B-tree lets the database find rows without a scan; each extra index slows writes, uses storage and burdens the planner.",
  ["Indexes store query results in memory, so they cost nothing and should be added to every column.",
   "Indexes only help Prisma, not raw SQL.",
   "Indexes speed up writes and slow down reads."],
  ex("An index (usually a B-tree) lets the database find rows without scanning the table. Costs: slower writes (every index updates), more storage, and more work for the query planner. Index columns used in filters, joins and sort; check plans with `EXPLAIN ANALYZE`; drop unused indexes."), ["explain", "use-the-index"]),

 # ---------------- Senior ----------------
 ("For a Node.js backend's data store, what does the CAP theorem force you to choose?", [DIST], S,
  "During a network partition, consistency or availability; partitions happen, so it's CP or AP, often per operation.",
  ["Two of consistency, availability and performance at design time; partitions only matter for multi-region setups.",
   "Between caching and persistence.",
   "Between SQL and NoSQL."],
  ex("In a network Partition a distributed store must choose between Consistency (every read sees the latest write) and Availability (every request gets a non-error response). Partitions happen, so the real choice is CP or AP during a partition. Many systems tune this per operation."), ["cap", "ddia"]),
 ("In a Node.js system, how do strong and eventual consistency differ for API design?", [DIST], S,
  "Strong: readers see every completed write. Eventual: replicas converge later, so design for staleness and idempotency.",
  ["Strong consistency is a JavaScript strict-mode setting; eventual consistency is the default in sloppy mode.",
   "Eventual consistency means data is eventually deleted.",
   "There's no difference once you use await."],
  ex("Strong: after a write completes, all readers see it (higher latency, lower availability). Eventual: replicas converge over time, so readers may see stale data briefly (higher availability and speed). Design UX and APIs for staleness (read-your-writes where needed, idempotent updates, conflict resolution)."), ["eventual"]),
 ("How does horizontal versus vertical scaling apply to Node.js specifically?", [RES, JS], S,
  "One process runs JS on one core, so scale out with several processes (cluster, containers) and keep sessions out of memory.",
  ["Node uses all cores automatically through the event loop, so vertical scaling is all you ever need.",
   "Horizontal scaling requires rewriting the app in worker threads.",
   "Node can't run behind a load balancer."],
  ex("Vertical: bigger machine (simple, capped, single point of failure). Horizontal: more instances (needs stateless services, shared or sharded data, load balancing). Node specifics: one process uses one core for JS, so run several processes (cluster, containers) and keep sessions out of memory."), ["node-cluster"]),
 ("When would a Node.js service use NoSQL instead of a relational database?", [SQL, SYS], S,
  "By access pattern: massive key lookups, flexible documents, graphs, time series; relational for transactions, joins and constraints.",
  ["Always, because JavaScript objects map directly to documents and relational drivers block the event loop.",
   "When the team prefers JSON over SQL syntax.",
   "Only for read-only data."],
  ex("Choose by access pattern and consistency needs, not fashion: massive scale and simple key access (key-value, wide column), flexible or hierarchical documents, graph traversals, time series. Stay relational for transactions, joins, constraints and ad hoc queries. PostgreSQL with `jsonb` covers many \"flexible\" cases."), ["ddia"]),
 ("What is a distributed lock in a Node.js system, and what are its risks?", [DIST], S,
  "A lock across processes (Redis NX PX, advisory locks); expiry mid-work, clocks and split brain mean you need fencing tokens.",
  ["A mutex from the async-mutex package, which is safe across servers because it uses the event loop.",
   "A Postgres transaction; the only risk is a slow commit.",
   "A file lock, which is always safe on NFS."],
  ex("A lock shared across processes (Redis `SET key val NX PX`, Redlock, Postgres advisory locks, ZooKeeper). Risks: expiry while the holder is still working (GC pauses, slow calls), clock assumptions, split brain, and deadlocks. Use TTLs, renew while working, and fencing tokens so the resource rejects stale holders; prefer idempotent operations or queue partitioning over locks."), ["dist-lock", "pg-locking"]),
 ("Optimistic versus pessimistic locking from a Node.js app: how do you implement each?", [SQL], S,
  "Pessimistic: SELECT ... FOR UPDATE inside a transaction. Optimistic: a version column in the WHERE; 0 rows updated means conflict.",
  ["Optimistic: wrap the update in a JavaScript lock; pessimistic: retry until the database stops throwing.",
   "Both need Redis; Postgres can't lock rows.",
   "Prisma does both automatically on every update."],
  ex("Pessimistic: lock the row up front (`SELECT ... FOR UPDATE`); safe under high contention, blocks others. Optimistic: no lock; a version column makes the update conditional and a conflict is retried or reported; best for low contention.", r'''
UPDATE items SET qty = $1, version = version + 1 WHERE id = $2 AND version = $3; -- 0 rows = conflict
''', "sql"), ["pg-locking"]),
 ("How do you design a multitenant database for a Node.js SaaS?", [SQL, SYS], S,
  "Shared tables with tenant_id (plus RLS), schema per tenant, or database per tenant; choose by isolation, compliance and scale.",
  ["One Prisma client per tenant pointing at the same tables, which isolates tenants without any tenant column.",
   "Separate tables named after each tenant in one schema.",
   "Store tenant data in browser storage."],
  ex("Three models: shared tables with a `tenant_id` (cheapest; enforce with Postgres row-level security and a mandatory tenant filter), schema per tenant (moderate isolation), database per tenant (strongest isolation, highest cost). Decide by isolation, compliance, noisy neighbours and tenant count. Always index `tenant_id` and test for cross-tenant leaks."), ["tenancy-models", "pg-rls"]),
 ("For a Node.js service, how do cache-aside, write-through and write-back differ?", [RES], S,
  "Cache-aside fills on miss and invalidates on write; write-through writes both; write-back flushes later and risks loss.",
  ["Cache-aside writes only to the cache; write-through writes only to the database; write-back reads from both.",
   "They're Redis eviction policies.",
   "They differ only in TTL length."],
  ex("Cache-aside: the app reads the cache, on miss reads the DB and fills the cache (most common; invalidate on write). Write-through: writes go to cache and DB together (consistent, slower writes). Write-back: write to cache, flush to DB later (fast, risk of data loss). Always set TTLs and plan stampede protection."), ["cache-aside"]),
 ("For Node.js services, when do you choose REST, gRPC or GraphQL?", [API], S,
  "REST outside (public, cacheable), gRPC inside (contracts, streaming, low latency), GraphQL for clients shaping their own data.",
  ["gRPC for browsers since it's JSON, REST for internal calls because it's binary, GraphQL only for files.",
   "Always GraphQL, since it replaces both.",
   "REST only; Node can't run gRPC servers."],
  ex("REST: public, cacheable, simple resource APIs. gRPC: internal service-to-service calls, strong contracts (protobuf), streaming, low latency. GraphQL: many different clients that need to shape their own data, at the cost of caching and query-cost control. Often: REST outside, gRPC inside."), ["grpc-node", "graphql"]),
 ("When should Node.js services use a message queue rather than calling each other's APIs?", [DIST], S,
  "When the answer isn't needed now: smoothing spikes, decoupled availability, retries, fan-out, long jobs; at the cost of eventual consistency.",
  ["Whenever latency matters, because queues deliver faster than HTTP between services.",
   "Only for logging and metrics.",
   "Never; queues block the event loop."],
  ex("When the caller does not need the answer now: smoothing spikes, decoupling availability, retries, fan-out to multiple consumers, long jobs. Use direct calls when you need an immediate result. Costs: eventual consistency, ordering, duplicates, observability."), ["load-leveling"]),
 ("For Node.js consumers, what do at-most-once, at-least-once and exactly-once mean?", [DIST], S,
  "At-most-once may lose, at-least-once may duplicate; exactly-once in practice is at-least-once delivery plus idempotent processing.",
  ["At-least-once may lose messages; exactly-once is what kafkajs and amqplib guarantee by default.",
   "They describe how many consumers share a queue.",
   "Exactly-once is achieved with setTimeout retries."],
  ex("At-most-once: may lose messages, never duplicates. At-least-once: never loses, may duplicate (the usual default). Exactly-once in practice is at-least-once delivery plus idempotent processing (dedupe by message id); true end-to-end exactly-once is only possible within a closed system such as Kafka transactions."), ["delivery"]),
 ("Which Node.js messaging libraries would you use, and how do you do idempotency and retries?", [JS, DIST], S,
  "kafkajs/confluent, amqplib, BullMQ, NATS; record processed ids with the effect (inbox), backoff with jitter, retry cap, DLQ.",
  ["Any library; retry failed messages immediately in a loop and rely on the broker to drop duplicates.",
   "Use setInterval polling of an HTTP endpoint instead of a broker.",
   "Idempotency isn't needed if handlers are async."],
  ex("Libraries: `kafkajs`/`@confluentinc/kafka-javascript`, `amqplib` (RabbitMQ), BullMQ (Redis jobs), NATS, cloud SDKs. Idempotency: carry a unique message id and record processed ids in a table inside the same transaction as the effect (inbox pattern), or use idempotency keys on HTTP writes. Retries: exponential backoff with jitter, a retry limit, and a dead-letter queue; only retry safe or idempotent work."), ["bullmq", "idempotent-consumer"]),
 ("How do you apply Clean Architecture's dependency rule in a Node.js codebase?", [ARCH], S,
  "The domain imports nothing from Express or Prisma; it declares ports that adapters implement, wired in one composition root.",
  ["Every module imports the Express app so it can register its own routes and database access directly.",
   "The domain extends Prisma models so entities can save themselves.",
   "It means one folder per npm dependency."],
  ex("Concentric layers: entities and use cases at the center, adapters (HTTP, DB, queues) outside. Dependencies point inward only: the domain imports nothing from Express or Prisma; it declares interfaces (ports) that outer code implements, wired in one composition root. Benefit: testable core and replaceable infrastructure. Do not apply it ceremonially to a tiny CRUD service."), ["clean"]),
 ("Should you wrap Prisma in Repository and Unit of Work classes?", [JS, ARCH], S,
  "Usually not: Prisma already offers repository-like APIs and $transaction; wrap only to shield the domain or ease testing.",
  ["Yes, always, because Prisma can't run transactions without a Unit of Work class around it.",
   "Never use Prisma directly from any code.",
   "Repositories are required for Prisma migrations."],
  ex("Prisma, TypeORM and Sequelize already implement unit of work and repository-like APIs (`prisma.$transaction`). Wrapping them adds a layer that is worth it only to protect domain code from the ORM or to ease testing; otherwise it is boilerplate. If you do, keep repositories small and aggregate-oriented, and let the use case own the transaction."), ["prisma-tx"]),
 ("In a Node.js codebase, what is Vertical Slice Architecture and how does it reduce coupling?", [ARCH], S,
  "Each feature keeps route, validation, handler, data access and tests together, so a change stays in one folder.",
  ["Splitting the code into controllers/, services/ and models/ folders shared by all features.",
   "Running each feature in its own Node worker thread.",
   "Giving each developer a vertical layer of the stack."],
  ex("Organise code by feature (a slice contains its route, validation, handler, data access and tests) instead of by technical layer. Changing a feature touches one folder; slices share little, so coupling between features is low and each slice can choose its own approach."), ["bogard"]),
 ("How do you organize a Node.js project with vertical slices?", [JS, ARCH], S,
  "src/features/<use-case>/ with route, schema, handler and tests; a small stable shared/ folder; app.ts mounts the feature routers.",
  ["src/controllers, src/services and src/repositories, with one file per feature in each folder.",
   "One npm package per HTTP route.",
   "Everything in index.js so imports stay short."],
  ex("A slice per use case, a small shared kernel, and one composition root that mounts each feature's router.", r'''
src/
  features/
    create-order/  route.ts  schema.ts  handler.ts  handler.test.ts
    get-order/     route.ts  query.ts   handler.ts
  shared/          logger.ts  db.ts  errors.ts   (small, stable)
  app.ts           (composition root, mounts feature routers)
''', "text"), ["bogard"]),
 ("In a Node.js vertical-slice project, how much duplication between slices is acceptable?", [ARCH, PAT], S,
  "Some: extract on the third repetition and share only stable things (errors, logging, auth, a small domain kernel).",
  ["None: extract a shared helper the moment two slices contain similar lines, including their DTOs and queries.",
   "All of it; slices should never share any code, not even logging.",
   "Duplication is fine only in tests."],
  ex("Accept some duplication: it is cheaper than the wrong abstraction. Apply the rule of three (extract on the third repetition), and share only genuinely stable things (error types, logging, auth, a small domain kernel). Do not share DTOs or query code between slices just to save lines."), ["rule-of-three", "bogard"]),
 ("How do you implement CQRS simply in a Node.js service?", [JS, ARCH], S,
  "Separate command and query handlers on one database first; add an event-fed read model only when reads need it.",
  ["CQRS in Node requires event sourcing and two databases from day one, otherwise queries can't scale.",
   "Split each route into a GET router and a POST router only.",
   "Use a message bus for every query."],
  ex("Separate commands (change state, return little) from queries (read only, return DTOs). Minimal version: two handlers per feature and the same database. Fuller version: a separate read model fed by events, which scales reads independently but adds eventual consistency. Start minimal.", r'''
const placeOrder = async (cmd) => { /* validate, write, publish OrderPlaced */ };
const getOrderSummary = async (id) => db.orderSummaries.findUnique({ where: { id } }); // read model
'''), ["cqrs", "msio"]),
]

assert len(Q) == 53, len(Q)

# Length balance (same approach as the .NET guide bank).
CLAUSES = [
    ", which is what the Express docs recommend for production apps",
    ", and that has been the default behaviour since Node 20",
    ", so no extra setup is needed for it to work",
    ", which is why most Node teams standardize on it",
    ", and it behaves the same in Express, Fastify and NestJS",
    ", which avoids the overhead of the alternatives entirely",
]
KEEP_LONGEST = 12
gaps = sorted(range(len(Q)), key=lambda i: len(Q[i][3]) - max(len(w) for w in Q[i][4]))
for n, i in enumerate(gaps[: len(Q) - KEEP_LONGEST]):
    prompt, tags, diff, correct, wrong, expl, keys = Q[i]
    lead = wrong[0].rstrip(".")
    k = n
    while len(lead) + 1 <= len(correct):
        lead += CLAUSES[k % len(CLAUSES)]
        k += 1
    Q[i] = (prompt, tags, diff, correct, [lead + ".", *wrong[1:]], expl, keys)

build("JavaScript / Node.js interview guide by level (junior, mid, senior)", M, Q, sys.argv[1],
      strip_backticks=False, canonical_tags=True)
