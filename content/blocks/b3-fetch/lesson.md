# --screen-- concept

A page often needs data that is kept somewhere else, such as a file or a server. `fetch` asks for it. The answer takes a moment, so the code waits for it with `await`. `await` only works inside a function marked `async`.

::: tryit web
```js file=script.js
async function loadComplaints() {
  const response = await fetch("complaints.json");
  console.log(response.status);
}

loadComplaints();
```

```json file=complaints.json
[
  { "id": 482, "room": "B-214", "category": "plumbing", "urgency": "urgent", "status": "Open" },
  { "id": 483, "room": "A-110", "category": "carpentry", "urgency": "low", "status": "Resolved" },
  { "id": 484, "room": "C-305", "category": "electrical", "urgency": "normal", "status": "In Progress" }
]
```
:::

## --callout-- tip

Press Run. The console shows `200`, the number a server sends back when all went well.

# --screen-- mcq

## --question--

What does `await` do?

## --options--

- [x] Waits for the result before the code carries on
  > Yes. The next line runs only after the reply has arrived.
- [ ] Makes the code run faster
  > No. `await` does not speed anything up. It pauses the function until the slow thing has finished.
- [ ] Sends the request again
  > No. `fetch` sends the request. `await` only waits for its answer.
- [ ] Turns the reply into a list of objects
  > No. That is the job of `response.json()`. `await` only waits.

## --why--

`fetch` hands back an unfinished answer straight away. `await` holds the function at that line until the answer is ready.

# --screen-- concept

The reply is only text until you read it. `response.json()` turns JSON text into JavaScript objects. It takes a moment too, so it gets its own `await`. In JSON, every key and every string has double quotes.

::: tryit web
```js file=script.js
async function loadComplaints() {
  const response = await fetch("complaints.json");
  const data = await response.json();
  console.log(data.length);
  console.log(data[0].room);
}

loadComplaints();
```

```json file=complaints.json
[
  { "id": 482, "room": "B-214", "category": "plumbing", "urgency": "urgent", "status": "Open" },
  { "id": 483, "room": "A-110", "category": "carpentry", "urgency": "low", "status": "Resolved" },
  { "id": 484, "room": "C-305", "category": "electrical", "urgency": "normal", "status": "In Progress" }
]
```
:::

## --callout-- info

`data` is an array of objects, like the `complaints` array you already know. JSON has no comments and no comma after the last item.

# --screen-- spotbug

## --code--

```js file=script.js
async function loadComplaints() {
  const response = await fetch("complaints.json");
  const data = response.json();
  console.log(data.length);
}

loadComplaints();
```

## --question--

`complaints.json` holds three complaints, but the console shows `undefined` instead of 3. What is wrong?

## --options--

- [x] `response.json()` has no `await`, so `data` is an unfinished answer, not the list.
  > Yes. Reading the JSON takes a moment too. Without `await`, `data.length` asks an unfinished answer for a length it does not have.
- [ ] `fetch` should not have an `await`.
  > No. `fetch` needs its `await`. The reply is only there once the wait is over.
- [ ] `data.length` should be `data.size`.
  > No. The number of items in an array is `length`. `size` is not a property of arrays.
- [ ] `console.log` cannot show numbers.
  > No. `console.log` shows numbers, text and other values.

## --why--

Both `fetch` and `response.json()` take time. Each one needs its own `await`.

# --screen-- spotbug

## --code--

```json file=complaints.json
[
  { id: 482, room: 'B-214', status: "Open" }
]
```

## --question--

The code that calls `response.json()` on this file throws an error. What is wrong with the file?

## --options--

- [x] Every key needs double quotes, and `'B-214'` needs double quotes instead of single quotes.
  > Yes. In JSON, every key and every piece of text is in double quotes. `"id"`, `"room"` and `"B-214"` are all valid.
- [ ] The list needs `const complaints =` in front of it.
  > No. A JSON file holds only the data. JavaScript words such as `const` are not part of JSON.
- [ ] The file needs a semicolon after the last bracket.
  > No. JSON has no semicolons.
- [ ] Square brackets are not allowed in JSON.
  > No. JSON can hold a list in square brackets, as `complaints.json` does.

## --why--

JSON looks like JavaScript but is stricter. Use double quotes on every key and string, and leave out comments and the comma after the last item.

# --screen-- concept

