# --screen-- concept

The browser turns your HTML into a tree of objects called the **DOM**. JavaScript finds an element in that tree with `document.querySelector`, which takes a CSS selector. Setting an element's `textContent` changes the text on the page.

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
    <p id="summary">Loading complaints...</p>
  </body>
</html>
```

```js file=script.js
const summary = document.querySelector("#summary");
summary.textContent = "3 complaints, 2 unresolved";
```
:::

## --callout-- tip

Change the text in `script.js` and press Run. The page changes, and the HTML stays as it was.

# --screen-- predict

## --code--

```js file=script.js
// The page has: <p id="note">Water will be off on Friday.</p>
const note = document.querySelector("#note");
note.textContent = "Water is back on.";
console.log(note.textContent);
```

## --question--

What does the console show, and what does the paragraph on the page say afterwards?

## --options--

- [x] Both say: Water is back on.
  > Yes. Setting `textContent` changes the paragraph on the page itself, and the log reads the new text.
- [ ] The console shows the new text, but the page still says: Water will be off on Friday.
  > No. `note` points at the real paragraph, so changing its `textContent` changes the page.
- [ ] The console shows: Water will be off on Friday.
  > No. The new text is set on the line above the log, so the log already sees it.
- [ ] An error, because `note` is a `const`.
  > No. The script does not give `note` a new value. It changes a property of the element `note` points to, and that is allowed.

## --why--

A variable that holds an element is a handle on the real element. Change the element through it and the page changes.

# --screen-- spotbug

## --code--

```html file=staff.html
<head>
  <title>Staff Dashboard</title>
  <script src="script.js"></script>
</head>
<body>
  <h1>Loading...</h1>
</body>
```

## --question--

`script.js` runs `document.querySelector("h1")` and sets its `textContent`. The heading still says Loading..., and the console reports an error about `null`. What is wrong?

## --options--

- [x] The `script` element has no `defer`, so the script runs before the `h1` exists.
  > Yes. `querySelector` found nothing and returned `null`. With `defer`, the script waits until the page has loaded.
- [ ] The selector should be `.h1`.
  > No. A dot is for classes. `h1` is an element name, so it needs no prefix.
- [ ] `textContent` should be spelled `text`.
  > No. `textContent` is the right property. `text` is not a property of elements.
- [ ] The script link must go inside the `body`.
  > No. The link can stay in the `head`. Adding `defer` is what makes the script wait.

## --why--

A script can only find elements that already exist. `defer` holds the script back until the whole page has loaded.

# --screen-- concept

JavaScript can also make new elements. `createElement` makes one, `textContent` sets its text, and `append` puts it inside another element on the page.

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
    <h1>Rooms with open complaints</h1>
    <ul id="rooms"></ul>
  </body>
</html>
```

```js file=script.js
const list = document.querySelector("#rooms");

const item = document.createElement("li");
item.textContent = "Room B-214";
list.append(item);
```
:::

## --callout-- tip

Copy the three lines that make the item, change the room, and press Run. The list gets a second item.

# --screen-- tapbuild

## --prompt--

Finish the code that makes a table row with one cell in it.

## --template--

```js
const row = document.createElement("tr");
const cell = document.createElement("___");
cell.___ = "B-214";
row.append(cell);
```

## --tokens--

- `td`
- `tr`
- `cell`
- `textContent`
- `text`
- `value`

## --answer--

- `td`
- `textContent`

## --why--

A cell in a table row is a `td` element. `textContent` sets the text it shows. Setting `text` or `value` on a `td` changes nothing you can see.

# --screen-- concept

Table rows can be built from data. `cell` makes a `td` with some text. `badge` makes a `td` that holds a `span`, and `classList.add` gives the span its CSS classes. `render` clears the table body, then adds one row for each complaint.

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
const complaints = [
  { id: 482, room: "B-214", category: "plumbing", urgency: "urgent", status: "Open" },
  { id: 483, room: "A-110", category: "carpentry", urgency: "low", status: "Resolved" },
  { id: 484, room: "C-305", category: "electrical", urgency: "normal", status: "In Progress" },
];

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

