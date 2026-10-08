# Group 39 Learn: learning platform build plan

## Context

Judah's COS 303 group (6 people, most have never coded) must build the Intelligent Hostel Management System (IHMS) and defend the group paper. The course content already exists as a draft: `school/cos303-hostel-paper/course/course-content.md` (about 4,900 lines; Track A Parts 0–5, Track B Parts 6–17, Appendices A–D).

This plan turns that draft into a web platform in the style of freeCodeCamp, with lesson mechanics borrowed from Mimo, SoloLearn and Brilliant. It is executed by Sonnet sub-agents, which I (Opus) brief, monitor and correct.

**Decisions taken with Judah (8 Oct 2026)**

| Topic | Decision |
|---|---|
| Device | Laptop first. A three-panel workshop layout like freeCodeCamp. Phones should still work for lessons and quizzes. |
| Accounts | Supabase (auth + Postgres) with a static Vite site on Vercel. Judah gets an admin dashboard. |
| Code runner | All in the browser: HTML/CSS/JS in an iframe, Python via Pyodide, PostgreSQL via PGlite, FastAPI via Pyodide. Phase 0 tests feasibility first. |
| Projects | Warm-up projects first, then the IHMS, in every language chapter. |
| Motivation | XP, a daily streak, a "N in a row" combo counter, and a weekly leaderboard of the 6 members. |
| AI | None. Help comes from progressive written hints and an "Ask the group" WhatsApp button. |
| Repo checks | Members create repos from a template. GitHub Actions runs the official tests, and the platform reads the job results. |
| Deadline | About one month. The course ships in 4 weekly releases, from 15 Oct to 5 Nov 2026. |

**Sub-agents:** they run as `model: "sonnet"`, which is Sonnet 5, the newest Sonnet; there is no Sonnet 5.5.

## What the reference apps showed (and what we take)

| Pattern | Seen in | Use in Group 39 Learn |
|---|---|---|
| Course structure: chapter → module → block. Block types are lecture, workshop, lab, review, quiz, cert project, exam. Each module runs lecture → workshop → lab → review → quiz. | freeCodeCamp v9 (`curriculum/structure/superblocks/*.json`) | Same hierarchy and rhythm. "Lecture" becomes a screen-based **lesson**. |
| Workshop step: short description, code seeded with the previous step's state, an editable region, ordered tests that each carry a diagnostic message, only the first failing message shown, success panel with block progress, Ctrl+Enter to check, reset button, help modal (Read-Search-Ask, hint, forum). | freeCodeCamp cat photo app steps, live UI | Copy it, but lock the code outside the editable region. The live fCC editor let typing land outside the region, which would confuse beginners. |
| Lab: "build an app functionally similar to this example", numbered user stories, full test list, empty editor, solution kept in the file. | fCC `lab-recipe-page` | Copy it. Warm-up labs and IHMS labs both use it. |
| Quiz: a pool of 80 questions; each attempt draws 20 and needs 18 to pass. Each question has its text, distractors and the answer. | fCC `quiz-basic-html` | Smaller pool: draw 15 from about 30, pass at 12. Add an explanation per question. |
| Lecture: short text, runnable snippets ("interactive editor"), 3 multiple-choice questions with feedback per option. | fCC `lecture-*` | Becomes the lesson's concept screen and question screens. |
| Local course: numbered steps, hints that go from vague to the exact answer, tests that check terminal and database state. | fCC CodeRoad (`learn-relational-databases-…`) | Progressive hints on every step. The laptop chapter uses checklists where the learner pastes command output. |
| Concept screen with code plus a runnable "Tap to edit / RUN" playground and an output sheet; info callout; fill-in-the-blank tokens; "Stuck?" helper; lesson list with XP; module quiz; streak screen. | SoloLearn (Kotlin variables) | Concept screen with a "Try it" runner. The tap-build screen type. |
| Show the finished thing first ("Guess the letter" game), then build its parts. Tap snippets from a token bank that includes tempting wrong tokens (`<\h1>`). Free typing with a code-symbol bar. MCQ, "What's wrong with this code?", predict-the-output ("How many paragraphs?"), an annotated anatomy diagram (opening tag / content / closing tag → element). | Mimo, Full-Stack path lesson 1 | Every workshop opens with a demo of the finished project. Lessons use these screen types. |
| Feedback sheet from a mascot ("Spot on! Let's keep it going"), a report flag, "N IN A ROW" in the progress bar. Lesson-end card with exercises, XP and accuracy. Mid-lesson question "How's this lesson feeling?". | Mimo | Feedback sheet, combo counter, end card. The feedback pulse is stored and shown to Judah. |
| Practice tab: daily review by spaced repetition, past topics, playgrounds (static site / Python / JS). | Mimo | A review queue of wrongly answered quiz questions (phase 5). Playgrounds are a stretch goal. |
| Visual puzzles: order commands until a robot reaches a gem; Check → "Correct!" + "Why?" + XP; 3-exercise lessons on a path map. | Brilliant | **Order** and **widget** screen types (escalation slider, tier sorter, data-flow tracer). A "Why?" button on every result. |
| Onboarding asks for a goal, experience level and daily target; heavy paywall and notification prompts. | All three | Keep only display name and daily XP goal. No paywall and no nagging. |

