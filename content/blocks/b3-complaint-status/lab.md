# --description--

Build the Complaint Status Page for hall wardens and maintenance officers, like the example. It is the Staff Dashboard from the CSS chapter, with its rows now coming from a file. Use the user stories as your checklist: when every test passes, the lab is done.

`staff.html` and `css/style.css` are finished, except for the script. `complaints.json` holds the complaints, and `js/staff.js` is empty. You write all of the JavaScript. The first three deadlines in `complaints.json` are in December 2026 and the other three have passed, so the example shows both kinds of row. The checks also use dates of their own.

# --user-stories--

1. Your `staff.html` has a `script` element in the `head` that loads `js/staff.js` and has the `defer` attribute.
2. The sample rows are gone from `staff.html`: the `tbody` of `#complaints` starts empty.
3. Your page has a `p` element with the id `error`, where a failure is reported.
4. Your `js/staff.js` has an `async` function `loadComplaints()` that fetches `complaints.json`, checks the reply, reads the JSON and draws the table. Your code calls it once when the page loads.
5. The table has one row for each complaint in the file. Each row has six cells, in this order: ID, Room, Category, Urgency, Deadline and Status. The Deadline cell shows the deadline written with `toLocaleString("en-NG")`.
6. The Urgency cell holds a `span` with the class `badge` and a second class that matches the urgency word, such as `badge urgent`.
7. Text from the file is shown as text. A room written as `<b>B-214</b>` appears with its tags visible and does not turn bold.
8. Choosing a status in `#status-filter` shows only the complaints with that status. Choosing `All complaints` shows every complaint again, and rows do not pile up.
9. A row whose deadline has passed has the class `overdue`. A row whose deadline is still ahead does not.
10. If the reply is not ok, `#error` says `Couldn't load complaints. Server replied` and the status number, such as `Server replied 404`. If `fetch` itself fails, `#error` says `Couldn't load complaints. ` followed by the error's message.

# --hints--

Your `head` element should have a `script` element.

```js
assert.match(code, /<head[\s>][\s\S]*<script[\s>][\s\S]*<\/head\s*>/i);
```

Your `script` element should have the attribute `src="js/staff.js"` and the `defer` attribute.

```js
assert.match(code, /<script\s[^>]*src\s*=\s*("|')(?:\.\/)?js\/staff\.js\1[^>]*>/i);
assert.match(code, /<script\s[^>]*\bdefer\b[^>]*>/i);
```

The sample rows should be gone from `staff.html`. The `tbody` should start empty, and your script should draw every row.

```js
assert.notMatch(code, /<td[\s>]/i);
```

Your page should have a `p` element with the id `error`.

```js
assert.exists(document.querySelector('p#error'));
```

Your code should define an `async` function called `loadComplaints`.

```js
assert.isFunction(loadComplaints);
assert.equal(loadComplaints.constructor.name, 'AsyncFunction');
```

After the page loads, the table should have one row for each complaint in `complaints.json`. Call `loadComplaints()` once when the page loads.

```js
await new Promise((resolve) => setTimeout(resolve, 50));
const data = JSON.parse(files['complaints.json']);
assert.lengthOf(document.querySelectorAll('#complaints tbody tr'), data.length);
```

Each row should have six cells: ID, Room, Category, Urgency, Deadline and Status. The first row should show the first complaint in the file, with its deadline written by `toLocaleString("en-NG")`.

```js
await new Promise((resolve) => setTimeout(resolve, 50));
const data = JSON.parse(files['complaints.json']);
const rows = [...document.querySelectorAll('#complaints tbody tr')];
rows.forEach((tr) => assert.lengthOf(tr.children, 6));
const c = data[0];
const cells = [...rows[0].children].map((td) => td.textContent.trim());
assert.deepEqual(cells, [String(c.id), c.room, c.category, c.urgency, new Date(c.deadline).toLocaleString('en-NG'), c.status]);
```

The Urgency cell of every row should hold a `span` with the class `badge` and the urgency word as a second class.

```js
await new Promise((resolve) => setTimeout(resolve, 50));
const data = JSON.parse(files['complaints.json']);
const rows = [...document.querySelectorAll('#complaints tbody tr')];
assert.isAbove(rows.length, 0);
rows.forEach((tr, i) => {
  const span = tr.children[3].querySelector('span');
  assert.exists(span);
  assert.isTrue(span.classList.contains('badge'));
  assert.isTrue(span.classList.contains(data[i].urgency));
});
```

Text from the file should be shown as text. A room named `<b>B-214</b>` should appear with its tags visible, and the table should contain no `b` element. Use `textContent`.