render(complaints);
```
:::

## --callout-- tip

Change `render(complaints)` to `render([])` and press Run. An empty list gives an empty table.

# --screen-- predict

## --code--

```js file=script.js
const tbody = document.querySelector("#complaints tbody");
const complaints = [{ id: 482 }, { id: 483 }, { id: 484 }];

function render(list) {
  tbody.replaceChildren();
  for (const c of list) {
    const row = document.createElement("tr");
    const td = document.createElement("td");
    td.textContent = c.id;
    row.append(td);
    tbody.append(row);
  }
}

render(complaints);
render(complaints);
```

## --question--

How many rows does the table show after the last line?

## --options--

- [x] 3
  > Yes. The second call starts with `replaceChildren()`, which clears the first three rows before the loop adds three again.
- [ ] 6
  > No. `replaceChildren()` empties the table body at the start of every call, so rows from the first call do not pile up.
- [ ] 0
  > No. The clearing happens at the start of `render`. The loop then adds a row for every complaint.
- [ ] 1
  > No. The loop adds one row for each complaint in the list, and the list has three.

## --why--

`render` first clears the old rows and then draws the list it was given. That is why it can be called again with a different list.

# --screen-- concept

Always use `textContent` for text that came from users. It shows the text as text. If you insert user text as HTML, someone could type HTML or code into a complaint and it would run on the warden's page.

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
    <h1>Latest complaint</h1>
    <p id="latest"></p>
  </body>
</html>
```

```js file=script.js
const description = "<b>Water is pouring in</b>";
document.querySelector("#latest").textContent = description;
```
:::

## --callout-- info

The page shows the tags as plain characters. That is what you want for anything a user typed.

# --screen-- mcq

## --question--

Why use `textContent` instead of inserting HTML for a complaint description?

## --options--

- [x] So text a user typed can't run as code on someone else's page
  > Yes. With `textContent`, even a description full of tags is shown as plain text.
- [ ] It is faster
  > No. Speed is not the reason. The reason is safety.
- [ ] HTML can't show text
  > No. HTML shows text all the time. The danger is that a user's text may contain tags or code.

## --why--

A complaint is typed by a student and read by a warden. `textContent` makes sure it is only ever shown, never run.

# --screen-- concept

An **event** is something the user does: a click, a change, a submit. `addEventListener` runs a function when the event happens. Here the function runs when the drop-down changes. Choose a status to try it.

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
    <label for="status-filter">Status</label>
    <select id="status-filter">
      <option value="all">All</option>
      <option>Open</option>
      <option>Assigned</option>
      <option>In Progress</option>
      <option>Resolved</option>
    </select>
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
const complaints = [
  { id: 482, room: "B-214", category: "plumbing", urgency: "urgent", status: "Open" },
  { id: 483, room: "A-110", category: "carpentry", urgency: "low", status: "Resolved" },
  { id: 484, room: "C-305", category: "electrical", urgency: "normal", status: "In Progress" },
];

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

render(complaints);

const filter = document.querySelector("#status-filter");
filter.addEventListener("change", () => {
  const value = filter.value;
  render(value === "all" ? complaints : complaints.filter(c => c.status === value));
});
```
:::

## --callout-- info

`condition ? a : b` is a short `if`/`else`. It gives `a` when the condition is true and `b` when it is false.

# --screen-- concept

Submitting a form makes the browser reload the page. To handle the submit yourself, listen for the `submit` event and call `event.preventDefault()` to stop the reload. The `.value` of a field is the text inside it.

::: tryit web
```html file=student.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Report a Fault</title>
    <script src="script.js" defer></script>
  </head>
  <body>
    <h1>Report a Fault</h1>
    <form id="complaint-form">
      <label for="description">What's wrong?</label>
      <textarea id="description" name="description" rows="3"></textarea>
      <button type="submit">Submit complaint</button>
    </form>
  </body>