A reply comes back even when something is wrong. `response.status` is the number the server sent, and `response.ok` is `true` for 200 to 299. A file that is not there gives 404, and `ok` is `false`. Check `ok` before you read the data.

::: tryit web
```js file=script.js
async function check(file) {
  const response = await fetch(file);
  console.log(file, response.status, response.ok);
}

check("complaints.json");
check("complaints-old.json");
```

```json file=complaints.json
[
  { "id": 482, "room": "B-214", "category": "plumbing", "urgency": "urgent", "status": "Open" },
  { "id": 483, "room": "A-110", "category": "carpentry", "urgency": "low", "status": "Resolved" },
  { "id": 484, "room": "C-305", "category": "electrical", "urgency": "normal", "status": "In Progress" }
]
```
:::

## --callout-- info

`complaints-old.json` is not in this project, so its reply is 404.

# --screen-- predict

## --code--

```js file=script.js
// The project has one data file: complaints.json
async function check() {
  const response = await fetch("complaints-2025.json");
  console.log(response.status, response.ok);
}

check();
```

## --question--

What does the console show?

## --options--

- [x] 404 false
  > Yes. The file is not there, so the reply has status 404 and `ok` is false.
- [ ] 200 true
  > No. 200 means the file was found, and this file does not exist.
- [ ] 404 true
  > No. `ok` is true only for 200 to 299, and 404 is outside that range.
- [ ] Nothing, because `fetch` throws an error
  > No. A missing file still gets a reply. `fetch` itself fails only when no reply arrives at all, for example when the internet is down.

## --why--

`fetch` gives a reply for a 404 too. Your code has to look at `response.ok` to notice the problem.

# --screen-- concept

To stop on a bad reply, write `throw new Error(...)`. To keep the page alive, wrap the work in `try { }`. If anything inside it fails, the `catch (err) { }` block runs instead, and `err.message` holds the text. Always tell the user what happened.

::: tryit web
```html file=staff.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Staff Dashboard</title>
    <script src="script.js" defer></script>
  </head>
  <body>
    <h1>Staff Dashboard</h1>
    <p id="error"></p>
  </body>
</html>
```

```js file=script.js
async function loadComplaints() {
  try {
    const response = await fetch("complaints-old.json");
    if (!response.ok) {
      throw new Error(`Server replied ${response.status}`);
    }
    const data = await response.json();
    console.log(data.length);
  } catch (err) {
    document.querySelector("#error").textContent = "Couldn't load complaints. " + err.message;
  }
}

loadComplaints();
```

```json file=complaints.json
[
  { "id": 482, "room": "B-214", "category": "plumbing", "urgency": "urgent", "status": "Open" },
  { "id": 483, "room": "A-110", "category": "carpentry", "urgency": "low", "status": "Resolved" },
  { "id": 484, "room": "C-305", "category": "electrical", "urgency": "normal", "status": "In Progress" }
]
```
:::

## --callout-- tip

Change `complaints-old.json` to `complaints.json` and press Run. The message disappears and the console shows 3.

# --screen-- order

## --prompt--

Put the steps of `loadComplaints` in the order they happen.

## --items--

- Ask for `complaints.json` with `await fetch(...)`
- Stop with an error if `response.ok` is false
- Read the reply with `await response.json()`
- Draw the list on the page
- If anything above failed, show a message in `catch`

## --why--

The reply has to arrive before it can be checked, be checked before it is read, and be read before it can be drawn. The `catch` block runs only when one of the steps before it failed.

# --screen-- concept

The list from `response.json()` is an array of objects, so the `render` function from the last lessons can draw it. Call `render(data)` inside `try`, after the data has arrived.

::: tryit web
```html file=staff.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Staff Dashboard</title>
    <style>
      td, th { padding: 4px 12px; text-align: left; }
      .badge { padding: 2px 8px; border-radius: 8px; }
      .urgent { background: #f7d4d0; }
      .normal { background: #fbe3c8; }
      .low { background: #d3ead9; }
    </style>
    <script src="script.js" defer></script>
  </head>
  <body>
    <h1>Staff Dashboard</h1>
    <p id="error"></p>
    <table id="complaints">
      <thead>
        <tr><th>ID</th><th>Room</th><th>Category</th><th>Urgency</th><th>Status</th></tr>
      </thead>
      <tbody></tbody>
    </table>
  </body>
</html>
```

