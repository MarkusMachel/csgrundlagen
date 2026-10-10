# Computer Fundamentals Trainer

A gamified quiz platform for computer-science fundamentals, built to
[the spec](./computer-fundamentals-trainer-spec.md) with a **code-editor-style UI**:
navigation is a strip of open "file" tabs (`home.cs`, `weak_spots.cs`, …), each
question renders in an editor pane with a line-number gutter, answers read as array
entries (`options[2] = "HTTPS"`), and a VS Code-style status bar carries page
context, progress dashes, and the session streak.

## Monorepo layout

```text
apps/
  web/   React + Vite frontend (npm workspace @csgrundlagen/web)
  api/   Go JSON API + Postgres migrations
docker-compose.yml   Postgres 16 (and, optionally, the API in a container)
```

The web app talks to `/api`. That `/api` is served either by **Mock Service Worker**
in the browser (the default — no backend needed, used by all frontend tests) or by
the **Go API**, which implements the same contract against Postgres.

## Stack

- **web** — TypeScript · React 18 · Vite · hand-rolled CSS design system ·
  Zustand · TanStack Query · React Router v6 · react-i18next (en / pt-BR / de) ·
  React Hook Form + Zod · MSW · Vitest + React Testing Library · Playwright ·
  Storybook.
- **api** — Go (standard-library `net/http` routing) · pgx v5 · bcrypt ·
  embedded SQL migrations · Postgres 16.

## Getting started

Frontend only, against the in-browser mocks:

```bash
npm install
npm run dev          # localhost:5173 — log in as demo@example.com / password
```

Full stack in Docker (Postgres, Go API, React app behind nginx):

```bash
cp .env.example .env # once; adjust credentials/ports if needed
npm run up           # builds and starts db, api (:8080) and web (localhost:3000)
docker compose exec api adduser -email you@example.com -name "You" -role admin -password '…'
docker compose exec api seed -file seeds/dotnet-interview.json   # optional question banks
```

nginx serves the production build and proxies `/api` to the api container, so the
browser sees one origin. Rebuild after code changes with `npm run up` again.

Full stack with hot reload (Postgres in Docker, API and web on the host):

```bash
cp .env.example .env # once; adjust credentials/ports if needed
docker compose stop api web  # if the containers are running, free :8080
npm run db:up        # Postgres in Docker
npm run api:dev      # Go API on :8080 — applies migrations on startup
npm run api:adduser -- -email you@example.com -name "You" -role admin -password '…'
npm run dev:real     # web on :5173 with mocks off; /api is proxied to :8080
```

The real database starts **empty** (no seed data). The mock demo accounts don't
exist there: people sign up at `/signup`, or you create users (including admins)
with `api:adduser`, which bcrypt-hashes the password (it can also read
`ADDUSER_PASSWORD` to keep it out of shell history).

**Password reset emails**: there is no mail provider yet, so the API writes each
reset link to its log instead (`npm run logs`, look for `Reset your password`).
Links work once and expire after an hour. Set `APP_BASE_URL` to the site's public
origin so the links point at the right host.

**Running code**: "predict the output" questions can be run after answering.
JavaScript runs in a sandboxed Web Worker in the browser; Go is sent by the API
to the official Go Playground (`go.dev/_/compile`). Set `GO_PLAYGROUND_URL=off`
to disable that, or point it at your own playground.

## Scripts

Run from the repo root.

| Script | What it does |
|---|---|
| `npm run dev` | Web dev server, MSW serves `/api` |
| `npm run dev:real` | Web dev server, `/api` proxied to the Go API (`API_PROXY_TARGET`, default `localhost:8080`) |
| `npm run typecheck` / `lint` | Web: `tsc --noEmit` (strict) / ESLint |
| `npm test` | Web: Vitest unit + integration tests (MSW via `msw/node`) |
| `npm run build` | Web: typecheck + production build |
| `npm run e2e` | Web: Playwright journeys (first run: `npx playwright install chromium`) |
| `npm run storybook` | Web: Storybook |
| `npm run up` / `down` | Build and start / stop all containers: db, api, web (data is kept) |
| `npm run logs` | Follow the api and web container logs |
| `npm run db:up` / `db:down` | Start Postgres only / stop everything (data is kept) |
| `npm run api:dev` | Run the Go API (`DATABASE_URL`, `PORT`) |
| `npm run api:test` | Go tests — the integration suite needs Postgres running |
| `npm run api:adduser` | Create a user with a hashed password |

Web CI gate order (§13.4): **typecheck → lint → test → build → e2e** — cheapest first.

## API (`apps/api`)

