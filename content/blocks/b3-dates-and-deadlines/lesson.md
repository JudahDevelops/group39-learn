# --screen-- concept

A `Date` holds a moment in time. Give it an ISO date string, like the ones the server sends. Subtracting one date from another gives the difference in **milliseconds**.

::: tryit web
```js file=script.js
const created = new Date("2026-10-05T09:00:00+01:00");
const deadline = new Date("2026-10-06T09:00:00+01:00");
console.log(deadline - created);
```
:::

## --callout-- info

Read `2026-10-05T09:00:00+01:00` as the date, a `T`, the time, and `+01:00`, which is the offset of Nigerian time.

# --screen-- predict

## --code--

```js file=script.js
const created = new Date("2026-10-05T09:00:00+01:00");
const deadline = new Date("2026-10-06T09:00:00+01:00");
console.log((deadline - created) / (1000 * 60 * 60));
```

## --question--

What does the console show?

## --options--

- [x] 24
  > Yes. The two dates are one day apart. Dividing the milliseconds by `1000 * 60 * 60` gives hours, and a day has 24.
- [ ] 86400000
  > No. That is the difference in milliseconds before the division. The division turns it into hours.
- [ ] 1
  > No. The code divides by the number of milliseconds in an hour, so the answer is in hours, not days.
- [ ] 86400
  > No. That would be seconds. Dividing by `1000 * 60 * 60` gives hours.

## --why--

A second is 1000 milliseconds, a minute is 60 seconds and an hour is 60 minutes. Divide by all three to turn milliseconds into hours.

# --screen-- mcq

## --question--

What do you get when you subtract one `Date` from another?

## --options--

- [x] The difference in milliseconds
  > Yes. The result is a plain number of milliseconds.
- [ ] A new date
  > No. Subtracting dates gives a number, not another date.
- [ ] A string
  > No. The result is a number, so you can divide it to get hours.

## --why--

A number is easy to work with. Divide it to get hours, or compare it with 0 to see which date is later.

# --screen-- concept

To show a countdown, work out the hours left. `condition ? a : b` is a short `if`/`else`: it gives `a` when the condition is true and `b` when it is false. A negative number of hours means the deadline has passed.

::: tryit web
```js file=script.js
const deadline = new Date("2026-10-08T10:00:00+01:00");
const now = new Date("2026-10-08T07:00:00+01:00");
const msLeft = deadline - now;
const hoursLeft = msLeft / (1000 * 60 * 60);

const label = hoursLeft >= 0
  ? `Due in ${Math.round(hoursLeft)} h`
  : `Overdue by ${Math.round(-hoursLeft)} h`;

console.log(label);
```
:::

## --callout-- tip

Change `now` to `2026-10-08T13:00:00+01:00` and press Run. In a real page, write `new Date()` for `now`: it is the moment the code runs.

# --screen-- predict

## --code--

```js file=script.js
const x = 5;
console.log(x > 0 ? "yes" : "no");
```

## --question--

What does the console show?

## --options--

- [x] yes
  > Yes. 5 is greater than 0, so the condition is true and the part after `?` is used.
- [ ] no
  > No. The part after `:` is used only when the condition is false.
- [ ] true
  > No. The condition picks one of the two texts. It does not print true or false.
- [ ] x > 0
  > No. The condition is worked out, not printed as written.

## --why--

Read it as a question: is `x > 0`? If yes, use the first value. If no, use the second.

# --screen-- tapbuild

## --prompt--

Finish the label. A deadline that has not passed leaves `hoursLeft` at 0 or more, and one that has passed leaves it below 0.

## --template--

```js
const label = hoursLeft ___ 0
  ? `Due in ${Math.round(hoursLeft)} h`
  : `Overdue by ${Math.round(___)} h`;
```

## --tokens--

- `>=`
- `<`
- `=`
- `-hoursLeft`
- `hoursLeft`
- `0`

## --answer--

- `>=`
- `-hoursLeft`

## --why--

`hoursLeft >= 0` is true while the deadline is ahead. After it passes, `hoursLeft` is negative, so the minus sign turns it into a positive number. Otherwise the label would read "Overdue by -3 h".

