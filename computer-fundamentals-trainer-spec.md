# Computer Fundamentals Trainer — Frontend Build Spec

**Purpose of this document:** this is a self-contained brief for an AI coding agent (or a human dev) to build the **frontend only** of a quiz/trainer app for computer fundamentals. There is no real backend — all data is mocked. The document defines scope, data model, pages, components, and conventions so the build can proceed without needing to ask clarifying questions on the basics below. Anything not covered here is left to the implementer's judgment, following the stated best practices.

---

## 1. Overview

A gamified quiz platform for learning computer fundamentals (e.g. networking, OS, hardware, data structures — actual question content is placeholder/mock data). Users can:

- Browse a paginated feed of all questions and answer them one at a time.
- See a featured **Question of the Day** on Home.
- Bookmark any question for later, independent of building a full test.
- Jot down **private notes** on any question (mnemonics, personal reminders).
- Build custom tests from a subset of questions, name them, and save them to their profile.
- Take a saved test in one sitting, in **Practice** or **Exam** mode, optionally timed, with a single bulk submit.
- Review past attempts of a test, and retry just the questions they got wrong.
- Get a standing **Weak Spots** queue of questions they've historically struggled with.
- Search the whole site from a top bar.
- Read curated learning material (books, videos, articles, links).
- See per-question stats, explanations, other users' comments, and report bugs on a question.

## 2. Scope

- **Frontend only.** No real backend, no real persistence beyond the mocked layer.
- All network calls go through **Mock Service Worker (MSW)**, intercepting real `fetch` calls, so components are written exactly as they would be against a real API. This makes swapping in a real backend later a non-event.
- "Loggable" = a mocked authentication flow (login/logout/register), not real security. Session persists in-memory via the mocked `/api/auth/me` + local storage token stub.

## 3. Tech Stack (confirmed + assumed)

| Concern | Choice | Status |
|---|---|---|
| Language | TypeScript | ✅ confirmed |
| UI library | MUI (Material UI) v6 | ✅ confirmed ("React Material") |
| Client/UI state | Zustand | ✅ confirmed |
| Mocked backend | Mock Service Worker (MSW) | ✅ confirmed |
| Server-state cache/fetching | TanStack Query (React Query), calling `fetch` against MSW-mocked endpoints | ⚠️ assumption — pairs naturally with Zustand: Zustand owns UI/client state (sidebar open/close, locale, theme), React Query owns anything that looks like "data from the server" (questions, comments, stats, tests). Flag if you'd rather do plain `fetch` + Zustand for everything. |
| Routing | React Router v6 | ⚠️ assumption |
| i18n | `react-i18next` | ⚠️ assumption |
| Charts (answer-distribution stats) | MUI X Charts | ⚠️ assumption — stays visually consistent with MUI without adding a second design system |
| Forms + validation | React Hook Form + Zod | ⚠️ assumption (login form, test-builder name field, comment box, bug report) |
| Build tool | Vite | ⚠️ assumption |
| Unit/integration testing | Vitest + React Testing Library + MSW | ⚠️ assumption |
| E2E testing | Playwright | ✅ confirmed |
| Component workshop | Storybook | ✅ confirmed — used for the Question Component's four modes (`feed`/`pick`/`test`/`review`) |
| Theming | MUI theme with light + dark mode | ✅ confirmed |
| Linting/formatting | ESLint + Prettier, `import/order` enforced | ⚠️ assumption |

Anything marked ⚠️ can be swapped freely without touching the rest of this spec — they're implementation details behind clean boundaries (each feature's own `hooks/` for data-fetching, a `theme/` folder for MUI, an `i18n/` folder for translations).

## 4. Project Structure & Architecture (feature-based)

The codebase follows **feature-based architecture** (a lighter version of Feature-Sliced Design): each feature owns everything it needs — components, hooks, its own types, its own tests/stories — and shared things are promoted to a common layer only once a second feature actually needs them.

### 4.1 Layering rule (the important part)

Three layers, strict one-way dependency — lower layers never import from higher ones:

```
app/        → wires everything together (routing, providers, theme, layout)
   ↓ imports from
features/   → one folder per business capability (questions, tests, bookmarks...)
   ↓ imports from
shared/     → generic, feature-agnostic building blocks (Button, Chip, api client, hooks)
```