## Product spec

**Users.** 6 members, invited by Judah. Judah has `role=admin`. Nobody can sign up publicly.

**Block types and players**

| Type | Player | How it is completed |
|---|---|---|
| `lesson` | Single column (max 720 px), one screen at a time, bottom bar with Check/Continue, feedback sheet with "Why?", combo counter, end card (screens done, XP, accuracy), feedback pulse | All screens done |
| `workshop` | Three panels: instructions \| CodeMirror 6 (multi-file tabs, locked outside the editable region) \| Preview / Console / Output / Results / Requests tab chosen by the runner. Bottom: Check (Ctrl+Enter), Reset step, Help (hints 1→3, "Ask the group"). The first failing test message shows above Check; on pass, "Your code passes" + block progress + Continue. The first step shows a live demo of the finished project. | All tests pass, step by step |
| `lab` | Same panels. Instructions are numbered user stories plus an "example project" link. The full test list shows ✓/✗. Hints are conceptual only and never give the answer. | All tests pass |
| `review` | Read-only summary with "Try it" snippets | Marked as read |
| `quiz` | One question per screen; score and wrong answers with explanations at the end; each retake draws a new set | Score ≥ pass mark |
| `project` | User stories, repo URL field, "Check my repo" button, list of CI jobs with links to the runs | The matching GitHub Actions job is green |
| `exam` | A quiz with a larger draw (Track A exam, Track B exam) | Score ≥ 80% |

**Lesson screen types:**

- `concept`: markdown, an optional code block, an optional `tryit` runner, an optional callout.
- `mcq`: one correct answer, with feedback for each option and a "Why?".
- `multi`: select all that apply.
- `tapbuild`: a template with blanks plus a token bank that includes distractors; undo and backspace.
- `typein`: a small editor region checked by tests.
- `predict`: code plus "what will it show/print?".
- `spotbug`: "What's wrong with this code?".
- `order`: drag to reorder.
- `match`: pair up two lists.
- `widget`: a named React component.
- `flashcard`: a defence question; tap to reveal the model answer, then rate it got / shaky / missed.
- `checklist`: laptop tasks, each with an optional pasted output checked by a regex. Example: `python --version` must match `^Python 3\.1[1-3]`.

**Motivation**

| Action | XP |
|---|---|
| Lesson | 10, +5 if accuracy is 100% |
| Workshop step | 5 |
| Lab | 40 |
| Quiz pass | 30 |
| Project | 80 |
| Exam pass | 100 |

- XP is written once per item per reason, enforced by a unique constraint.
- **Streak:** a day counts when at least 1 XP is earned, using Africa/Lagos time.
- **Daily goal:** chosen at onboarding: 30, 60, 100 or 150 XP.
- **Leaderboard:** this week's XP (Monday to Sunday, Lagos time) and all-time XP. It shows only display names and totals.

