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
  ["One handler per method and path, and Express parses JSON bodies by default; return 200 for each write so clients stay simple.",
   "Route writes through app.get with a method query parameter, since fetch in browsers sends just GET and POST requests.",
   "Register one wildcard route and branch on req.method, since Express keeps one handler per path; return 200 with the body for each verb."],
  ex("Register a handler per method and path, parse the body with `express.json()`, and return the right status: `201` (plus `Location`) for create, `200` or `204` for update, `204` for delete, `404` if missing.\n\nWhy the others are wrong: Express does not parse bodies until you add `express.json()`, and returning 200 for everything hides created/empty/missing outcomes; `fetch` can send `PUT`, `DELETE` and `PATCH`, and writes over GET break caching and safety guarantees; and Express happily registers many handlers per path, one per method (`app.post`, `app.put`...).", r'''
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
  ["A three-argument (req, res, next) middleware registered last that checks res.error; Express 5 added a built-in app.onError hook.",
   "Wrap app.listen in try/catch to catch route errors; Express 5 removed error middleware in favour of process-level handlers.",
   "A four-argument (err, req, res, next) middleware registered first; Express 5 still needs async handlers wrapped in try/catch."],
  ex("Register an error-handling middleware last; it has four parameters `(err, req, res, next)`. In Express 5 a rejected promise or thrown error in any handler reaches it. In Express 4 you must wrap async handlers and call `next(err)`.\n\nWhy the others are wrong: Express recognises error middleware by its four parameters, there is no `res.error` or `app.onError`; `app.listen` returns immediately, so its try/catch never sees request errors, and Express 5 kept error middleware; and error middleware must come after the routes, while Express 5 is exactly the version that forwards rejected promises without wrappers.", r'''
app.use((err, req, res, next) => {
  req.log?.error(err);
  res.status(err.status ?? 500).json({ error: { message: err.expose ? err.message : "Internal error" } });
});
'''), ["ex-errors", "ex-5"]),
 ("How do you validate request input in a Node.js API?", [JS, API, SEC], J,
  "Validate req.body against a schema (Zod, Joi, Ajv) at the edge, return 400/422 with field errors, pass only parsed data on.",
  ["Declare the body with TypeScript interfaces, which the compiler turns into runtime checks that reject bad input with 400.",
   "Check each field with if statements inside the handler and coerce wrong types silently so requests don't fail.",
   "Skip server checks when the client is your own front end, since its form validation already ran, and rely on the database constraints."],
  ex("Never trust `req.body`. Validate against a schema (Zod, Joi, Ajv) at the edge, return `400` or `422` with field errors, and pass only validated data inward.\n\nWhy the others are wrong: TypeScript types are erased at compile time and check nothing at runtime; ad hoc checks scattered through handlers miss cases, and silent coercion hides client bugs instead of returning a 400/422; and anyone can call the API directly, bypassing the front end, while database errors give poor messages and catch only some rules.", r'''
import { z } from "zod";
const CreateItem = z.object({ name: z.string().min(1), price: z.number().positive() });
const parsed = CreateItem.safeParse(req.body);
if (!parsed.success) return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
'''), ["zod"]),
 ("What makes a good Express route that takes a DTO, validates it and returns a custom error?", [JS, API], J,
  "Parse with a schema, return a stable error shape (code, message, details) with 422, and never leak stack traces.",
  ["Parse with a schema and throw the Zod error as is, so Express serializes its full issue list and stack with status 500.",
   "Validate with a schema and return 500 with a message string, since invalid input means the request failed on the server.",
   "Parse with a schema and send err.stack with status 400, so front-end developers can see where validation failed."],
  ex("Parse the body with a schema; on failure return `422` (or `400`) with a stable error shape (`code`, `message`, field `details`, ideally RFC 9457 problem details) that clients can rely on, and never send stack traces to clients. On success pass only the parsed data on and return `201` for a create.\n\nWhy the others are wrong: an unhandled Zod error becomes a 500 with internals instead of a client error with a stable shape; invalid input is a client error (400/422), 500 means the server failed; and stack traces leak implementation details to attackers and are useless to clients compared to field-level details.", r'''
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
  ["Express infers it from the body: objects send 200, strings send 201 and an empty body sends 204, with no extra call needed.",
   "Assign res.code = 404 before res.send(); Express reads that property when it writes the response headers.",
   "Call res.send(body, code) with the status as the second argument, which is the form Express 5 recommends."],
  ex("`res.status(code).json(body)`. Common set: `200` OK, `201` created, `204` no content, `400/422` bad input, `401` unauthenticated, `403` forbidden, `404` not found, `409` conflict, `429` too many requests, `500` server fault.\n\nWhy the others are wrong: Express defaults to 200 whatever the body type; `res.code` is not read by anything (the real Node property is `res.statusCode`, and `res.status()` is the idiomatic setter); and the old two-argument `res.send` forms were deprecated in Express 4 and removed in Express 5."), ["mdn-status"]),
 ("In Express, what is the difference between app and express.Router, and when do you use each?", [JS, API], J,
  "app is the whole application; a Router is a mountable mini-app with its own routes and middleware, one per feature.",
  ["app handles requests and settings, and a Router is a lighter app for read routes (GET) that skips the middleware stack.",
   "A Router runs its routes in a separate worker, so slow features don't block app; use one per CPU-heavy feature.",
   "Router is the older API replaced in Express 5, so new code registers each route on app directly and avoids mounting."],
  ex("`app` is the whole application (settings, listen). A `Router` is a mountable mini-application with its own routes and middleware. Use one router per feature and mount it: `app.use(\"/items\", itemsRouter)`. (In NestJS the closest equivalent is a feature module with its own controllers.)\n\nWhy the others are wrong: a Router supports every HTTP method and has its own middleware stack; it runs in the same process and thread as the app; and `express.Router()` is fully supported in Express 5 and is the recommended way to split routes by feature."), ["ex-routing"]),
 ("How do you centralize error handling in an Express codebase?", [JS, PAT], J,
  "Throw an AppError carrying status and code anywhere, and map it in the single error middleware; business code never touches res.",
  ["Return null from services on failure and let each route turn the null into a 404 or 500 response as it sees fit.",
   "Handle errors in each route with res.status(...).json(...), so each handler controls its own error format.",
   "Log errors in the service where they occur and swallow them, returning a default value so routes can skip error handling entirely."],
  ex("Define an `AppError` class carrying `status` and `code`, throw it anywhere, and map it in the one error middleware. Business code never touches `res`.\n\nWhy the others are wrong: a `null` carries no reason, so routes guess the status and the shape drifts; per-route handling duplicates code and produces inconsistent error formats; and swallowing errors hides failures and returns wrong data as if it were correct.", r'''
class AppError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; this.expose = true; }
}
throw new AppError(404, "ITEM_NOT_FOUND", "Item not found");
'''), ["ex-errors"]),
 ("What is structured logging in Node.js, and why use it?", [JS, OPS], J,
  "JSON log objects with fields (level, msg, requestId, userId) that machines can filter, aggregate and trace across services.",
  ["Logging to separate files per level (error.log, info.log) so each file has a predictable structure for grep.",
   "Writing log lines into a database table inside each transaction, so logs and data stay consistent and queryable.",
   "Formatted console.log lines with a fixed column order, which are faster than JSON and easier for log tools to search and index."],
  ex("Logs as JSON objects with fields (`level`, `time`, `msg`, `requestId`, `userId`, `durationMs`) instead of free text. Machines can filter, aggregate and alert on them; one request can be traced across lines and services.\n\nWhy the others are wrong: splitting by level is about routing, the lines are still free text; logging inside transactions loses the log when the transaction rolls back and adds load to the database; and free-text lines need fragile parsing, while JSON loggers like Pino are among the fastest options.", r'''
import pino from "pino";
const logger = pino();
logger.info({ requestId, orderId }, "order created");
'''), ["pino"]),
 ("How do you write Node.js logs to a file, and what's better in containers?", [JS, OPS], J,
  "A Pino destination or Winston file transport with rotation; in containers, write JSON to stdout and let the platform collect it.",
  ["Set NODE_LOG_FILE so Node redirects console output to that file; in containers, mount a volume and log to it.",
   "console.error writes to a log file by default; in containers, write logs to /var/log so the platform rotates them.",
   "fs.writeFileSync on each log call so lines stay ordered; in containers, write to a file inside the image."],
  ex("Pino: `pino(pino.destination(\"app.log\"))` or a transport. Winston: `new winston.transports.File({ filename })`. In containers the better practice is to write JSON to stdout and let the platform collect and rotate it; files need rotation (`logrotate`, `pino-roll`).\n\nWhy the others are wrong: Node has no `NODE_LOG_FILE` setting, and in containers stdout is the collected stream; `console.error` writes to stderr, not a file, and nothing rotates `/var/log` inside a container; and synchronous writes block the event loop on every log call, while files inside the container vanish with it."), ["pino"]),
 ("How does an Express middleware stop the request from continuing?", [JS, API], J,
  "It sends a response without calling next(), or calls next(err) to jump to the error handler.",
  ["It calls next(false), which tells Express to skip the remaining middleware and close the connection.",
   "It returns false from the middleware function, and Express then ends the request with a 403.",
   "It calls res.end() and then next(), so later middleware still runs but leaves the response alone."],
  ex("Do not call `next()`; send a response, or call `next(err)` to jump to the error handler.\n\nWhy the others are wrong: Express has no `next(false)` (it has `next('route')` and `next('router')`, which skip to other routes); Express ignores a middleware's return value; and calling `next()` after responding lets later handlers try to respond again, which fails with \"headers already sent\".", r'''
const requireAuth = (req, res, next) => {
  if (!req.headers.authorization) return res.status(401).json({ error: "unauthenticated" });
  next();
};
'''), ["ex-writing-mw"]),
 ("How do you pass data between Express middleware, including deep in the call stack?", [JS, API], J,
  "res.locals or a typed req property between middleware; AsyncLocalStorage for request context deep in the call stack.",
  ["process.env entries set per request, since each request gets its own copy of the environment in Node.",
   "Module-level variables, since Node handles one request at a time on its single thread until that response is fully sent.",
   "Cookies set on the response and read by later middleware in the same request; globalThis for deeper code."],
  ex("Use `res.locals` (request-scoped) or attach a typed property such as `req.user`. For deep call stacks without passing parameters, use `AsyncLocalStorage` (request id, tenant id).\n\nWhy the others are wrong: `process.env` is one shared object for the whole process; Node interleaves many requests on one thread, so module-level state leaks between concurrent requests; and a response cookie is not visible on the current request, while `globalThis` is shared by every request.", r'''
import { AsyncLocalStorage } from "node:async_hooks";
export const ctx = new AsyncLocalStorage();
app.use((req, res, next) => ctx.run({ requestId: crypto.randomUUID() }, next));
'''), ["als", "ex-middleware"]),
 ("How should a Node.js service read configuration such as a connection string?", [JS], J,
  "Read process.env once at startup in one config module, validate it (e.g. Zod), freeze it, and import that object.",
  ["Keep the values, connection string included, in a config.json committed to the repo and read it with require where needed.",
   "Read process.env.X directly in each handler, so changes to the environment apply without a restart.",
   "Hard-code defaults in the code and use a git branch per environment, merging config changes between them."],
  ex("Read `process.env` once at startup in a single config module, validate it, freeze it, and import the config object everywhere. Do not scatter `process.env.X` through handlers.\n\nWhy the others are wrong: committing connection strings leaks secrets and ties config to builds; a running process's environment doesn't change from outside, and scattered reads skip validation and fail late; and per-environment branches drift apart and make every deploy a merge.", r'''
const Env = z.object({ DATABASE_URL: z.string().url(), PORT: z.coerce.number().default(3000) });
export const config = Object.freeze(Env.parse(process.env));
'''), ["zod", "node-env"]),
 ("How do you access environment variables in Node.js?", [JS, OPS], J,
  "process.env.NAME (always strings, so convert and validate); --env-file or dotenv in development, secrets from the platform.",
  ["process.env.NAME, which returns numbers and booleans already parsed; --env-file loads production secrets from the repo.",
   "require('env').NAME, the built-in env module; dotenv is needed in production because Node doesn't read the OS environment itself.",
   "process.env.NAME; Node 22 loads a .env file from the working directory automatically, so dotenv is no longer needed."],
  ex("`process.env.NAME` (always strings, so convert and validate). Load a `.env` file in development with `node --env-file=.env app.js` (Node 20.6+) or `dotenv`. Production values come from the platform or a secret store; never commit secrets.\n\nWhy the others are wrong: every `process.env` value is a string (or `undefined`), and production secrets shouldn't live in repo files; there is no built-in `env` module, and `process.env` already exposes the OS environment; and Node loads a `.env` file only when asked (`--env-file` or `process.loadEnvFile()`)."), ["node-env", "node-learn"]),
 ("How can a Node.js service reload configuration without restarting?", [JS, OPS], MID,
  "Env vars need a restart; for file or remote config, watch it or handle SIGHUP, validate, then swap the reference atomically.",
  ["Send SIGTERM; Node rereads process.env and its config files on that signal and continues without restarting.",
   "Re-read process.env on a timer, since the OS updates a running process's environment when the variable changes in the shell or the service config.",
   "Clear require.cache and re-import the config module; that also refreshes process.env from the shell."],
  ex("Environment variables need a restart. For file or remote config: watch the file (`fs.watch`) or listen for `SIGHUP`, validate the new config, then atomically swap the reference. Feature flags and a config service avoid restarts altogether.\n\nWhy the others are wrong: `SIGTERM` asks the process to shut down, and Node reloads nothing by itself; a process's environment is copied at start and outside changes don't reach it; and clearing the module cache re-runs the module but `process.env` stays the same (and ESM has no `require.cache`).", r'''
let config = load();
process.on("SIGHUP", () => { try { config = load(); } catch (e) { logger.error(e); } });
'''), ["node-signals"]),
 ("What are the three ways a Node.js app can read configuration over time (like .NET's IOptions variants)?", [JS], MID,
  "Once at startup (frozen constant), per request (a getter that rereads), or a live watcher that swaps a shared reference.",
  ["Through Node's require, dynamic import() or fetch, which map to IOptions, IOptionsSnapshot and IOptionsMonitor in that order.",
   "From JSON, YAML or TOML files, one per environment, which Node merges in a fixed order at startup.",
   "Synchronously, with callbacks or with promises; the choice decides whether in-flight requests see changes."],
  ex("Three read strategies: a value read once at startup (frozen constant, like `IOptions`), a value read per request (a getter that rereads, like `IOptionsSnapshot`), and a live watcher that updates a shared reference and notifies subscribers (like `IOptionsMonitor`). Choose by how often it changes and whether in-flight requests may see a change mid-way.\n\nWhy the others are wrong: the loading mechanism says nothing about when values refresh; Node has no built-in config merging, and file format is unrelated to lifetime; and sync versus async reading is an API style, not a refresh strategy."), ["node-bp"]),
 ("What is the difference between Code First and Database First with a Node ORM like Prisma?", [JS, SQL], J,
  "Code First: schema.prisma plus prisma migrate create the database. Database First: prisma db pull generates the schema.",
  ["Code First: Prisma generates SQL from TypeScript types at runtime. Database First: raw SQL with no ORM involved.",
   "Code First: prisma db pull writes models into code. Database First: prisma migrate creates tables from them.",
   "Code First: Prisma Client creates missing tables on its first query. Database First: prisma generate creates the database tables."],
  ex("Code First: you define models in code, and migrations create or update the database (Prisma `schema.prisma` and `prisma migrate dev`). Database First: the database is the source of truth and you generate models from it (`prisma db pull`, `sequelize-auto`). Code First suits new services; Database First suits legacy or DBA-owned schemas.\n\nWhy the others are wrong: Prisma works from `schema.prisma`, not TypeScript types, and Database First still uses the ORM; the commands are swapped; and the client never creates tables, while `prisma generate` only generates the typed client."), ["prisma-migrate", "prisma-introspect"]),
 ("How do you define a one-to-many relationship in Prisma?", [JS, SQL], J,
  "The many side holds the foreign key field plus @relation; the one side has a list field. Index the foreign key.",
  ["Give both models a list field and Prisma creates an implicit join table, which is how it models one-to-many.",
   "Store the child ids as a scalar list (Int[]) on the parent; Prisma resolves them into a proper relation automatically.",
   "The one side holds the foreign key plus @relation; the many side has a single field pointing back. Index it."],
  ex("The \"many\" side holds the foreign key. Index the foreign key.\n\nWhy the others are wrong: list fields on both sides define an implicit many-to-many; a scalar list is plain data with no foreign key or relation behind it; and the foreign key belongs on the many side, since one parent row can't hold a column per child.", r'''
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
  ["Method injection means monkey-patching module exports at runtime; factories do the same through require.cache.",
   "Factories need TypeScript decorators and a container; method injection is the plain-JS form that passes them once.",
   "Factories receive dependencies per call; method injection sets them once on the prototype, fitting long-lived app-wide services."],
  ex("Constructor injection passes dependencies once when the object or factory is created; method injection passes them per call. JS usually uses factory functions or class constructors; method injection fits things that vary per call (a transaction, a request context).\n\nWhy the others are wrong: monkey-patching is a testing hack, not injection; a factory is a plain function taking its dependencies, no decorators or container needed, and method injection passes per call, not once; and the definitions are swapped.", r'''
const createOrderService = ({ repo, mailer }) => ({
  async place(order, tx) { await repo.save(order, tx); await mailer.send(order); },
});
'''), ["node-bp"]),
 ("What happens to a request in Express from arrival to response (and in NestJS)?", [JS, API], MID,
  "Middleware runs in registration order, the matching route handler responds; errors skip to error middleware; finish fires after.",
  ["Each request gets its own worker, which runs middleware in registration order before the matching route responds.",
   "Route handlers run first, then middleware in registration order adds headers; errors go to the error middleware.",
   "Middleware runs in registration order, but error middleware runs before route handlers to catch errors early."],
  ex("Server receives the request, it passes through middleware in registration order, a matching route handler runs, the response is sent. A thrown error or `next(err)` skips to error middleware. After sending, the `finish` and `close` events fire (useful for logging duration). In NestJS the order is middleware, guards, interceptors, pipes, handler, interceptors, exception filters.\n\nWhy the others are wrong: Express handles every request on the one event-loop thread; middleware and routes share one ordered stack, so middleware registered before a route runs before it; and error middleware is skipped until an error is passed, so it belongs after the routes."), ["ex-middleware", "nest-lifecycle"]),
 ("What are the Node.js equivalents of .NET action filters?", [JS, API], MID,
  "Route-level middleware (auth, validation), Fastify lifecycle hooks, or NestJS guards, pipes and interceptors.",
  ["Express's app.filter() hook, Fastify's filters array, and NestJS @Filter() decorators on each handler.",
   "There are none in Express; cross-cutting logic is copied into each handler, and NestJS limits it to exception filters.",
   "process.on('request') listeners for Express, and Fastify's onRequest event emitted on the process object."],
  ex("Route-level middleware: `router.post(\"/items\", requireAuth, validate(CreateItem), handler)`. Fastify has lifecycle hooks (`preHandler`, `onSend`); NestJS has guards, pipes and interceptors. Use them for cross-cutting concerns: auth, validation, timing, caching.\n\nWhy the others are wrong: those APIs don't exist (NestJS has exception filters via `@UseFilters`, which only handle errors); route-level middleware is Express's equivalent, and NestJS also offers guards, pipes and interceptors; and requests are not events on `process` (Fastify's `onRequest` is a hook on the Fastify instance)."), ["ex-middleware", "nest-lifecycle"]),
 ("How do you log HTTP requests and responses in a Node.js API?", [JS, OPS, SEC], MID,
  "pino-http or morgan: method, path, status, duration, request id; redact secrets and skip bodies by default.",
  ["A middleware that stores each request and response in Redis indefinitely, so you can replay any of them later.",
   "console.log of the full req and res objects, including headers and bodies, for a complete audit trail.",
   "pino-http or morgan logging just the URL, so logs stay small; status and duration belong in metrics instead."],
  ex("Use `pino-http` or `morgan`. Log method, path, status, duration, request id, and user id. Redact secrets (`authorization`, passwords, tokens) and avoid logging bodies by default (privacy and volume); sample or log bodies only for failures.\n\nWhy the others are wrong: keeping everything forever is a privacy and cost problem and not a logging pipeline; full objects leak tokens, passwords and personal data and are unstructured; and status, duration and request id are what make request logs useful for debugging.", r'''
import pinoHttp from "pino-http";
app.use(pinoHttp({ redact: ["req.headers.authorization"] }));
'''), ["pino-http"]),
 ("In Express, what are req.params, req.query, req.body and form data?", [JS, API], J,
  "Path segments, query string, parsed payload (express.json / urlencoded), and multer for file uploads; all untrusted.",
  ["Path segments, query string and raw payload; Express parses JSON and multipart form data into req.body by default.",
   "req.params holds request headers, req.query the parsed cookies, and req.body the JSON payload once express.json() has run.",
   "Path segments, query string and payload, which Express validates and converts to numbers and booleans for you."],
  ex("`params` come from the path (`/items/:id`), `query` from the query string, `body` from the payload (`express.json()` for JSON, `express.urlencoded()` for HTML forms, `multer` for file uploads). All are untrusted strings or objects: validate and convert each.\n\nWhy the others are wrong: `req.body` is `undefined` until a parser runs, and multipart needs `multer` or similar; headers live in `req.headers` and cookies need `cookie-parser`; and Express validates nothing, params and query values arrive as strings."), ["ex-routing", "multer"]),
 ("Why does middleware order matter in Express, and what's a typical order?", [JS, API], MID,
  "It runs in registration order: helmet and CORS, request id and logging, parsers, auth, rate limit, routes, 404, error handler.",
  ["It runs in registration order: error handler first so it wraps everything after it, then parsers, auth, routes and the 404 handler.",
   "It runs in registration order: routes first so they match quickly, then body parsers, auth, logging and errors.",
   "Express sorts middleware by type internally, so registration order affects just performance, not behaviour."],
  ex("Middleware runs in registration order. Typical order: security headers (`helmet`) and CORS, request id and logging, body parsers, auth, rate limit, routes, 404 handler, error handler. Wrong order gives bugs such as reading `req.body` before the parser, or auth running after a route.\n\nWhy the others are wrong: error middleware only receives errors from middleware registered before it, so it goes last; routes before parsers see no `req.body`, and auth after routes protects nothing; and Express does no sorting, order is behaviour."), ["ex-middleware", "helmet"]),
 ("What's the difference between app-level, router-level and error middleware in Express?", [JS, API], MID,
  "app.use applies to everything, router middleware to one router, and error middleware (4 params) only runs on errors.",
  ["App-level middleware runs once at startup, router-level runs per request, and error middleware handles 404s.",
   "They're interchangeable at runtime; the names just describe the files where the middleware is defined.",
   "app.use applies to everything, router middleware to one router, and error middleware runs after each response has been sent."],
  ex("App-level (`app.use`) applies to everything; router-level applies to one router; error middleware has four parameters and runs only when an error is passed. Scope middleware as narrowly as correctness allows.\n\nWhy the others are wrong: `app.use` middleware runs on every matching request, and a 404 is handled by a normal catch-all middleware, not error middleware; the scope differs (app-wide versus mounted router); and error middleware runs only when an error is passed via `next(err)` or thrown."), ["ex-middleware"]),
 ("How should a Node.js process handle uncaughtException and unhandledRejection?", [JS, RES], MID,
  "Log, flush and exit non-zero so a supervisor restarts a clean process; also handle SIGTERM for graceful shutdown.",
  ["Register handlers that log and continue; Node rolls back the failed operation, so the process state stays consistent.",
   "Exit with code 0 straight away so the orchestrator treats it as a clean stop; SIGTERM needs no handling.",
   "Log the error and keep serving, because exiting would drop in-flight requests; restart once a day to clear leaks."],
  ex("Log, flush and exit with a non-zero code; let the supervisor (Kubernetes, systemd, PM2) restart a clean process. Continuing after an uncaught exception risks corrupt state. Also handle `SIGTERM` for graceful shutdown (stop accepting, finish in-flight requests, close DB).\n\nWhy the others are wrong: Node rolls nothing back, so state may be half-updated; exit code 0 hides the crash from supervisors and alerts, and without a `SIGTERM` handler deploys cut requests off; and continuing after an uncaught exception risks corrupt state, a clean restart is safer."), ["node-uncaught", "node-signals"]),
 ("How do you inject dependencies into a custom Express middleware?", [JS, PAT], MID,
  "Write a factory that takes the dependencies and returns the middleware, so it stays testable and global-free.",
  ["Attach dependencies to globalThis at startup, so each middleware can read them directly without imports or parameters.",
   "Name the middleware's extra parameters after the services, and Express resolves them by name per request.",
   "Import the dependency inside the middleware with a dynamic import() on each request, so it's freshly built."],
  ex("Write a factory that takes dependencies and returns the middleware. This keeps it testable and avoids globals.\n\nWhy the others are wrong: globals hide dependencies and make tests interfere with each other; Express passes `(req, res, next)` and has no dependency container; and modules are cached, so a per-request `import()` returns the same instance while adding overhead, and it still can't be swapped in tests.", r'''
const rateLimit = ({ store, limit }) => async (req, res, next) => {
  if (await store.hit(req.ip) > limit) return res.sendStatus(429);
  next();
};
app.use(rateLimit({ store: redisStore, limit: 100 }));
'''), ["ex-writing-mw"]),
 ("For an Express API, when do you return 404 and when 204?", [API], MID,
  "404 when the addressed resource doesn't exist; 204 for success with no body; an empty collection is 200 with [].",
  ["204 when the resource doesn't exist and 404 when a list is empty, since both just mean that nothing was found for the request.",
   "200 in both cases with an error field in the body, so clients parse one shape and don't branch on status.",
   "404 for a successful DELETE so clients know it's gone, and 204 when a GET by id finds nothing."],
  ex("`404`: the resource does not exist (GET, PUT or DELETE by id of something unknown). `204`: the request succeeded and there is intentionally no body (successful DELETE or PUT). An empty collection is `200` with `[]`, not 404.\n\nWhy the others are wrong: 204 means success, and an empty list is a valid result (200 with `[]`); hiding errors in a 200 breaks caches, retries and monitoring that rely on status codes; and a successful DELETE is 204 (or 200), while a missing resource is 404."), ["rfc9110"]),
 ("How do you handle a needed breaking change in a Node.js API?", [API], MID,
  "Avoid it with additive changes; if unavoidable, ship a new version, keep the old one, announce dates, watch usage, use contract tests.",
  ["Ship it in a patch release and bump the npm package version; semantic versioning informs API consumers of the break.",
   "Change the response freely as long as it stays valid JSON, since clients parse whatever fields they happen to receive.",
   "Change the existing endpoint in place, document it in the changelog, and send a Warning header for a week after."],
  ex("Avoid it. Prefer additive, backward compatible changes (new optional fields, new endpoints). If a break is unavoidable: ship a new version, keep the old one running, announce deprecation with dates (`Deprecation` and `Sunset` headers), watch usage, and use contract tests with consumers.\n\nWhy the others are wrong: an HTTP API's consumers don't install your npm package, and a break would need a major version anyway; clients depend on specific fields and types, so removing or renaming breaks them; and changing in place breaks clients immediately, before anyone reads the changelog."), ["sunset", "versioning"]),
 ("What's the most common way to version a Node.js REST API?", [API], MID,
  "In the URL path (/v1/items): visible, cacheable, simple to route; headers or a query parameter are the alternatives.",
  ["In the JSON request body as an apiVersion field, which works for each HTTP method and keeps the URLs stable over time.",
   "In a cookie named api-version, so browsers send it automatically and clients don't need to change URLs.",
   "Through the version field in package.json, which Express exposes as a header on each response."],
  ex("URL path (`/v1/items`), because it is visible, cacheable and simple to route. Alternatives: a header (`Accept: application/vnd.api.v2+json`) or a query parameter. Pick one and be consistent.\n\nWhy the others are wrong: GET requests have no meaningful body and routing on body content is awkward; cookies are browser state that server clients lack and caches ignore; and `package.json` versions the code, Express exposes nothing from it."), ["versioning"]),
 ("Why map objects by hand between layers in a Node.js service?", [JS, PAT], MID,
  "Explicit conversion functions are type-safe and debuggable, and stop internal fields like password hashes from leaking.",
  ["Spreading the database row into the response is the safer default, as it keeps each field the client might need later on.",
   "JSON.stringify throws on class instances, so each layer must convert objects to plain literals by hand.",
   "Hand mapping lets V8 keep objects in one hidden class, which is the main reason; field safety is a side effect."],
  ex("Writing explicit functions that convert between layers (request DTO to domain model to DB row to response DTO). It is verbose but type-safe, easy to debug, and stops internal fields (password hash, internal ids) from leaking. Avoid magic auto-mappers unless the shapes are truly identical.\n\nWhy the others are wrong: spreading rows leaks internal columns such as password hashes; `JSON.stringify` serializes class instances' own enumerable properties without complaint; and hidden-class effects are a micro-optimisation, the real reason is explicit, safe contracts between layers.", r'''
const toItemDto = (row) => ({ id: row.id, name: row.name, price: row.price_cents / 100 });
'''), ["node-bp"]),
 ("Where do most Express APIs sit on the Richardson Maturity Model?", [API], MID,
  "Level 2: resources with proper HTTP verbs and status codes; level 3 adds hypermedia links (HATEOAS).",
  ["Level 0: JSON over HTTP counts as RPC, and resources with proper HTTP verbs and status codes are already level 3.",
   "Level 1: resources with their own URLs and proper verbs; level 2 adds hypermedia links (HATEOAS).",
   "Level 3: resources with proper HTTP verbs and status codes; level 4 adds hypermedia links (HATEOAS)."],
  ex("Four levels of REST adoption: 0 one endpoint, one verb (RPC over HTTP); 1 resources with their own URLs; 2 correct HTTP verbs and status codes; 3 hypermedia (HATEOAS: responses carry links to next actions). Most production APIs sit at level 2.\n\nWhy the others are wrong: the payload format doesn't decide the level, and verbs plus status codes are level 2; level 1 has resources but not proper verbs, and hypermedia is level 3; and the model stops at level 3, which is hypermedia."), ["richardson"]),
 ("For a Node.js team, what separates a monolith, a modular monolith and microservices?", [ARCH, SYS], MID,
  "Modular monolith: one deployable, strict module boundaries, no cross-module DB access; microservices deploy and own data separately.",
  ["Modular monolith: modules in npm workspaces sharing tables freely; microservices: separate repos sharing one database.",
   "Modular monolith: one codebase run in cluster mode per module; microservices: monoliths split by Express router.",
   "Modular monolith: separately deployed services that share one database; microservices: one deployable per team."],
  ex("Monolith: one deployable, usually tangled. Modular monolith: one deployable with strict module boundaries and no cross-module database access; cheap to run and a good default. Microservices: independently deployable services with their own data, giving team and scaling independence at the price of network failures, distributed data and operational cost. Split only when a boundary and a reason are clear.\n\nWhy the others are wrong: shared tables break module boundaries and a shared database couples microservices; cluster mode and routers are runtime and code details, not architecture boundaries; and separately deployed services sharing a database is a distributed monolith, while microservices are split by capability, not one per team."), ["monolith-first"]),
 ("What does an API gateway do in front of Node.js services, and what's the risk?", [API, SYS], MID,
  "Routes and handles auth, rate limits, TLS, aggregation, caching; risks are a single point of failure and creeping business logic.",
  ["Routes requests and compiles TypeScript per request; the risk is slower cold starts for each service behind it.",
   "Proxies WebSocket traffic, which Node services don't accept directly; the risk is dropped connections on deploys.",
   "Replaces each service's database with a shared cache and runs business rules centrally; the risk is cache size."],
  ex("A single entry point in front of services: routing, authentication, rate limiting, TLS, request aggregation, caching and observability. It spares clients from knowing the internal topology. Risks: a single point of failure and a place where business logic wrongly accumulates.\n\nWhy the others are wrong: gateways don't compile service code; Node services serve WebSockets directly and gateways handle all kinds of traffic; and data and business rules stay in the services, a gateway full of business logic is the anti-pattern."), ["gateway"]),
 ("In a Node.js app's database, what is normalization and when do you denormalize?", [SQL], MID,
  "Store each fact once to avoid update anomalies; denormalize deliberately for read-heavy paths and keep copies in sync.",
  ["Lowercase and trim the string columns so values compare equally; denormalize again when case-sensitive search is needed.",
   "Convert rows to JSON documents to avoid joins; denormalize back into tables when you need foreign keys.",
   "Store each fact once; Prisma migrations denormalize read-heavy tables automatically, so copies stay in sync."],
  ex("Normalization removes duplicated data into separate tables to avoid update anomalies. Denormalize deliberately for read performance (reporting, search, read models, hot lists) and keep copies in sync through events or triggers; measure first.\n\nWhy the others are wrong: that is data cleaning, unrelated to database normalization; embedding data in documents is denormalization, not normalization; and Prisma never denormalizes for you, keeping copies in sync is your job (events, triggers, jobs)."), ["normalization"]),
 ("Why do indexes speed up a Node.js app's queries, and what does adding too many cost?", [SQL], MID,
  "A B-tree lets the database find rows without a scan; each extra index slows writes, uses storage and burdens the planner.",
  ["Indexes cache recent query results in memory; extra indexes use RAM but have no effect on write speed.",
   "A B-tree sorts the table itself on each insert; extra indexes speed up writes because rows are pre-sorted.",
   "Indexes speed up writes by batching them; each extra index slows reads because the planner checks each one."],
  ex("An index (usually a B-tree) lets the database find rows without scanning the table. Costs: slower writes (every index updates), more storage, and more work for the query planner. Index columns used in filters, joins and sort; check plans with `EXPLAIN ANALYZE`; drop unused indexes.\n\nWhy the others are wrong: an index is a sorted structure of column values pointing to rows, not a result cache, and every insert or update must maintain it; a secondary index is a separate structure and each one adds write cost; and indexes help reads and cost writes, not the other way round."), ["explain", "use-the-index"]),

 # ---------------- Senior ----------------
 ("For a Node.js backend's data store, what does the CAP theorem force you to choose?", [DIST], S,
  "During a network partition, consistency or availability; partitions happen, so it's CP or AP, often per operation.",
  ["Between SQL and NoSQL: relational stores give consistency, document stores give availability and partitioning.",
   "Two of consistency, availability and performance, chosen once at design time regardless of network failures.",
   "Between consistency and latency during normal operation; partitions are rare enough to leave out of the system design."],
  ex("In a network Partition a distributed store must choose between Consistency (every read sees the latest write) and Availability (every request gets a non-error response). Partitions happen, so the real choice is CP or AP during a partition. Many systems tune this per operation.\n\nWhy the others are wrong: CAP is about behaviour under partition, and SQL and NoSQL systems exist on both sides; the P is partition tolerance, not performance, and the choice only bites when the network fails; and consistency versus latency in normal operation is the PACELC extension, while partitions are a reality to design for."), ["cap", "ddia"]),
 ("In a Node.js system, how do strong and eventual consistency differ for API design?", [DIST], S,
  "Strong: readers see every completed write. Eventual: replicas converge later, so design for staleness and idempotency.",
  ["Strong: writes are retried until they succeed. Eventual: writes may be dropped, so add a nightly reconciliation job to repair them.",
   "Strong: data is validated before saving. Eventual: data is validated after saving, so add rollback endpoints.",
   "Strong: replicas confirm writes asynchronously. Eventual: readers see the latest write once you await the call."],
  ex("Strong: after a write completes, all readers see it (higher latency, lower availability). Eventual: replicas converge over time, so readers may see stale data briefly (higher availability and speed). Design UX and APIs for staleness (read-your-writes where needed, idempotent updates, conflict resolution).\n\nWhy the others are wrong: eventual consistency doesn't lose writes, replicas converge; consistency models are about what readers see, not validation; and asynchronous replica confirmation is what leads to eventual consistency, while awaiting a write doesn't make other replicas current."), ["eventual"]),
 ("How does horizontal versus vertical scaling apply to Node.js specifically?", [RES, JS], S,
  "One process runs JS on one core, so scale out with several processes (cluster, containers) and keep sessions out of memory.",
  ["One process runs JS on one core, so scale vertically with more cores; worker threads then spread incoming requests automatically.",
   "The event loop spreads JS across cores, so vertical scaling covers most loads; sessions can stay in process memory.",
   "Scale out with several processes, keeping sessions in each process's memory since the load balancer routes evenly."],
  ex("Vertical: bigger machine (simple, capped, single point of failure). Horizontal: more instances (needs stateless services, shared or sharded data, load balancing). Node specifics: one process uses one core for JS, so run several processes (cluster, containers) and keep sessions out of memory.\n\nWhy the others are wrong: extra cores sit idle unless you run more processes, and worker threads don't take HTTP requests automatically; the event loop runs your JS on one thread; and in-memory sessions break when the next request hits a different process, so use a shared store or tokens."), ["node-cluster"]),
 ("When would a Node.js service use NoSQL instead of a relational database?", [SQL, SYS], S,
  "By access pattern: massive key lookups, flexible documents, graphs, time series; relational for transactions, joins and constraints.",
  ["For read-heavy data, since NoSQL stores don't support transactions and relational ones don't scale reads.",
   "When the team prefers JSON to SQL syntax; Postgres needs an ORM in Node, while document stores don't.",
   "By default, because JavaScript objects map to documents and relational drivers block the event loop."],
  ex("Choose by access pattern and consistency needs, not fashion: massive scale and simple key access (key-value, wide column), flexible or hierarchical documents, graph traversals, time series. Stay relational for transactions, joins, constraints and ad hoc queries. PostgreSQL with `jsonb` covers many \"flexible\" cases.\n\nWhy the others are wrong: many NoSQL stores support transactions and relational databases scale reads with replicas; syntax preference is a poor reason, and `pg` works fine without an ORM; and Node's database drivers are asynchronous, they don't block the event loop."), ["ddia"]),
 ("What is a distributed lock in a Node.js system, and what are its risks?", [DIST], S,
  "A lock across processes (Redis NX PX, advisory locks); expiry mid-work, clocks and split brain mean you need fencing tokens.",
  ["A file lock on shared storage such as NFS; locks there are atomic, so no expiry or fencing is needed.",
   "A mutex from async-mutex, which coordinates across servers through the event loop; the risk is extra latency.",
   "A row lock in a Postgres transaction held across HTTP calls; the main risk is a slightly slower commit."],
  ex("A lock shared across processes (Redis `SET key val NX PX`, Redlock, Postgres advisory locks, ZooKeeper). Risks: expiry while the holder is still working (GC pauses, slow calls), clock assumptions, split brain, and deadlocks. Use TTLs, renew while working, and fencing tokens so the resource rejects stale holders; prefer idempotent operations or queue partitioning over locks.\n\nWhy the others are wrong: NFS locking is notoriously unreliable, and a crashed holder needs expiry anyway; `async-mutex` works inside one process, it knows nothing about other servers; and holding a transaction open across HTTP calls blocks other writers and connections far worse than a slow commit."), ["dist-lock", "pg-locking"]),
 ("Optimistic versus pessimistic locking from a Node.js app: how do you implement each?", [SQL], S,
  "Pessimistic: SELECT ... FOR UPDATE inside a transaction. Optimistic: a version column in the WHERE; 0 rows updated means conflict.",
  ["Prisma applies optimistic locking to each update automatically; pessimistic locking is a Prisma schema flag.",
   "Optimistic: an in-process mutex around the update. Pessimistic: retry the update until the database stops erroring.",
   "Pessimistic: a version column in the WHERE clause. Optimistic: SELECT ... FOR UPDATE, retried on deadlock."],
  ex("Pessimistic: lock the row up front (`SELECT ... FOR UPDATE`); safe under high contention, blocks others. Optimistic: no lock; a version column makes the update conditional and a conflict is retried or reported; best for low contention.\n\nWhy the others are wrong: Prisma does neither automatically (you add a version field, and use raw SQL for `FOR UPDATE`); an in-process mutex doesn't protect against other instances, and blind retry is not locking; and the two approaches are swapped.", r'''
UPDATE items SET qty = $1, version = version + 1 WHERE id = $2 AND version = $3; -- 0 rows = conflict
''', "sql"), ["pg-locking"]),
 ("How do you design a multitenant database for a Node.js SaaS?", [SQL, SYS], S,
  "Shared tables with tenant_id (plus RLS), schema per tenant, or database per tenant; choose by isolation, compliance and scale.",
  ["Separate tables named after each tenant in one schema, created at signup, which gives full isolation cheaply.",
   "One Prisma client per tenant pointed at the same tables, which isolates tenants without a tenant column.",
   "Shared tables with tenant_id filtered in the front end, since the API returns rows for the logged-in user."],
  ex("Three models: shared tables with a `tenant_id` (cheapest; enforce with Postgres row-level security and a mandatory tenant filter), schema per tenant (moderate isolation), database per tenant (strongest isolation, highest cost). Decide by isolation, compliance, noisy neighbours and tenant count. Always index `tenant_id` and test for cross-tenant leaks.\n\nWhy the others are wrong: per-tenant tables explode the schema and make migrations painful, without real isolation; several clients on the same tables see the same rows, isolation needs a tenant key or separate schemas/databases; and filtering in the front end means the API sends other tenants' data."), ["tenancy-models", "pg-rls"]),
 ("For a Node.js service, how do cache-aside, write-through and write-back differ?", [RES], S,
  "Cache-aside fills on miss and invalidates on write; write-through writes both; write-back flushes later and risks loss.",
  ["They're Redis eviction policies: cache-aside evicts LRU, write-through evicts by TTL, write-back by size.",
   "Cache-aside writes to the cache alone; write-through writes to the database alone; write-back reads from both and merges them.",
   "They differ in TTL: cache-aside short, write-through long, write-back none, with the same data flow otherwise."],
  ex("Cache-aside: the app reads the cache, on miss reads the DB and fills the cache (most common; invalidate on write). Write-through: writes go to cache and DB together (consistent, slower writes). Write-back: write to cache, flush to DB later (fast, risk of data loss). Always set TTLs and plan stampede protection.\n\nWhy the others are wrong: they're read/write patterns, Redis eviction policies are things like `allkeys-lru`; cache-aside writes to the database and invalidates the cache, and write-through writes to both; and TTLs are orthogonal, the patterns differ in data flow."), ["cache-aside"]),
 ("For Node.js services, when do you choose REST, gRPC or GraphQL?", [API], S,
  "REST outside (public, cacheable), gRPC inside (contracts, streaming, low latency), GraphQL for clients shaping their own data.",
  ["REST for public and internal APIs, because Node lacks a maintained gRPC server; GraphQL for file uploads.",
   "GraphQL everywhere, since it replaces REST and gRPC and keeps HTTP caching just as simple as REST.",
   "gRPC for browsers since it uses JSON, REST inside because it's binary, and GraphQL for streaming."],
  ex("REST: public, cacheable, simple resource APIs. gRPC: internal service-to-service calls, strong contracts (protobuf), streaming, low latency. GraphQL: many different clients that need to shape their own data, at the cost of caching and query-cost control. Often: REST outside, gRPC inside.\n\nWhy the others are wrong: `@grpc/grpc-js` is the maintained Node gRPC implementation, and GraphQL isn't a file-upload protocol; GraphQL usually POSTs to one endpoint, which makes HTTP caching harder; and gRPC uses binary protobuf (browsers need gRPC-Web) while REST is typically JSON."), ["grpc-node", "graphql"]),
 ("When should Node.js services use a message queue rather than calling each other's APIs?", [DIST], S,
  "When no answer is needed now: smoothing spikes, decoupling availability, retries, fan-out, long jobs; costs eventual consistency.",
  ["Whenever latency matters, because a broker delivers faster than an HTTP call between services and adds no ops cost.",
   "When the caller needs an immediate answer, since a queue guarantees ordered, exactly-once replies to each request.",
   "When services share a database, since a queue lets them lock rows across services without distributed transactions."],
  ex("When the caller does not need the answer now: smoothing spikes, decoupling availability, retries, fan-out to multiple consumers, long jobs. Use direct calls when you need an immediate result. Costs: eventual consistency, ordering, duplicates, observability.\n\nWhy the others are wrong: a broker adds a hop and operational cost, it's not faster; queues fit when the caller doesn't wait, and they typically give at-least-once delivery, not exactly-once replies; and queues don't lock rows, services sharing a database is a separate coupling problem."), ["load-leveling"]),
 ("For Node.js consumers, what do at-most-once, at-least-once and exactly-once mean?", [DIST], S,
  "At-most-once may lose, at-least-once may duplicate; exactly-once in practice is at-least-once delivery plus idempotent processing.",
  ["They describe how many consumers share a queue: one, several, or exactly one per partition in a group.",
   "At-most-once may duplicate, at-least-once may lose; exactly-once comes from retrying with setTimeout until acked.",
   "At-least-once may lose messages; exactly-once is what kafkajs and amqplib guarantee by default for consumers."],
  ex("At-most-once: may lose messages, never duplicates. At-least-once: never loses, may duplicate (the usual default). Exactly-once in practice is at-least-once delivery plus idempotent processing (dedupe by message id); true end-to-end exactly-once is only possible within a closed system such as Kafka transactions.\n\nWhy the others are wrong: delivery guarantees are about how often a message is processed, not consumer counts; the guarantees are swapped, and retrying until acked is at-least-once (duplicates possible); and at-least-once never loses messages but may duplicate, and neither library gives exactly-once processing by default."), ["delivery"]),
 ("Which Node.js messaging libraries would you use, and how do you do idempotency and retries?", [JS, DIST], S,
  "kafkajs/confluent, amqplib, BullMQ, NATS; record processed ids with the effect (inbox), backoff with jitter, retry cap, DLQ.",
  ["kafkajs, amqplib, BullMQ; idempotency comes from making handlers async, and failed messages retry immediately in a tight loop.",
   "kafkajs, amqplib, BullMQ; keep processed ids in an in-memory Set and retry failures forever at a fixed interval.",
   "Any library; retry failures immediately in a tight loop and rely on the broker to drop duplicate deliveries."],
  ex("Libraries: `kafkajs`/`@confluentinc/kafka-javascript`, `amqplib` (RabbitMQ), BullMQ (Redis jobs), NATS, cloud SDKs. Idempotency: carry a unique message id and record processed ids in a table inside the same transaction as the effect (inbox pattern), or use idempotency keys on HTTP writes. Retries: exponential backoff with jitter, a retry limit, and a dead-letter queue; only retry safe or idempotent work.\n\nWhy the others are wrong: `async` has nothing to do with idempotency, and immediate retries hammer a failing dependency; an in-memory Set is lost on restart and not shared between instances, and endless fixed retries need a cap and a DLQ; and brokers deliver at least once, so deduplication is the consumer's job."), ["bullmq", "idempotent-consumer"]),
 ("How do you apply Clean Architecture's dependency rule in a Node.js codebase?", [ARCH], S,
  "The domain imports nothing from Express or Prisma; it declares ports that adapters implement, wired in one composition root.",
  ["Domain entities extend Prisma models so they can save themselves, and Express routes call them directly.",
   "Each module imports the Express app to register its own routes and database access, keeping each feature fully self-contained.",
   "Dependencies point outward: the domain imports adapters for Express and Prisma, and the HTTP layer stays thin."],
  ex("Concentric layers: entities and use cases at the center, adapters (HTTP, DB, queues) outside. Dependencies point inward only: the domain imports nothing from Express or Prisma; it declares interfaces (ports) that outer code implements, wired in one composition root. Benefit: testable core and replaceable infrastructure. Do not apply it ceremonially to a tiny CRUD service.\n\nWhy the others are wrong: extending Prisma models makes the domain depend on the ORM, the opposite of the rule; modules importing the app and database couple everything to infrastructure; and dependencies must point inward, the domain never imports adapters."), ["clean"]),
 ("Should you wrap Prisma in Repository and Unit of Work classes?", [JS, ARCH], S,
  "Usually not: Prisma already offers repository-like APIs and $transaction; wrap only to shield the domain or ease testing.",
  ["Yes: Prisma migrations need repository classes to discover models, so each model needs its own repository.",
   "Yes: Prisma can't run multi-statement transactions without a Unit of Work class coordinating them.",
   "No: wrapping Prisma breaks its type generation, so use the client directly from controllers instead."],
  ex("Prisma, TypeORM and Sequelize already implement unit of work and repository-like APIs (`prisma.$transaction`). Wrapping them adds a layer that is worth it only to protect domain code from the ORM or to ease testing; otherwise it is boilerplate. If you do, keep repositories small and aggregate-oriented, and let the use case own the transaction.\n\nWhy the others are wrong: migrations read `schema.prisma`, not repository classes; `prisma.$transaction` already runs multi-statement transactions; and wrapping doesn't affect the generated types, it's just usually unnecessary."), ["prisma-tx"]),
 ("In a Node.js codebase, what is Vertical Slice Architecture and how does it reduce coupling?", [ARCH], S,
  "Each feature keeps route, validation, handler, data access and tests together, so a change stays in one folder.",
  ["Each developer owns one layer across features (routes, services, data), so changes rarely collide in review.",
   "Code is split into controllers/, services/ and models/ folders shared by features, so each layer is reusable across features.",
   "Each feature runs in its own worker thread, so a bug in one slice doesn't crash the others at runtime."],
  ex("Organise code by feature (a slice contains its route, validation, handler, data access and tests) instead of by technical layer. Changing a feature touches one folder; slices share little, so coupling between features is low and each slice can choose its own approach.\n\nWhy the others are wrong: ownership by layer is the opposite of slicing by feature; folders per technical layer are the layered structure vertical slices replace, since a feature change touches every folder; and slices are a code organisation, not a runtime isolation mechanism."), ["bogard"]),
 ("How do you organize a Node.js project with vertical slices?", [JS, ARCH], S,
  "src/features/<use-case>/ with route, schema, handler and tests; a small stable shared/ folder; app.ts mounts the feature routers.",
  ["src/controllers, src/services and src/repositories, with one file per feature in each of the three folders.",
   "One package per HTTP route in a monorepo, each with its own database client and its own copy of shared code.",
   "src/features/<entity>/ with routes for each use case, plus a large shared/ folder holding the DTOs and queries."],
  ex("A slice per use case, a small shared kernel, and one composition root that mounts each feature's router.\n\nWhy the others are wrong: per-layer folders scatter one feature across the tree; a package per route adds heavy tooling overhead and duplicated infrastructure; and grouping by entity with a big shared folder recreates coupling, slices are per use case with a small shared kernel.", r'''
src/
  features/
    create-order/  route.ts  schema.ts  handler.ts  handler.test.ts
    get-order/     route.ts  query.ts   handler.ts
  shared/          logger.ts  db.ts  errors.ts   (small, stable)
  app.ts           (composition root, mounts feature routers)
''', "text"), ["bogard"]),
 ("In a Node.js vertical-slice project, how much duplication between slices is acceptable?", [ARCH, PAT], S,
  "Some: extract on the third repetition and share only stable things (errors, logging, auth, a small domain kernel).",
  ["Some, in tests; production code should extract a helper as soon as two slices share similar lines.",
   "None: extract a shared helper when two slices have similar lines, including their DTOs and queries.",
   "Any amount: slices shouldn't share code at all, not even logging or error types, to stay independent of each other."],
  ex("Accept some duplication: it is cheaper than the wrong abstraction. Apply the rule of three (extract on the third repetition), and share only genuinely stable things (error types, logging, auth, a small domain kernel). Do not share DTOs or query code between slices just to save lines.\n\nWhy the others are wrong: extracting at the second repetition often creates the wrong abstraction, in production code as much as in tests; sharing DTOs and queries couples slices that should evolve separately; and cross-cutting concerns like logging and error types are stable and worth sharing."), ["rule-of-three", "bogard"]),
 ("How do you implement CQRS simply in a Node.js service?", [JS, ARCH], S,
  "Separate command and query handlers on one database first; add an event-fed read model only when reads need it.",
  ["Start with event sourcing and two databases from day one, since queries can't scale without a separate read store.",
   "Route each query through a message bus and each command through HTTP, so reads and writes are decoupled.",
   "Split each route into a GET router and a POST router; that separation is what CQRS refers to."],
  ex("Separate commands (change state, return little) from queries (read only, return DTOs). Minimal version: two handlers per feature and the same database. Fuller version: a separate read model fed by events, which scales reads independently but adds eventual consistency. Start minimal.\n\nWhy the others are wrong: CQRS doesn't require event sourcing or a second database, and starting there adds eventual consistency for no reason; transport choice isn't the point, the separation is between handler models; and splitting routers by HTTP verb is routing, not separate command and query models.", r'''
const placeOrder = async (cmd) => { /* validate, write, publish OrderPlaced */ };
const getOrderSummary = async (id) => db.orderSummaries.findUnique({ where: { id } }); // read model
'''), ["cqrs", "msio"]),
]

assert len(Q) == 53, len(Q)

build("JavaScript / Node.js interview guide by level (junior, mid, senior)", M, Q, sys.argv[1],
      strip_backticks=False, canonical_tags=True)