```text
cmd/api          server entry point (graceful shutdown, migrations on start)
cmd/adduser      CLI to create users
internal/db      pgx pool + embedded migration runner (migrations/*.sql)
internal/store   domain models and every SQL query
internal/httpapi routes, auth middleware, handlers, integration tests
```

- **Contract**: identical paths and JSON shapes to the MSW handlers in
  `apps/web/src/mocks/handlers` — the field names in `internal/store/models.go`
  match `apps/web/src/features/*/types.ts`. Errors are `{"message": "…"}`.
- **Auth**: `POST /api/auth/login` checks the bcrypt hash and returns a random
  bearer token; only its SHA-256 is stored (`sessions` table, 30-day expiry).
  `POST /api/auth/logout` revokes it. Admin-only routes return **403** for other
  users, matching the mock.
- **Accounts**: `POST /api/auth/signup` (logs straight in), `POST /api/auth/password`
  (change; ends the user's other sessions), `POST /api/auth/password-reset` (always
  202, so it can't reveal who has an account) and `…/password-reset/confirm`
  (single-use, 1-hour token; ends all sessions). Login, sign-up, reset and code
  runs are rate-limited to 20 requests per minute per IP and endpoint.
- **Question types**: `multiple-choice`, `true-false`, `multi-select` (several
  correct options), `ordering` (options carry a correct position) and `output`
  (code + language + expected output). Grading lives in
  `internal/store/grading.go`, mirrored by `apps/web/src/features/questions/grading.ts`.
- **Spaced repetition**: every answer updates `review_schedule` with a simplified
  SM-2 (`internal/store/review.go`); `GET /api/review/queue` serves what's due and
  `GET /api/me/progress?tz=…` the progress page.
- **Admin**: `PUT`/`DELETE` on `/api/questions/{id}` and `/api/materials/{id}`, and
  the bug-report queue at `GET`/`PATCH /api/admin/bug-reports`.
- **Devices**: each session stores the IP and User-Agent it was opened from, its
  latest IP and use, and what the browser reports about itself
  (`POST /api/me/device`: time zone, screen, languages). `login_events` keeps the
  sign-in history (logins, sign-ups, wrong passwords for known accounts, resets).
  Users list and sign out their own devices (`/api/me/sessions`); admins see
  everyone's under `/api/admin/users`. The API purges expired sessions and
  history older than 90 days hourly.
- **Privacy (GDPR)**: a first-visit banner offers "Accept all" and "Essential only"
  side by side, and a settings dialog (linked from every page's status bar) has
  per-category switches. Essential storage (sign-in token, the choice itself) and
  security records are always on. "Preferences" decides whether theme and
  language are remembered. "Device details" decides whether the browser's
  self-report is stored, and the API refuses `POST /api/me/device` without it.
  Signed-in users' choices are logged in `consent_records`
  (`POST /api/me/consent`). Sign-up requires accepting the policy at `/privacy`,
  and users who haven't read the current version are asked once. The Account
  page offers a JSON export of everything stored (`GET /api/me/export`) and
  account deletion (`DELETE /api/me`, password required; the last admin can't
  delete themselves). Set `PRIVACY_CONTACT` in `.env` so the policy names who runs
  the instance. Bump `PrivacyPolicyVersion` (Go) and `PRIVACY_POLICY_VERSION`
  (web) together when the policy text changes.
- **Migrations**: numbered files in `internal/db/migrations`, embedded in the
  binary and applied in order on startup, each recorded in `schema_migrations`.
  Never edit an applied file — add the next number.
  - `0001_schema.sql` — tables mirroring the frontend domain model (users,
    sessions, questions + options + tags + translations, materials and their
    question links, bookmarks/notes/comments/bug reports, submitted answers,
    custom tests + attempts).
  - `0002_views.sql` — read-only views for the aggregates (per-question stats,
    weak spots, admin stats), handy in DBeaver.
  - `0003_code_fences.sql` — documents the ```` ``` ```` code format on the text
    columns and converts old "Go:"/"SQL:" explanation trailers.
  - `0004_merge_tags.sql` — folds ~120 ad-hoc tags into 17 shared ones.
  - `0005_accounts.sql` — password reset tokens.
  - `0006_review_schedule.sql` — spaced-repetition state, backfilled from answers.
  - `0007_question_types.sql` — multi-select, ordering and output questions.
- **Tests**: `go test ./...` creates a throwaway database next to
  `DATABASE_URL`, migrates it, drives every endpoint over HTTP, then drops it.
  It skips itself if Postgres isn't reachable.
- **Docker**: `apps/api/Dockerfile` builds a distroless image with the `api`,
  `adduser` and `seed` binaries plus `seeds/`. The web image
  (`apps/web/Dockerfile`, built from the repo root) is a Vite build served by
  nginx (`apps/web/nginx.conf`) with mocks off.

## Postgres

**Connect from DBeaver** (or `psql`) with the values in `.env` — by default:
host `localhost`, port `5432`, database `csgrundlagen`, user `csgrundlagen`,
password `csgrundlagen`. `DATABASE_URL` in `.env` has the same as one string.

```bash
docker compose down        # stop (keeps data)
docker compose down -v     # stop and WIPE the data volume
docker compose logs -f db  # tail logs
```

The web app internals below live under `apps/web/`.

## Architecture

Feature-based layering with a strict one-way dependency (§4.1), enforced by a
`no-restricted-imports` rule — other code may only import a feature's `index.ts` barrel:

```text
app/ (providers, router, layout: tab strip + status bar)  →  pages/ (thin composition)
  →  features/ (questions, custom-tests, auth, authoring, search, materials, weak-spots)
  →  shared/ (ui, api client, hooks, utils, types)
```

- **Server state** lives in TanStack Query hooks inside each feature's `hooks/`.
- **Client/UI state** lives in Zustand: global stores in `src/stores/` (auth session,
  theme/locale, session streak, status-bar context), feature-scoped stores inside the
  owning feature (test-builder selection, in-progress attempt incl. the per-attempt
  shuffle seed).
- **Theming** is pure CSS custom properties: light tokens on `:root`, dark overrides
  under `[data-theme='dark']` (stamped on `<html>` from the UI store; defaults to the
  OS preference, persisted to `localStorage`). The Stats bar colors are validated for
  contrast/CVD on both surfaces.
- **Mocks** (`src/mocks/`) mirror the feature split: handlers per domain, an in-memory
  `db.ts` (reset per test), seed data in `seed/`. The auth token stub encodes the user
  id so the mock session survives page reloads.
- **Question content i18n**: seeds are authored in English with per-locale overrides
  (`translations[locale]`); handlers resolve a `locale` query param. EN is complete,
  pt-BR/de are stubbed for the first questions to demonstrate the pattern (§5).
- **Search** is a command-palette (⌘/Ctrl+K or the ⌕ icon) with grouped results.

## Content authoring (admin-gated)

The `authoring` feature adds an `admin.cs` tab with forms to create **questions**
and **material**, and to cross-link them in either direction (a new question can be
linked to existing material; a new material can be linked to existing questions).

The gate is deliberately layered so it slots straight onto a real backend:

- `User.role` (`'admin' | 'user'`) — the seed **demo user is `admin`**, the others
  are `user`.
- **UI**: `useIsAdmin()` hides the nav tab; `AdminPage` redirects non-admins to `/`.
- **API**: the mock `POST /api/questions` and `POST /api/materials` return **403**
  for non-admins — the check a real backend takes over unchanged. All other content
  endpoints stay open.
- The mock `db` now holds questions and materials as mutable collections (still
  seeded, still reset per test), so created content flows through the existing
  feed / search / Curated Material / per-question Material tab with no special-casing.

The admin page's **Stats** tab (default tab) is a `GET /api/admin/stats` snapshot,
also 403'd for non-admins: headline tiles (question/material/user counts, answers
submitted, saved tests, attempts, bookmarks, bug reports) plus charts — questions by
type and by difficulty (ordinal: easy → medium → hard, not alphabetical), material by
type, an answer-correctness split, and a top-tags-by-answer-volume ranking. Charts
follow the project's dataviz method: fixed categorical hue slots for identity
(`--series-1…4`, validated against both surfaces), one sequential hue for the
open-ended tag ranking so it never cycles a 4-slot palette, and every bar keeps a
direct text label since two of the four categorical slots carry a contrast WARN on
the light surface.

## Decisions on the spec's open points (§15)

- **Scissors strike-through**: session-only, not persisted.
- **Tabs vs accordions**: an editor-style bottom panel with tabs, used consistently.
- **Pagination size**: 10 per page. Chart colors: validated tokens in `global.css`.
- **"Weak" definition** (single constant in `src/features/weak-spots/weakness.ts`):
  accuracy < 60% with ≥ 2 attempts, **or** the most recent attempt was wrong.
- **Practice mode**: the Commented Answer tab is available per-question as the user
  goes (lower-stakes feel); Exam hides Commented Answer / Comments / Stats and the
  scissors aid until after the bulk submit.

### Deliberate deviations from the original spec (by design request)

- The collapsible sidebar (§8) was replaced by the file-tab navigation strip; on
  small screens it scrolls horizontally instead of collapsing into a drawer.
- MUI was removed entirely in favor of the custom editor theme; the answer
  distribution chart is a hand-rolled bar list instead of MUI X Charts.
- Options display as `options[n] = "…"` array entries rather than A–E letter pills
  (option ids remain A–E internally for scoring and the mock API).
