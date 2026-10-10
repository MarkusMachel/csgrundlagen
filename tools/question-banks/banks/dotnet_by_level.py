"""The .NET interview guide by level (Junior, Mid, Senior). Level -> difficulty."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # tools/question-banks
from bankgen import build

LEARN, ADD = "Microsoft Learn", "added"
L = "https://learn.microsoft.com/en-us/"


def ms(path, title, desc, flag=ADD):
    return ("article", title, L + path, LEARN, desc, flag)


M = {
 "minimal": ms("aspnet/core/fundamentals/minimal-apis", "Minimal APIs overview", "Routing, binding and results in minimal APIs.", False),
 "error-handling": ms("aspnet/core/fundamentals/error-handling", "Handle errors in ASP.NET Core", "IExceptionHandler, UseExceptionHandler and ProblemDetails.", False),
 "api-errors": ms("aspnet/core/web-api/handle-errors", "Handle errors in ASP.NET Core APIs", "Problem details and exception handling for web APIs.", False),
 "validation": ms("aspnet/core/mvc/models/validation", "Model validation in ASP.NET Core", "DataAnnotations, ModelState and automatic 400s."),
 "return-types": ms("aspnet/core/web-api/action-return-types", "Controller action return types", "ActionResult<T>, IActionResult and response types."),
 "web-api": ms("aspnet/core/web-api/", "Create web APIs with ASP.NET Core", "ControllerBase, [ApiController] and conventions."),
 "rfc9457": ("article", "Problem Details for HTTP APIs (RFC 9457)", "https://datatracker.ietf.org/doc/html/rfc9457", "IETF", "The standard error body for HTTP APIs.", False),
 "logging": ms("dotnet/core/extensions/logging", "Logging in .NET", "ILogger, message templates and providers."),
 "serilog": ("link", "Serilog", "https://serilog.net/", "Serilog", "Structured logging library with file and many other sinks.", ADD),
 "middleware": ms("aspnet/core/fundamentals/middleware/", "ASP.NET Core middleware", "The pipeline, ordering and short-circuiting.", False),
 "write-middleware": ms("aspnet/core/fundamentals/middleware/write", "Write custom ASP.NET Core middleware", "Convention-based middleware and per-request dependencies.", False),
 "imiddleware": ms("aspnet/core/fundamentals/middleware/extensibility", "Factory-based middleware (IMiddleware)", "Middleware activated per request from DI."),
 "configuration": ms("aspnet/core/fundamentals/configuration/", "Configuration in ASP.NET Core", "Providers, sections and environment variables."),
 "environments": ms("aspnet/core/fundamentals/environments", "Use multiple environments", "ASPNETCORE_ENVIRONMENT and IHostEnvironment."),
 "options": ms("aspnet/core/fundamentals/configuration/options", "Options pattern in ASP.NET Core", "IOptions, IOptionsSnapshot and IOptionsMonitor.", False),
 "secrets": ms("aspnet/core/security/app-secrets", "Safe storage of app secrets in development", "User secrets and keeping secrets out of source.", False),
 "migrations": ms("ef/core/managing-schemas/migrations/", "Migrations overview (EF Core)", "Code First schema evolution."),
 "scaffolding": ms("ef/core/managing-schemas/scaffolding/", "Scaffolding (reverse engineering)", "Generating a model from an existing database."),
 "one-to-many": ms("ef/core/modeling/relationships/one-to-many", "One-to-many relationships (EF Core)", "Conventions and fluent configuration."),
 "di": ms("aspnet/core/fundamentals/dependency-injection", "Dependency injection in ASP.NET Core", "Lifetimes, constructor and action injection.", False),
 "filters": ms("aspnet/core/mvc/controllers/filters", "Filters in ASP.NET Core", "Authorization, resource, action, exception and result filters."),
 "endpoint-filters": ms("aspnet/core/fundamentals/minimal-apis/min-api-filters", "Filters in minimal API apps", "IEndpointFilter, the minimal API equivalent of filters."),
 "http-logging": ms("aspnet/core/fundamentals/http-logging/", "HTTP logging in ASP.NET Core", "Logging requests and responses with field allow-lists."),
 "model-binding": ms("aspnet/core/mvc/models/model-binding", "Model binding in ASP.NET Core", "Binding sources: body, query, route, form."),
 "apis-overview": ms("aspnet/core/fundamentals/apis", "Choose between controller-based APIs and minimal APIs", "Trade-offs between the two styles."),
 "jwt": ms("aspnet/core/security/authentication/configure-jwt-bearer-authentication", "Configure JWT bearer authentication", "Validating issuer, audience, lifetime and keys."),
 "policies": ms("aspnet/core/security/authorization/policies", "Policy-based authorization", "Requirements, handlers and named policies."),
 "rfc9110": ("article", "HTTP Semantics (RFC 9110)", "https://datatracker.ietf.org/doc/html/rfc9110", "IETF", "Methods and status codes, including 204 and 404.", False),
 "api-versioning": ("link", "ASP.NET API Versioning", "https://github.com/dotnet/aspnet-api-versioning", "dotnet", "URL, query and header versioning for ASP.NET Core.", False),
 "sunset": ("article", "The Sunset HTTP Header Field (RFC 8594)", "https://datatracker.ietf.org/doc/html/rfc8594", "IETF", "Announcing when an endpoint goes away.", ADD),
 "mapperly": ("link", "Mapperly", "https://mapperly.riok.app/", "Riok", "Source-generated object mapping, no reflection.", ADD),
 "richardson": ("article", "Richardson Maturity Model", "https://martinfowler.com/articles/richardsonMaturityModel.html", "Martin Fowler", "Levels of RESTfulness in practice.", False),
 "monolith-first": ("article", "Monolith First", "https://martinfowler.com/bliki/MonolithFirst.html", "Martin Fowler", "Start with a monolith; split when boundaries are clear.", False),
 "gateway": ms("azure/architecture/microservices/design/gateway", "Use API gateways in microservices", "Routing, aggregation and offloading at the edge.", False),
 "yarp": ("link", "YARP: Yet Another Reverse Proxy", "https://github.com/dotnet/yarp", "dotnet", "A reverse proxy library for building gateways in .NET.", ADD),
 "normalization": ("article", "Database normalization", "https://en.wikipedia.org/wiki/Database_normalization", "Wikipedia", "Normal forms and update anomalies.", ADD),
 "ef-indexes": ms("ef/core/modeling/indexes", "Indexes (EF Core)", "Declaring single and composite indexes."),
 "explain": ("article", "Using EXPLAIN", "https://www.postgresql.org/docs/current/using-explain.html", "PostgreSQL documentation", "Reading query plans and actual row counts.", False),
 "cap": ("article", "CAP theorem", "https://en.wikipedia.org/wiki/CAP_theorem", "Wikipedia", "Consistency, availability and partition tolerance.", False),
 "ddia": ("book", "Designing Data-Intensive Applications", "https://dataintensive.net/", "Martin Kleppmann", "Consistency, replication, partitioning and messaging in depth.", ADD),
 "eventual": ("article", "Eventually Consistent", "https://www.allthingsdistributed.com/2008/12/eventually_consistent.html", "Werner Vogels", "What eventual consistency means in practice.", ADD),
 "autoscale": ms("azure/architecture/best-practices/auto-scaling", "Autoscaling", "Scaling out versus up, and designing for it."),
 "data-stores": ms("azure/architecture/guide/technology-choices/data-store-overview", "Understand data store models", "Relational, document, key-value, graph and more."),
 "dist-lock": ("article", "How to do distributed locking", "https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html", "Martin Kleppmann", "Why leases need fencing tokens.", False),
 "pg-locking": ("article", "Explicit locking", "https://www.postgresql.org/docs/current/explicit-locking.html", "PostgreSQL documentation", "Row locks and advisory locks.", False),
 "ef-concurrency": ms("ef/core/saving/concurrency", "Handling concurrency conflicts", "Optimistic concurrency with tokens and row versions.", False),
 "tenancy-models": ms("azure/architecture/guide/multitenant/considerations/tenancy-models", "Tenancy models for a multitenant solution", "Shared, schema and database per tenant.", False),
 "query-filters": ms("ef/core/querying/filters", "Global query filters (EF Core)", "Filtering every query by tenant or soft delete."),
 "pg-rls": ("article", "Row security policies", "https://www.postgresql.org/docs/current/ddl-rowsecurity.html", "PostgreSQL documentation", "Enforcing tenant isolation in the database.", ADD),
 "cache-aside": ms("azure/architecture/patterns/cache-aside", "Cache-Aside pattern", "Load on miss, invalidate on write.", False),
 "hybridcache": ms("aspnet/core/performance/caching/hybrid", "HybridCache library in ASP.NET Core", "Two-level caching with stampede protection.", False),
 "grpc-compare": ms("aspnet/core/grpc/comparison", "Compare gRPC services with HTTP APIs", "When gRPC beats JSON over HTTP.", False),
 "graphql": ("link", "Learn GraphQL", "https://graphql.org/learn/", "GraphQL Foundation", "Queries, schemas and resolvers.", ADD),
 "load-leveling": ms("azure/architecture/patterns/queue-based-load-leveling", "Queue-Based Load Leveling pattern", "Absorbing spikes with a queue.", False),
 "delivery": ("article", "Message Delivery Guarantees", "https://docs.confluent.io/kafka/design/delivery-semantics.html", "Confluent", "At-most-once, at-least-once and exactly-once.", False),
 "idempotent-consumer": ("article", "Pattern: Idempotent consumer", "https://microservices.io/patterns/communication-style/idempotent-consumer.html", "microservices.io", "Handling duplicate messages safely.", False),
 "outbox": ("article", "Pattern: Transactional outbox", "https://microservices.io/patterns/data/transactional-outbox.html", "microservices.io", "Publishing events reliably without dual writes.", False),
 "resilience": ms("dotnet/core/resilience/", "Introduction to resilient app development", "Microsoft.Extensions.Resilience and Polly pipelines.", False),
 "clean": ("article", "The Clean Architecture", "https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html", "Robert C. Martin", "Concentric layers and the dependency rule.", False),
 "persistence": ms("dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/infrastructure-persistence-layer-design", "Design the infrastructure persistence layer", "Repositories and Unit of Work with EF Core.", False),
 "vertical-slice": ("article", "Vertical slice architecture", "https://www.jimmybogard.com/vertical-slice-architecture/", "Jimmy Bogard", "Organizing by feature instead of layer.", False),
 "rule-of-three": ("article", "Rule of three (computer programming)", "https://en.wikipedia.org/wiki/Rule_of_three_(computer_programming)", "Wikipedia", "Refactor duplication on the third occurrence.", ADD),
 "cqrs": ("article", "CQRS", "https://martinfowler.com/bliki/CQRS.html", "Martin Fowler", "Separate models for reading and writing.", ADD),
 "cqrs-simple": ms("dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/apply-simplified-microservice-cqrs-ddd-patterns", "Apply simplified CQRS and DDD patterns in a microservice", "CQRS with one database and separate read paths.", False),
}

J, MID, S = "easy", "medium", "hard"
CS, API, OPS, SQL, ARCH = "C# & .NET", "APIs & HTTP", "Testing & Operations", "SQL & Databases", "Architecture & DDD"
DIST, RES, PAT, SYS, SEC = "Distributed Systems & Messaging", "Resilience & Scalability", "Design Principles & Patterns", "System Design", "Security"


def ex(text, code=None, lang="csharp"):
    return text if code is None else f"{text}\n\n```{lang}\n{code.strip(chr(10))}\n```"


Q = [
 # ---------------- Junior ----------------
 ("How do you handle POST, PUT and DELETE in ASP.NET Core Minimal APIs?", [CS, API], J,
  "Map a handler per verb; parameters bind automatically, and TypedResults make 201, 204 and 404 explicit.",
  ["Use one MapPost handler for all three verbs and switch on the HTTP method inside it, since minimal APIs only support POST bodies.",
   "Minimal APIs only handle GET; writes require controllers derived from ControllerBase.",
   "Return Results.Ok() for every write so clients can always parse a body."],
  ex("Map each verb to a handler; parameters bind from route, query, body or DI automatically. Return `TypedResults` so status codes are explicit and OpenAPI is accurate: `201` with a location for create, `200/204` for update, `204` for delete, `404` if missing.", r'''
var items = app.MapGroup("/items");
items.MapPost("/", async (CreateItem dto, IItemService svc) =>
{
    var item = await svc.CreateAsync(dto);
    return TypedResults.Created($"/items/{item.Id}", item);
});
items.MapPut("/{id:int}", async (int id, UpdateItem dto, IItemService svc) =>
    await svc.UpdateAsync(id, dto) ? TypedResults.NoContent() : Results.NotFound());
items.MapDelete("/{id:int}", async (int id, IItemService svc) =>
    await svc.DeleteAsync(id) ? TypedResults.NoContent() : Results.NotFound());
'''), ["minimal"]),
 ("How do you handle exceptions globally in ASP.NET Core (.NET 8+)?", [CS, API], J,
  "Register an IExceptionHandler plus AddProblemDetails, and call UseExceptionHandler() first in the pipeline.",
  ["Wrap every controller action in try/catch, because ASP.NET Core has no global hook for unhandled exceptions in APIs.",
   "Set a global catch in Main around app.Run(), which catches exceptions thrown inside any request.",
   "Use AppDomain.UnhandledException, which turns exceptions into 500 responses."],
  ex("Register an `IExceptionHandler` (.NET 8+), add `ProblemDetails`, and put `UseExceptionHandler()` first in the pipeline. The handler maps known exceptions to status codes and hides internals for the rest.", r'''
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();
app.UseExceptionHandler();

public sealed class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> log) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext ctx, Exception ex, CancellationToken ct)
    {
        log.LogError(ex, "Unhandled exception");
        var status = ex is NotFoundException ? 404 : 500;
        ctx.Response.StatusCode = status;
        await ctx.Response.WriteAsJsonAsync(new ProblemDetails { Status = status, Title = "Request failed" }, ct);
        return true;
    }
}
'''), ["error-handling", "api-errors"]),
 ("How does ASP.NET Core validate request models, and what happens when one is invalid?", [CS, API], J,
  "With [ApiController], validation runs automatically and returns 400 ValidationProblemDetails; minimal APIs need an explicit step.",
  ["Validation never runs automatically; every action must call Validator.ValidateObject itself, in controllers and minimal APIs alike.",
   "Invalid models throw a ValidationException that crashes the request with a 500.",
   "The framework silently drops invalid fields and passes defaults to the action."],
  ex("In controllers with `[ApiController]`, model validation runs automatically and returns `400` with `ValidationProblemDetails`. Use DataAnnotations for simple rules or FluentValidation for complex ones. Minimal APIs need an explicit validation step (a filter, FluentValidation, or the built-in support in the newest .NET versions).", r'''
public record CreateItem([Required, StringLength(100)] string Name, [Range(0.01, 100000)] decimal Price);
'''), ["validation"]),
 ("What makes a good controller action that takes a DTO, validates it and returns a custom error?", [CS, API], J,
  "Accept a DTO, check business rules too, and return ProblemDetails with the right status (e.g. 409), or CreatedAtAction.",
  ["Bind directly to the EF entity so validation and saving happen in one step, then return the exception message as plain text.",
   "Return 200 with { success: false } so clients never see an error status.",
   "Throw an exception for every validation failure and let the logs explain it."],
  ex("Point out: a DTO instead of the entity, a consistent error shape (`ProblemDetails`), and the correct status.", r'''
[HttpPost]
public async Task<IActionResult> Create(CreateItemDto dto)
{
    if (await _repo.ExistsAsync(dto.Name))
        return Problem(statusCode: 409, title: "Duplicate item", detail: $"'{dto.Name}' already exists");
    if (!ModelState.IsValid) return ValidationProblem(ModelState);
    var item = _svc.Create(dto);
    return CreatedAtAction(nameof(Get), new { id = item.Id }, item);
}
'''), ["validation", "api-errors"]),
 ("How do you return different HTTP status codes from a controller action?", [CS, API], J,
  "Use result helpers (Ok, CreatedAtAction, NoContent, NotFound, Conflict, Problem) with ActionResult<T> and [ProducesResponseType].",
  ["Set Response.StatusCode at the start of the action, because result helpers always return 200 regardless of their name.",
   "Throw HttpException with the code, the same way classic ASP.NET did.",
   "Status codes are chosen by the framework from the return type and can't be set."],
  ex("Use result helpers (`Ok`, `Created`/`CreatedAtAction`, `NoContent`, `BadRequest`, `NotFound`, `Conflict`, `Problem`). Return `ActionResult<T>` and declare outcomes with `[ProducesResponseType]` so Swagger documents them.", r'''
[ProducesResponseType<Item>(200)] [ProducesResponseType(404)]
public async Task<ActionResult<Item>> Get(int id)
    => await _repo.FindAsync(id) is { } item ? Ok(item) : NotFound();
'''), ["return-types"]),
 ("ControllerBase or Controller: which should a Web API derive from?", [CS, API], J,
  "ControllerBase (with [ApiController]); Controller only adds view support (View, ViewBag) for Razor MVC.",
  ["Controller, because ControllerBase lacks Ok(), NotFound() and ModelState, which only the full Controller class provides.",
   "Either; they are aliases kept for backward compatibility.",
   "ControllerBase is for gRPC services and Controller for HTTP APIs."],
  ex("`ControllerBase` has everything an API needs (`Ok()`, `NotFound()`, `ModelState`, `User`, `Request`). `Controller` derives from it and adds view support (`View()`, `ViewBag`, `PartialView`) for MVC with Razor. Web APIs should derive from `ControllerBase` with `[ApiController]`; use `Controller` only when the controller returns views."), ["web-api"]),
 ("What is ProblemDetails, and why should an API return it?", [CS, API], J,
  "The RFC 9457 error body (type, title, status, detail, instance): one consistent error shape every client can handle.",
  ["A debugging object that includes the stack trace so clients can report bugs, meant to be returned only in production.",
   "An EF Core type describing failed database queries.",
   "A logging format for Serilog that replaces structured logs."],
  ex("The standard error body for HTTP APIs (RFC 9457, formerly 7807): `type`, `title`, `status`, `detail`, `instance`, plus extensions. A consistent shape means clients can handle every error the same way. `AddProblemDetails()` makes the framework produce it for exceptions and status-code-only responses; `[ApiController]` already uses it for `400`s."), ["rfc9457", "api-errors"]),
 ("What is structured logging, and why use message templates instead of string interpolation?", [CS, OPS], J,
  "Logs with named properties, so they're queryable; templates capture each property and let identical messages group together.",
  ["It's logging in a fixed column layout; interpolation is preferred because it's faster and keeps the property values.",
   "It means logging only exceptions; templates are for formatting stack traces.",
   "It writes logs to a relational table instead of files."],
  ex("Logging with named properties instead of formatted strings, so logs are queryable data. Use message templates, not string interpolation, so the property is captured and the template can be grouped. Sinks (Serilog, OpenTelemetry) store it as JSON for search and alerting.", r'''
_logger.LogInformation("Order {OrderId} placed by {CustomerId}", order.Id, customerId); // good
_logger.LogInformation($"Order {order.Id} placed");                                      // loses structure
'''), ["logging"]),
 ("How do you write ASP.NET Core logs to a file?", [CS, OPS], J,
  "The built-in providers can't; use a provider such as Serilog's file sink with rolling, or log to stdout in containers.",
  ["Enable the built-in File provider in appsettings.json, which every ASP.NET Core template registers by default.",
   "Redirect Console.Out to a FileStream at startup.",
   "Use the Debug provider, which writes to a file next to the binary."],
  ex("The built-in providers (console, debug, EventSource) do not write files. Use a third-party provider such as Serilog with `Serilog.Sinks.File` and a rolling interval. In containers prefer stdout and let the platform ship the logs.", r'''
builder.Host.UseSerilog((ctx, cfg) => cfg
    .ReadFrom.Configuration(ctx.Configuration)
    .WriteTo.Console()
    .WriteTo.File("logs/app-.log", rollingInterval: RollingInterval.Day, retainedFileCountLimit: 14));
'''), ["serilog", "logging"]),
 ("How does a middleware stop the ASP.NET Core request pipeline?", [CS, API], J,
  "It writes the response itself and doesn't call next (short-circuit); terminal middleware never calls next.",
  ["It throws an OperationCanceledException, which is the only way to stop the remaining middleware from running.",
   "It calls next(ctx) with a null context.",
   "It sets ctx.Items[\"stop\"] = true, which later middleware check."],
  ex("Do not call `next`; write the response yourself (short-circuit). Terminal middleware (`app.Run`) never calls next either.", r'''
app.Use(async (ctx, next) =>
{
    if (!ctx.Request.Headers.ContainsKey("X-Api-Key"))
    {
        ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return;
    }
    await next(ctx);
});
'''), ["middleware"]),
 ("How do you pass data between ASP.NET Core middleware components?", [CS, API], J,
  "HttpContext.Items (a per-request dictionary) or a scoped service; Features are for framework extension points.",
  ["A static dictionary keyed by thread id, because each request always runs on a single thread from start to finish.",
   "Response headers, which later middleware read back.",
   "IMemoryCache with the request path as the key."],
  ex("`HttpContext.Items` (a per-request dictionary), or a scoped service injected into both parts. `HttpContext.Features` is for framework-level extension points. Keep keys as constants.", r'''
ctx.Items["TenantId"] = tenantId;            // set in middleware
var tenant = (string)ctx.Items["TenantId"]!; // read later
'''), ["middleware"]),
 ("How do you read a configuration value such as a connection string in ASP.NET Core?", [CS], J,
  "builder.Configuration.GetConnectionString in Program.cs; elsewhere inject IConfiguration, or better, bind a typed options class.",
  ["Read appsettings.json with File.ReadAllText and parse it, since IConfiguration is only available inside Program.cs.",
   "Use ConfigurationManager.AppSettings as in .NET Framework.",
   "Hard-code it in a static class, because configuration can't be injected into controllers."],
  ex("`builder.Configuration` is available in `Program.cs`; in other classes inject `IConfiguration`, or better a strongly typed options class. Avoid reading `IConfiguration` all over controllers.", r'''
var cs = builder.Configuration.GetConnectionString("Default");
// or
builder.Services.Configure<DbOptions>(builder.Configuration.GetSection("Db"));
'''), ["configuration", "options"]),
 ("How are environment variables read in ASP.NET Core?", [CS, OPS], J,
  "They're a configuration provider: values land in IConfiguration, with __ standing in for : in nested keys.",
  ["Only through Environment.GetEnvironmentVariable, because IConfiguration never includes environment variables.",
   "They're loaded from a .env file that ASP.NET Core reads automatically.",
   "They must be prefixed with DOTNET_ or they are ignored."],
  ex("Environment variables are a configuration provider already: they are read into `IConfiguration`, and `__` replaces `:` for nested keys (`ConnectionStrings__Default`). `Environment.GetEnvironmentVariable` works too, and `IHostEnvironment` / `ASPNETCORE_ENVIRONMENT` tells you Development, Staging, Production. Secrets belong in a secret store, not in committed files."), ["configuration", "environments", "secrets"]),
 ("How do you pick up configuration changes without restarting an ASP.NET Core app?", [CS, OPS], J,
  "JSON files reload on change; read through IOptionsMonitor or IOptionsSnapshot. Environment variables need a restart.",
  ["Call Configuration.Reload() on every request, because file providers never watch for changes on their own.",
   "Environment variables reload automatically every few seconds.",
   "Configuration can't change without a restart in .NET."],
  ex("JSON file providers use `reloadOnChange: true` (the default for `appsettings.json`). Read the values through `IOptionsMonitor<T>` (or `IOptionsSnapshot<T>` per request) so changes are visible. Environment variables are read at startup and do not reload; use a config service (for example Azure App Configuration or a feature-flag service) for live changes."), ["configuration", "options"]),
 ("What's the difference between IOptions<T>, IOptionsSnapshot<T> and IOptionsMonitor<T>?", [CS], J,
  "IOptions: singleton, read once. Snapshot: scoped, recomputed per request. Monitor: singleton with a live CurrentValue and OnChange.",
  ["They are the same service registered three times for compatibility; any of them reloads values on every access.",
   "IOptions is scoped, IOptionsSnapshot is a singleton, and IOptionsMonitor is transient.",
   "Only IOptionsSnapshot can be injected into background services."],
  ex("- `IOptions<T>`: singleton, values read once at startup; no reload.\n- `IOptionsSnapshot<T>`: scoped, recomputed per request, so changes show up on the next request; cannot be injected into singletons.\n- `IOptionsMonitor<T>`: singleton, `CurrentValue` is always fresh and `OnChange` fires on reload; use it in singletons and background services."), ["options"]),
 ("What is the difference between Code First and Database First in EF Core?", [CS, SQL], J,
  "Code First: classes are the source of truth and migrations evolve the schema. Database First: scaffold the model from an existing database.",
  ["Code First writes raw SQL scripts by hand, while Database First generates the database from your classes.",
   "They are performance modes: Code First caches queries, Database First doesn't.",
   "Database First is the only option for PostgreSQL."],
  ex("Code First: classes and `DbContext` are the source of truth; migrations (`dotnet ef migrations add`, `database update`) create and evolve the schema. Database First: the database already exists; `dotnet ef dbcontext scaffold` generates the model, and you re-scaffold when the schema changes. Code First for new systems; Database First for legacy or DBA-owned databases."), ["migrations", "scaffolding"]),
 ("How do you define a one-to-many relationship in EF Core?", [CS, SQL], J,
  "The many side holds the foreign key, the one side a collection; conventions find it, or configure HasMany/WithOne.",
  ["Put a List on both classes; EF Core always creates a join table, even for one-to-many relationships.",
   "Store the child ids as a comma-separated string on the parent.",
   "Mark the parent with [OneToMany] and EF Core infers the rest."],
  ex("The \"many\" side holds the foreign key; the \"one\" side holds a collection. By convention this is enough, or configure it fluently.", r'''
public class Author { public int Id { get; set; } public List<Book> Books { get; set; } = []; }
public class Book   { public int Id { get; set; } public int AuthorId { get; set; } public Author Author { get; set; } = null!; }

modelBuilder.Entity<Author>().HasMany(a => a.Books).WithOne(b => b.Author).HasForeignKey(b => b.AuthorId);
'''), ["one-to-many"]),

 # ---------------- Mid ----------------
 ("What is method injection in ASP.NET Core, and how does it differ from constructor injection?", [CS, PAT], MID,
  "It supplies a dependency for one call ([FromServices] or a handler parameter) instead of for the object's lifetime.",
  ["It's injecting through public settable properties after construction, which ASP.NET Core's container does by default.",
   "It means calling the container's GetService inside each method (service locator).",
   "It's identical to constructor injection but resolved lazily."],
  ex("Constructor injection supplies dependencies for the whole lifetime of the class; method injection supplies them for one call. In ASP.NET Core use `[FromServices]` on an action parameter (controllers) or just list the service as a parameter (Minimal APIs, `Middleware.InvokeAsync`). Use it when only one action needs a dependency or when you need a scoped service inside a singleton-like component.", r'''
public IActionResult Report([FromServices] IReportService reports) => Ok(reports.Build());
'''), ["di"]),
 ("What is the lifecycle of a controller in ASP.NET Core?", [CS, API], MID,
  "A new instance per request from DI: routing, filters, model binding and validation, the action, result filters, then disposal.",
  ["One controller instance is created at startup and shared by all requests, so fields act as an application-wide cache.",
   "Controllers are pooled and reused, so they must reset their state between requests.",
   "Each user session gets its own controller instance."],
  ex("A new controller instance is created for every request (via DI), then disposed. Flow: routing selects an action, authorization and other filters run, model binding and validation fill parameters, action filters run before and after, the action executes, result filters run, the result is written. Because it is per request, controllers must not hold state between requests."), ["filters", "web-api"]),
 ("What are action filters in ASP.NET Core, and what is the Minimal API equivalent?", [CS, API], MID,
  "IActionFilter/IAsyncActionFilter run code around an action (timing, auditing); minimal APIs use IEndpointFilter.",
  ["Filters are attributes that only validate input; cross-cutting code like timing must live in middleware instead.",
   "They're LINQ predicates applied to the action's return value.",
   "Minimal APIs can't have filters of any kind."],
  ex("Filters run at defined points of the MVC pipeline (authorization, resource, action, exception, result). An action filter implements `IActionFilter`/`IAsyncActionFilter` to run code before and after an action: validation, timing, auditing, caching. Register globally, per controller or per action; use `[ServiceFilter]` or `[TypeFilter]` when the filter needs DI. For Minimal APIs the equivalent is `IEndpointFilter`.", r'''
public class TimingFilter(ILogger<TimingFilter> log) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext ctx, ActionExecutionDelegate next)
    {
        var sw = Stopwatch.StartNew();
        await next();
        log.LogInformation("{Action} took {Ms} ms", ctx.ActionDescriptor.DisplayName, sw.ElapsedMilliseconds);
    }
}
'''), ["filters", "endpoint-filters"]),
 ("How do you log HTTP requests and responses in ASP.NET Core safely?", [CS, OPS, SEC], MID,
  "Use the HTTP logging middleware with explicit fields; skip bodies by default, redact secrets, correlate with request ids.",
  ["Log full request and response bodies for every call, because that's the only way to debug production issues.",
   "Enable Debug-level logging for Microsoft.* in production.",
   "Write a filter that serializes HttpContext to JSON."],
  ex("Use the built-in HTTP logging middleware and choose fields explicitly, or write your own middleware. Do not log bodies by default (privacy, size); redact tokens and personal data; correlate with a request id and trace id.", r'''
builder.Services.AddHttpLogging(o =>
{
    o.LoggingFields = HttpLoggingFields.RequestPropertiesAndHeaders | HttpLoggingFields.ResponsePropertiesAndHeaders;
    o.RequestHeaders.Add("X-Request-Id");   // only allow-listed headers are logged
});
app.UseHttpLogging();
'''), ["http-logging"]),
 ("What do [FromBody], [FromQuery], [FromRoute] and [FromForm] control?", [CS, API], MID,
  "Where binding reads from: JSON body, query string, route segment, or form data (incl. files). Only one body parameter.",
  ["Which HTTP verbs the action accepts: FromBody for POST, FromQuery for GET, FromRoute for PUT, FromForm for DELETE.",
   "How values are validated; the binding source is always the query string.",
   "Which parameters are optional; all others are required."],
  ex("They say where binding reads from: JSON body, query string, route template segment, or form data (`application/x-www-form-urlencoded` and multipart, including files). Only one parameter can come from the body. `[ApiController]` infers complex types as `FromBody` and simple types as route or query."), ["model-binding"]),
 ("Why does middleware order matter in ASP.NET Core, and what's a typical order?", [CS, API], MID,
  "Middleware runs in registration order in, reverse out; e.g. exception handler, HTTPS, routing, CORS, authN, authZ, endpoints.",
  ["It doesn't: the framework sorts middleware by type before running, so registration order only affects startup time.",
   "Authorization must come before authentication so anonymous users are rejected early.",
   "Endpoints should be mapped first so routing is as fast as possible."],
  ex("Middleware runs in the order registered on the way in, and in reverse on the way out. Wrong order gives bugs: authorization before authentication always fails, CORS after the endpoint adds no headers, the exception handler placed late misses earlier errors.", r'''
app.UseExceptionHandler();
app.UseHttpsRedirection();
app.UseRouting();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
'''), ["middleware"]),
 ("When do you choose Minimal APIs and when controllers?", [CS, API], MID,
  "Minimal APIs for small services and vertical slices; controllers when you want the full MVC feature set and conventions.",
  ["Minimal APIs are for prototypes only, since they can't use DI, authorization or OpenAPI in production.",
   "Controllers are deprecated in .NET 8, so new code should only use minimal APIs.",
   "Mix both in every endpoint for best performance."],
  ex("Minimal APIs: less ceremony, fast, good for small services, microservices and vertical slices; filters via `IEndpointFilter`; group with `MapGroup`. Controllers: conventions, the filters pipeline, model binding features and content negotiation that large teams are used to; good when you need the full MVC feature set. Both run on the same hosting and middleware; pick one style per service for consistency."), ["apis-overview"]),
 ("How do you secure an ASP.NET Core API with JWT bearer tokens and authorization policies?", [CS, SEC], MID,
  "Validate issuer, audience, lifetime and signing key; define claim-based policies; apply with [Authorize] or RequireAuthorization.",
  ["Decode the JWT payload in each action and trust its claims, since tokens are signed by the client and can't be forged.",
   "Store the JWT in the database and compare strings on every request.",
   "Use [AllowAnonymous] globally and check roles in the UI."],
  ex("Authentication proves who the caller is; authorization decides what they may do. Configure JWT bearer to validate issuer, audience, lifetime and signing key; define policies from claims or roles; apply with `[Authorize]` or `RequireAuthorization`. Keep tokens short-lived and validate on every request.", r'''
builder.Services.AddAuthentication().AddJwtBearer(o => builder.Configuration.Bind("Jwt", o));
builder.Services.AddAuthorizationBuilder().AddPolicy("Admin", p => p.RequireClaim("role", "admin"));
app.MapDelete("/items/{id}", Delete).RequireAuthorization("Admin");
'''), ["jwt", "policies"]),
 ("How do you inject a scoped service into custom ASP.NET Core middleware?", [CS], MID,
  "Middleware is a singleton, so take scoped services as InvokeAsync parameters, or implement IMiddleware (resolved per request).",
  ["Inject it through the constructor like any class; the container creates a new middleware instance per request.",
   "Call app.Services.GetRequiredService once at startup and store it in a field.",
   "Scoped services can't be used from middleware at all."],
  ex("Middleware is created once, so constructor injection is only for singleton dependencies. Scoped or transient services go into `InvokeAsync` parameters. Alternatively implement `IMiddleware` (created per request from DI, so constructor injection can use scoped services).", r'''
public class AuditMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext ctx, IAuditService audit) // scoped service here
    {
        await next(ctx);
        await audit.RecordAsync(ctx.Request.Path, ctx.Response.StatusCode);
    }
}
'''), ["write-middleware", "imiddleware"]),
 ("When should an ASP.NET Core REST API return 404 Not Found and when 204 No Content?", [API], MID,
  "404 when the addressed resource doesn't exist; 204 when an operation succeeded with no body. An empty list is 200 with [].",
  ["404 for an empty search result and 204 when the resource was not found, since neither has a body.",
   "Always 200 with an error flag, so caches aren't confused.",
   "204 for every DELETE, even when the id doesn't exist."],
  ex("`404`: the resource addressed by the URL does not exist. `204`: the operation succeeded and there is deliberately no body (a successful `DELETE` or `PUT`). An empty list from a collection endpoint is `200` with `[]`, not `404` or `204`."), ["rfc9110"]),
 ("Can you make breaking changes to an existing .NET API, and how?", [API], MID,
  "Only with a new version: keep the old one working, announce deprecation with dates, measure usage, protect with contract tests.",
  ["Yes, any time, as long as the OpenAPI document is regenerated so clients pick up the change automatically.",
   "No, never; APIs must stay unchanged forever.",
   "Yes, if the change is shipped on a Friday with release notes."],
  ex("Only with a version change; otherwise clients break. Make additive changes (optional fields, new endpoints), keep old behaviour working, publish a new version for real breaks, announce deprecation with dates (`Deprecation`/`Sunset` headers), measure usage of the old version, and protect with contract tests."), ["sunset", "api-versioning"]),
 ("What's the most common way to version an ASP.NET Core API?", [CS, API], MID,
  "A URL segment (/api/v1/items): visible, cacheable, easy to route; Asp.Versioning also supports query and header versions.",
  ["A custom X-Version request header, because URL versions break caching and can't be routed by ASP.NET Core.",
   "A new port number per version.",
   "Renaming the controller class for each version."],
  ex("The URL segment (`/api/v1/items`): visible, cacheable, easy to route and document. Alternatives are a query string (`?api-version=1.0`) and a header. The `Asp.Versioning` packages support all of them and integrate with OpenAPI.", r'''
builder.Services.AddApiVersioning(o => o.ApiVersionReader = new UrlSegmentApiVersionReader()).AddMvc();
'''), ["api-versioning"]),
 ("What is manual object mapping in .NET, and why do many teams prefer it now?", [CS, PAT], MID,
  "Explicit conversion code between DTOs and entities: obvious, type-safe, no leaked fields; AutoMapper is now commercial.",
  ["Copying properties with reflection at runtime, which is preferred because it needs no code when classes change.",
   "Using EF Core entities as API responses so no mapping is needed.",
   "Serializing to JSON and back to convert types."],
  ex("Writing explicit conversion code between layers (request DTO, entity, response DTO), often as extension methods or constructors. It is verbose but obvious, type-safe, searchable, and prevents accidentally exposing fields. Reflection-based mappers hide bugs until runtime; AutoMapper has moved to a commercial license, so many teams now choose manual mapping or the source generator Mapperly.", r'''
public static ItemDto ToDto(this Item i) => new(i.Id, i.Name, i.PriceCents / 100m);
'''), ["mapperly"]),
 ("What are the levels of the Richardson Maturity Model?", [API], MID,
  "0: one endpoint, RPC; 1: resources; 2: proper verbs and status codes; 3: hypermedia (HATEOAS). Most APIs target 2.",
  ["0: no authentication; 1: API keys; 2: OAuth; 3: mutual TLS. Most APIs should aim for level 3.",
   "Levels count how many versions an API has shipped.",
   "It rates JSON schema strictness from 0 to 3."],
  ex("A scale for how RESTful an API is. Level 0: one endpoint, HTTP as a tunnel (RPC). Level 1: separate resources with URLs. Level 2: proper verbs and status codes. Level 3: hypermedia controls (HATEOAS), where responses include links to possible next actions. Most real APIs target level 2."), ["richardson"]),
 ("Monolith, modular monolith or microservices: how do they differ for a .NET system?", [ARCH, SYS], MID,
  "Modular monolith: one deployable with strict module boundaries and data ownership; microservices add independent deploys and data.",
  ["Microservices are just a monolith split into class libraries, deployed together in one process for speed.",
   "A modular monolith is a monolith with a plugin system loaded at runtime.",
   "They differ only in which cloud provider hosts them."],
  ex("Monolith: one deployable unit, often with tangled dependencies. Modular monolith: one deployable but divided into modules with clear public contracts and separate data ownership; low operational cost and an easy path to extract services later. Microservices: separate deployable services with their own data, giving independent scaling and team autonomy at the cost of distributed-systems complexity. Start modular; split when a clear boundary and need exist."), ["monolith-first"]),
 ("What problems does an API gateway solve in a .NET microservice system?", [API, SYS], MID,
  "One entry point for routing plus auth, rate limiting, TLS, aggregation and caching (e.g. YARP); keep business logic out.",
  ["It replaces the services' own databases with a shared cache, so services no longer need persistence.",
   "It's a load balancer for SQL Server read replicas.",
   "It generates client SDKs from controllers."],
  ex("A single entry point that routes requests to backend services and handles cross-cutting concerns: authentication, rate limiting, TLS termination, request aggregation, caching, logging. In .NET: YARP (reverse proxy library), Ocelot, or a managed gateway such as Azure API Management. Watch out for it becoming a bottleneck or a home for business logic."), ["gateway", "yarp"]),
 ("What is data normalization, and when is denormalizing the right call?", [SQL], MID,
  "Storing each fact once (up to 3NF) to avoid anomalies; denormalize deliberately for read-heavy paths and keep copies in sync.",
  ["Converting every column to a string so data is uniform; denormalize when you need numeric columns for math.",
   "Splitting each table into one table per column for speed.",
   "Normalization is only for NoSQL stores."],
  ex("Normalization organizes data so each fact is stored once (1NF to 3NF), avoiding update anomalies and inconsistency. Denormalize on purpose when reads dominate and joins are too costly: reporting tables, read models, caches of computed totals. Keep the copies in sync (events, triggers, jobs) and measure before and after."), ["normalization"]),
 ("How do indexes speed up queries in EF Core apps, and what do too many cost?", [SQL, CS], MID,
  "A B-tree lets the engine seek instead of scan; too many slow every write, use storage and can confuse the planner.",
  ["Indexes cache whole result sets in memory, so there's no cost to adding one for every column of every table.",
   "Indexes only help ORDER BY, not WHERE or JOIN.",
   "EF Core creates the right indexes automatically for every LINQ query."],
  ex("An index (a B-tree in most databases) lets the engine jump to matching rows instead of scanning the table. Too many indexes slow every insert, update and delete, use storage and memory, and can confuse the planner. Index columns used in `WHERE`, `JOIN` and `ORDER BY`, use composite indexes in the right column order, check plans with `EXPLAIN ANALYZE`, and remove unused ones.", r'''
modelBuilder.Entity<Order>().HasIndex(o => new { o.CustomerId, o.CreatedAt });
'''), ["ef-indexes", "explain"]),

 # ---------------- Senior ----------------
 ("What does each letter of the CAP theorem stand for, and what's the real choice?", [DIST], S,
  "Consistency, Availability, Partition tolerance; partitions happen, so during one you choose C or A, per operation.",
  ["Concurrency, Atomicity, Persistence; a database can only guarantee two of them at the same time.",
   "Caching, Availability, Performance; pick any two at design time.",
   "Consistency, Availability, Performance; partitions are rare enough to ignore."],
  ex("Consistency (every read sees the latest write), Availability (every request gets a non-error response), Partition tolerance (the system keeps working when the network splits). Partitions are unavoidable in distributed systems, so during a partition you choose consistency or availability. It is a per-operation choice (a payment may be CP, a product feed AP)."), ["cap", "ddia"]),
 ("What's the difference between strong and eventual consistency, and how do you design for the latter?", [DIST], S,
  "Strong: every read sees acknowledged writes. Eventual: replicas converge later; design with pending states and idempotency.",
  ["Strong means the data is encrypted; eventual means it's encrypted later by a background job.",
   "Eventual consistency only exists in NoSQL databases.",
   "They're the same once replicas are in the same region."],
  ex("Strong: after a write is acknowledged, every reader sees it (single leader, quorum reads/writes), at the cost of latency and availability. Eventual: replicas converge given time, so reads may be stale. Design for it: show pending states, use idempotent updates, read-your-writes where needed, and resolve conflicts deliberately."), ["eventual", "ddia"]),
 ("Horizontal or vertical scaling for an ASP.NET Core app: what does each require?", [RES], S,
  "Vertical: a bigger machine (simple, capped). Horizontal: more instances, which needs a stateless web tier and shared state.",
  ["Horizontal means adding CPU cores to one machine, and vertical means adding more machines behind a load balancer.",
   "ASP.NET Core can only scale vertically.",
   "Both are automatic once you enable server GC."],
  ex("Vertical: a bigger machine (simple, limited, a single point of failure). Horizontal: more instances behind a load balancer (needs stateless services, externalized sessions and cache, sharded or replicated data). In .NET keep the web tier stateless so it can scale out, and scale the database separately (replicas, partitioning)."), ["autoscale"]),
 ("When would you choose a NoSQL store over a relational database for a .NET service?", [SQL, SYS], S,
  "By access pattern: massive key lookups, flexible documents, graphs, time series; relational for transactions and joins.",
  ["Whenever the data has more than a million rows, because relational databases can't index beyond that.",
   "Always for new services, since NoSQL is faster at everything.",
   "Only when EF Core doesn't support the database."],
  ex("Look at access patterns, data shape, scale, consistency needs and the team. NoSQL fits: simple key lookups at massive scale, flexible documents, graph traversals, time series, wide-column writes. Relational fits: transactions, constraints, joins and ad hoc queries. PostgreSQL with `jsonb` often covers the \"flexible schema\" need without a second system."), ["data-stores"]),
 ("What is a distributed lock, and what makes it risky?", [DIST], S,
  "A lock across processes (Redis, advisory locks); expiry while paused, clocks and split brain make it unsafe without fencing tokens.",
  ["A lock held inside one process across threads, which is risky only because lock statements are slow.",
   "A database transaction that spans two databases; the risk is deadlock on the second one.",
   "A file lock on a network share, which is perfectly safe."],
  ex("A lock that coordinates several processes (Redis `SET NX PX`, Redlock implementations, PostgreSQL advisory locks, blob leases). Risks: the lock expiring while the holder is paused (GC, slow call), clock and network assumptions, split brain, forgotten release, and deadlocks. Mitigate with TTLs plus renewal, fencing tokens the resource checks, or avoid locks with idempotency, queues partitioned by key, and conditional updates.", r'''
await using var tx = await db.Database.BeginTransactionAsync();
await db.Database.ExecuteSqlRawAsync("SELECT pg_advisory_xact_lock({0})", key); // PostgreSQL, released at commit
'''), ["dist-lock", "pg-locking"]),
 ("Optimistic or pessimistic locking with EF Core: how do they work and when do you use each?", [SQL, CS], S,
  "Pessimistic locks rows first (FOR UPDATE) for high contention; optimistic uses a concurrency token and handles the conflict.",
  ["Optimistic locks the whole table up front, pessimistic locks nothing; use optimistic when many writers collide.",
   "EF Core only supports pessimistic locking.",
   "Both are the same; the names refer to retry counts."],
  ex("Pessimistic: lock the data first (`SELECT ... FOR UPDATE`), others wait; good for high contention and short critical sections. Optimistic: no lock; a version or concurrency token makes the update conditional, and a conflict raises an exception you retry or surface; good for low contention and web workloads.", r'''
public class Product { public int Id { get; set; } [Timestamp] public uint Version { get; set; } /* or xmin in PostgreSQL */ }
try { await db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { /* reload, merge or return 409 */ }
'''), ["ef-concurrency", "pg-locking"]),
 ("How do you design the database for a multitenant .NET SaaS?", [SQL, SYS], S,
  "Shared tables with TenantId (query filters + RLS), schema per tenant, or database per tenant; choose by isolation and cost.",
  ["Always one database per tenant, because sharing tables with a TenantId column can't be made secure.",
   "Store each tenant's data in a separate JSON file on disk.",
   "Use one table per tenant inside a shared schema, named after the tenant."],
  ex("Shared tables with a `TenantId` column (cheapest; enforce with EF Core global query filters and PostgreSQL row-level security), schema per tenant (moderate isolation), database per tenant (strongest isolation, most expensive and hardest to migrate). Choose by isolation and compliance needs, tenant count, and noisy neighbours. Index `TenantId` first, resolve the tenant from the token, and test for cross-tenant leaks.", r'''
modelBuilder.Entity<Order>().HasQueryFilter(o => o.TenantId == _tenant.Id);
'''), ["tenancy-models", "query-filters", "pg-rls"]),
 ("Cache-aside, write-through or write-back: what's the difference in a .NET service?", [RES], S,
  "Cache-aside loads on miss and invalidates on write; write-through writes both; write-back flushes later and can lose data.",
  ["Cache-aside writes to the database first and never reads the cache; write-back reads the database on every request.",
   "They're HybridCache configuration flags with the same behaviour.",
   "Write-through is the only pattern safe for multi-instance apps."],
  ex("Cache-aside: the app checks the cache, on a miss loads from the database and fills the cache (most common; invalidate on write). Write-through: every write goes through the cache to the database (consistent, slower writes). Write-back: write to cache and flush to the database later (fast, risk of loss). In .NET 9+ `HybridCache` combines in-memory and distributed layers with stampede protection.", r'''
var item = await cache.GetOrCreateAsync($"item:{id}", async ct => await repo.GetAsync(id, ct));
'''), ["cache-aside", "hybridcache"]),
 ("REST, gRPC or GraphQL: when do you use each?", [API], S,
  "REST for public, cacheable APIs; gRPC for typed, fast internal calls and streaming; GraphQL when clients shape their data.",
  ["GraphQL for internal service calls because it's binary, gRPC for public browser APIs, and REST only for file uploads.",
   "gRPC replaces REST everywhere since .NET 8.",
   "Use all three on every endpoint for compatibility."],
  ex("REST: resource-oriented, cacheable, ideal for public APIs. gRPC: HTTP/2 and protobuf, strongly typed contracts, streaming, low latency; best for internal service-to-service calls (not directly callable from browsers without gRPC-Web). GraphQL: clients choose the fields and combine data in one request; good for varied front ends, with extra work for caching, authorization per field and query cost limits."), ["grpc-compare", "graphql"]),
 ("When should services talk through a message queue instead of direct API calls?", [DIST], S,
  "When the caller doesn't need the answer now: spikes, a consumer being down, retries, fan-out, long jobs.",
  ["Always, because queues are faster than HTTP and remove the need for idempotency.",
   "Only for logging, since queues can't carry business data.",
   "When the caller needs an immediate, consistent answer."],
  ex("When the caller does not need the result immediately: absorbing traffic spikes, surviving a down consumer, retrying, fan-out to several consumers, long-running work. Use direct calls for queries that need an answer now. Queues bring eventual consistency, duplicates, ordering questions and extra monitoring."), ["load-leveling"]),
 ("At-most-once, at-least-once, exactly-once: what do the delivery guarantees mean?", [DIST], S,
  "At-most-once may lose, at-least-once may duplicate; exactly-once in practice is at-least-once plus idempotent handling.",
  ["At-least-once may lose messages but never duplicates; exactly-once is the default of every modern broker.",
   "They describe how many consumers can read a message.",
   "Exactly-once is guaranteed by HTTP retries."],
  ex("At-most-once: may lose messages, never duplicates. At-least-once: never loses, may deliver duplicates (the common default). Exactly-once processing is achieved in practice as at-least-once delivery plus idempotent handling (deduplicate by message id); broker-level exactly-once exists only in limited, closed settings (such as Kafka transactions)."), ["delivery", "ddia"]),
 ("Which .NET messaging libraries would you use, and how do you make handlers idempotent and retried safely?", [CS, DIST], S,
  "MassTransit, Wolverine, Service Bus SDK…; an inbox of processed ids in the same transaction, backoff with jitter, DLQ, outbox.",
  ["Any library works; retry immediately in a tight loop and rely on the broker to remove duplicates automatically.",
   "Use HttpClient polling instead of a library, since libraries can't retry.",
   "Idempotency isn't needed if messages have timestamps."],
  ex("Options: MassTransit, Wolverine, NServiceBus, Rebus, `Azure.Messaging.ServiceBus`, `Confluent.Kafka`, Brighter, Dapr. Check current licensing, because some of these (NServiceBus, newer MassTransit versions) are commercial. Idempotency: a unique message id stored in an inbox table in the same transaction as the side effect, or naturally idempotent operations (upserts, conditional updates). Retries: exponential backoff with jitter via Polly / `Microsoft.Extensions.Resilience`, a retry cap, and a dead-letter queue; the outbox pattern guarantees the message is published when the transaction commits.", r'''
if (await db.ProcessedMessages.AnyAsync(m => m.Id == msg.Id)) return; // duplicate, ignore
db.ProcessedMessages.Add(new(msg.Id));
await ApplyEffect(msg);
await db.SaveChangesAsync();   // effect and dedupe record commit together
'''), ["idempotent-consumer", "outbox", "resilience"]),
 ("What is Clean Architecture, and how do you enforce its dependency rule in .NET?", [ARCH], S,
  "Domain at the center, dependencies only point inward; Application defines ports, Infrastructure implements; check with project refs and arch tests.",
  ["Every layer references every other layer so any code can call the database directly; the rule only applies to UI code.",
   "It means one project per class, referenced alphabetically.",
   "The domain project references EF Core so entities can save themselves."],
  ex("Layers arranged around the domain: Domain at the center, Application (use cases) around it, then Infrastructure and Presentation at the edge. Source dependencies point inward only: Domain references nothing; Application defines interfaces (ports); Infrastructure implements them; the API project wires everything in the composition root. Enforce with project references and architecture tests (for example NetArchTest). Do not add layers a small service does not need."), ["clean"]),
 ("Do you put Repository and Unit of Work on top of EF Core?", [ARCH, CS], S,
  "Usually not generically: DbContext already is a Unit of Work and DbSet a repository; add specific aggregate repositories when useful.",
  ["Always add a generic IRepository<T> and IUnitOfWork, because DbContext can't run transactions without them.",
   "Never use DbContext directly; wrap it in three layers of repositories.",
   "Repositories are required for EF Core migrations to work."],
  ex("`DbContext` already implements Unit of Work and `DbSet<T>` is a repository, so a generic repository on top adds little and hides useful features (`Include`, projections). Add repositories when they express domain concepts (aggregate roots), protect the domain from EF Core, or simplify testing; keep them specific, not generic `IRepository<T>`. The use case owns the transaction (`SaveChanges` once)."), ["persistence"]),
 ("What is Vertical Slice Architecture, and why does organizing by feature reduce coupling?", [ARCH], S,
  "Each feature keeps its endpoint, models, validation, handler and data access together, so changes stay in one folder.",
  ["It splits the app into one microservice per database table, deployed separately.",
   "It's layering by technical concern: controllers, services and repositories folders.",
   "It means each developer owns one vertical layer of the stack."],
  ex("Group code by feature rather than by technical layer: each slice has its endpoint, request/response models, validation, handler and data access together. A change touches one folder; slices depend on each other very little, and each can use the simplest suitable approach (one may use raw SQL, another EF Core)."), ["vertical-slice"]),
 ("How do you lay out a .NET project with vertical slices?", [ARCH, CS], S,
  "Features/<Area>/<UseCase>/ with endpoint, request, validator and handler; a small Common folder; Program.cs maps the features.",
  ["Controllers/, Services/, Repositories/ and Models/ folders at the root, with one class per layer per feature.",
   "One project per HTTP verb.",
   "Put all slices in Program.cs so they're easy to find."],
  ex("Keep the domain model for real business rules in a shared place; keep slices thin and explicit. A mediator library is optional; plain handler classes or Wolverine work, and MediatR is now commercial in newer versions.", r'''
src/Api/
  Features/
    Orders/
      CreateOrder/   Endpoint.cs  Request.cs  Validator.cs  Handler.cs
      GetOrder/      Endpoint.cs  Query.cs    Handler.cs
  Common/            ProblemDetails, behaviors, small shared kernel
  Program.cs         (composition root, maps each feature's endpoints)
''', "text"), ["vertical-slice"]),
 ("How do you handle duplicated code between vertical slices?", [ARCH, PAT], S,
  "Tolerate it; extract only after the third repetition and only stable concepts (domain rules, errors, cross-cutting behaviors).",
  ["Extract a shared base class as soon as two slices look alike, so no line of code ever appears twice.",
   "Share request and response models between all slices to save lines.",
   "Copy-paste is forbidden; route every slice through one generic handler."],
  ex("Tolerate duplication between slices: it is cheaper than the wrong shared abstraction. Extract after the third real repetition, and only for stable concepts: domain rules, error types, cross-cutting behaviors (validation, logging, transactions) and a small shared kernel. Do not share request/response models or data access between slices just to save lines."), ["rule-of-three", "vertical-slice"]),
 ("How do you implement CQRS in simple, concrete terms in .NET?", [ARCH, PAT], S,
  "Separate commands (change state) from queries (read DTOs): same database first, projections for reads; a read model only if needed.",
  ["CQRS requires event sourcing and a separate database for reads from day one, otherwise it isn't CQRS.",
   "It means every query must go through a message bus.",
   "It's splitting controllers into GET and POST classes only."],
  ex("Separate commands (change state, return little) from queries (read only, return DTOs). Simplest form: one database, a command handler using EF Core and a query handler using projections or Dapper. Next step: a separate read model updated by events, scaling reads independently at the price of eventual consistency. Start simple; add the read model only when a real read problem exists.", r'''
public record PlaceOrder(int CustomerId, List<Line> Lines);                 // command
public record GetOrderSummary(int OrderId);                                 // query
// handlers: PlaceOrderHandler writes via DbContext; GetOrderSummaryHandler reads with AsNoTracking().Select(...)
'''), ["cqrs", "cqrs-simple"]),
]

assert len(Q) == 53, len(Q)

# Length balance: the correct answer shouldn't be the giveaway longest option.
# Extend the lead distractor of the questions where the gap is smallest with
# a plausible-sounding (still wrong) clause, rotating the wording.
CLAUSES = [
    ", which is what the official docs recommend for production apps",
    ", and that has been the default behaviour since .NET 8",
    ", so no extra configuration is needed for it to work",
    ", which is why most teams standardize on it",
    ", and it behaves the same in controllers and minimal APIs",
    ", which avoids the overhead of the alternatives entirely",
]
KEEP_LONGEST = 12  # roughly a quarter, like chance with four options
gaps = sorted(range(len(Q)), key=lambda i: len(Q[i][3]) - max(len(w) for w in Q[i][4]))
for n, i in enumerate(gaps[: len(Q) - KEEP_LONGEST]):
    prompt, tags, diff, correct, wrong, expl, keys = Q[i]
    lead = wrong[0].rstrip(".")
    k = n
    while len(lead) + 1 <= len(correct):
        lead += CLAUSES[k % len(CLAUSES)]
        k += 1
    Q[i] = (prompt, tags, diff, correct, [lead + ".", *wrong[1:]], expl, keys)
build(".NET interview guide by level (junior, mid, senior)", M, Q, sys.argv[1],
      strip_backticks=False, canonical_tags=True)