```js
const real = window.fetch;
const body = JSON.stringify([{ id: 1, room: '<b>B-214</b>', category: 'plumbing', urgency: 'urgent', status: 'Open', deadline: '2030-01-01T09:00:00+01:00' }]);
window.fetch = () => Promise.resolve(new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } }));
try { await loadComplaints(); } finally { window.fetch = real; }
const rows = document.querySelectorAll('#complaints tbody tr');
assert.lengthOf(rows, 1);
assert.equal(rows[0].children[1].textContent, '<b>B-214</b>');
assert.lengthOf(document.querySelectorAll('#complaints b'), 0);
await loadComplaints();
```

Choosing a status in the drop-down should show only the complaints with that status. Check `Open`, `Assigned`, `In Progress` and `Resolved`.

```js
await loadComplaints();
const data = JSON.parse(files['complaints.json']);
const select = document.querySelector('#status-filter');
for (const status of ['Open', 'Assigned', 'In Progress', 'Resolved']) {
  select.value = status;
  select.dispatchEvent(new Event('change'));
  const ids = [...document.querySelectorAll('#complaints tbody tr')].map((tr) => tr.children[0].textContent.trim());
  assert.deepEqual(ids, data.filter((c) => c.status === status).map((c) => String(c.id)), status);
}
select.value = 'all';
select.dispatchEvent(new Event('change'));
```

Choosing `All complaints` should show every complaint again, and the rows should not pile up. After `Open` and then `All complaints`, the table should have one row for each complaint in the file.

```js
await loadComplaints();
const data = JSON.parse(files['complaints.json']);
const select = document.querySelector('#status-filter');
select.value = 'Open';
select.dispatchEvent(new Event('change'));
select.value = 'all';
select.dispatchEvent(new Event('change'));
assert.lengthOf(document.querySelectorAll('#complaints tbody tr'), data.length);
```

A row whose deadline has passed should have the class `overdue`. A row whose deadline is still ahead should not.

```js
const at = (h) => new Date(Date.now() + h * 3600000).toISOString();
const row = (id, hours) => ({ id, room: 'A-1', category: 'plumbing', urgency: 'urgent', status: 'Open', deadline: at(hours) });
const real = window.fetch;
const body = JSON.stringify([row(1, -5), row(2, 48), row(3, -30), row(4, 0.5)]);
window.fetch = () => Promise.resolve(new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } }));
try { await loadComplaints(); } finally { window.fetch = real; }
const flags = [...document.querySelectorAll('#complaints tbody tr')].map((tr) => tr.classList.contains('overdue'));
await loadComplaints();
assert.deepEqual(flags, [true, false, true, false]);
```

Every row should be judged on its own deadline. With the dates in `complaints.json`, a row should have the class `overdue` exactly when its deadline is earlier than now.

```js
await loadComplaints();
const data = JSON.parse(files['complaints.json']);
const rows = [...document.querySelectorAll('#complaints tbody tr')];
assert.lengthOf(rows, data.length);
data.forEach((c, i) => assert.strictEqual(rows[i].classList.contains('overdue'), new Date(c.deadline) < new Date()));
```

When the reply is a 404, `#error` should say `Couldn't load complaints. Server replied 404`. Check `response.ok` and throw an error.

```js
const real = window.fetch;
window.fetch = () => Promise.resolve(new Response('Not found', { status: 404 }));
try { await loadComplaints(); } finally { window.fetch = real; }
assert.equal(document.querySelector('#error').textContent.trim(), "Couldn't load complaints. Server replied 404");
await loadComplaints();
```

When `fetch` itself fails, `#error` should say `Couldn't load complaints. ` followed by the error's message. Wrap the work in `try` and use `catch`.

```js
const real = window.fetch;
window.fetch = () => Promise.reject(new TypeError('Failed to fetch'));
try { await loadComplaints(); } finally { window.fetch = real; }
assert.equal(document.querySelector('#error').textContent.trim(), "Couldn't load complaints. Failed to fetch");
await loadComplaints();
```

# --seed--

## --seed-contents--