```js file=script.js
const tbody = document.querySelector("#complaints tbody");

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
    row.append(cell(c.id), cell(c.room), cell(c.category), badge(c.urgency), cell(c.status));
    tbody.append(row);
  }
}

async function loadComplaints() {
  try {
    const response = await fetch("complaints.json");
    if (!response.ok) {
      throw new Error(`Server replied ${response.status}`);
    }
    const data = await response.json();
    render(data);
  } catch (err) {
    document.querySelector("#error").textContent = "Couldn't load complaints. " + err.message;
  }
}

loadComplaints();
```

```json file=complaints.json
[
  { "id": 482, "room": "B-214", "category": "plumbing", "urgency": "urgent", "status": "Open" },
  { "id": 483, "room": "A-110", "category": "carpentry", "urgency": "low", "status": "Resolved" },
  { "id": 484, "room": "C-305", "category": "electrical", "urgency": "normal", "status": "In Progress" }
]
```
:::

## --callout-- tip

Rename the file in the `fetch` line and press Run. The table stays empty and the page says why.

# --screen-- tapbuild

## --prompt--

Finish the function that loads the complaints and draws them.

## --template--

```js
___ function loadComplaints() {
  const response = ___ fetch("complaints.json");
  const data = await response.___();
  render(data);
}
```

## --tokens--

- `async`
- `await`
- `json`
- `text`
- `wait`
- `function`

## --answer--

- `async`
- `await`
- `json`

## --why--

`async` lets the function use `await`. `await` waits for the reply. `json()` reads the reply as objects, while `text()` would give plain text that you could not loop over.

# --screen-- mcq

## --question--

When does the `catch` block run?

## --options--

- [x] When something in the `try` block fails
  > Yes. A thrown error, a failed `fetch` or a broken JSON file all send the code to `catch`.
- [ ] Always, after `try`
  > No. If everything in `try` works, `catch` is skipped.
- [ ] Only when `response.ok` is false
  > No. That case reaches `catch` only because the code throws an error there. Any other failure inside `try` reaches it too.
- [ ] When the page first loads
  > No. `catch` belongs to a `try` block. It runs when that block fails, not when the page loads.

## --why--

`try` holds the work that might fail. `catch` is the plan for when it does.

# --screen-- spotbug

## --code--

```js file=script.js
async function loadComplaints() {
  try {
    const response = await fetch("complaints.json");
    if (!response.ok) {
      throw new Error(`Server replied ${response.status}`);
    }
    const data = await response.json();
    render(data);
  } catch (err) {
    console.log(err.message);
  }
}
```

## --question--

When the file is missing, a student sees an empty table and no message, unless they open the console. What is missing?

## --options--

- [x] The `catch` block should put a message on the page, for example in a `p` element with the id `error`.
  > Yes. The console is for the developer. A student never opens it, so the page itself has to say what went wrong.
- [ ] The `throw` line should be removed.
  > No. The `throw` is what sends a bad reply to `catch`. Without it, the code would try to read a 404 reply as JSON.
- [ ] The `try` block should come after `render`.
  > No. `render` belongs inside the `try`. If the data never arrives, there is nothing to draw.
- [ ] `err.message` should be `err.text`.
  > No. The text of an error is in `message`. `text` is not a property of errors.

## --why--

Messages in the console are for the person who wrote the code. Whoever uses the page needs a message on the page.

# --screen-- typein

## --prompt--

The `complaints` array has been moved into `complaints.json` for you, in JSON format. The page has a table and a `p` element with the id `error`.

Write an `async` function `loadComplaints`. It fetches `complaints.json` and throws `new Error(`Server replied ${response.status}`)` when `response.ok` is false. Then it reads the JSON and calls `render(data)`. Wrap the work in `try`, and in `catch` set the text of `#error` to `Couldn't load complaints. ` followed by `err.message`. Call `loadComplaints()` once.

## --seed-contents--

```html file=staff.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Staff Dashboard</title>
    <style>
      td, th { padding: 4px 12px; text-align: left; }
      .badge { padding: 2px 8px; border-radius: 8px; }
      .urgent { background: #f7d4d0; }
      .normal { background: #fbe3c8; }
      .low { background: #d3ead9; }
    </style>
    <script src="script.js" defer></script>
  </head>
  <body>
    <h1>Staff Dashboard</h1>
    <p id="error"></p>
    <table id="complaints">
      <thead>
        <tr><th>ID</th><th>Room</th><th>Category</th><th>Urgency</th><th>Status</th></tr>
      </thead>
      <tbody></tbody>
    </table>
  </body>
</html>
```