# --screen-- concept

`toLocaleString` writes a date the way a place writes it. With `"en-NG"` it uses the Nigerian style, in the time zone of the device that runs the code.

::: tryit web
```js file=script.js
const deadline = new Date("2026-10-08T10:00:00+01:00");
console.log(deadline.toLocaleString("en-NG"));
console.log(deadline.toLocaleDateString("en-NG"));
```
:::

## --callout-- info

The exact text can differ a little between browsers. Do not write code that depends on it.

# --screen-- concept

Each complaint has a deadline length **d**, set by its urgency: 24 hours for urgent, 72 hours for normal, and 7 days (168 hours) for low. **t** is the hours since it was submitted. The escalation level **L** is 0 if t < d, 1 if d ≤ t < 2d, and 2 if t ≥ 2d.

::: tryit web
```js file=script.js
function deadlineHours(urgency) {
  if (urgency === "urgent") return 24;
  if (urgency === "normal") return 72;
  return 168;
}

function escalationLevel(t, d) {
  if (t < d) return 0;
  if (t < 2 * d) return 1;
  return 2;
}

const created = new Date("2026-10-05T09:00:00+01:00");
const checkedAt = new Date("2026-10-06T10:00:00+01:00");
const t = (checkedAt - created) / (1000 * 60 * 60);

console.log(t);
console.log(escalationLevel(t, deadlineHours("urgent")));
```
:::

## --callout-- info

Level 1 emails the hall warden. Level 2 emails Student Affairs.

# --screen-- match

## --prompt--

Match each urgency to the length of its deadline.

## --pairs--

- `"urgent"`
  - 24 hours
- `"normal"`
  - 72 hours
- `"low"`
  - 168 hours, which is 7 days

## --why--

An urgent complaint has one day, a normal one has three days, and a low one has a week.

# --screen-- predict

## --code--

```js file=script.js
function escalationLevel(t, d) {
  if (t < d) return 0;
  if (t < 2 * d) return 1;
  return 2;
}

console.log(escalationLevel(48, 24));
```

## --question--

What does the console show?

## --options--

- [x] 2
  > Yes. Here d is 24, so 2d is 48. The second `if` needs t below 48, and 48 is not below 48, so the function returns 2.
- [ ] 1
  > No. Level 1 lasts only while t is below 2d, and 48 is not below 48.
- [ ] 0
  > No. Level 0 is only for t below d, and 48 is not below 24.
- [ ] undefined
  > No. The last line returns 2, so a value always comes back.

## --why--

A complaint reaches level 2 at exactly 2d. The boundaries belong to the higher level.

# --screen-- spotbug

## --code--

```js file=script.js
function escalationLevel(t, d) {
  if (t <= d) return 0;
  if (t < 2 * d) return 1;
  return 2;
}

console.log(escalationLevel(24, 24));
```

## --question--

An urgent complaint open for exactly 24 hours should be level 1, but the console shows 0. What is wrong?

## --options--

- [x] The first condition should be `t < d`, because level 0 is only for t less than d.
  > Yes. With `<=`, a complaint at exactly d stays at level 0. At t = d the deadline has been reached, so it is level 1.
- [ ] The second condition should be `t < 3 * d`.
  > No. Level 1 ends at 2d, so `2 * d` is correct.
- [ ] The first line should return 1.
  > No. Level 0 is right for complaints still inside their deadline.
- [ ] The function needs an `else` after each `if`.
  > No. `return` already ends the function, so the next line runs only when the `if` above did not match.

## --why--

The rule is L = 0 if t < d, and L = 1 if d ≤ t < 2d. The edge case t = d belongs to level 1.

# --screen-- typein

## --prompt--

Write `escalationLevel(t, d)`. It takes t, the hours since a complaint was submitted, and d, its deadline length in hours, and returns the level L: 0 if t < d, 1 if d ≤ t < 2d, and 2 if t ≥ 2d.

Then check it. An urgent complaint was created at `2026-10-05T09:00:00+01:00`. Work out t at `2026-10-06T10:00:00+01:00` from the two dates, and log its level, using `deadlineHours`.

