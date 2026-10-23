## Linking a script and the console

JavaScript makes a page do things. It lives in its own file, linked from the `head` with a `script` element. The `defer` attribute makes the script wait until the whole page has loaded, so it can find every element on the page. The IHMS keeps its scripts in a `js` folder.

The **console** is where a page prints messages and errors. Open it with F12 in your own browser. In this course it sits under each Try it.

::: tryit web
```html file=index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>IHMS</title>
    <script src="script.js" defer></script>
  </head>
  <body>
    <h1>Staff Dashboard</h1>
  </body>
</html>
```

```js file=script.js
console.log("Hello from the Staff Dashboard");
console.log("Room", "B-214");
```
:::

## Variables, types and template literals

A **variable** is a name for a value. Use `const` for a value that will not change and `let` for one that will.

| Type | Example |
|---|---|
| String (text) | `"plumbing"` |
| Number | `24`, `0.5` |
| Boolean | `true`, `false` |

Quotes decide the type: `24` is a number and `"24"` is a string. A **template literal** uses backticks and puts values into text with `${...}`. The brackets can hold a calculation.

::: tryit web
```js file=script.js
const room = "B-214";
let status = "Open";
status = "Assigned";

const hours = 24;
console.log(`Room ${room} is ${status}`);
console.log(`Urgent complaints must be fixed within ${hours} hours`);
console.log(`That's ${hours * 60} minutes`);
console.log(typeof "24", typeof 24);
```
:::

## Decisions

An `if` runs code only when its condition is true. `else if` checks the next condition, and `else` runs when nothing above it matched.

| Operator | Means |
|---|---|
| `===` | Is equal to. Capital letters count |
| `<` `>` `<=` `>=` | Compares sizes |
| `&&` | And: both sides must be true |
| `\|\|` | Or: one side is enough |
| `!` | Not: flips true to false |

::: tryit web
```js file=script.js
const urgency = "urgent";

if (urgency === "urgent") {
  console.log("Deadline: 24 hours");
} else if (urgency === "normal") {
  console.log("Deadline: 72 hours");
} else {
  console.log("Deadline: 7 days");
}

console.log(24 >= 24);
console.log(urgency === "urgent" && urgency === "low");
console.log(urgency === "urgent" || urgency === "low");
```
:::

## Arrays and loops

An **array** holds a list of values in order. Counting starts at 0, so the first item has index 0. `.length` is the number of items, and `.push(item)` adds one at the end. A `for ... of` loop runs its block once for each item.

::: tryit web
```js file=script.js
const urgencies = ["urgent", "low", "urgent", "normal"];
console.log(urgencies[0]);
console.log(urgencies.length);

urgencies.push("low");

let urgentCount = 0;
for (const u of urgencies) {
  if (u === "urgent") {
    urgentCount = urgentCount + 1;
  }
}
console.log(urgentCount);
```
:::

## Functions and objects

A **function** packages code you can reuse. It takes **parameters** and can **return** a value. A function with no `return` gives back `undefined`.

An **object** groups related values under names, and a dot reads one: `complaint.room`. A list of records is an **array of objects**. Three array methods take a small arrow function:

| Method | Returns | Example |
|---|---|---|
| `filter` | A new array of the items that pass the test | `complaints.filter(c => c.status !== "Resolved")` |
| `map` | A new array with every item changed | `complaints.map(c => c.room)` |
| `find` | The first item that passes the test | `complaints.find(c => c.id === 483)` |

::: tryit web
```js file=script.js
function deadlineHours(urgency) {
  if (urgency === "urgent") return 24;
  if (urgency === "normal") return 72;
  return 168;
}

const complaints = [
  { id: 482, room: "B-214", category: "plumbing", urgency: "urgent", status: "Open" },
  { id: 483, room: "A-110", category: "carpentry", urgency: "low", status: "Resolved" },
  { id: 484, room: "C-305", category: "electrical", urgency: "normal", status: "In Progress" },
];