```js file=script.js
const tbody = document.querySelector("#complaints tbody");

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
    row.append(cell(c.id), cell(c.room), cell(c.category), badge(c.urgency), cell(c.status));
    tbody.append(row);
  }
}

--editable-region--

--editable-region--
```

```json file=complaints.json
[
  { "id": 482, "room": "B-214", "category": "plumbing", "urgency": "urgent", "status": "Open" },
  { "id": 483, "room": "A-110", "category": "carpentry", "urgency": "low", "status": "Resolved" },
  { "id": 484, "room": "C-305", "category": "electrical", "urgency": "normal", "status": "In Progress" }
]
```

## --tests--

Your code should define an `async` function called `loadComplaints`.

```js
assert.isFunction(loadComplaints);
assert.equal(loadComplaints.constructor.name, 'AsyncFunction');
```

After the page loads, the table should show the three complaints from `complaints.json`. Call `loadComplaints()` once.

```js
await new Promise((resolve) => setTimeout(resolve, 50));
assert.lengthOf(document.querySelectorAll('#complaints tbody tr'), 3);
```

Each row should show one complaint from the file. The first row should read 482, B-214, plumbing, urgent, Open.

```js
await new Promise((resolve) => setTimeout(resolve, 50));
const cells = [...document.querySelector('#complaints tbody tr').children].map((td) => td.textContent.trim());
assert.deepEqual(cells, ['482', 'B-214', 'plumbing', 'urgent', 'Open']);
```

When the file loads, the `#error` paragraph should stay empty.

```js
await new Promise((resolve) => setTimeout(resolve, 50));
assert.equal(document.querySelector('#error').textContent.trim(), '');
```

When the server replies 404, `#error` should say `Couldn't load complaints. Server replied 404`. Check `response.ok` before you read the JSON.

```js
const real = window.fetch;
window.fetch = () => Promise.resolve(new Response('Not found', { status: 404 }));
try { await loadComplaints(); } finally { window.fetch = real; }
assert.equal(document.querySelector('#error').textContent.trim(), "Couldn't load complaints. Server replied 404");
```

When `fetch` itself fails, `#error` should say `Couldn't load complaints. ` followed by the error's message. Use `err.message`.

```js
const real = window.fetch;
window.fetch = () => Promise.reject(new TypeError('Failed to fetch'));
try { await loadComplaints(); } finally { window.fetch = real; }
assert.equal(document.querySelector('#error').textContent.trim(), "Couldn't load complaints. Failed to fetch");
```

## --solutions--

```html file=staff.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Staff Dashboard</title>
    <style>
      td, th { padding: 4px 12px; text-align: left; }
      .badge { padding: 2px 8px; border-radius: 8px; }
      .urgent { background: #f7d4d0; }
      .normal { background: #fbe3c8; }
      .low { background: #d3ead9; }
    </style>
    <script src="script.js" defer></script>
  </head>
  <body>
    <h1>Staff Dashboard</h1>
    <p id="error"></p>
    <table id="complaints">
      <thead>
        <tr><th>ID</th><th>Room</th><th>Category</th><th>Urgency</th><th>Status</th></tr>
      </thead>
      <tbody></tbody>
    </table>
  </body>
</html>
```

```js file=script.js
const tbody = document.querySelector("#complaints tbody");

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
    row.append(cell(c.id), cell(c.room), cell(c.category), badge(c.urgency), cell(c.status));
    tbody.append(row);
  }
}

async function loadComplaints() {
  try {
    const response = await fetch("complaints.json");
    if (!response.ok) {
      throw new Error(`Server replied ${response.status}`);
    }
    const data = await response.json();
    render(data);
  } catch (err) {
    document.querySelector("#error").textContent = "Couldn't load complaints. " + err.message;
  }
}

loadComplaints();
```

```json file=complaints.json
[
  { "id": 482, "room": "B-214", "category": "plumbing", "urgency": "urgent", "status": "Open" },
  { "id": 483, "room": "A-110", "category": "carpentry", "urgency": "low", "status": "Resolved" },
  { "id": 484, "room": "C-305", "category": "electrical", "urgency": "normal", "status": "In Progress" }
]
```

## --why--

`await` pauses the function until the reply arrives. The `ok` check turns a bad reply into an error, and `catch` shows that error on the page instead of leaving an empty table.