## --seed-contents--

```js file=script.js
function deadlineHours(urgency) {
  if (urgency === "urgent") return 24;
  if (urgency === "normal") return 72;
  return 168;
}

--editable-region--

--editable-region--
```

## --tests--

Your code should define a function called `escalationLevel`.

```js
assert.isFunction(escalationLevel);
```

An urgent complaint open for 12 hours is still inside its 24-hour deadline. `escalationLevel(12, 24)` should return `0`.

```js
assert.strictEqual(escalationLevel(12, 24), 0);
```

At exactly the deadline the level is 1. `escalationLevel(24, 24)` should return `1`.

```js
assert.strictEqual(escalationLevel(24, 24), 1);
```

`escalationLevel(25, 24)` should return `1`.

```js
assert.strictEqual(escalationLevel(25, 24), 1);
```

`escalationLevel(96, 72)` should return `1`: a normal complaint open for 96 hours is past 72 but not yet 144.

```js
assert.strictEqual(escalationLevel(96, 72), 1);
```

At exactly twice the deadline the level is 2. `escalationLevel(144, 72)` should return `2`.

```js
assert.strictEqual(escalationLevel(144, 72), 2);
```

`escalationLevel(216, 168)` should return `1`: a low complaint open for 9 days is past 7 days but not yet 14.

```js
assert.strictEqual(escalationLevel(216, 168), 1);
```

Your code should work out t from the two dates `2026-10-05T09:00:00+01:00` and `2026-10-06T10:00:00+01:00`, using `new Date(...)`.

```js
const src = files['script.js'];
assert.match(src, /new Date\(\s*["']2026-10-05T09:00:00\+01:00["']\s*\)/);
assert.match(src, /new Date\(\s*["']2026-10-06T10:00:00\+01:00["']\s*\)/);
```

Your code should log `1`, the level of the urgent complaint at that time.

```js
const lines = [];
const real = console.log;
console.log = (...args) => lines.push(args.join(' '));
try { (0, eval)(files['script.js']); } finally { console.log = real; }
assert.include(lines, '1');
```

## --solutions--

```js file=script.js
function deadlineHours(urgency) {
  if (urgency === "urgent") return 24;
  if (urgency === "normal") return 72;
  return 168;
}

function escalationLevel(t, d) {
  if (t < d) return 0;
  if (t < 2 * d) return 1;
  return 2;
}

const created = new Date("2026-10-05T09:00:00+01:00");
const checkedAt = new Date("2026-10-06T10:00:00+01:00");
const t = (checkedAt - created) / (1000 * 60 * 60);
console.log(escalationLevel(t, deadlineHours("urgent")));
```

## --why--

The two dates are 25 hours apart. For an urgent complaint d is 24, and 24 ≤ 25 < 48, so the level is 1.

# --screen-- typein

## --prompt--

