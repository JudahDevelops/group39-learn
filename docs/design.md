# Design system: Group 39 Learn

Read this before building any screen. It replaces the scaffold's first dark-IDE theme.

## Brief

| | |
|---|---|
| Subject | Learning to code by building a hostel management system (IHMS). |
| Audience | Six COS 303 students at Nile University, Abuja. Most have never coded, they work on laptops, and they sometimes use phones for lessons. |
| Primary job | Get a nervous beginner through the next step with confidence, and make progress visible. |

**Identity.** The look borrows from the hostel itself:

- whitewashed plaster walls
- deep green painted doors
- brass key tags
- room-number plates
- a lecturer's red biro correcting a script

All labels are plain words. The metaphor is visual only and never appears in copy: say "Chapter B1: HTML", not "Floor B1".

## Colour tokens

| Token | Hex | Use |
|---|---|---|
| `--plaster` | `#EDEFEA` | Page background |
| `--paper` | `#FAFBF8` | Raised reading surfaces: instructions pane, option rows, bottom bar, sheets |
| `--ink` | `#1A2420` | Body text |
| `--ink-2` | `#4A5752` | Secondary text |
| `--rule` | `#CBD2CC` | Borders and dividers |
| `--door` | `#1E4A38` | Brand and primary: top bar, primary buttons, done state, correct |
| `--door-hi` | `#2B6A50` | Hover/pressed for door, and the "next up" door |
| `--door-wash` | `#E3F0E8` | Background of the correct/pass band |
| `--key` | `#E9B824` | Brass: XP, streak, key tags, current position, focus ring on dark surfaces. **Never as text on light surfaces.** |
| `--biro` | `#B8322A` | Errors, wrong answers, failing tests |
| `--biro-wash` | `#F7E4E1` | Background of the wrong/fail band |
| `--bench` | `#14201B` | Code editor background |
| `--bench-2` | `#1C2A24` | Editor gutter, tabs, console |
| `--bench-ink` | `#DCE5DF` | Code text |

**Colour carries state only:**

- green: done, correct, primary action
- brass: progress and "you are here"
- red: something to fix

No decorative gradients, washes or colour blocks.

**Editor ("bench") syntax colours:**

| Element | Hex |
|---|---|
| tag | `#8FD1A8` |
| attribute / number | `#E9C46A` |
| string | `#F2B8A0` |
| keyword | `#A9C7F5` |
| comment | `#7E918A` |
| selection | `rgba(233,184,36,.25)` |
| cursor | `#E9B824` |

**Contrast.** Body text must reach WCAG AA (4.5:1); large text and UI parts must reach 3:1. Verify with a contrast check when adding any new pair.

## Typography

**Typefaces.** Bundle them from npm (`@fontsource-variable/atkinson-hyperlegible-next` and `@fontsource-variable/atkinson-hyperlegible-mono`), latin subset only. Never load them from a CDN.

- **Atkinson Hyperlegible Next** (variable, 200–800) for all interface and reading text.
- **Atkinson Hyperlegible Mono** for code and for nothing else.

The reason: both were designed so 0/O, l/1/I and similar characters cannot be confused, which is the commonest beginner misreading in code. Do not use monospace for UI labels, data or badges.

**Type scale** (ratio 1.25, base 16 px):

| Role | Size / line-height | Weight |
|---|---|---|
| Small (meta) | 13 / 18 | 400 |
| UI and body | 16 / 24 | 400 |
| Reading (lesson and instruction text) | 18 / 28 | 400 |
| Question / step title | 20 / 28 | 700 |
| Page title | 25 / 32 | 700 |
| Screen title | 31 / 38 | 700 |
| Room plate number | 20 | 800, tabular numerals, letter-spacing 0.02em |
| Code | 15 / 22 (Mono) | 400 |

**Rules:**

- Keep the measure at 60–70 characters for reading text.
- Set text left-aligned. Do not justify.
- Use sentence case everywhere.
- **Banned:**
  - all-caps labels
  - eyebrow labels above headings
  - one word accented in a different colour or style inside a headline
  - "→" appended to buttons or links
  - meta strings joined with middle dots (write "Workshop, 20 steps")

## Shape, depth, motion