</html>
```

```js file=script.js
const form = document.querySelector("#complaint-form");
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const description = document.querySelector("#description").value;
  console.log("Would send:", description);
});
```
:::

## --callout-- tip

Type a sentence in the box, press Submit complaint, and read the console.

# --screen-- spotbug

## --code--

```js file=script.js
const form = document.querySelector("#complaint-form");
form.addEventListener("submit", (event) => {
  const description = document.querySelector("#description").value;
  console.log("Would send:", description);
});
```

## --question--

In a real browser, the message appears for a moment and then the page reloads, so it is gone. What is missing?

## --options--

- [x] A call to `event.preventDefault()`, which stops the browser reloading the page
  > Yes. A submit makes the browser load the page again unless the handler calls `event.preventDefault()`.
- [ ] A call to `form.clear()` to empty the form
  > No. Emptying the form would not stop the reload, and `form.clear()` is not a real method.
- [ ] A second listener for the `click` event
  > No. The reload comes from the submit. A click listener would not stop it.
- [ ] `defer` on the script
  > No. The listener is attached, because the message appears. The problem is what the browser does after the handler runs.

## --why--

`event.preventDefault()` stops the browser's usual reaction to the event. For a form submit, that reaction is a page reload.

# --screen-- typein

## --prompt--

Build the staff table from data. `staff.html` and the first part of `script.js` are ready: the `complaints` array, `tbody`, `filter` and the helpers `cell` and `badge`.

Write a function `render(list)` that clears the table body and adds one row for each complaint, with its id, room, category, urgency and status. Call `render(complaints)` once. Then make the drop-down work: when `filter` changes, render all the complaints if its value is `all`, or only the complaints with that status.

## --seed-contents--

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
    <label for="status-filter">Status</label>
    <select id="status-filter">
      <option value="all">All</option>
      <option>Open</option>
      <option>Assigned</option>
      <option>In Progress</option>
      <option>Resolved</option>
    </select>
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
const complaints = [
  { id: 482, room: "B-214", category: "plumbing", urgency: "urgent", status: "Open" },
  { id: 483, room: "A-110", category: "carpentry", urgency: "low", status: "Resolved" },
  { id: 484, room: "C-305", category: "electrical", urgency: "normal", status: "In Progress" },
];

const tbody = document.querySelector("#complaints tbody");
const filter = document.querySelector("#status-filter");

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

--editable-region--

--editable-region--
```

## --tests--

Your code should define a function called `render`.

```js
assert.isFunction(render);
```

After the page loads, the table should show three rows, one for each complaint. Call `render(complaints)`.

```js
assert.lengthOf(document.querySelectorAll('#complaints tbody tr'), 3);
```

Each row should have five cells: id, room, category, urgency and status, in that order. The first row should read 482, B-214, plumbing, urgent, Open.

```js
const cells = [...document.querySelector('#complaints tbody tr').children].map((td) => td.textContent.trim());
assert.deepEqual(cells, ['482', 'B-214', 'plumbing', 'urgent', 'Open']);
```

Choosing `Open` in the drop-down should show only the Open complaint, number 482.

```js
const select = document.querySelector('#status-filter');
select.value = 'Open';
select.dispatchEvent(new Event('change'));
const ids = [...document.querySelectorAll('#complaints tbody tr')].map((tr) => tr.children[0].textContent.trim());
assert.deepEqual(ids, ['482']);
```

Choosing `Resolved` should show only the Resolved complaint, number 483.

```js
const select = document.querySelector('#status-filter');
select.value = 'Resolved';
select.dispatchEvent(new Event('change'));
const ids = [...document.querySelectorAll('#complaints tbody tr')].map((tr) => tr.children[0].textContent.trim());
assert.deepEqual(ids, ['483']);
```

Choosing `Assigned` should leave the table empty, because no complaint has that status.

```js
const select = document.querySelector('#status-filter');
select.value = 'Assigned';
select.dispatchEvent(new Event('change'));
assert.lengthOf(document.querySelectorAll('#complaints tbody tr'), 0);
```