console.log(complaints[1].room);
console.log(complaints.filter(c => c.status !== "Resolved").length);
console.log(complaints.map(c => deadlineHours(c.urgency)));
console.log(complaints.find(c => c.id === 483).category);
```
:::

## Changing the page

The browser turns your HTML into a tree of objects called the **DOM**. `document.querySelector` finds an element with a CSS selector. `createElement` makes a new one, `textContent` sets its text, and `append` puts it inside another element. `replaceChildren()` empties an element.

Always use `textContent` for text that came from users. It shows the text as text. If you insert user text as HTML, someone could type code into a complaint and it would run on the warden's page.

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

## Events and forms

An **event** is something the user does: a click, a change, a submit. `addEventListener` runs a function when the event happens. The `.value` of a field is the text inside it.

A form submit makes the browser reload the page. Call `event.preventDefault()` in the listener to stop that.

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
    <label for="status-filter">Status</label>
    <select id="status-filter">
      <option value="all">All</option>
      <option>Open</option>
      <option>Assigned</option>
      <option>In Progress</option>
      <option>Resolved</option>
    </select>
    <p id="shown"></p>

    <form id="complaint-form">
      <label for="description">What's wrong?</label>
      <textarea id="description" rows="3"></textarea>
      <button type="submit">Submit complaint</button>
    </form>
  </body>
</html>
```

```js file=script.js
const complaints = [
  { id: 482, status: "Open" },
  { id: 483, status: "Resolved" },
  { id: 484, status: "In Progress" },
];

const filter = document.querySelector("#status-filter");
const shown = document.querySelector("#shown");

filter.addEventListener("change", () => {
  const value = filter.value;
  const list = value === "all" ? complaints : complaints.filter(c => c.status === value);
  shown.textContent = `${list.length} complaint(s) shown`;
});

const form = document.querySelector("#complaint-form");
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const description = document.querySelector("#description").value;
  console.log("Would send:", description);
});
```
:::

## Dates and deadlines

A `Date` holds a moment in time. Give it an ISO date string, like the ones the server sends. Subtracting two dates gives **milliseconds**, and dividing by `1000 * 60 * 60` gives hours. `condition ? a : b` is a short `if`/`else`.

Each complaint has a deadline length **d**: 24 hours for urgent, 72 hours for normal and 7 days (168 hours) for low. **t** is the hours since it was submitted. The escalation level **L** is 0 if t < d, 1 if d ≤ t < 2d, and 2 if t ≥ 2d.

::: tryit web
```js file=script.js
const deadline = new Date("2026-10-08T10:00:00+01:00");
const now = new Date("2026-10-08T07:00:00+01:00");
const hoursLeft = (deadline - now) / (1000 * 60 * 60);

const label = hoursLeft >= 0
  ? `Due in ${Math.round(hoursLeft)} h`
  : `Overdue by ${Math.round(-hoursLeft)} h`;
console.log(label);

function escalationLevel(t, d) {
  if (t < d) return 0;
  if (t < 2 * d) return 1;
  return 2;
}

console.log(escalationLevel(12, 24));
console.log(escalationLevel(24, 24));
console.log(escalationLevel(48, 24));
```
:::

## Getting data with fetch

`fetch` asks a file or a server for data. It takes time, so the code waits with `await`, inside a function marked `async`.

| Part | Meaning |
|---|---|
| `async function` | A function that can wait for slow things |
| `await` | Wait here until the result arrives |
| `response.ok` | `true` for status 200 to 299 |
| `response.json()` | Read the reply as JSON, and `await` it too |
| `try { } catch (err) { }` | If anything in `try` fails, run `catch` |

A missing file still gets a reply, with status 404 and `ok` false. Turn that into an error with `throw new Error(...)`, and show the message on the page. JSON looks like JavaScript, with double quotes on every key and string.

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
    <ul id="rooms"></ul>
  </body>
</html>
```

```js file=script.js
async function loadComplaints() {
  try {
    const response = await fetch("complaints.json");
    if (!response.ok) {
      throw new Error(`Server replied ${response.status}`);
    }
    const data = await response.json();
    for (const c of data) {
      const item = document.createElement("li");
      item.textContent = `${c.room}: ${c.category}`;
      document.querySelector("#rooms").append(item);
    }
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

### Remember

- Link a script with `<script src="js/staff.js" defer></script>`. `defer` makes it wait for the page.
- `const` for a value that will not change, `let` for one that will. Quotes make a string.
- Compare with `===`. A single `=` gives a value to a variable.
- Array counting starts at 0. `.length` is how many items there are.
- `filter` and `map` give back a new array. `find` gives back one item. A function needs `return` to give anything back.
- Use `textContent` for text a user typed. Never insert it as HTML.
- A script can only find elements that already exist, so link it with `defer`.
- `event.preventDefault()` stops a form submit from reloading the page.
- Subtracting two dates gives milliseconds. A negative number of hours left means the deadline has passed.
- `await` waits for a result and works only inside an `async` function. Both `fetch` and `response.json()` need one.
- A bad reply is still a reply: check `response.ok`. Show failures on the page, not only in the console.