**Radii follow hierarchy:**

| Element | Radius |
|---|---|
| Doors and room plates | 2 px |
| Inputs, option rows, buttons, chips | 8 px |
| Sheets and modals | 16 px on top corners |

**Shadow.** Only the feedback sheet and modals have one: `0 -8px 24px rgba(20,32,27,.18)`. Everything else is flat, using `--rule` borders.

**Focus.**

- On light surfaces: a 2 px `--ink` outline, offset 2 px.
- On dark surfaces (top bar, editor, green buttons): a 2 px `--key` outline, offset 2 px.
- Focus must always be visible. Never remove the outline without a replacement.

**Motion is allowed only:**

- for the feedback sheet sliding up (180 ms ease-out);
- for a modal fading in (120 ms);
- for one celebration: on the map, when a block is completed, its key tag drops onto the door handle and swings once (600 ms).

There are no page-load entrance animations and no card hover lifts. Under `prefers-reduced-motion: reduce`, all motion is removed.

**Touch.** Targets are at least 44 px tall on phones.

## Components

**Top bar** (`--door` background, 52 px):

- **Left:** "Group 39 Learn" (700, paper colour).
- **Nav:** Learn, Reference, Leaderboard (paper at 80% opacity; the active link at 100% with a 2 px brass underline).
- **Right:** two key-tag chips.
  - Streak: "4-day streak".
  - Daily XP: "35 of 60 XP today".
  - Each is a rounded rectangle in brass with ink text and a small punched hole circle on the left (CSS only).
- **Below 480 px:** the bar wraps to two rows and the chips shorten to "4 days" and "35/60 XP".

**Buttons:**

| Kind | Style |
|---|---|
| Primary | `--door` background, paper text, 600 weight, 8 px radius, 44 px tall |
| Secondary | Paper background, 1 px `--rule` border, ink text |
| Text button | Ink, underline on hover |

Button labels are actions: "Check your code", "Continue", "Try again", "Show hint 2", "Check my repo". No "Submit".

**Option row** (lesson questions):

- Paper background, 1 px `--rule` border, 8 px radius, 16 px padding.
- The key letter sits in a 28 px square on the left. The letter is real: keys A–D select options.
- Selected: a 2 px `--ink` border.
- After checking, the correct row gets `--door` and the wrong one gets `--biro`. A border alone never carries the state, so an icon ✓ or ✗ goes with it.

**Feedback sheet.** It replaces the bottom bar after Check.

| | Correct | Wrong |
|---|---|---|
| Background | `--door-wash` | `--biro-wash` |
| Title (20/700) | "Correct" in `--door` | "Not quite" in `--biro` |
| Body | A one-line why | The chosen option's feedback |
| Actions | "Why?" (secondary; expands the explanation) and "Continue" (primary) | "Try again" |

A copy option: rotate a few short correct titles ("Correct", "That's it", "Spot on"). Never use exclamation-heavy hype.

**Combo counter.** It sits right-aligned in the lesson progress bar: "4 in a row" (13 px, ink-2), shown from 3 in a row upwards. A wrong answer resets it without comment.

**Progress bar** (lessons). Segmented, one segment per screen. Done segments are `--door`, the current one is `--key`, the rest are `--rule`. Not a smooth bar.

**Correction slip** (workshop/lab failing test):

- A paper block with a 3 px `--biro` left rule.
- The first failing test's message in ink, 16/24.
- It appears in the instructions pane under the step text.

On pass it becomes a `--door-wash` block with a 3 px `--door` rule: "Your code passes." It also shows block progress ("Step 3 of 25 done") and a primary "Continue" button. Ctrl+Enter checks the code; Ctrl+Enter again continues.

## Layouts

**Map (/learn): the one bold element.**

```
Track B: Build the IHMS                                   [ 12 of 87 done ]
Chapter B1: HTML                                            6 of 11 done
 ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
 │┌────┐│ │┌────┐│ │┌────┐│ │┌────┐│ │┌────┐│ │┌────┐│     ← doors in a corridor row
 ││B1-01││ ││B1-02││ ││B1-03││ ││B1-04││ ││B1-05││ ││B1-06││    plate = paper, room code 800
 │└────┘│ │└────┘│ │└────┘│ │└────┘│ │└────┘│ │└────┘│
 │     ●│ │    ●🏷│ │     ●│ │     ●│ │     ●│ │     ●│     ● brass knob; 🏷 key tag = done
 └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘
 Your first  Build a      ...
 web page    Student
 Lesson      Profile Page
             Workshop, 20 steps
```