**Help.** Every workshop step has 1–3 hints, from conceptual to the exact code; lab hints are conceptual only. The "Ask the group" button opens `https://wa.me/?text=` with the step title, the platform URL and the first 600 characters of the learner's code. The learner sends it themselves.

**Admin dashboard (Judah).** It shows:

- A grid of members × modules with % complete, and when each member was last active.
- Quiz scores.
- Stuck list: steps with at least 5 failed checks, with the most common failing test.
- Lesson feedback ratings and comments.
- Project status, with links to each member's repo.

**Reference pages.** Built from the Appendices:

- Glossary (A). Its terms can be linked from lessons.
- Group decisions (B), including the six open design decisions.
- Do's and Don'ts (C).
- Database schema (D).

## Technical architecture

**Repo** `~/Work/group39-learn`. This is a new code project kept outside the vault, which stays storage-only. It is a single package.

```
group39-learn/
  docs/PLAN.md (copy of this plan) · docs/content-format.md · docs/style-guide.md · docs/SPIKE.md
  content/curriculum.json            chapters → modules → block slugs (fCC superblock shape)
  content/blocks/<slug>/meta.json    {id,type,title,runner,estMinutes,sourceRef}
  content/blocks/<slug>/*.md         lesson.md | 01.md…NN.md (steps) | lab.md | quiz.md | review.md | project.md
  content/reference/*.md             glossary, decisions, dos-donts, schema
  src/                               React app: pages/, players/, screens/, widgets/, runners/, store/, lib/
  src/runners/{web,python,sql,fastapi}/   each: worker or iframe host + test harness
  scripts/build-content.ts · validate-content.ts · verify-challenges.ts · new-step.ts
  supabase/migrations/*.sql
  tests/unit (Vitest) · tests/e2e (Playwright)
  .github/workflows/ci.yml           lint, typecheck, unit, validate, verify, e2e
```

**Stack:**

| Area | Choice |
|---|---|
| App | Vite, React 18, TypeScript (strict), React Router |
| Editor | CodeMirror 6, with read-only ranges outside the editable region |
| Markdown | remark/rehype |
| Validation | zod schemas for every content type |
| Supabase client | `@supabase/supabase-js` |
| Asset caching | `vite-plugin-pwa`, cache-first for runtime assets |
| Tests | Vitest and Playwright |
| Theme | Dark, IDE-like, one accent colour, monospace for code |
| UI work packages | Load the `frontend-design` skill |

**Store abstraction.** `ProgressStore` has two implementations, `SupabaseStore` and `LocalStore` (localStorage). Development and e2e work never wait for Judah's Supabase project.

**Runners.** All runners share one test contract: each test returns `{ok, message}`, and the player shows the message of the first failing test, in file order.

| Runner | Engine | Learner sees | What tests can use |
|---|---|---|---|
| `web` | sandboxed `iframe srcdoc`; `postMessage` | Preview + Console | JS function body run inside the iframe, with `code`, `code.html/css/js`, `document`, `window` and chai `assert`. These follow fCC's hint format, so fCC-style tests port directly. |
| `python` | Pyodide in a Web Worker; terminated and restarted after a 5 s timeout | Output console + Run button | Python snippet run after the learner's code in the same namespace, with `_code`, `_stdout`, `_tree` (an ast module) and the helpers `has_function(name)`, `defines(name)` and `prints(text)`. A failed `assert` returns the hint text. |
| `sql` | PGlite (real PostgreSQL in WASM) in a worker; a fresh DB per check; `setup.sql` per challenge | Results table | JS async function with `db` (`await db.query()`), `code` and `assert`. |
| `fastapi` | Pyodide + `fastapi`, `pydantic`, `httpx`, `sqlalchemy`, `bcrypt` (built-in packages) + `pyjwt` (micropip). Files are written to `/app`. SQLAlchemy uses SQLite in the browser; the lesson says so plainly. APScheduler is **never** run in the browser: escalation is taught with an injected `now`. | Requests panel (method, path, JSON body → status + JSON), like a mini Swagger | Python async snippet with `client` = `httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://t")`. Starlette's `TestClient` needs threads, which Pyodide doesn't have. |