```html file=staff.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Staff Dashboard</title>
    <link rel="stylesheet" href="css/style.css">
  </head>
  <body>
    <header>
      <h1>Staff Dashboard</h1>
      <nav>
        <a href="index.html">Home</a>
        <a href="student.html">Student Portal</a>
        <a href="staff.html">Staff Dashboard</a>
        <a href="admin.html">Admin Dashboard</a>
      </nav>
    </header>
    <main>
      <div class="filter">
        <label for="status-filter">Show</label>
        <select id="status-filter">
          <option value="all">All complaints</option>
          <option value="Open">Open</option>
          <option value="Assigned">Assigned</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>
      </div>
      <div class="table-wrap">
        <table id="complaints">
          <thead>
            <tr>
              <th>ID</th><th>Room</th><th>Category</th><th>Urgency</th><th>Deadline</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr class="overdue">
              <td>482</td><td>B-214</td><td>Plumbing</td><td><span class="badge urgent">Urgent</span></td><td>24 hours</td><td>Open</td>
            </tr>
            <tr>
              <td>479</td><td>A-110</td><td>Electrical</td><td><span class="badge normal">Normal</span></td><td>72 hours</td><td>Assigned</td>
            </tr>
            <tr>
              <td>476</td><td>C-305</td><td>Sanitation</td><td><span class="badge normal">Normal</span></td><td>72 hours</td><td>In Progress</td>
            </tr>
            <tr>
              <td>470</td><td>B-107</td><td>Carpentry</td><td><span class="badge low">Low</span></td><td>7 days</td><td>Resolved</td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
    <footer>
      <p>Group 39 · COS 303 · Nile University of Nigeria</p>
    </footer>
  </body>
</html>
```

```css file=css/style.css
:root {
  --primary: #1f5c99;
  --text: #1a1a1a;
  --muted: #5b6b80;
  --urgent: #b42318;
  --normal: #b45309;
  --low: #2e7d4f;
}

* {
  box-sizing: border-box;
}

body {
  font-family: system-ui, sans-serif;
  color: var(--text);
  margin: 0;
}

h1 {
  color: var(--primary);
  margin: 0;
  padding: 1rem;
}

nav {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1rem;
  background-color: var(--primary);
}

nav a {
  color: white;
  text-decoration: none;
}

main {
  max-width: 40rem;
  margin: 0 auto;
  padding: 1rem;
}

footer {
  color: var(--muted);
  padding: 1rem;
}

.filter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1rem 0;
}

select {
  padding: 0.5rem;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 0.5rem 0.75rem;
  text-align: left;
}

th {
  background-color: var(--primary);
  color: white;
}

.badge {
  display: inline-block;
  padding: 0.1rem 0.6rem;
  border-radius: 999px;
  color: white;
  font-size: 0.8rem;
}

.badge.urgent { background-color: var(--urgent); }
.badge.normal { background-color: var(--normal); }
.badge.low    { background-color: var(--low); }

tr.overdue {
  background-color: #fdecea;
}

.table-wrap {
  overflow-x: auto;
}

@media (max-width: 600px) {
  nav {
    flex-direction: column;
  }
}
```

```js file=js/staff.js

```

```json file=complaints.json
[
  {
    "id": 484,
    "room": "C-305",
    "category": "electrical",
    "urgency": "normal",
    "status": "In Progress",
    "deadline": "2026-12-18T08:00:00+01:00"
  },
  {
    "id": 483,
    "room": "A-110",
    "category": "carpentry",
    "urgency": "low",
    "status": "Resolved",
    "deadline": "2026-12-18T14:00:00+01:00"
  },
  {
    "id": 482,
    "room": "B-214",
    "category": "plumbing",
    "urgency": "urgent",
    "status": "Open",
    "deadline": "2026-12-17T09:00:00+01:00"
  },
  {
    "id": 479,
    "room": "A-110",
    "category": "electrical",
    "urgency": "normal",
    "status": "Assigned",
    "deadline": "2026-10-14T10:00:00+01:00"
  },
  {
    "id": 476,
    "room": "C-305",
    "category": "sanitation",
    "urgency": "normal",
    "status": "In Progress",
    "deadline": "2026-10-13T16:00:00+01:00"
  },
  {
    "id": 470,
    "room": "B-107",
    "category": "carpentry",
    "urgency": "low",
    "status": "Resolved",
    "deadline": "2026-10-12T11:00:00+01:00"
  }
]
```

# --solutions--

```html file=staff.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Staff Dashboard</title>
    <link rel="stylesheet" href="css/style.css">
    <script src="js/staff.js" defer></script>
  </head>
  <body>
    <header>
      <h1>Staff Dashboard</h1>
      <nav>
        <a href="index.html">Home</a>
        <a href="student.html">Student Portal</a>
        <a href="staff.html">Staff Dashboard</a>
        <a href="admin.html">Admin Dashboard</a>
      </nav>
    </header>
    <main>
      <div class="filter">
        <label for="status-filter">Show</label>
        <select id="status-filter">
          <option value="all">All complaints</option>
          <option value="Open">Open</option>
          <option value="Assigned">Assigned</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>
      </div>
      <p id="error"></p>
      <div class="table-wrap">
        <table id="complaints">
          <thead>
            <tr>
              <th>ID</th><th>Room</th><th>Category</th><th>Urgency</th><th>Deadline</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
          </tbody>
        </table>
      </div>
    </main>
    <footer>
      <p>Group 39 · COS 303 · Nile University of Nigeria</p>
    </footer>
  </body>
</html>
```