- **Door:** 104 × 156 px, `--door` fill, 2 px radius. A paper plate near the top carries the room code (chapter + two-digit position), and there is a brass knob.
  - The **next-up** door uses `--door-hi` with a 3 px `--key` outline.
  - **Done** doors carry a brass key tag with ✓ hanging from the knob.
  - Doors are never greyed out. Nothing is locked, so a learner can open any room.
- **Below each door:** the title (16/24, ink, at most 3 lines) and the type plus size in ink-2 ("Workshop, 20 steps").
- **Rows:** a corridor row per chapter. It wraps on laptops and scrolls horizontally with snap on phones.
- **Headers:**
  - Track: page-title size, left-aligned.
  - Chapter: question size, with "n of m done" right-aligned.
- **Room codes:** Track A uses A0-01…; Track B uses B1-01…. The code is the real sequence number, so the numbering carries information.

**Home (/).**

- **Hero:** the next door at double size, with its title and a primary button that says exactly where it goes ("Continue Build the Complaint Form, step 4").
- **Beside it:** today's XP against the goal, as a segmented bar, and the streak.
- **Below:** this week's leaderboard as a plain ranked list. The ranking is a real sequence, so numbers are fine.
- No stat-tile row and no big-number hero.

**Lesson player.**

- A centred 640 px column on plaster. Content is left-aligned inside it.
- **Top:** a close ✕, the segmented progress bar and the combo counter.
- **Middle:** the screen content.
- **Bottom:** a sticky paper bar with the primary action on the right. The feedback sheet replaces this bar.
- **End card:** "Lesson done", then three plain lines (screens, XP earned, accuracy) and "Continue". Then the one-tap pulse "How did this lesson feel?" with Too easy / Just right / Too hard / Confusing, plus an optional comment.

**Workshop and lab player** (at 1100 px and wider):

```
┌ top bar ──────────────────────────────────────────────────────────────────┐
│ Build the Complaint Form      Step 3 of 25   ▮▮▮▯▯▯▯…        [ Help ]     │
├────────────────┬─────────────────────────────────┬────────────────────────┤
│ Instructions   │ index.html  styles.css          │ Preview   Console      │
│ (paper, 18/28, │ (bench editor; locked lines at  │ (white page frame,     │
│  ≤ 62ch)       │  60% opacity; the editable      │  real render)          │
│                │  region has a brass 3 px gutter │                        │
│ correction     │  bar and a #1E2D27 background)  │                        │
│ slip here      ├─────────────────────────────────┤                        │
│                │ [Check your code]  Ctrl+Enter ⟲ │                        │
└────────────────┴─────────────────────────────────┴────────────────────────┘
```

- **Column widths:** instructions 30%, editor 40%, preview 30%. The dividers can be dragged.
- **Medium (768–1099 px):** instructions on top, with editor and preview side by side below.
- **Narrow (under 768 px):** three tabs: Instructions / Code / Preview.
- **Labs** add the user-story list to the instructions pane. The test list sits under it with ✓ or ✗ per test, using an icon as well as the colour.
- **Help modal** contains:
  - hint buttons ("Show hint 1", then 2, then 3);
  - "Ask the group on WhatsApp";
  - the line "AI may explain code to you, but it must not write it."

**Other runners** reuse the same layout. The right pane changes by runner:

| Runner | Right pane |
|---|---|
| Python | Output console |
| SQL | Results table |
| FastAPI | Requests panel |

## Copy

- Write from the learner's side, in plain verbs and sentence case.
- **Errors** say what is wrong and how to fix it, e.g. "Your `p` element needs a closing tag: `</p>`". No "Oops" and no apologies.
- **Empty states** invite action, e.g. "No XP yet this week. Continue your course to start."
- **Actions** keep their name through the whole flow, e.g. "Check my repo" → "Checked 2 minutes ago".