**Content format.** `docs/content-format.md` is written in WP1.2 and enforced by zod.

- **Workshop step** (`NN.md`):
  - Frontmatter: `id` (8-char random, from `new-step.ts`), `title: Step N`, `runner`.
  - `# --description--`: the instructions.
  - `# --hints--`: pairs of hint text plus a fenced test block (```js / ```py / ```sql).
  - `# --seed--` → `## --seed-contents--`: one fenced block per file (```html file=index.html) with `--editable-region--` markers.
  - `# --solutions--`: **required on every step**, so CI can prove each step works.
  - `# --help--`: hints 1–3.
- **Lab** (`lab.md`): the same, plus `# --user-stories--` and a `demo` frontmatter field pointing to the solution rendered as the example project.
- **Lesson** (`lesson.md`): frontmatter (`id`, `title`, `sourceRef`), then `# --screen-- <type>` sections. Each type has fixed subsections:
  - `## --question--`
  - `## --options--` (`- [x]` / `- [ ]`, each followed by a `> feedback` line)
  - `## --why--`
  - `## --template--` / `## --tokens--` (tapbuild)
  - `## --items--` (order/match)
  - `## --widget-- name {props}`
  - `## --tests--` (typein)
  - `::: tryit <runner>` blocks
- **Quiz** (`quiz.md`): frontmatter `draw`, `pass`; then `## --question--` with `### --text--`, `### --distractors--`, `### --answer--`, `### --explanation--`.
- **Project** (`project.md`): frontmatter `ciJob: lab-<name>`, user stories, instructions.
- **Build step:** `build-content.ts` compiles everything to `public/content/*.json` for lazy loading.

**Supabase** (migrations in the repo; Judah applies them).

Tables:

| Table | Columns | Notes |
|---|---|---|
| `profiles` | id → auth.users, display_name, github_username, role (member\|admin), daily_goal_xp | |
| `progress` | user_id, item_id, block_id, completed_at | pk(user_id, item_id) |
| `xp_events` | user_id, item_id, reason, amount, created_at | unique(user_id, item_id, reason) |
| `attempts` | user_id, item_id, passed, failed_test_index, created_at | Feeds the stuck list |
| `code_saves` | user_id, item_id, files jsonb, updated_at | Lets a learner resume on another device |
| `quiz_attempts` | user_id, quiz_id, score, total, passed, wrong_ids text[], created_at | |
| `lesson_feedback` | user_id, block_id, rating (too_easy\|just_right\|too_hard\|confusing), comment | |
| `project_submissions` | user_id, project_id, repo_url, run_url, jobs jsonb, passed, checked_at | |

Security and access:

- **Row-level security:** each user can only read and write their own rows. `is_admin()` (security definer) gives Judah read access to everything.
- **Leaderboard and streaks:** the `leaderboard` view is security definer and exposes only names and XP totals. `streak(user)` is a SQL function computed in Africa/Lagos time.
- **Accounts:** public signups are disabled. Judah invites members by email from the Supabase dashboard, and they set their own password.

**Repo checks**

- **Template repo:** public template repo `group39-ihms` (FastAPI skeleton laid out as in course-content Parts 10–16).
- **Workflow:** `.github/workflows/labs.yml` runs on push, with a matrix of jobs named `lab-<id>`:
  - `setup`, `db`, `allocation`, `complaints`, `triage-escalation`, `email`, `portals`, `reports`, `api-tests`, `star-tests`.
  - Each job runs with a `postgres:16` service.
  - Each job runs `curl`s the **official** tests from the template repo's raw URL into `tests/official/` and runs `pytest tests/official/test_<id>.py`. A member who edits their own copy of the tests cannot pass that way.
  - Emails are captured with a fake SMTP fixture.
- **Platform check:** `GET /repos/{o}/{r}/actions/runs?branch=main&status=completed&per_page=1`, then `GET …/jobs`. Each `lab-<id>` job is mapped to a project.
  - The call is unauthenticated (60 requests/hour per IP is enough for 6 people). The result is cached in `project_submissions`.
  - Jobs for projects the member hasn't reached yet show as "not started", not as failures.
- **The team PR project (P9):** checked through the GitHub search API: a merged PR by `github_username` into the group's chosen base repo.

**Deploy and data costs.**

- Vercel serves the static build with an SPA rewrite. COOP/COEP headers are added only if the spike shows `SharedArrayBuffer` is needed.
- Pyodide and PGlite load from jsDelivr and the service worker caches them, so each member downloads them once. The UI states the size before the first download ("Python needs about N MB, once").
- The spike measures the real sizes. The estimate is 25–40 MB in total, which matters for members on mobile data.

## Content plan

- **Sources:** each block's `sourceRef` points to the course-content.md section it comes from (line ranges are below). After conversion, the platform content becomes the source of truth, and course-content.md is frozen as the draft.
- **New content:** warm-up projects and IHMS workshop step sequences are new; they go beyond the md.
- **Sizes:** lessons have 8–15 screens. Workshops have 15–35 steps. Labs have 8–15 user stories.

**Track A: Understand and defend** (about 14 h, can run alongside Track B at about 30 min a day)

| Module | Blocks | Source lines | Widgets |
|---|---|---|---|
| A0 Orientation | 3 lessons (0.1–0.3), quiz | 72–254 | order-the-15-steps |
| A1 How we did the research | 8 lessons (1.1–1.8, including practice tasks with model answers), review, quiz | 255–717 | match paper→variable, order the verification steps |
| A2 Problem, aim, objectives | 2 lessons, quiz | 718–812 | match drawback→objective |
| A3 Architecture | 6 lessons, review, quiz | 813–1196 | request/response animation (3.1), tier sorter (3.2–3.3), data-flow tracer F1–F4 (3.4), escalation slider for t and d → L (3.5), stack matcher (3.6) |
| A4 Reading the group paper | 4 lessons, quiz | 1197–1390 | match claim→source |
| A5 Presenting and defending | 2 lessons, defence flashcard drill (the whole Q&A bank from 5.3), **Track A exam** | 1391–1505 | — |

**Track B: Build the IHMS** (about 80 h). Each language chapter runs lessons → warm-up workshop → warm-up lab → IHMS workshop → IHMS lab → review → quiz.

| Ch | Lessons (source) | Warm-up workshop / lab | IHMS workshop / lab or project | Runner |
|---|---|---|---|---|
| B1 HTML | 6.1–6.4 (1542–1798) | Build a Student Profile Page (~20) / Build a Recipe Page (jollof) | Build the Complaint Form (~25) / Build the Rooms Table Page | web |
| B2 CSS | 7.1–7.4 (1799–2043) | Build a Food Menu (~25) / Build a Business Card | Style the IHMS Pages (~30: urgency badges, flex/grid, phone view) / Style the Warden Dashboard | web |
| B3 JavaScript | 8.1–8.6 (2044–2413) | Build a Bill Splitter (~25) / Build a CGPA Calculator | Make the Complaint Form Work (~35: validation, render list, deadline countdown, fetch against a mock API) / Build the Complaint Status Page (status filter) | web |
| B4 Python | 9.1–9.6 (2414–2770) | Build a Grade Report Printer (~20) / Build a Bus Fare Splitter | Code the Triage and Escalation Rules (~30: `escalation_level`, `compute_deadline`, `triage_urgency`, `triage_category`) / Build the Room Allocation Function | python |
| B5 Your laptop | 10.1–10.5 (2771–3031), using checklist screens | — | **P1** Set up your IHMS repo (green `lab-setup`, which runs the B4 functions' tests) | laptop + CI |
| B6 HTTP + FastAPI | 11.1–11.2, 12.1–12.5 (3032–3427) | Build a Proverbs API (~20) / — | Build the Complaints API (~25, in memory) / Build the Rooms API | fastapi |
| B7 SQL + PostgreSQL | 13.1–13.6 (3428–3827) | Build a Library Database (~25) / — | Create the IHMS Database (~30, the Appendix D schema with its partial unique indexes) / Write the Warden Report Queries; Connect FastAPI to the Database (~15); **P2** Database-backed API (`lab-db`, real Postgres in CI) | sql, fastapi, CI |
| B8 Users and roles | 14.1–14.3 (3828–4027) | — | Add Login with bcrypt + JWT (~20) / Protect the Warden Routes | fastapi |
| B9 IHMS modules | 15.1–15.8 (4028–4492), short framing lessons | — | **P3** Allocation, **P4** Complaints, **P5** Triage + Escalation (+ scheduler), **P6** Email, **P7** Portals, **P8** Reports + CSV, **P9** Team PR | CI |
| B10 Testing | 16.1–16.3 (4493–4660) | — | **P10** API test suite, **P11** ★ tests (triage accuracy, escalation timing); usability-session checklist | CI |
| B11 Finishing | 17.x (4661–end) | — | Jev lesson (optional; written from live TypeSafe docs with the `typesafe-ai` skill), demo-day checklist, **Track B exam** | — |

**Writing rules** (these go into `docs/style-guide.md`):

- **Language:** plain English, second person, one idea per screen, at most 60 words per concept screen.
- **Setting:** Nigerian student life (hostel, porter, hall warden, bursary, naira, Abuja).
- **Titles:** plain titles of the form "Build a …". No catchy names.
- **Code:** every snippet runs.
- **Facts:** facts about the project come only from paper.md, course-content.md or the research files. For example, Yusof scored 93.3% on category and 86.7% on urgency, on 15 complaints.
- **Open decisions:** the six open design decisions keep the placeholders from course-content.md and link to Reference → Group decisions.
- **Integrity:** the integrity rule (AI may explain code but must not write it) is stated in A0.3 and on the Help modal.

## Execution

**Releases** (members study one release while the next one is built)

| Release | Target | Contents |
|---|---|---|
| R0 | 9 Oct | Spike report (go / fallback) |
| R1 | 15 Oct | Platform core, all of Track A, B1 HTML. Pilot with one non-technical member, then the whole group. |
| R2 | 22 Oct | B2 CSS, B3 JS, Python runner + B4, leaderboard, admin dashboard |
| R3 | 29 Oct | B5 laptop + template repo + project checks, SQL runner + B7, FastAPI runner + B6 |
| R4 | 5 Nov | B8, B9, B10, B11, exams, review queue, polish |

**Work packages.** Every WP is one Sonnet agent. Parallel WPs run in the background; code WPs that run in parallel use `isolation: "worktree"` and I merge them.

| WP | Scope | Depends | Done when |
|---|---|---|---|
| 0.1 | **Spike** in `spikes/`. Tests that Pyodide imports fastapi, pydantic, httpx, sqlalchemy, sqlite3, bcrypt and pyjwt; that an `ASGITransport` request works; and that SQLAlchemy ORM works on SQLite. Tests PGlite running the Appendix D schema plus a join. Tests the worker timeout/restart. Measures download sizes and cold/warm load times. | — | `docs/SPIKE.md` gives pass/fail per item, the pinned versions and the measured sizes |
| 1.1 | Scaffold, CI, design tokens, app shell, `ProgressStore` interface + `LocalStore` | — | `npm run lint && npm run typecheck && npm test && npm run build` |
| 1.2 | Content parser, zod schemas, `build/validate/new-step` scripts, `docs/content-format.md` | 1.1 | Fixture of each type parses; `npm run validate:content` passes |
| 1.3 | Supabase migrations, RLS, views/functions, `SupabaseStore`, auth pages, onboarding | 1.1 | Migration SQL lints; Vitest covers XP/streak SQL logic via pg-mem or PGlite; auth UI e2e against `LocalStore` |
| 1.4 | Lesson player and all screen types except widgets, feedback sheet, combo counter, end card, feedback pulse | 1.2 | e2e: fixture lesson completes, combo resets on a wrong answer |
| 1.5 | Web runner + workshop/lab player (CodeMirror regions, preview, console, tests, hints, help modal, Ask-the-group) | 1.2 | e2e: fixture step fails, then passes; a locked region can't be edited |
| 1.6 | Map, home (continue, streak, daily goal), quiz player, review page, XP engine, Reference pages | 1.2 | e2e: quiz pass/fail; XP written once |
| 1.7 | `verify-challenges.ts`: Playwright checks that every step's and lab's seed fails ≥1 test and its solution passes all; lesson/quiz answer sanity | 1.5 | Fixtures verify; a broken fixture is caught |
| C0 | **Golden examples:** lesson 6.1, Student Profile workshop steps 1–8, Recipe lab, B1 quiz, B1 review | 1.4–1.7 | I review line by line, then Judah previews. They become the reference copied by all later content WPs. |
| W1 | Widgets: order-15-steps, tier sorter, data-flow tracer, escalation slider, stack matcher, request/response animation, match/order helpers | 1.4 | Each one is shown in a fixture lesson and has unit tests for its scoring |
| CA0–CA5 | Track A modules (one agent per module) | C0, W1 | validate + verify pass; facts checked against paper.md |
| CB1 | B1 HTML (rest of the chapter) | C0 | validate + verify pass |
| 2.1 | Python runner + output console | 0.1, 1.5 | Fixture Python step fails/passes; an infinite loop is stopped at 5 s |
| 2.2 | Leaderboard, admin dashboard | 1.3, 1.6 | e2e with seeded data in `LocalStore` |
| CB2, CB3, CB4 | CSS, JS, Python chapters. Each splits into a lessons agent and a workshops+labs agent if it exceeds about 40 files. | C0, 2.1 for CB4 | validate + verify pass |
| 3.1 | SQL runner (PGlite) + results table | 0.1 | Fixture SQL step fails/passes |
| 3.2 | FastAPI runner + Requests panel + multi-file | 0.1, 2.1 | Fixture API step fails/passes |
| 3.3 | Template repo `group39-ihms` + workflow + official tests per lab, written from Parts 10–16 and Appendix D | — | `act` or a real push shows the expected green/red pattern for the reference solution and the empty skeleton |
| 3.4 | Project player + GitHub check + caching | 1.3 | e2e with a mocked GitHub API |
| 3.5 | Service-worker caching + download-size notice | 2.1, 3.1 | A second load makes no network requests for runtime assets |
| CB5, CB6, CB7 | Laptop, FastAPI, SQL chapters | 3.x | validate + verify pass |
| CB8–CB11 | Auth, modules (projects), testing, finishing, exams | 3.x | validate + verify pass |
| 5.1 | Review queue (wrong quiz questions return after 1, 3 and 7 days), accessibility pass, keyboard paths, performance | R3 | axe has no serious issues; Lighthouse ≥ 90 on the map page |
| 5.2 | Deployment config (`vercel.json`, env docs, `README` for Judah) | 1.1 | Production build served locally behaves like dev |

**Fallback** if the spike fails for FastAPI in the browser: B6 and B8 workshops move to the laptop and are verified by CI jobs. The SQL chapter stays on PGlite.

## How I run and correct the sub-agents

1. **Setup (me):**
   - Create the repo folder and run `git init`.
   - Copy this plan to `docs/PLAN.md`, so agents read it from disk instead of me pasting it.
   - I make local commits after each accepted WP. Pushing to GitHub happens only with Judah's OK at that moment.
2. **Brief:** each agent call is `Agent(subagent_type: "general-purpose", model: "sonnet", run_in_background: true)` with this prompt:
   ```
   You are doing WP <id> of Group 39 Learn (repo ~/Work/group39-learn).
   Read first: docs/PLAN.md §<sections>, docs/content-format.md, docs/style-guide.md, <inputs + line ranges>.
   Deliver: <exact files>.  Only edit: <paths>.  New dependencies allowed: <list or none>.
   Done when: <commands> pass and <observable criteria>.
   Rules: no git push or remote writes; no secrets in files; ground every project fact in the listed sources;
   if a requirement is unclear or conflicts, stop and report instead of guessing.
   Report in ≤150 words: files changed, commands + results, open issues. Do not paste file contents.
   ```
3. **Review (me):**
   - Run the "done when" commands myself.
   - Run `git diff --stat` and read 1–3 key files.
   - For UI work: `preview_start` the dev server, screenshot at laptop width and at 375 px, and click through once.
   - For content work: run validate and verify, read about 20% of the files plus every quiz answer key, and check each fact against its `sourceRef`.
4. **Correct:**
   - Send a numbered fix list to the **same** agent with `SendMessage`, so it keeps its context, then re-run the checks.
   - After 2 rounds I fix it myself or re-scope the WP.
   - Recurring mistakes go into `docs/style-guide.md` so later agents avoid them.
5. **Context saving:**
   - Agents read the plan and sources from disk.
   - Reports are capped at 150 words.
   - I read diffs selectively instead of whole files.
6. **Gates where Judah decides:**
   - Spike result, if the fallback is needed.
   - Golden examples (C0).
   - Each release before members get it.
   - Any outward action: creating GitHub repos, pushing, deploying.

## Things only Judah can do

1. **Supabase:**
   - Create a free Supabase project.
   - Put `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` into `.env.local` yourself.
   - Apply the migrations, with `npx supabase login`, `link`, `db push`, or by pasting into the SQL editor.
   - Disable signups.
   - Invite the 5 members by email.
   - Run the one-line SQL that makes your own profile admin.
2. **Vercel:** connect the GitHub repo to Vercel and add the same two env vars.
3. **GitHub:** say yes when I ask to create the private `group39-learn` and public `group39-ihms` repos with `gh`.
4. **Members:** ask each member to add their GitHub username to their profile.
5. **Design decisions:** settle the six open design decisions whenever the group is ready. Until then the placeholders stay.

## Verification

- **Code:** CI on every commit runs lint, typecheck, Vitest, `validate:content`, `verify:challenges` (every seed fails, every solution passes) and the Playwright e2e suite (sign-in, lesson, workshop step, lab, quiz, project check with a mocked GitHub API).
- **Release checks (me):**
  - Walk through one block of each type in the built-in browser, at laptop width and at 375 px.
  - Check the DevTools network tab for cached runtime assets on a second load.
  - Confirm that a fresh `LocalStore` user can complete R1 from start to end.
- **Pilot:** before R1 goes to the group, one non-technical member does lesson 6.1 and Student Profile steps 1–5 while Judah watches silently. Fix anything they stumble on.
- **Content accuracy:** every Track A number and quote is matched to paper.md or course-content.md through `sourceRef`, and quiz answer keys are double-checked by me.

## Risks

| Risk | Mitigation |
|---|---|
| About 94 h of content against one month (about 3 h/day) | Members do Track A at about 30 min/day alongside Track B. R1 alone holds about 22 h of study. Warm-ups stay small. Judah can mark warm-up labs optional per member. |
| FastAPI/SQLAlchemy in Pyodide fails | Spike first; fallback described above |
| Download size on mobile data | Cached once by the service worker; size shown before the first download |
| Supabase free project pauses after 7 idle days | Judah resumes it from the dashboard. Daily use prevents it. |
| Wrong facts in Track A | sourceRef grounding, my review, Judah previews C0 and each release |
| Client-side tests can be bypassed | Acceptable for practice. Projects are graded in CI against the official tests. |