Each sample complaint now has a `deadline`, written as an ISO date string. Fill the Due column. Add one row for each complaint with its id, room, urgency and a due label: `Due in X h` while the deadline is ahead, or `Overdue by X h` once it has passed, with X rounded to a whole number. Give the row of an overdue complaint the class `overdue`. The page paints that class red.

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
      .overdue { background: #f7d4d0; }
    </style>
    <script src="script.js" defer></script>
  </head>
  <body>
    <h1>Staff Dashboard</h1>
    <table id="complaints">
      <thead>
        <tr><th>ID</th><th>Room</th><th>Urgency</th><th>Due</th></tr>
      </thead>
      <tbody></tbody>
    </table>
  </body>
</html>
```

```js file=script.js
const HOUR = 60 * 60 * 1000;

// Sample data. hoursFromNow(-5) is a moment 5 hours ago, written as an ISO string like the server sends.
function hoursFromNow(hours) {
  return new Date(Date.now() + hours * HOUR).toISOString();
}

const complaints = [
  { id: 482, room: "B-214", urgency: "urgent", deadline: hoursFromNow(-5) },
  { id: 483, room: "A-110", urgency: "low", deadline: hoursFromNow(48) },
  { id: 484, room: "C-305", urgency: "normal", deadline: hoursFromNow(10) },
];

const tbody = document.querySelector("#complaints tbody");

function cell(text) {
  const td = document.createElement("td");
  td.textContent = text;
  return td;
}

--editable-region--

--editable-region--
```

## --tests--

Your table should show three rows, one for each complaint.

```js
assert.lengthOf(document.querySelectorAll('#complaints tbody tr'), 3);
```

Each row should have four cells: id, room, urgency and Due. The first row should start with 482, B-214 and urgent.

```js
const rows = [...document.querySelectorAll('#complaints tbody tr')];
rows.forEach((tr) => assert.lengthOf(tr.children, 4));
const first = [...rows[0].children].slice(0, 3).map((td) => td.textContent.trim());
assert.deepEqual(first, ['482', 'B-214', 'urgent']);
```

Turn each `deadline` string into a date with `new Date(...)` before you subtract.

```js
assert.match(files['script.js'], /new Date\(/);
```

Complaint 482 passed its deadline 5 hours ago, so its Due cell should say `Overdue by 5 h`.

```js
const rows = document.querySelectorAll('#complaints tbody tr');
assert.equal(rows[0].children[3].textContent.trim(), 'Overdue by 5 h');
```

Complaint 483 is due in 48 hours, so its Due cell should say `Due in 48 h`.

```js
const rows = document.querySelectorAll('#complaints tbody tr');
assert.equal(rows[1].children[3].textContent.trim(), 'Due in 48 h');
```

Complaint 484 is due in 10 hours, so its Due cell should say `Due in 10 h`.

```js
const rows = document.querySelectorAll('#complaints tbody tr');
assert.equal(rows[2].children[3].textContent.trim(), 'Due in 10 h');
```

The row of the overdue complaint, 482, should have the class `overdue`.

```js
const rows = document.querySelectorAll('#complaints tbody tr');
assert.isTrue(rows[0].classList.contains('overdue'));
```

Only overdue rows should have the class `overdue`. Complaints 483 and 484 are not overdue.

```js
const rows = document.querySelectorAll('#complaints tbody tr');
assert.isFalse(rows[1].classList.contains('overdue'));
assert.isFalse(rows[2].classList.contains('overdue'));
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
      .overdue { background: #f7d4d0; }
    </style>
    <script src="script.js" defer></script>
  </head>
  <body>
    <h1>Staff Dashboard</h1>
    <table id="complaints">
      <thead>
        <tr><th>ID</th><th>Room</th><th>Urgency</th><th>Due</th></tr>
      </thead>
      <tbody></tbody>
    </table>
  </body>
</html>
```

```js file=script.js
const HOUR = 60 * 60 * 1000;

// Sample data. hoursFromNow(-5) is a moment 5 hours ago, written as an ISO string like the server sends.
function hoursFromNow(hours) {
  return new Date(Date.now() + hours * HOUR).toISOString();
}

const complaints = [
  { id: 482, room: "B-214", urgency: "urgent", deadline: hoursFromNow(-5) },
  { id: 483, room: "A-110", urgency: "low", deadline: hoursFromNow(48) },
  { id: 484, room: "C-305", urgency: "normal", deadline: hoursFromNow(10) },
];

const tbody = document.querySelector("#complaints tbody");

function cell(text) {
  const td = document.createElement("td");
  td.textContent = text;
  return td;
}

const now = new Date();

for (const c of complaints) {
  const hoursLeft = (new Date(c.deadline) - now) / (1000 * 60 * 60);
  const label = hoursLeft >= 0
    ? `Due in ${Math.round(hoursLeft)} h`
    : `Overdue by ${Math.round(-hoursLeft)} h`;

  const row = document.createElement("tr");
  row.append(cell(c.id), cell(c.room), cell(c.urgency), cell(label));
  if (hoursLeft < 0) {
    row.classList.add("overdue");
  }
  tbody.append(row);
}
```

## --why--

`new Date(c.deadline)` turns the string into a date. Subtracting `now` gives milliseconds, and dividing gives hours. A negative result means the deadline has passed, which decides both the label and the `overdue` class.