```css file=css/style.css
:root {
  --primary: #1f5c99;
  --text: #1a1a1a;
  --muted: #5b6b80;
  --urgent: #b42318;
  --normal: #b45309;
  --low: #2e7d4f;
}

* {
  box-sizing: border-box;
}

body {
  font-family: system-ui, sans-serif;
  color: var(--text);
  margin: 0;
}

h1 {
  color: var(--primary);
  margin: 0;
  padding: 1rem;
}

nav {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1rem;
  background-color: var(--primary);
}

nav a {
  color: white;
  text-decoration: none;
}

main {
  max-width: 40rem;
  margin: 0 auto;
  padding: 1rem;
}

footer {
  color: var(--muted);
  padding: 1rem;
}

.filter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1rem 0;
}

select {
  padding: 0.5rem;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 0.5rem 0.75rem;
  text-align: left;
}

th {
  background-color: var(--primary);
  color: white;
}

.badge {
  display: inline-block;
  padding: 0.1rem 0.6rem;
  border-radius: 999px;
  color: white;
  font-size: 0.8rem;
}

.badge.urgent { background-color: var(--urgent); }
.badge.normal { background-color: var(--normal); }
.badge.low    { background-color: var(--low); }

tr.overdue {
  background-color: #fdecea;
}

.table-wrap {
  overflow-x: auto;
}

@media (max-width: 600px) {
  nav {
    flex-direction: column;
  }
}
```

```js file=js/staff.js
const tbody = document.querySelector("#complaints tbody");
const filter = document.querySelector("#status-filter");
const loadError = document.querySelector("#error");
const HOUR = 60 * 60 * 1000;
let complaints = [];

function cell(text) {
  const td = document.createElement("td");
  td.textContent = text;
  return td;
}

function badge(urgency) {
  const td = document.createElement("td");
  const span = document.createElement("span");
  span.classList.add("badge", urgency);
  span.textContent = urgency;
  td.append(span);
  return td;
}

function render(list) {
  tbody.replaceChildren();
  for (const c of list) {
    const row = document.createElement("tr");
    row.append(
      cell(c.id),
      cell(c.room),
      cell(c.category),
      badge(c.urgency),
      cell(new Date(c.deadline).toLocaleString("en-NG")),
      cell(c.status)
    );
    const hoursLeft = (new Date(c.deadline) - new Date()) / HOUR;
    if (hoursLeft < 0) {
      row.classList.add("overdue");
    }
    tbody.append(row);
  }
}

async function loadComplaints() {
  try {
    const response = await fetch("complaints.json");
    if (!response.ok) {
      throw new Error(`Server replied ${response.status}`);
    }
    complaints = await response.json();
    render(complaints);
  } catch (err) {
    loadError.textContent = "Couldn't load complaints. " + err.message;
  }
}

filter.addEventListener("change", () => {
  const value = filter.value;
  render(value === "all" ? complaints : complaints.filter(c => c.status === value));
});

loadComplaints();
```

```json file=complaints.json
[
  {
    "id": 484,
    "room": "C-305",
    "category": "electrical",
    "urgency": "normal",
    "status": "In Progress",
    "deadline": "2026-12-18T08:00:00+01:00"
  },
  {
    "id": 483,
    "room": "A-110",
    "category": "carpentry",
    "urgency": "low",
    "status": "Resolved",
    "deadline": "2026-12-18T14:00:00+01:00"
  },
  {
    "id": 482,
    "room": "B-214",
    "category": "plumbing",
    "urgency": "urgent",
    "status": "Open",
    "deadline": "2026-12-17T09:00:00+01:00"
  },
  {
    "id": 479,
    "room": "A-110",
    "category": "electrical",
    "urgency": "normal",
    "status": "Assigned",
    "deadline": "2026-10-14T10:00:00+01:00"
  },
  {
    "id": 476,
    "room": "C-305",
    "category": "sanitation",
    "urgency": "normal",
    "status": "In Progress",
    "deadline": "2026-10-13T16:00:00+01:00"
  },
  {
    "id": 470,
    "room": "B-107",
    "category": "carpentry",
    "urgency": "low",
    "status": "Resolved",
    "deadline": "2026-10-12T11:00:00+01:00"
  }
]
```

# --help--

## --hint--

Work in the order the page works: first get the data and draw it, then make the filter use the same data, then mark the late rows.

## --hint--

Keep the complaints from the file in one variable that both the loader and the filter can read. One function that draws any list it is given can serve the first load and every filter choice, as long as it clears the table body first.

## --hint--

A row is overdue when its deadline is earlier than now, and subtracting two dates gives a number you can compare with 0. A 404 is an ordinary reply to `fetch`, so your own code has to notice a bad reply and turn it into an error that `catch` can show.
