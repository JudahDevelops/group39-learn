# Style guide (content + engineering)

## Who the learners are
Six COS 303 students at Nile University of Nigeria, Abuja. Most have **never coded**. They are building the
Intelligent Hostel Management System (IHMS) for their group project and must defend the group paper.

## Writing rules
- Plain English, second person ("you"), short sentences. One idea per screen. Max 60 words per concept screen.
- Nigerian student setting: hostel, room, porter, hall warden, Student Affairs, bursary, naira (₦), Abuja.
- Titles are plain: "Build a Recipe Page", "Style the IHMS Pages", "Your first web page". No catchy names, no puns.
- Every code snippet must run as shown. No pseudo-code presented as code.
- Explain a term the first time it appears, then use it consistently. Link glossary terms where possible.
- No hype words ("powerful", "seamless", "robust", "crucial", "delve"). No exclamation marks except in feedback lines.
- Feedback lines: short and specific. Wrong-answer feedback says *why* that option is wrong, never just "Try again".

## Facts about the project
- Project facts come **only** from paper.md, course-content.md or research/ (paths in docs/sources.md).
  Never invent numbers, names, dates or citations. If a fact is missing, leave a `TODO(source)` note and report it.
- The ★ module is the Complaint Triage and Escalation Engine: keyword triage → urgency → deadline
  (urgent 24 h / normal 72 h / low 7 days) → email escalation to the hall warden, then Student Affairs.
  Escalation level L = 0 if t < d; 1 if d ≤ t < 2d; 2 if t ≥ 2d (t = time open, d = deadline length).
- Six design decisions are still open. Use the placeholders exactly as course-content.md does and link to
  Reference → Group decisions. Do not present a placeholder as final.
- Integrity rule: AI may explain code but must not write it; every member must be able to explain every line.

## Engineering rules
- Every screen follows docs/design.md (tokens, type, components, layouts, copy). Do not invent new colours, fonts or radii.
- TypeScript strict. No `any` unless commented why.
- Only the dependencies listed in your WP brief. Ask (report back) before adding others.
- **Disk is nearly full (~2.6 GB free).** Never run `npx playwright install`. Playwright uses the cached browser:
  `PW_CHROMIUM_PATH=/home/judah/.cache/puppeteer/chrome-headless-shell/linux-151.0.7922.47/chrome-headless-shell-linux64/chrome-headless-shell`
  (playwright.config reads it from the env; CI installs its own browsers). Do not create git worktrees.
- Run e2e with the port your brief gives you: `E2E_PORT=<port> PW_CHROMIUM_PATH=... npm run test:e2e`. Each port
  builds into its own `.e2e-dist/<port>/`, so parallel agents never test each other's build. Delete your
  `.e2e-dist/<port>/` when you finish.
  Do not download large files except the npm packages in your brief.
- Keep your own logs and scratch files in `.e2e-dist/<your port>/` or a folder named after your WP under `/tmp`.
  Never write into the reviewer's scratchpad folder: the reviewer's own logs live there.
- Python e2e tests download Pyodide (about 6 MB) on first run. If they time out while another agent's e2e run is
  going, rerun them once before reporting a failure.
- No git push, no remote writes, no secrets in files.
- List a new block in `content/curriculum.json` as soon as you create its folder, before writing its files. The dev
  server rebuilds content on start and refuses to start while any block folder is unlisted.

## Recurring corrections
(Added by the reviewer as agents make mistakes. Read before starting.)
- Chapter titles are short names: `HTML`, `CSS`, `JavaScript`, `Python`. The map adds "Chapter B1:" in front, so a
  title with its own colon reads badly.
- A lone link that teaches `href` must point to a different page from the one being built. (A site nav that also
  lists the current page is normal.) Name each exercise's file after the page it builds: `staff.html`, `login.html`,
  `profile.html`, not `index.html` for everything.
- Fictional people in exercises are fine (Amina in room B-214 comes from the source). Facts about the IHMS, the
  paper or the research are not: those still need a source line.
- Chapter order is lessons → warm-up workshop → warm-up lab → IHMS workshop → IHMS lab → review → quiz. A
  workshop or lab may only use what the lessons before it teach.
