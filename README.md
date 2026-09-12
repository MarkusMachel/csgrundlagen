# Computer Fundamentals Trainer

Frontend-only, gamified quiz platform for computer-science fundamentals, built to
[the spec](./computer-fundamentals-trainer-spec.md) with a **code-editor-style UI**:
navigation is a strip of open "file" tabs (`home.cs`, `weak_spots.cs`, …), each
question renders in an editor pane with a line-number gutter, answers read as array
entries (`options[2] = "HTTPS"`), and a VS Code-style status bar carries page
context, progress dashes, and the session streak. There is no real backend — every
`fetch` is intercepted by **Mock Service Worker (MSW)**, so components are written
exactly as they would be against a real API.

## Stack

TypeScript · React 18 · Vite · hand-rolled CSS design system (no UI library —
tokens + components in `src/styles/global.css`) · Zustand · TanStack Query ·
React Router v6 · react-i18next (en / pt-BR / de) · React Hook Form + Zod · MSW ·
Vitest + React Testing Library · Playwright · Storybook.

## Getting started

```bash
npm install
npm run dev          # serves on localhost:5173
```

Log in with the mock demo account: **demo@example.com / password**.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server (MSW serves `/api`) |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run lint` | ESLint (incl. `import/order` and feature-boundary rule) |
| `npm test` | Vitest unit + integration tests (MSW via `msw/node`) |
| `npm run build` | typecheck + production build |
| `npm run e2e` | Playwright journeys (starts the dev server itself; first run: `npx playwright install chromium`) |
| `npm run storybook` | Storybook (QuestionCard in all four modes) |

CI gate order (§13.4): **typecheck → lint → test → build → e2e** — cheapest first.

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
