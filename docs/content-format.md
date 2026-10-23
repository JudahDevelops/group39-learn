# Content format

The authoritative guide for writing course content. Every example in a block marked `<!-- example:... -->` is parsed and validated by `tests/unit/content.docs.test.ts`, so copy from here and it will pass. The rules are enforced by `src/content/schema.ts` (zod) and `src/content/validate.ts`.

Read `docs/style-guide.md` for how to write. This file is only about the shape.

## 1. Layout

```
content/
  curriculum.json                  tracks -> chapters -> block slugs
  blocks/<slug>/
    meta.json                      id, type, title, runner, ...
    lesson.md                      type lesson
    01.md 02.md ... NN.md          type workshop (one file per step)
    lab.md                         type lab
    review.md                      type review
    quiz.md                        type quiz and type exam
    project.md                     type project
  reference/*.md                   glossary etc. (not validated by this format yet)
```

- A block folder holds `meta.json` plus exactly the file(s) its `type` needs. Anything else is an error.
- The folder name is the block's slug. Slugs are lowercase words joined by hyphens: `student-profile`.
- Track `Z` (chapter `Z1`) is fixture content for tests and development. It is built only when `INCLUDE_FIXTURES=1`.

### Ids

| What | Looks like | Where it comes from |
|---|---|---|
| Block id | `lbj9me1r` | `meta.json` `id`. Also the progress item id of a lesson, lab, review, quiz, exam or project |
| Step id | `scwu02e0` | frontmatter `id` of each workshop step. The progress item id of that step |
| Quiz question id | `3f2a91c0` | Computed from the question text: a hash of the text with whitespace collapsed. Editing the text changes the id |

All ids are 8 characters from `a-z0-9`, and **unique across all content**. Never invent one by hand: run `npm run new:step` (below).

### Commands

| Command | What it does |
|---|---|
| `npm run new:step -- <slug>` | Adds the next step `NN.md` to workshop `<slug>`. From step 2 on, the seed starts from the previous step's solution |
| `npm run new:step -- --block <slug> --type lesson --title "..." --runner web --est 10 --chapter B1` | Creates a block folder with `meta.json` and a starter file, and lists it in chapter B1 |
| `npm run new:step -- --id 3` | Prints 3 fresh ids |
| `npm run validate:content` | Parses and checks everything. Prints `file:line: message` and exits 1 on any problem |
| `npm run content` | Validates, then writes `public/content/`. Fixture track Z only with `INCLUDE_FIXTURES=1` |

Files made by `new:step` already validate. They contain `TODO` text where you write the content.

## 2. `curriculum.json`

<!-- example:curriculum -->
````json
{
  "tracks": [
    {
      "id": "B",
      "title": "Build the IHMS",
      "chapters": [
        {
          "id": "B1",
          "title": "HTML",
          "blocks": ["html-lessons", "student-profile"]
        }
      ]
    }
  ]
}
````

- Track `id` is `A`, `B` or `Z`. Add `"fixture": true` to a track that is dev/test-only. Track `Z` must have it.
- Chapter `id` is the track letter plus a number: `A0`, `B1`. A chapter's blocks appear in the order listed.
- The room code of a block is the chapter id, a hyphen and its 2-digit position in the chapter: `B1-01`, `B1-02`.

## 3. `meta.json`

<!-- example:meta -->
````json
{
  "id": "lbj9me1r",
  "slug": "student-profile",
  "type": "workshop",
  "title": "Build a Student Profile Page",
  "runner": "web",
  "estMinutes": 25,
  "sourceRef": "course-content.md:1542-1798",
  "demo": "index.html",
  "optional": false
}
````