A feature may import from another feature's **public API only** (its `index.ts` barrel export) — never reach into another feature's internal files (e.g. `features/custom-tests` importing `features/questions/index.ts`'s exported `QuestionCard`, not `features/questions/components/QuestionCard` directly). This one rule is what keeps the app from tangling as it grows, and it's cheap to enforce with `eslint-plugin-boundaries` or `import/no-restricted-paths`.

### 4.2 Folder layout

```
src/
  app/
    App.tsx
    router.tsx
    providers.tsx          # QueryClientProvider, ThemeProvider, i18n, MSW init (dev)
    layout/
      AppShell.tsx
      TopBar.tsx
      SideNav.tsx

  pages/                    # thin route-level components — compose features, hold no logic
    HomePage.tsx
    BuildTestPage.tsx
    TakeTestPage.tsx
    MyTestsPage.tsx
    BookmarksPage.tsx
    WeakSpotsPage.tsx
    CuratedMaterialPage.tsx
    LoginPage.tsx

  features/
    questions/
      components/
        QuestionCard.tsx
        AnswerOptions.tsx
        ScissorsToggle.tsx
        ExpandableTabs/
          CommentedAnswerTab.tsx
          CommentsTab.tsx
          MyNotesTab.tsx
          StatsTab.tsx
          MaterialTab.tsx
          BugReportTab.tsx
      hooks/                # React Query hooks for this feature's data
        useQuestions.ts
        useSubmitAnswer.ts
        useBookmark.ts
        useQuestionNote.ts
      types.ts
      index.ts              # public API — the only thing other features may import
      __tests__/

    custom-tests/           # test-building/taking; named to avoid clashing with "tests" as in Jest
      components/
        TestBuilderTray.tsx
        TestModePicker.tsx  # Practice/Exam selector
        TestTimer.tsx
        ResultsScreen.tsx
      hooks/
        useTestBuilder.ts
        useTestAttempt.ts
        useTestAttempts.ts  # attempt history
      types.ts
      index.ts

    materials/
    search/
    weak-spots/
    auth/
      components/
        LoginForm.tsx
      hooks/
        useAuth.ts
      index.ts

  shared/
    ui/                      # generic, feature-agnostic components
      Chip.tsx
      EmptyState.tsx
      ErrorState.tsx
    hooks/
      useDebounce.ts
      useLocalStorage.ts
    api/
      client.ts              # fetch wrapper, base URL, error normalization
    utils/
    types/                   # cross-feature shared types only (e.g. User)

  stores/                    # cross-feature Zustand stores ONLY (auth, UI/theme/locale)
    useAuthStore.ts
    useUIStore.ts

  mocks/
    handlers/                # split by domain, mirrors the feature split
      questions.ts
      tests.ts
      auth.ts
      materials.ts
    seed/
    browser.ts               # msw/browser setup (dev)
    server.ts                # msw/node setup (tests)

  i18n/
    en.json
    pt-BR.json
    de.json
    config.ts

  theme/
    theme.ts
    palette.ts

e2e/                          # Playwright specs, outside src/, own tsconfig
  home.spec.ts
  build-test.spec.ts
  take-test.spec.ts
```

### 4.3 Notes on specific choices

- **`pages/` vs `features/`**: pages are deliberately dumb — they compose feature components and pass through route params, nothing else. This keeps routing decoupled from business logic, so feature components stay testable and storyable without a router in the loop.
- **Per-feature `index.ts`**: the feature's public API. Anything not exported from it is private — enforce with a lint rule blocking deep imports into another feature's internals.
- **`mocks/handlers/` split by domain**, not one giant `handlers.ts` — mirrors the feature split and keeps MSW setup maintainable as endpoints grow (see §7 for the full endpoint list).
- **State placement**: only genuinely cross-feature state lives in top-level `stores/` (auth, UI/theme/locale). Feature-scoped state (in-progress test builder selection, in-progress attempt/timer) lives inside that feature's own `hooks/`, as a local store or component state — don't reflexively promote everything to global state.
- **`.stories.tsx` files** sit next to the component they document inside the feature (e.g. `features/questions/components/QuestionCard.stories.tsx`), not in a separate top-level folder — keeps them from going stale.
- **Absolute imports** (e.g. `@/features/questions`) via `tsconfig.json` paths + Vite alias.

## 5. Internationalization

Three locales: **English (en)**, **Portuguese — Brazil (pt-BR)**, **German (de)**.

- All user-facing strings go through `react-i18next` — no hardcoded copy in components.
- Locale is stored in the UI Zustand store and persisted to `localStorage`.
- A locale switcher lives in the top bar (or user menu).
- Mock question content should exist in all three locales in the seed data (or at minimum, structured so a `content[locale]` lookup pattern is obvious and trivial to extend) — the agent building this can seed EN fully and stub PT-BR/DE with the same structure.

## 6. Data Model (TypeScript)

```ts
// --- Users ---
interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  locale: 'en' | 'pt-BR' | 'de';
}

// --- Questions ---
type QuestionType = 'multiple-choice' | 'true-false';

interface BaseQuestion {
  id: string;
  type: QuestionType;
  prompt: string;          // the question text / statement
  tags: string[];          // categories, e.g. ["Networking", "OSI Model"]
  difficulty?: 'easy' | 'medium' | 'hard';
  explanation: string;     // "commented answer" content
}

interface MultipleChoiceOption {
  id: string;              // 'A' | 'B' | 'C' | 'D' | 'E'
  label: string;
}

interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice';
  options: MultipleChoiceOption[]; // 2–5 options, labeled A–E
  correctOptionId: string;
}

interface TrueFalseQuestion extends BaseQuestion {
  type: 'true-false';
  correctAnswer: boolean;
}

type Question = MultipleChoiceQuestion | TrueFalseQuestion;

// --- Comments ---
interface QuestionComment {
  id: string;
  questionId: string;
  userId: string;
  userName: string;
  body: string;
  createdAt: string; // ISO date
}

// --- Stats ---
interface AnswerStat {
  optionId: string;   // option id, or 'true' / 'false'
  label: string;
  count: number;
  percentage: number;
}
interface QuestionStats {
  questionId: string;
  totalResponses: number;
  distribution: AnswerStat[];
}

// --- Materials ---
type MaterialType = 'book' | 'video' | 'article' | 'link';
interface MaterialItem {
  id: string;
  type: MaterialType;
  title: string;
  url: string;
  author?: string;
  description?: string;
  tags: string[];
  relatedQuestionIds?: string[]; // links back into per-question "Material" tab
}

// --- Bug reports ---
interface BugReport {
  id: string;
  questionId: string;
  userId: string;
  message: string;
  createdAt: string;
  status: 'open' | 'reviewed' | 'closed';
}

// --- Bookmarks ---
interface Bookmark {
  id: string;
  userId: string;
  questionId: string;
  createdAt: string;
}

// --- Private per-user notes on a question ---
interface QuestionNote {
  id: string;
  userId: string;
  questionId: string;
  body: string;
  updatedAt: string;
}
// Visible only to the note's own author — never shown alongside public Comments.

// --- Per-user, per-question performance (drives the Weak Spots queue) ---
interface UserQuestionStat {
  userId: string;
  questionId: string;
  timesAnswered: number;
  timesCorrect: number;
  lastAnsweredAt: string;
  lastAnswerCorrect: boolean;
}
// "Weak" = accuracy below a threshold (e.g. <60%) OR the most recent attempt was wrong.
// This is a derived/aggregate mock concept — MSW can compute it from stored attempts
// rather than requiring a hand-seeded table.

// --- Custom tests ---
type TestMode = 'practice' | 'exam';

interface CustomTest {
  id: string;
  ownerId: string;
  name: string;
  questionIds: string[];
  timed: boolean;
  durationMinutes?: number;
  shuffleQuestions: boolean;   // randomize question order per attempt
  shuffleOptions: boolean;     // randomize multiple-choice option order per attempt
  createdAt: string;
}

interface TestAttempt {
  id: string;
  testId: string;
  userId: string;
  mode: TestMode;
  answers: Record<string, string | boolean>; // questionId -> chosen optionId or bool
  score: number;
  startedAt: string;
  submittedAt?: string;
}
```

## 7. Mocked API (MSW handlers)

All under `/api`:

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/login` | mock credential check, returns fake token + user |
| POST | `/auth/logout` | clears mock session |
| GET | `/auth/me` | returns current mock user or 401 |
| GET | `/questions` | query params: `page`, `pageSize`, `tags`, `search` |
| GET | `/questions/daily` | today's featured Question of the Day (deterministic by date, so it doesn't change on refresh) |
| GET | `/questions/:id` | single question |
| POST | `/questions/:id/submit` | body = chosen answer; returns correctness + updates in-memory stats |
| GET | `/questions/:id/comments` | |
| POST | `/questions/:id/comments` | |
| GET | `/questions/:id/notes` | current user's private note on this question, if any |
| PUT | `/questions/:id/notes` | create/update the current user's private note on this question |
| GET | `/questions/:id/stats` | returns `QuestionStats` |
| GET | `/questions/:id/materials` | materials tied to this question |
| POST | `/questions/:id/bug-reports` | |
| POST | `/questions/:id/bookmark` | toggles a bookmark for the current user on this question |
| GET | `/bookmarks` | current user's bookmarked questions |
| GET | `/questions/weak` | the current user's Weak Spots queue — questions derived as "weak" from `UserQuestionStat` |
| GET | `/tags` | full tag/category list, for filters |
| GET | `/search` | `q=` — searches questions, materials, and test names; used by the top-bar search |
| GET | `/tests` | current user's saved tests |
| POST | `/tests` | create/save a custom test (incl. `shuffleQuestions`/`shuffleOptions` flags) |
| GET | `/tests/:id` | |
| GET | `/tests/:id/attempts` | attempt history for a test — list of past `TestAttempt`s with scores and dates |
| POST | `/tests/:id/submit` | bulk submit of all answers in a test attempt (tagged with `mode: 'practice' \| 'exam'`), returns score breakdown |
| GET | `/materials` | curated materials page, filterable by `type`/`tags` |

Seed data lives in `mocks/seed/` — enough fake questions (~30–50) across a handful of tags to make pagination, filtering, and search demonstrably work.

## 8. Layout / App Shell

- **Top bar**: app logo/name on the left, a **centered global search field** (queries `/api/search`, results grouped by type: Questions / Materials / Tests, navigates on click), user menu + locale switcher + a **light/dark mode toggle** on the right.
- **Side menu**: collapsible (icon-only collapsed state vs. full labels expanded state; persisted in the UI Zustand store). Full overlay drawer with a hamburger toggle below the `sm` breakpoint. Items:
  - Home (question feed)
  - Weak Spots
  - Bookmarks
  - Build a Test
  - My Tests
  - Curated Material
  - (Profile / Logout in user menu, not sidebar)
- Built mobile-first — see §12 for the full responsive/mobile requirements (touch targets, breakpoints, reflow rules).

## 9. Pages

### 9.1 Login / Register (mocked)
Simple MUI form, React Hook Form + Zod validation, hits the mocked `/auth/login`. No real security — this exists to make the app "loggable" and to scope data (comments, saved tests) to a mock user.

### 9.2 Home — Question Feed
- A **Question of the Day** card featured at the top, above the feed (`GET /questions/daily`) — rendered with the same Question Component, so it's answerable in place like any other question.
- Paginated list of **all** questions (mock `pageSize`, e.g. 10–20/page), with tag filter and the shared search.
- Each question card renders the full **Question Component** (see §10) **including its own Submit button** — answering is per-question here, immediate feedback.

### 9.3 Build a Test
- Question picker: same filterable/searchable list as Home, but with a checkbox/"add to test" affordance instead of a submit button.
- A running "selected questions" tray (side panel or sticky footer) showing the current picks, removable.
- Name field for the test.
- Toggle: **Timed / Not timed** — if timed, a duration field appears.
- "Save Test" → `POST /tests`, then navigate to My Tests.

### 9.4 My Tests
- List of the user's saved tests (name, question count, timed/untimed, created date).
- Actions: Take Test, Edit, Delete, **View Attempt History** (expands or navigates to a list of past `TestAttempt`s for that test — date, mode, score — via `GET /tests/:id/attempts`).

### 9.5 Take Test
- Before starting, the user picks **Practice** or **Exam** mode (`TestMode`):
  - **Practice**: the scissors elimination aid and the Commented Answer tab are available as normal; the user can check an answer's explanation as they go if the underlying UI allows it in `test` mode, or immediately after the bulk submit — implementer's call, but practice should feel lower-stakes.
  - **Exam**: scissors aid hidden, Commented Answer / Stats / Comments tabs hidden until after submission — simulates a real test.
- If the test's `shuffleQuestions`/`shuffleOptions` flags are set, order is randomized once per attempt (not re-shuffled on every render).
- Renders the test's questions using the **Question Component in "test" mode**: no individual submit buttons, no per-question correctness reveal.
- If timed: a visible countdown; auto-submits on expiry.
- A single **global Submit** at the end submits all answers at once (`POST /tests/:id/submit`, tagged with the chosen `mode`) and shows a results/score screen (per-question breakdown, reusing the review UI from §10 in read-only "reveal" mode).
- **Results screen** includes a **"Retry Incorrect Only"** action, which starts a new attempt scoped to just the questions the user got wrong.

### 9.6 Curated Material
- Standalone page listing `MaterialItem`s (books/videos/articles/links), filterable by type and tag — independent of any single question, though the same items can also surface in a question's "Material" tab.

### 9.7 Bookmarks
- A simple list/grid of the user's bookmarked questions (`GET /bookmarks`), rendering the Question Component in `feed` mode so they can be answered directly from here.
- Empty state when nothing is bookmarked yet, pointing back to Home.

### 9.8 Weak Spots
- A queue of questions the user has historically struggled with (`GET /questions/weak`, derived from `UserQuestionStat`), rendered the same way as Bookmarks.
- A short explanatory line at the top (e.g. "Questions you've gotten wrong recently or often") so the feature's purpose is obvious without a tooltip.
- Empty state for users with no attempt history yet, or none currently "weak."

## 10. Question Component (the core reusable piece)

Used in the Home feed, the Build-a-Test picker, Take-Test, Bookmarks, and Weak Spots — with mode flags (`mode: 'feed' | 'pick' | 'test' | 'review'`, plus `testMode?: 'practice' | 'exam'` when `mode === 'test'`) controlling which affordances show.

**Structure:**

1. **Prompt** — the question text or true/false statement.
2. **Tags/categories** — small chip row (e.g. MUI `Chip`) showing the question's tags.
3. **Bookmark toggle** — a small icon (e.g. outline/filled bookmark) near the prompt, hits `POST /questions/:id/bookmark`; available in every mode except `test`/`review` (no point bookmarking mid-attempt).
4. **Answer area:**
   - *Multiple choice*: options **A–E** as a radio group (MUI `RadioGroup` styled as cards/list items).
   - *True/False*: two large toggle-style options.
   - **Scissors affordance**: each option row has a small scissors icon that only appears **on hover** on pointer devices (see §12 for the touch-device equivalent). Clicking it toggles a "struck out" state for that option — strikethrough text + greyed out, purely a personal elimination aid (does not deselect if already chosen, does not affect scoring, not persisted beyond the session unless you want to persist per-user — implementer's call, note it as such). **Hidden entirely when `testMode === 'exam'`.**
5. **Submit button** — present in `feed`/`pick`-adjacent contexts per §9.2; **absent** in `test` mode (bulk submit only at the test level).
6. **Below the answer area, an expandable/tabbed section** (MUI `Tabs` or a set of collapsible `Accordion`s — implementer's choice, but be consistent site-wide) with:
   - **Commented Answer** — the `explanation` field, revealed after submitting (or always visible in `review` mode). **Hidden until after submission when `testMode === 'exam'`.**
   - **Comments** — other users' comments (`QuestionComment[]`), plus a box to add your own. Same exam-mode hiding rule as above.
   - **My Notes** — a private textarea (`QuestionNote`), visible only to the current user, autosaved/saved-on-blur via `PUT /questions/:id/notes`. Kept visually and functionally distinct from **Comments** — clearly labeled as private, no user attribution shown since there's only one author. Available in every mode, including `test`/exam, since it's a personal aid rather than a "reveal."
   - **Stats** — a bar chart (MUI X Charts) of `QuestionStats.distribution` — how every user has ever answered this question. Same exam-mode hiding rule as the Commented Answer/Comments tabs.
   - **Material** — book/video/article recommendations tied to this question (`relatedQuestionIds` match).
   - **Notify Bug** — a small form to file a `BugReport` against this question.

## 11. State Management Split

- **Zustand** (`stores/`): `useAuthStore` (mock session), `useUIStore` (sidebar collapsed state, locale, theme mode), `useTestBuilderStore` (in-progress test selection before saving, incl. shuffle flags), `useTestAttemptStore` (in-progress answers + timer state + `mode: 'practice' | 'exam'` during Take Test).
- **TanStack Query** (living in each feature's own `hooks/`, per §4): all reads/writes that hit MSW — questions, comments, stats, materials, tests, test attempts, bookmarks, weak spots, search. Gives caching, invalidation, and loading/error states for free.

## 12. Non-functional Requirements

- **Accessibility**: proper labeling of radio groups/toggles, keyboard navigation through options, sufficient contrast for struck-out (scissors) state in both light and dark palettes, ARIA live region for timer countdown.
- **Mobile-first / responsive**: design and build mobile-up, not desktop-down. Concretely:
  - Sidebar is a full overlay drawer (not a squeezed rail) below MUI's `sm` breakpoint, opened via a hamburger icon in the top bar.
  - Top bar search collapses to an icon that expands into a full-width field/overlay on small screens, rather than staying "centered" at an unusable width.
  - Touch targets (options, scissors icon, chips, tabs) sized to at least 44×44px on touch devices — the scissors affordance in particular needs a tap-friendly hit area since "hover" doesn't exist on touch, so on touch devices it should show a persistent (not hover-only) small icon or be reachable via long-press/tap, not hidden behind a hover state that can never trigger.
  - Question cards, the test-builder tray, and the results screen all reflow to single-column on narrow viewports.
  - Timed-test countdown stays visible without scrolling on mobile (e.g. sticky top).
  - Verified at minimum at common breakpoints: ~360px (small phone), ~768px (tablet), desktop.
- **Error and empty states**: every list or async section has an explicit, designed state for "no data yet" and "failed to load" — not just a blank div. This applies at minimum to: the question feed (no results for a filter/search), comments (no comments yet / failed to post), stats (no responses yet), materials (none linked to this question), My Tests (no saved tests yet), and curated material (no matches for the current filter). Each error state should offer a retry action where the underlying action is retryable (e.g. refetch).
- **List performance**: if the question feed, the test-builder picker, or a single test's question count grows large, virtualize the list (e.g. `react-window` / `@tanstack/react-virtual`) rather than rendering everything at once. Not required at the seed-data scale in §7, but components shouldn't be built in a way that assumes a small, fixed list size — keep the list-rendering logic swappable for a virtualized version later.
- **Theming**: light and dark mode via MUI's `createTheme`/`ThemeProvider`, toggle in the top bar, preference persisted in the UI Zustand store (`localStorage`), defaulting to the user's OS preference (`prefers-color-scheme`) on first visit.
- **Code quality**: strict TypeScript (`strict: true`), no `any` without justification, components kept small and colocated with their feature, shared types in `types/`, no business logic in JSX beyond simple derivations.
- **Testing**: see §13 below — testing is not an afterthought, it's part of the definition of done for each feature in the build order.

## 13. Testing Strategy

Three layers, each with a distinct job — don't let one substitute for another.

### 13.1 Unit tests (Vitest + React Testing Library)
Fast, isolated, no network. One component/function/hook at a time.

- **Question Component logic**: option selection (single-select enforcement), scissors strike-through toggle (doesn't clear selection, doesn't affect the submitted answer), rendering differences across `feed`/`pick`/`test`/`review` modes and `practice`/`exam` sub-modes (scissors + tabs hidden correctly in exam), A–E option labeling for 2–5 options, bookmark toggle state, My Notes save/load state independent of other users.
- **Test timer**: countdown math, pause/resume if supported, auto-submit callback firing exactly once at zero.
- **Score calculation**: given a set of answers + correct answers, the scoring util returns the right tally, including unanswered questions counted as wrong; "Retry Incorrect Only" correctly derives the subset of missed question IDs.
- **Weak Spots derivation**: given a set of `UserQuestionStat` records, the "is this question weak" util correctly applies the accuracy-threshold-or-last-wrong rule.
- **Shuffle util**: given a fixed seed/input, question and option shuffling is deterministic in tests (don't let true randomness make a unit test flaky).
- **Zustand stores**: sidebar collapse toggle, locale persistence, theme persistence — pure store logic, no rendering needed.
- Target: every store and every non-trivial hook/util has a unit test; UI components get unit tests for behavior, not for pixel output.

### 13.2 Integration tests (Vitest + React Testing Library + MSW)
Render a real feature (multiple components + React Query + the actual mocked network layer), assert on user-visible outcomes.

- Answer a question in the feed → submit → explanation reveals → stats bar chart shows the updated distribution.
- Home page loads and shows a Question of the Day card, distinct from and above the paginated feed, answerable the same way.
- Write a private note on a question, reload/refetch → note persists and is not shown to other (mock) users.
- Bookmark a question from the feed → it appears on the Bookmarks page; un-bookmarking removes it.
- Build a test (pick 5 questions, name it, toggle timed on) → save → it appears in My Tests with the right metadata.
- Take a test in **Exam mode** → verify scissors and the answer/stats/comments tabs are hidden until after submit, then appear on the results screen.
- Take a test in **Practice mode** → verify scissors and tabs behave as in normal `test` mode.
- Take a timed test → let the timer hit zero → auto-submit fires → results screen shows a score.
- From a results screen with some wrong answers, click **Retry Incorrect Only** → a new attempt starts scoped to just those questions.
- Open a test's **Attempt History** → past attempts list with correct scores/dates.
- Answer the same question wrong enough times → it appears in the Weak Spots queue.
- Post a comment → it appears in the comment list without a page reload.
- Global search → typing a query surfaces grouped results and clicking one navigates correctly.
- File a bug report → success confirmation shown, form resets.

These live alongside the unit tests (e.g. `*.integration.test.tsx`) and always run against MSW — never against a real network.

### 13.3 End-to-end tests (Playwright)
Full browser, full app, real user journeys, top to bottom — the app under test still runs with MSW mocks (via `msw/browser` service worker) so E2E stays fast and deterministic without needing a real backend.

Minimum journey coverage:

1. **Login → browse → answer**: log in, land on Home, answer a multiple-choice question and a true/false question, see correctness + explanation for each.
2. **Build and take a test**: log in, build a 5-question test (timed), save it, open it from My Tests, choose Exam mode, answer all questions, submit, verify the score screen and that hidden aids (scissors/explanations) only appear after submission.
3. **Search**: use the top-bar search to find a question by keyword and navigate to it.
4. **Localization**: switch locale to pt-BR (or de), verify key UI strings change (nav labels, buttons).
5. **Dark mode**: toggle dark mode, verify it persists across a page reload.
6. **Mobile viewport**: run the core "browse and answer a question" journey (from #1) at a small viewport size, verifying the sidebar opens as an overlay and the layout stays usable.
7. **Bookmark and revisit**: bookmark a question from Home, navigate to Bookmarks, confirm it's there and answerable.

Playwright specs live in `e2e/`, run against a locally built/served app (`vite preview` or dev server) as part of CI.

### 13.4 CI Gate
Whatever CI runner is used, the pipeline should run, in order: typecheck → lint → unit/integration tests → build → E2E — failing fast on the cheapest checks first.

## 14. Suggested Build Order

1. App shell (theme incl. dark mode, router, top bar, collapsible sidebar) + i18n scaffolding.
2. Mock data + MSW handlers + seed questions/materials.
3. Auth (mocked login/logout) + protected routes.
4. Question Component in `feed` mode, with Storybook stories for each mode as it's built → Home page with pagination + tag filter.
5. Question of the Day card on Home.
6. Expandable tabs (Commented Answer, Comments, My Notes, Stats, Material, Notify Bug) wired to mock endpoints.
7. Bookmarks (toggle on the Question Component + Bookmarks page).
8. Global search (top bar) hitting `/api/search`.
9. Build a Test flow (incl. shuffle flags) → My Tests → Take Test (Practice/Exam mode picker, timer) → results/review screen with "Retry Incorrect Only".
10. Attempt History on My Tests.
11. Weak Spots queue (derived from mock `UserQuestionStat` seed data) + page.
12. Curated Material page.
13. Unit + integration tests written alongside each feature above (not deferred to the end).
14. Playwright E2E journeys (§13.3) once the flows they cover exist end to end.
15. Polish: mobile-viewport pass (touch targets, drawer/search behavior, reflow at 360/768px), a11y pass, PT-BR/DE translation stubs, dark mode contrast check, empty/error state review across all lists.

## 15. Explicit Open Decisions Left to Implementer

- Whether the scissors "strike-through" state persists per-user across sessions or is session-only (default assumption: session-only, no persistence needed for an MVP mock).
- Whether tabs vs. accordions are used for the per-question expandable section (pick one and use it consistently).
- Exact pagination size and chart color scheme (for both light and dark palettes).
- The exact "weak" threshold for the Weak Spots queue (e.g. accuracy < 60% with at least 2 attempts, or simply "last attempt was wrong") — pick one, document it in code, and keep it in a single constant so it's easy to tune.
- Whether Practice mode reveals the Commented Answer per-question as the user goes, or only after the bulk submit like Exam mode (the spec only requires Exam to withhold it fully).