Choosing `All` again should show all three complaints. Make sure `render` clears the old rows first, so rows do not pile up.

```js
const select = document.querySelector('#status-filter');
select.value = 'Open';
select.dispatchEvent(new Event('change'));
select.value = 'all';
select.dispatchEvent(new Event('change'));
assert.lengthOf(document.querySelectorAll('#complaints tbody tr'), 3);
```

Use `textContent` to show text, not `innerHTML`.

```js
assert.notMatch(files['script.js'], /innerHTML/);
```

## --solutions--

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
    <label for="status-filter">Status</label>
    <select id="status-filter">
      <option value="all">All</option>
      <option>Open</option>
      <option>Assigned</option>
      <option>In Progress</option>
      <option>Resolved</option>
    </select>
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
const complaints = [
  { id: 482, room: "B-214", category: "plumbing", urgency: "urgent", status: "Open" },
  { id: 483, room: "A-110", category: "carpentry", urgency: "low", status: "Resolved" },
  { id: 484, room: "C-305", category: "electrical", urgency: "normal", status: "In Progress" },
];

const tbody = document.querySelector("#complaints tbody");
const filter = document.querySelector("#status-filter");

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

render(complaints);

filter.addEventListener("change", () => {
  const value = filter.value;
  render(value === "all" ? complaints : complaints.filter(c => c.status === value));
});
```

## --why--

`render` clears the table body and draws whatever list it is given. The `change` listener picks the list: all the complaints, or only those whose status matches the drop-down.

# --screen-- typein

## --prompt--

Catch the submit of the complaint form on `student.html`. Stop the page from reloading, read the text in the `#description` box, and log it with `console.log("Would send:", description)`.

## --seed-contents--

```html file=student.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Report a Fault</title>
    <script src="script.js" defer></script>
  </head>
  <body>
    <h1>Report a Fault</h1>
    <form id="complaint-form">
      <label for="description">What's wrong?</label>
      <textarea id="description" name="description" rows="4"></textarea>
      <button type="submit">Submit complaint</button>
    </form>
  </body>
</html>
```

```js file=script.js
--editable-region--

--editable-region--
```

## --tests--

Your form should listen for the `submit` event and call `event.preventDefault()`, so the page does not reload.

```js
const form = document.querySelector('#complaint-form');
const real = console.log;
console.log = () => {};
let notPrevented;
try { notPrevented = form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); } finally { console.log = real; }
assert.isFalse(notPrevented);
```

When the form is submitted, your code should log `Would send:` followed by the text in the `#description` box.

```js
const form = document.querySelector('#complaint-form');
const box = document.querySelector('#description');
const lines = [];
const real = console.log;
console.log = (...args) => lines.push(args.join(' '));
try {
  box.value = 'Water is pouring from the ceiling';
  form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
} finally { console.log = real; }
assert.include(lines, 'Would send: Water is pouring from the ceiling');
```

Your code should read the text each time the form is submitted, not once when the page loads.

```js
const form = document.querySelector('#complaint-form');
const box = document.querySelector('#description');
const lines = [];
const real = console.log;
console.log = (...args) => lines.push(args.join(' '));
try {
  box.value = 'First fault';
  form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  box.value = 'Second fault';
  form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
} finally { console.log = real; }
assert.include(lines, 'Would send: First fault');
assert.include(lines, 'Would send: Second fault');
```

## --solutions--

```html file=student.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Report a Fault</title>
    <script src="script.js" defer></script>
  </head>
  <body>
    <h1>Report a Fault</h1>
    <form id="complaint-form">
      <label for="description">What's wrong?</label>
      <textarea id="description" name="description" rows="4"></textarea>
      <button type="submit">Submit complaint</button>
    </form>
  </body>
</html>
```

```js file=script.js
const form = document.querySelector("#complaint-form");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const description = document.querySelector("#description").value;
  console.log("Would send:", description);
});
```

## --why--

The `submit` listener runs when the form is sent. `event.preventDefault()` stops the reload, and `.value` reads whatever the student typed at that moment.