| Key | Required | Notes |
|---|---|---|
| `id` | yes | 8 chars. From `new:step` |
| `slug` | yes | Must equal the folder name |
| `type` | yes | `lesson`, `workshop`, `lab`, `review`, `quiz`, `project`, `exam` |
| `title` | yes | Plain title ("Build a Recipe Page") |
| `runner` | yes | `web`, `python`, `sql`, `fastapi` or `none`. Workshops and labs cannot be `none`. A lesson with a `typein` screen cannot be `none` |
| `estMinutes` | yes | Positive whole number |
| `sourceRef` | no | Where the content came from, e.g. `course-content.md:1542-1798` |
| `demo` | no | Workshops and labs only: the file in the (last step's) solutions that the "example project" opens. **Required for web labs** |
| `optional` | no | `true` for blocks a member may skip |

No other keys are allowed.

## 4. Syntax shared by every markdown file

### Markers

A line like `# --description--` is a **section marker**. The number of `#` is the level.

```
# --name--            level 1
## --name--           level 2
### --name--          level 3
## --widget-- escalation-slider      a marker can take one argument after its name
```

- One space after the `#`s. The name is lowercase letters and hyphens between two `--`.
- Markers inside a code fence are plain text.
- Ordinary headings (`## Heading`, `### Remember`) are fine inside markdown bodies. Only `--name--` headings are markers.
- A marker not listed for its place is an error ("unknown section").

### Frontmatter

YAML between two `---` lines at the very top. Only these files have frontmatter:

| File | Keys |
|---|---|
| Workshop step `NN.md` | `id`, `title` (`Step N`), `runner` |
| `quiz.md` | `draw`, `pass` |
| `project.md` | `ciJob` |

`lesson.md`, `lab.md` and `review.md` have none. Their id, title and runner come from `meta.json`.

### Markdown to HTML

- Text fields are written in markdown and compiled to HTML at build time (CommonMark plus GFM tables and task lists).
- Raw HTML in the markdown is passed through unchanged. **To show a tag to the learner, put it in backticks**: write `` `<h1>` ``, never a bare `<h1>`.
- Block fields (a `<p>` wrapper is kept): step and lab `description`, concept body, `question`, `prompt`, `why`, `answer` (flashcard), callout, hints, quiz `text` and `explanation`, project `instructions`.
- Inline fields (a single paragraph loses its `<p>`): option text and feedback, order items, match sides, checklist text and hint, user stories, quiz `distractors` and `answer`, test messages.

### Code fences

````
```html file=index.html
<h1>Hello</h1>
```
````

- The info string is `lang` plus an optional `file=name`. `lang` is required wherever code is read as code.
- `file=` is required for files in `--seed-contents--`, `--solutions--` and `::: tryit` blocks. File names are relative (`index.html`, `app/main.py`), with no `..`.
- A fence with more backticks (or `~~~`) wraps one with fewer.

### Editable region

In **seed** files, two lines containing only `--editable-region--` mark the part the learner may edit. The marker lines are removed from the file text and the range is stored as `editable: { start, end }`: 0-based line numbers into the file text with the markers removed, `start` inclusive, `end` exclusive. Everything outside the range is locked in the editor.

````
```html file=index.html
<body>
--editable-region--

--editable-region--
</body>
```
````

stores `contents = "<body>\n\n</body>"` and `editable = { start: 1, end: 2 }`.

- The region must contain at least one line. Use a blank line for an empty region.
- Markers are not allowed in solutions or `::: tryit` files.

### `::: tryit <runner>` blocks

A runnable playground, used in concept screens and reviews. The learner can edit everything.

````
::: tryit web
```html file=index.html
<h1>Hello</h1>
```
:::
````

The runner is `web`, `python`, `sql` or `fastapi`. The block holds one or more `file=` fences. Concept screens take at most one tryit block; reviews take any number.

### Lists

Lists use `- ` or `1. `. A line starting with `>` right under a list item belongs to that item. A continuation line (no marker) joins the item above. Nested items are indented by two spaces and are used only where stated below.

## 5. Tests

A test is a **message paragraph followed by a fenced test block**. The message is shown when the test fails; the learner sees the message of the first failing test, in file order.

````
Your `h1` element should have the text `Hall Notice`.

```js
assert.equal(document.querySelector('h1')?.textContent.trim(), 'Hall Notice');
```
````

Write the message so it tells the learner what to fix, not what the test does ("Your page should have a `p` element", not "p exists"). Order tests from the most basic to the most specific.

| Runner | Fence | What the test body can use | Default file names |
|---|---|---|---|
| `web` | `js` | The body of an async function run in a hidden sandboxed iframe once the page has loaded (so `await` works). `document`, `window`, `code` (the learner's `index.html`, or every file joined when there is no HTML), `files` (every file's text, e.g. `files['styles.css']`) and chai's `assert` | `index.html`, `styles.css`, `script.js` |
| `python` | `py` | Python run after the learner's `main.py`, in the same namespace. `_code`, `_stdout`, `_tree`, `has_function(name)`, `defines(name)`, `prints(text)`. A failed `assert` shows the test's message. See "Python tests" below | `main.py` |
| `sql` | `js` | The body of an async function with `db` (`await db.query(sql, params?)` returns `{ rows, fields }`), `code` (the text of the learner's `query.sql`) and chai's `assert`. See "SQL tests" below | `query.sql`, plus `setup.sql` |
| `fastapi` | `py` | Async Python with `client`, an `httpx.AsyncClient` bound to `app` | `main.py` |

**`fetch` in the web runner.** Inside the preview and the test frame, `fetch("complaints.json")` (or `./complaints.json`, with or without a `?query`) answers from the learner's own files, as a static server would. The `Content-Type` comes from the extension, so `await response.json()` works. A file that is not in the project gets a 404 (`response.ok` is `false`). An absolute URL (`https://...`) goes to the real network. The answer arrives a few milliseconds later, so a test of code that fetches waits first:

```js
await new Promise((resolve) => setTimeout(resolve, 50));
assert.lengthOf(document.querySelectorAll('#complaints tbody tr'), 3);
```

The fence language must match the runner (`js` for `web` and `sql`, `py` for `python` and `fastapi`). `js` tests are also syntax-checked at validation time. The `web`, `python` and `sql` runners are built. `fastapi` comes in a later work package and owns its exact globals.

### Python tests

The `python` runner is Pyodide (Python 3.14) in a Web Worker, loaded from a CDN. The first run on a device downloads about 6 MB, once. The page says so before it starts.

**How a check runs**

1. The learner's files are written side by side, and `main.py` is the entry. (With no `main.py`, the first `.py` file is.) It can `import` its other files.
2. `main.py` runs once for the Output tab: what it prints appears there. If it raises an uncaught exception, including a syntax error, the learner sees the error in plain words with the line number from their own file, and **no test runs**.
3. Otherwise each test runs on a **fresh namespace**: `main.py` runs again in a new dictionary, the helpers below are added, then the test runs in that same dictionary. A test cannot change what the next one sees. It also means the learner's code runs once per test, so keep it quick.
4. The whole check (code plus every test) has 5 seconds. After that the worker is stopped, the learner reads "Your code ran for more than 5 seconds, so it was stopped. Check for a loop that never ends.", and a fresh worker starts on the next run.

**What a test can use**

| Name | What it is |
|---|---|
| `_code` | The source text of `main.py` |
| `_stdout` | Everything the code printed, as one string |
| `_tree` | `ast.parse(_code)`. Use `import ast` in the test to walk it |
| `has_function(name)` | True when the code has a `def` (or `async def`) called `name`, at any level, so a method counts. A lambda or an imported function does not. This reads the text, so it works even if the function is never called |
| `defines(name)` | True when running the code created a top-level name: a variable, function, class or import. Built-ins and the helpers do not count |
| `prints(text)` | True when `text` appears in what the code printed. The letters must match exactly. `prints("")` is true only if something was printed. For a whole line use `text in _stdout.splitlines()` |

A test can also call or read anything `main.py` defined (`compute_deadline("urgent")`), and import from Python's standard library.

**What a result means**

- A failed `assert` is the normal failure. The learner sees the test's message. `assert x == 2, "x is 1"` adds text for you, not the learner: it appears in `npm run verify:challenges` output. Without text, that output shows the failing line.
- Any other exception in a test (`NameError`, `TypeError` and so on) is also a failure. The learner sees the test's message followed by what Python said in plain words, with the line of their own code if the error came from it.
- An `assert` that fails inside the learner's own function is the learner's error, not the test failing.
- `input()` cannot work, because nobody can type an answer. The learner gets a plain-words note to put the value in the code instead. Do not use `input()` in exercises.
- Order tests from structure to behaviour: first `has_function` or a look at `_code`, then calls with fixed arguments, so the first message names the first thing missing.

Example. This is a step's `--hints--` section, not a marked example, because it is checked by `npm run verify:challenges` rather than by the docs test:

````markdown
Your code should define a function called `compute_deadline`.

```py
assert has_function('compute_deadline')
```

`compute_deadline("urgent")` should return `24`.

```py
assert compute_deadline('urgent') == 24
```

Your code should print `Deadline: 24 hours`.

```py
assert prints('Deadline: 24 hours')
```
````

A `::: tryit python` block shows a Run button and a console and has no tests. The fixture `content/blocks/fixture-python` (a workshop) and `fixture-python-lesson` (a Try it and a `typein`) are working examples.

### SQL tests

The `sql` runner is PostgreSQL 18 (PGlite, PostgreSQL compiled to WebAssembly) in a Web Worker, loaded from a CDN. The first run on a device downloads about 5.3 MB, once. The page says so before it starts. The right-hand pane is a **Results** panel: the rows of the last statement that returns rows, as a table with a row count under it. A statement with no rows shows "Query ran. No rows to show."

**The two files**

| File | Who writes it | What it is |
|---|---|---|
| `query.sql` | The learner | The editable file. It can hold several statements |
| `setup.sql` | You | Creates the tables and rows the exercise starts with. Put it in the seed and the solutions. The learner can read it but never change it (see below) |

`setup.sql` is optional. Put `query.sql` first in the seed so it is the first tab. A `::: tryit sql` block takes the same two files.

**`setup.sql` is always read-only.** In a workshop step, a lab (with or without an editable region), a Try it box and a `typein` screen, the learner sees `setup.sql` as a locked tab and cannot type in it. A Check and a Run always run the block's own `setup.sql`, never the copy in the editor, so nobody can change the data the tests run against. The editable region goes in `query.sql`, never in `setup.sql`.

**How a check runs**

1. The database is made empty: no tables, schemas, roles or settings from the last run. Every Run and every Check starts here, so a Run never changes what a Check sees.
2. `setup.sql` runs (if there is one), then the learner's `query.sql`. The statements go to PostgreSQL together, so they run as one transaction unless the code has its own `begin` and `commit`. If one fails, the learner sees PostgreSQL's own message, the line of `query.sql` it points at, and its detail and hint if it gives them (`relation "rooms" does not exist. Line 3 of query.sql.`). **No test runs.**
3. Otherwise every test runs, in file order, against **the same database the learner's code left**. Tests share it: a test that writes data should expect later tests to see it.
4. The whole check (setup, the learner's code and every test) has 5 seconds. After that the worker is stopped, the learner reads "Your query ran for more than 5 seconds, so it was stopped. Check for a join with no condition: it pairs every row with every other row.", and a fresh worker starts on the next run.

**What a test can use**

| Name | What it is |
|---|---|
| `db.query(sql, params?)` | Runs `sql` and returns `{ rows, fields }`. `rows` is a list of objects keyed by column name, with JavaScript values: `count(*)` is a number (a very large `bigint` is a `BigInt`), `numeric` is a string, a timestamp is a `Date`, `json` is an object. `fields` is `[{ name, dataTypeID }]`. With `params`, `sql` is one statement and uses `$1`, `$2`. Without `params`, `sql` may hold several statements and the answer is that of the last statement that returns rows (or `{ rows: [], fields: [] }`), so `await db.query(code)` runs the learner's own code |
| `code` | The text of the learner's `query.sql`, for checks like `assert.match(code, /order by/i)` |
| `assert` | chai's `assert` |

When PostgreSQL refuses a query, `db.query` throws an error with its `message` and its server fields: `code` (the SQLSTATE, such as `23505` for a unique violation), `detail`, `hint`, `constraint`, `table`, `column`. Catch it to check that a constraint holds.

**What a result means**

- A failed `assert` is the normal failure. The learner sees the test's message. The assertion's own wording (`expected 2 to equal 3`) appears in `npm run verify:challenges` output.
- If a query inside the test fails and the test does not catch it, the test fails. The learner sees the test's message followed by "PostgreSQL said: ..." and PostgreSQL's real words. So a test that reads a table the learner has not created yet needs no `try`: its message says what to create and PostgreSQL says the table is missing.
- Any other exception in a test (a `TypeError` in your own test code, say) is also a failure, with no extra text for the learner.
- To check what a **query** returns, run the learner's code again: `await db.query(code)`. Do this for a `select`. A statement that changes data (`insert`, `update`) would change it a second time, so check the **state** with a new query instead.
- Order tests from structure to behaviour: first a look at `code`, then the rows, then the columns, so the first message names the first thing missing.

Checking the rows a query returns:

````markdown
Your query should return the 3 rooms in Hall B.

```js
const { rows } = await db.query(code);
assert.lengthOf(rows, 3);
```

Your query should show only `room_number` and `beds`.

```js
const { rows } = await db.query(code);
assert.sameMembers(Object.keys(rows[0] ?? {}), ['room_number', 'beds']);
```
````

Checking what the code changed:

````markdown
Room `B-217` should be in Hall B with 4 beds.

```js
const { rows } = await db.query('select hall, beds from rooms where room_number = $1', ['B-217']);
assert.lengthOf(rows, 1);
assert.equal(rows[0].hall, 'Hall B');
assert.equal(rows[0].beds, 4);
```
````

Checking the schema through `information_schema`:

````markdown
The `complaints` table should have the columns `id` and `description`, in that order.

```js
const { rows } = await db.query(
  "select column_name from information_schema.columns where table_name = 'complaints' order by ordinal_position",
);
assert.deepEqual(
  rows.map((r) => r.column_name),
  ['id', 'description'],
);
```
````

Checking that a constraint refuses a row:

````markdown
Two rooms should not share a room number.

```js
let error;
try {
  await db.query("insert into rooms values (9, 'A-101', 'Hall A', 1)");
} catch (e) {
  error = e;
}
assert.exists(error);
assert.equal(error.code, '23505');
```
````

A `::: tryit sql` block shows a Run button and the Results panel and has no tests. The fixture `content/blocks/fixture-sql-workshop` (a workshop with a `setup.sql`), `fixture-sql-lab` (a lab whose seed has no editable region) and `fixture-sql-lesson` (a Try it and a `typein`) are working examples.

## 6. Workshop step (`NN.md`)

One file per step, named `01.md`, `02.md`, ... Steps are numbered from 01 with no gaps. The step number is the file name. The title must be `Step N` to match.

<!-- example:step -->
````markdown
---
id: scwu02e0
title: Step 1
runner: web
---

# --description--

Add an `h1` element with the text `Hall Notice`. An `h1` element is the main heading of a page.

# --hints--

Your page should have exactly one `h1` element.

```js
assert.lengthOf(document.querySelectorAll('h1'), 1);
```

Your `h1` element should have the text `Hall Notice`.

```js
assert.equal(document.querySelector('h1')?.textContent.trim(), 'Hall Notice');
```

# --seed--

## --seed-contents--

```html file=index.html
<body>
--editable-region--

--editable-region--
</body>
```

# --solutions--

```html file=index.html
<body>
  <h1>Hall Notice</h1>
</body>
```

# --help--

## --hint--

An element has an opening tag, the text, and a closing tag.

## --hint--

The opening tag is `<h1>`. The closing tag is `</h1>`.

## --hint--

Type `<h1>Hall Notice</h1>` on the empty line.
````

| Section | Content |
|---|---|
| `# --description--` | The instructions, markdown. One or two sentences per step |
| `# --hints--` | Tests: message + fenced test, at least one. (The name follows freeCodeCamp. These are the tests, not the help hints) |
| `# --seed--` > `## --seed-contents--` | One `file=` fence per file. Exactly one `--editable-region--` pair in the whole seed |
| `# --solutions--` | One `file=` fence per file, the same file names as the seed, no markers. Required on every step |
| `# --help--` | One to three `## --hint--` sections, from conceptual to the exact code |

From step 2 on, the seed is the previous step's solution with the new editable region.

## 7. Lab (`lab.md`)

Same as a step, with `# --user-stories--` and no frontmatter. The lab's id, runner and `demo` come from `meta.json`. The seed is the empty or near-empty starting point. The editable region is optional in a lab (without one, the whole file is editable). Lab hints are conceptual and never give the answer.

<!-- example:lab -->
````markdown
# --description--

Build a notice page like the example. Use the user stories as your checklist.

# --user-stories--

1. Your page has one `h1` element.
2. Your page has a `button` element.

# --hints--

Your page should have exactly one `h1` element.

```js
assert.lengthOf(document.querySelectorAll('h1'), 1);
```

Your page should have a `button` element.

```js
assert.exists(document.querySelector('button'));
```

# --seed--

## --seed-contents--

```html file=index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Notice</title>
  </head>
  <body>
  </body>
</html>
```

# --solutions--

```html file=index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Notice</title>
  </head>
  <body>
    <h1>Bursary Notice</h1>
    <button>I have paid</button>
  </body>
</html>
```

# --help--

## --hint--

Each user story names one element. Add them one at a time.
````

`# --user-stories--` is a list, one story per item, numbered. Section order is free.

## 8. Lesson (`lesson.md`)

A lesson is a list of screens. Each screen starts with `# --screen-- <type>`. Under it, level-2 sections hold its parts. Text between the `# --screen--` line and the first `##` marker is allowed only on `concept` screens (it is their body).

Types: `concept`, `mcq`, `multi`, `tapbuild`, `typein`, `predict`, `spotbug`, `order`, `match`, `widget`, `flashcard`, `checklist`. One idea per screen; at most 60 words on a concept screen.

### concept

<!-- example:screen:concept -->
````markdown
# --screen-- concept

A web page is built from **elements**. An element has an opening tag, some content, and a closing tag.

::: tryit web
```html file=index.html
<p>Hello, Hall A.</p>
```
:::

## --code--

```html file=index.html
<p>Hello, Hall A.</p>
```

## --callout-- info

The closing tag has a `/` in front of the name.
````

- The body is the text before the first `##` marker. A `::: tryit` block may sit anywhere in the body; it is taken out of the body text. (Put it before `## --code--`, not under it.)
- `## --code--` (optional): exactly one fence, `lang` required, `file=` optional. Shown read-only.
- `## --callout-- <kind>` (optional): `info`, `tip` or `warning`. Without a kind it is `info`.

### mcq

<!-- example:screen:mcq -->
````markdown
# --screen-- mcq

## --question--

Which element is the main heading of a page?

## --options--

- [x] `h1`
  > Yes. `h1` is the top-level heading.
- [ ] `p`
  > No. `p` holds a paragraph of text.

## --why--

Headings use `h1` down to `h6`. Paragraphs use `p`.
````

- `- [x]` is correct, `- [ ]` is wrong. Every option needs a `>` feedback line under it. A wrong option's feedback says why it is wrong.
- 2 to 6 options. **Exactly one** `[x]`.

### multi

Same sections as `mcq` ("select all that apply"). **At least one** `[x]`.

<!-- example:screen:multi -->
````markdown
# --screen-- multi

## --question--

Select every closing tag.

## --options--

- [x] `</p>`
  > Yes. The `/` marks a closing tag.
- [ ] `<p>`
  > No. This is an opening tag.
- [x] `</h1>`
  > Yes. It closes an `h1` element.

## --why--

A closing tag repeats the element name with a `/` in front.
````

### tapbuild

<!-- example:screen:tapbuild -->
````markdown
# --screen-- tapbuild

## --prompt--

Build a heading that says Notice.

## --template--

```html
___Notice___
```

## --tokens--

- `<h1>`
- `</h1>`
- `<p>`
- `<\h1>`

## --answer--

- `<h1>`
- `</h1>`

## --why--

An `h1` element opens with `<h1>` and closes with `</h1>`.
````

- `## --template--`: one fence, `lang` required. Each blank is exactly three underscores `___`. Do not use `___` for anything else.
- `## --tokens--`: every token the learner can tap, **distractors included**. Wrap each token in backticks so spaces and symbols survive. The same token may appear twice.
- `## --answer--`: the tokens that fill the blanks, in order. The count must equal the number of blanks, and every answer token must be in the token list (as many times as it is used).

### typein

<!-- example:screen:typein -->
````markdown
# --screen-- typein

## --prompt--

Add a `p` element with any text inside the `body`.

## --seed-contents--

```html file=index.html
<body>
--editable-region--

--editable-region--
</body>
```

## --tests--

Your page needs a `p` element.

```js
assert.exists(document.querySelector('p'));
```

## --solutions--

```html file=index.html
<body>
  <p>Water will be off on Friday.</p>
</body>
```

## --why--

A paragraph is a `p` element: `<p>`, the text, then `</p>`.
````

Needs a block `runner` other than `none`. Exactly one editable region; solutions with the same files; at least one test. Tests use the block's runner. With `runner: python` the file is `main.py`. (`--solutions--` is required so CI can prove the screen can be passed.)

### predict and spotbug

Like `mcq`, plus a `## --code--` section with one fence. Exactly one `[x]`. `predict` asks what the code shows or prints. `spotbug` asks what is wrong.

<!-- example:screen:predict -->
````markdown
# --screen-- predict

## --code--

```html file=index.html
<p>Rice</p>
<p>Beans</p>
```

## --question--

How many paragraphs will the page show?

## --options--

- [x] 2
  > Yes. There are two `p` elements.
- [ ] 1
  > No. Each `p` element is its own paragraph.

## --why--

Each `p` element makes one paragraph.
````

<!-- example:screen:spotbug -->
````markdown
# --screen-- spotbug

## --code--

```html file=index.html
<h1>Hall Notice
<p>Water will be off on Friday.</p>
```

## --question--

What is wrong with this code?

## --options--

- [x] The `h1` element is missing its closing tag.
  > Yes. It needs `</h1>` after the text.
- [ ] The `p` element is missing its opening tag.
  > No. `<p>` is there.

## --why--

Without `</h1>` the browser treats the next lines as part of the heading.
````

### order

<!-- example:screen:order -->
````markdown
# --screen-- order

## --prompt--

Put the parts of an element in order.

## --items--

- The opening tag, such as `<p>`
- The content, such as `Hello`
- The closing tag, such as `</p>`

## --why--

An element opens, holds its content, then closes.
````

Write the items **in the correct order**. The player shuffles them. At least 2, all different.

### match

<!-- example:screen:match -->
````markdown
# --screen-- match

## --prompt--

Match each element to what it makes.

## --pairs--

- `h1`
  - The main heading
- `p`
  - A paragraph

## --why--

Each element has one job.
````

Each pair is a top-level item (left) with exactly one nested item (right), indented two spaces. At least 2 pairs; the right sides must all be different.

### widget

<!-- example:screen:widget -->
````markdown
# --screen-- widget

## --prompt--

Slide the time a complaint has been open and watch the escalation level change.

## --widget-- escalation-slider

```json
{ "deadlineHours": 24, "maxHours": 72 }
```

## --why--

The level L is 0 before the deadline d, 1 from d until 2d, and 2 from 2d on.
````

- `## --widget-- <name>`: the name is kebab-case and names a React widget registered in the lesson player. The fence is a `json` object with that widget's props.
- `## --prompt--` and `## --why--` are optional. Whether a name exists is not checked by this format.

#### The widgets

Four widgets are registered (code in `src/screens/widgets/`). Their props are checked when the screen opens, not by `validate:content`: a wrong prop makes the widget show "This interactive part could not load." and lets the learner carry on, so open the lesson once after writing one. Text in props is plain text, not markdown. A `tier` in a card or step is one of the names in `tiers`.

| Widget | Lesson | Scored | Props |
|---|---|---|---|
| `escalation-slider` | 3.5 | only with `target` | `deadlineHours`: 24, 72 or 168. `maxHours`: a whole number above `2 * deadlineHours`, up to 1000. `target` (optional): 1 or 2 |
| `tier-sorter` | 3.2, 3.3 | yes | `tiers`: 2 to 6 different names. `cards`: 2 to 20 of `{ "text", "tier" }`, each text different |
| `data-flow-tracer` | 3.4 | yes | `title`. `tiers`: 2 to 6 different names. `steps`: 2 to 20 of `{ "text", "tier" }`, in the order of the flow |
| `request-response` | 3.1 | no | `request`: `{ "method", "path", "body" }`. `response`: `{ "status", "statusText", "body" }`. `stops`: 3 to 12 of `{ "label", "tier" }` |

**`escalation-slider`.** The learner slides t, the hours a complaint has been open, and sees the level L and who has been emailed (nobody, then the hall warden, then the hall warden and Student Affairs) on a timeline marked at d and 2d. With no `target` it is an explorer and never reports. With `target` it asks "Move the slider to the first moment the hall warden is emailed." (`1`) or "...Student Affairs is emailed." (`2`), has its own Check, and is right only at the first hour of that level: d for 1, 2d for 2. The slider moves one hour at a time, and two buttons nudge it by exactly one hour. With a `target` the screen is scored like any other: Continue stays away until the result, and `--why--` shows only after it, behind "Why?". Without one, Continue is there from the start and `--why--` shows under the slider.

````markdown
## --widget-- escalation-slider

```json
{ "deadlineHours": 72, "maxHours": 216, "target": 1 }
```
````

**`tier-sorter`.** The learner taps a card, then the tier it belongs to, and can move a card again until Check. Check waits until every card has a tier. A wrong result says "2 of 5 cards are in the right tier." Cards come in a new random order each time.

````markdown
## --widget-- tier-sorter

```json
{
  "tiers": ["Client", "Logic", "Data", "Output"],
  "cards": [
    { "text": "Student Portal", "tier": "Client" },
    { "text": "Room Allocation", "tier": "Logic" },
    { "text": "Complaint history and audit log", "tier": "Data" },
    { "text": "Email Notification Service", "tier": "Output" }
  ]
}
```
````

**`data-flow-tracer`.** One flow (F1 to F4), one step at a time. The learner taps the tier that handles the step. A wrong tier is counted and cannot be tapped again for that step; the right one moves the flow there and the arrows between the tiers light up and animate. Check at the end is correct only if no pick was wrong, so the first attempt decides: "You picked a wrong tier 3 times, on 2 of 6 steps."

````markdown
## --widget-- data-flow-tracer

```json
{
  "title": "F2 Complaint triage",
  "tiers": ["Client", "Logic", "Data", "Output"],
  "steps": [
    { "text": "Amina presses Submit in the Student Portal.", "tier": "Client" },
    { "text": "The engine sets the category, the urgency and the deadline.", "tier": "Logic" },
    { "text": "The complaint is saved in PostgreSQL.", "tier": "Data" },
    { "text": "The maintenance officer is emailed.", "tier": "Output" }
  ]
}
```
````

**`request-response`.** Back and Next step a request from the first box to the deepest one and the response back. `method` is `GET`, `POST`, `PUT`, `PATCH` or `DELETE`, `path` starts with `/`, and `body` is an object, a list, or `null` (or left out, for a `GET`). The boxes are the different `tier` values of `stops`, top to bottom in the order they first appear. The stops must reach the deepest box and then come back by at least one stop. The request shows from the first stop; the response appears from the stop after the deepest box.

````markdown
## --widget-- request-response

```json
{
  "request": {
    "method": "POST",
    "path": "/api/complaints",
    "body": { "description": "Water is pouring from the ceiling near the light" }
  },
  "response": {
    "status": 201,
    "statusText": "Created",
    "body": { "id": 482, "category": "plumbing", "urgency": "urgent", "status": "Open" }
  },
  "stops": [
    { "label": "The browser sends the form to the server.", "tier": "Browser" },
    { "label": "The server applies the rules.", "tier": "Server" },
    { "label": "The database stores the complaint.", "tier": "Database" },
    { "label": "The server sends back a response.", "tier": "Server" },
    { "label": "The browser shows the response.", "tier": "Browser" }
  ]
}
```
````

### flashcard

<!-- example:screen:flashcard -->
````markdown
# --screen-- flashcard

## --question--

What are the three parts of an HTML element?

## --answer--

An opening tag, the content, and a closing tag.
````

The learner reveals the answer, then rates it got / shaky / missed.

### checklist

<!-- example:screen:checklist -->
````markdown
# --screen-- checklist

## --items--

- Install Python 3.11 or newer, then run the command below and paste what it prints.
  - command: `python --version`
  - pattern: `^Python 3\.1[1-3]`
  - hint: Your Python is older than 3.11. Install a newer one from python.org.
- Create a folder called `ihms` for your project.
````

An item with no nested lines is a plain tick-box. An item with a check has all three nested lines: the `command` the learner runs, the `pattern` (a regular expression the pasted output must match), and the `hint` shown when it does not.

## 9. Quiz and exam (`quiz.md`)

Both types use `quiz.md`. `draw` questions are drawn at random from the pool each attempt; `pass` correct answers are needed.

<!-- example:quiz -->
````markdown
---
draw: 2
pass: 2
---

## --question--

### --text--

What does the `h1` element make?

### --distractors--

- A paragraph of text
- A button that can be clicked

### --answer--

The main heading of a page

### --explanation--

`h1` is the top-level heading. Paragraphs use `p` and buttons use `button`.

## --question--

### --text--

Which pair of tags wraps a paragraph?

### --distractors--

- `<h1>` and `</h1>`
- `<para>` and `</para>`

### --answer--

`<p>` and `</p>`

### --explanation--

A paragraph is a `p` element. `h1` makes a heading, and `para` is not an element.
````

- Each `## --question--` has the four `###` sections, all required.
- 2 to 5 distractors; they are shown mixed with the answer.
- The question `id` is computed from the `--text--` source. You never write it. Two questions with the same text clash.
- Pool size is the number of questions. Rule: `pass <= draw <= pool size`. An exam must pass at 80% or more of `draw`.

## 10. Review (`review.md`)

Plain markdown, no markers and no frontmatter. `::: tryit` blocks may sit anywhere.

<!-- example:review -->
````markdown
## HTML basics

A page is made of **elements**. Most have an opening tag, some content and a closing tag.

| Element | What it makes |
|---|---|
| `h1` | The main heading |
| `p` | A paragraph |

::: tryit web
```html file=index.html
<h1>Hall Notice</h1>
```
:::

### Remember

- Visible content goes inside `body`.
````

## 11. Project (`project.md`)

<!-- example:project -->
````markdown
---
ciJob: lab-setup
---

# --user-stories--

1. You have a GitHub repository for your IHMS project.
2. The `lab-setup` job in GitHub Actions passes.

# --instructions--

Create your repository from the group template, then push a commit to `main`.

Paste the link to your repository below and press **Check my repo**.
````

`ciJob` is the name of the GitHub Actions job that must be green (`lab-` plus lowercase words). It must be unique across projects.

## 12. Validation rules

`npm run validate:content` checks all of these. A zod rule is checked per file; a cross-file rule needs the whole tree.

| Rule | Where |
|---|---|
| `curriculum.json`: track id is `A`, `B` or `Z`; `Z` has `fixture: true`; chapter ids start with their track id; track, chapter and slug entries are unique | zod |
| Every curriculum slug has a folder in `blocks/`, and every folder is listed in the curriculum | cross-file |
| `meta.json`: only the documented keys; `slug` equals the folder name; workshop and lab runner is not `none`; `demo` only on workshops and labs; web labs have `demo` | meta check |
| The block folder holds `meta.json` and exactly the file(s) its type needs | cross-file |
| Ids are unique across all content: block ids, step ids and quiz question ids | cross-file |
| Step numbering starts at `01` and has no gaps; step title is `Step N`; step `runner` equals the block runner | cross-file |
| Every step has `solutions`, with the same file names as the seed | zod |
| Exactly one `--editable-region--` pair per step seed (typein: one; lab: at most one); the region has at least one line | zod / parser |
| Solutions and tryit files contain no `--editable-region--` markers | parser |
| Test fences use the runner's language (`web` `js`, `python` `py`, `sql` `js`, `fastapi` `py`); `js` tests parse | parser / cross-file |
| A step or lab has 1 to 3 hints under `--help--` | zod |
| `mcq`, `predict`, `spotbug`: exactly one correct option. `multi`: at least one. Every option has feedback | zod / parser |
| `tapbuild`: blank count equals answer length; answer tokens are in the token list; blanks are exactly `___` | zod |
| `typein`: exactly one editable region, solutions present, runner not `none` | zod / parser |
| `order` items are all different; `match` right sides are all different; `checklist` patterns are valid regular expressions and checks are complete | zod / parser |
| `widget` props are a valid JSON object | parser |
| Quiz: `pass <= draw <= pool size`; exam: `pass` is at least 80% of `draw`; 2 to 5 distractors per question | zod / cross-file |
| Project `ciJob` looks like `lab-name` and is unique | zod / cross-file |
| Unknown, duplicate or missing sections are errors; so is text before the first marker (except on a `concept` screen) | parser |

Problems are printed as `content/blocks/<slug>/<file>:<line>: <message>`.

## 13. What the build writes

`npm run content` writes `public/content/` (git-ignored).

- `curriculum.json`: `{ tracks: [{ id, title, fixture?, chapters: [{ id, title, blocks: [Summary] }] }] }`. A summary is `{ id, slug, type, title, runner, estMinutes, itemCount, roomCode, optional? }`. `itemCount` is screens (lesson), steps (workshop), user stories (lab, project), `draw` (quiz, exam), or 1 (review).
- `blocks/<slug>.json`: `{ type, meta, roomCode, ... }` plus the parsed content under a key by type: `lesson`, `steps`, `lab`, `review`, `quiz` (also for exams) or `project`.

Types for all of it are exported from `src/content/schema.ts`. The app reads it with `fetchCurriculum()` and `fetchBlock(slug)` from `src/content/loader.ts`.

## 14. Verify your content

`npm run validate:content` checks the shape. `npm run verify:challenges` checks that every challenge **works**: it runs your code in a headless browser with the same runner the app uses. Run it after you write or change a step, lab or typein screen.

| Command | What it does |
|---|---|
| `npm run verify:challenges` | Verifies everything in `content/`, fixtures included |
| `npm run verify:challenges -- --block <slug>` | Verifies one block. Only that block's own files have to validate |
| `npm run verify:challenges -- --content <dir>` | Uses another content folder |
| `npm run verify:challenges -- --strict` | A skipped check counts as a failure (exit 1) |

| What | Rule |
|---|---|
| Workshop step, lab, lesson `typein` screen | Run the tests on the **seed**: at least one must fail. Run them on the **solution**: all must pass. A seed that cannot run (a syntax error) counts as failing |
| `::: tryit` block (concept screen or review) | Running the code raises no uncaught error and no syntax error. `console.log` and `console.error` calls are fine |
| `python` | Runs in the real Python runner. The first check downloads Python (about 6 MB), so it takes longer. A `::: tryit python` block passes when `main.py` ends with no error inside 5 seconds. `print` is fine |
| `sql` | Runs in the real SQL runner. The first check downloads PostgreSQL (about 5.3 MB), so it takes longer. A `::: tryit sql` block passes when `setup.sql` and `query.sql` run with no error inside 5 seconds. A statement that returns no rows is fine |
| `fastapi` | Skipped until that runner is built |

It needs Chromium. Locally, set `PW_CHROMIUM_PATH` to a Chromium or `chrome-headless-shell` binary (see `docs/style-guide.md`). CI installs its own. A run builds its harness into `.verify-dist/` (git-ignored, removed afterwards) and never writes `public/content/`.

### Reading the output

One line per problem, then a summary: `16 checked, 0 failed, 0 skipped`. A "check" is one step, lab, typein screen or try-it block. A check with two problems prints two lines and counts as one failed.

| Line | Meaning and fix |
|---|---|
| `content/blocks/x/03.md: the seed already passes every test` | A learner would pass without typing. Make a test fail on the seed, or leave out of the seed the part the step adds |
| `content/blocks/x/03.md: the solution fails test 2: <message> (<detail>)` | The solution breaks the second test (counted from 1, in file order). `<message>` is that test's text. `<detail>` is the assertion's own wording, such as `expected 0 to equal 1`. Fix the solution or the test |
| `content/blocks/x/03.md: the solution could not run: <reason>` | Nothing was tested: a syntax error, a loop that never ends, or a timeout |
| `content/blocks/x/lesson.md: screen 6 (typein): ...` | The same checks on a lesson screen. Screens count from 1 |
| `content/blocks/x/review.md: try it 2: running the code raises an uncaught error: <error>` | The code in the second try-it block throws. A lesson names it `screen N (try it)` |
| `content/blocks/x/review.md: try it 2: running the code fails: <reason>` | The code has a syntax error or a loop that never ends |
| `skipped: fastapi runner not built yet (content/blocks/x/03.md)` | Not checked yet. Not an error, unless you pass `--strict` |
| `... the web runner could not start: ...` or `... the check could not run: ...` | The checking tool broke, not your content. Run it again, then report it |

Exit code 0 means every check passed. 1 means a challenge is broken, the content does not validate, or `--strict` met a skipped check. 2 means the command could not run (unknown option, no such block, no browser).
