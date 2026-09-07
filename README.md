# Computer Fundamentals Trainer

Frontend-only, gamified quiz platform for computer-science fundamentals, built to
[the spec](./computer-fundamentals-trainer-spec.md). There is no real backend — every
`fetch` is intercepted by **Mock Service Worker (MSW)**, so components are written
exactly as they would be against a real API.

## Stack

TypeScript · React 18 · Vite · MUI v6 · MUI X Charts · Zustand · TanStack Query ·
React Router v6 · react-i18next (en / pt-BR / de) · React Hook Form + Zod · MSW ·
Vitest + React Testing Library · Playwright · Storybook.

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173
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

```
app/ (providers, router, layout)  →  pages/ (thin composition)
  →  features/ (questions, custom-tests, auth, search, materials, weak-spots)
  →  shared/ (ui, api client, hooks, utils, types)
```

- **Server state** lives in TanStack Query hooks inside each feature's `hooks/`.
- **Client/UI state** lives in Zustand: global stores in `src/stores/` (auth session,
  theme/locale/sidebar), feature-scoped stores inside the owning feature
  (test-builder selection, in-progress attempt incl. the per-attempt shuffle seed).
- **Mocks** (`src/mocks/`) mirror the feature split: handlers per domain, an in-memory
  `db.ts` (reset per test), seed data in `seed/`. The auth token stub encodes the user
  id so the mock session survives page reloads.
- **Question content i18n**: seeds are authored in English with per-locale overrides
  (`translations[locale]`); handlers resolve a `locale` query param. EN is complete,
  pt-BR/de are stubbed for the first questions to demonstrate the pattern (§5).

## Decisions on the spec's open points (§15)

- **Scissors strike-through**: session-only, not persisted.
- **Tabs vs accordions**: MUI `Tabs` inside a collapsible section, used consistently.
- **Pagination size**: 10 per page. Chart colors: per-mode palette in `src/theme/palette.ts`.
- **"Weak" definition** (single constant in `src/features/weak-spots/weakness.ts`):
  accuracy < 60% with ≥ 2 attempts, **or** the most recent attempt was wrong.
- **Practice mode**: the Commented Answer tab is available per-question as the user
  goes (lower-stakes feel); Exam hides Commented Answer / Comments / Stats and the
  scissors aid until after the bulk submit.
