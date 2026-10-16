# --screen-- concept

A **media query** applies its rules only when its condition is true. `@media (max-width: 600px)` means a screen 600px wide or less. Change `600px` to `3000px` and press Run. Every screen is narrower than that, so the rule applies.

::: tryit web
```html file=index.html
<nav>
  <a href="index.html">Home</a>
  <a href="student.html">Student Portal</a>
  <a href="staff.html">Staff Dashboard</a>
</nav>
```

```css file=styles.css
nav {
  display: flex;
  gap: 1rem;
}

@media (max-width: 600px) {
  nav {
    flex-direction: column;
  }
}
```
:::

## --callout-- info

The `meta` viewport line in the `head` makes a phone use its real screen width. Keep it on every page.

# --screen-- mcq

## --question--

When does a rule inside `@media (max-width: 600px)` apply?

## --options--

- [x] When the screen is 600px wide or less
  > Yes. `max-width` is the widest screen the rule applies to.
- [ ] Always
  > No. A media query exists so that its rules apply only when the condition is true.
- [ ] Only when printing
  > No. Printing needs a different condition. This one is about the width of the screen.
- [ ] Only when the screen is exactly 600px wide
  > No. `max-width` means 600px or narrower, not exactly 600px.

## --why--

The condition in brackets must be true for the rules inside to apply. Here it is true on any screen 600px wide or less.

# --screen-- predict

## --code--

```css file=styles.css
nav {
  display: flex;
  gap: 1rem;
}

@media (max-width: 600px) {
  nav {
    flex-direction: column;
  }
}
```

## --question--

A student opens the page on a phone that is 375px wide. How are the nav links laid out?

## --options--

- [x] One under another, in a column
  > Yes. 375px is less than 600px, so the media query applies and `flex-direction: column` stacks the links.
- [ ] Side by side, in a row
  > No. That is the layout on screens wider than 600px. A 375px phone is narrower, so the query applies.
- [ ] They are hidden
  > No. Nothing in the rule hides the links. It only changes their direction.
- [ ] In a row, because the query only works on laptops
  > No. A media query reacts to the width of the screen, whatever device it is.

## --why--

On a screen 600px wide or less, the rule inside the media query is added to the rules outside it.

# --screen-- concept

A wide table can push the whole page sideways on a phone. Wrap the table in a `div` and set `overflow-x: auto` on the `div`. The table then scrolls inside its box and the page stays still.

::: tryit web
```html file=index.html
<div class="table-wrap">
  <table>
    <thead>
      <tr><th>ID</th><th>Room</th><th>Category</th><th>Urgency</th><th>Deadline</th><th>Status</th></tr>
    </thead>
    <tbody>
      <tr><td>482</td><td>B-214</td><td>Plumbing</td><td>Urgent</td><td>24 hours</td><td>Open</td></tr>
    </tbody>
  </table>
</div>
```

```css file=styles.css
.table-wrap {
  max-width: 16rem;
  overflow-x: auto;
}
```
:::

## --callout-- info

The box is made narrow here so that you can see the scroll. Drag the table sideways in the preview.

# --screen-- concept

A **badge** is a small coloured label. A `span` is a plain piece of text inside a line, so it suits a badge. `.badge` gives every badge its shape, and `.urgent` adds a colour. `.badge.urgent` matches elements that have both classes.

::: tryit web
```html file=index.html
<span class="badge urgent">Urgent</span>
<span class="badge normal">Normal</span>
<span class="badge low">Low</span>
```

```css file=styles.css
:root {
  --urgent: #b42318;
  --normal: #b45309;
  --low: #2e7d4f;
}

.badge {
  display: inline-block;
  padding: 0.1rem 0.6rem;
  border-radius: 999px;
  color: white;
  font-size: 0.8rem;
}

.badge.urgent { background: var(--urgent); }
.badge.normal { background: var(--normal); }
.badge.low    { background: var(--low); }
```
:::

## --callout-- info

`display: inline-block` lets the badge sit in a line of text and still keep its padding.

# --screen-- tapbuild

## --prompt--

Make the background red only for elements that have both the class `badge` and the class `urgent`.

## --template--

```css
___ {
  background: var(--urgent);
}
```

## --tokens--

- `.badge.urgent`
- `.badge .urgent`
- `.badge, .urgent`
- `#badge.urgent`
- `badge.urgent`

## --answer--

- `.badge.urgent`

## --why--

Two classes joined with no space match an element that has both. A space means "inside", so `.badge .urgent` looks for an `urgent` element inside a `badge`. A comma means "or", and a `#` is an id.

# --screen-- mcq

## --question--

Which element does `.badge.urgent` match?

## --options--

- [x] `<span class="badge urgent">`
  > Yes. The element has both classes.
- [ ] `<span class="badge"><span class="urgent">`
  > No. The two classes are on different elements: the outer one has `badge` and the inner one has `urgent`.
- [ ] `<span class="urgent">`
  > No. It has only one of the two classes, and the selector needs both.
- [ ] `<span id="badge" class="urgent">`
  > No. `badge` is an id here, not a class, and the selector `.badge` looks for a class.

## --why--

`.badge.urgent` matches one element that carries both class names.

# --screen-- multi

## --question--

A rule has the selector `tr.overdue`. Select every element it matches.

## --options--

- [x] `<tr class="overdue">`
  > Yes. It is a `tr` and it has the class `overdue`.
- [x] `<tr class="row overdue">`
  > Yes. An element can have more classes. It is a `tr` and it has `overdue`, so it matches.
- [ ] `<td class="overdue">`
  > No. The selector needs a `tr`, and this is a `td`.
- [ ] `<tr id="overdue">`
  > No. `overdue` is an id here, not a class. A class selector looks only at `class`.
- [ ] `<tr>`
  > No. A `tr` with no class does not have `overdue`.

## --why--

A name with a dot after an element name means that element with that class. Both parts must be true.

# --screen-- concept

A **state** is a moment in an element's life. `:hover` applies while the pointer is over it. `:focus` applies while a field or button is selected, such as by the keyboard. Hover over the link, click the field, then change `0.85` to `0.4` and press Run.

::: tryit web
```html file=index.html
<a href="student.html">Student Portal</a>
<button>Submit complaint</button>
<label for="room">Room</label>
<input type="text" id="room">
```

```css file=styles.css
a:hover,
button:hover {
  opacity: 0.85;
}

input:focus {
  outline: 2px solid #1f5c99;
}
```
:::

## --callout-- warning

Never remove the focus outline without replacing it. Keyboard users need it to see where they are.

# --screen-- spotbug

## --code--

```css file=styles.css
input:focus {
  outline: none;
}
```

## --question--

A keyboard user cannot tell which field they are typing in. What is wrong?

## --options--

- [x] The rule removes the focus outline and puts nothing in its place.
  > Yes. The outline is how keyboard users see where they are. If you remove it, add a new one.
- [ ] `:focus` should be `:hover`.
  > No. `:hover` is for the pointer. A keyboard user is not using a pointer.
- [ ] `outline` is not a CSS property.
  > No. `outline` is a property. Setting it to `none` is what takes the outline away.
- [ ] The rule needs a media query.
  > No. A focus outline matters on every screen size.

## --why--

`:focus` is the moment a field is selected. Give it a clear outline, and never leave it with none.

# --screen-- match

## --prompt--

Match each piece of CSS to when it applies.

## --pairs--

- `a:hover`
  - While the pointer is over a link
- `input:focus`
  - While a field is selected
- `@media (max-width: 600px)`
  - Only on a screen 600px wide or less
- `overflow-x: auto`
  - Lets a wide table scroll sideways inside its box

## --why--

States such as `:hover` and `:focus` depend on what the visitor is doing. A media query depends on the size of the screen.

# --screen-- typein

## --prompt--

Mark up the Staff Dashboard table. The styles are given. Wrap the `table` in a `div` with the class `table-wrap`. In the Urgency column, wrap each word in a `span` with the class `badge` and the class that matches it: `urgent`, `normal` or `low`. Give one row in the `tbody` the class `overdue`.

## --seed-contents--

```html file=staff.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Staff Dashboard</title>
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <h1>Staff Dashboard</h1>
--editable-region--
    <table>
      <thead>
        <tr><th>ID</th><th>Room</th><th>Category</th><th>Urgency</th><th>Deadline</th><th>Status</th></tr>
      </thead>
      <tbody>
        <tr><td>482</td><td>B-214</td><td>Plumbing</td><td>Urgent</td><td>24 hours</td><td>Open</td></tr>
        <tr><td>483</td><td>A-110</td><td>Carpentry</td><td>Low</td><td>7 days</td><td>Resolved</td></tr>
        <tr><td>484</td><td>C-305</td><td>Electrical</td><td>Normal</td><td>72 hours</td><td>In Progress</td></tr>
      </tbody>
    </table>
--editable-region--
  </body>
</html>
```

```css file=styles.css
:root {
  --primary: #1f5c99;
  --text: #1a1a1a;
  --muted: #5b6b80;
  --urgent: #b42318;
  --normal: #b45309;
  --low: #2e7d4f;
}

body {
  font-family: system-ui, sans-serif;
  color: var(--text);
}

h1 {
  color: var(--primary);
}

.table-wrap {
  overflow-x: auto;
}

.badge {
  display: inline-block;
  padding: 0.1rem 0.6rem;
  border-radius: 999px;
  color: white;
  font-size: 0.8rem;
}

.badge.urgent { background: var(--urgent); }
.badge.normal { background: var(--normal); }
.badge.low    { background: var(--low); }

tr.overdue { background: #fdecea; }
```

## --tests--

Your `table` should be inside a `div` with the class `table-wrap`.

```js
assert.exists(document.querySelector('div.table-wrap > table'));
```

Every cell in the Urgency column should hold a `span` with the class `badge`.

```js
const rows = document.querySelectorAll('tbody tr');
assert.lengthOf(rows, 3);
rows.forEach((tr) => assert.exists(tr.querySelector('td:nth-child(4) > span.badge')));
```

Your badges should keep their words, in this order: Urgent, Low and Normal.

```js
const words = [...document.querySelectorAll('tbody td:nth-child(4) > span.badge')].map((s) => s.textContent.trim());
assert.deepEqual(words, ['Urgent', 'Low', 'Normal']);
```

Each badge should have a second class that matches its word, in lower case: `urgent`, `normal` or `low`.

```js
document.querySelectorAll('tbody td:nth-child(4) > span.badge').forEach((s) => {
  assert.isTrue(s.classList.contains(s.textContent.trim().toLowerCase()));
});
```

Your badges should show the right colours: red for Urgent, orange for Normal and green for Low. Check that each `class` has `badge` and the urgency, separated by a space.

```js
const colours = { urgent: 'rgb(180, 35, 24)', normal: 'rgb(180, 83, 9)', low: 'rgb(46, 125, 79)' };
document.querySelectorAll('tbody td:nth-child(4) > span.badge').forEach((s) => {
  assert.equal(getComputedStyle(s).backgroundColor, colours[s.textContent.trim().toLowerCase()]);
});
```

Exactly one row in your `tbody` should have the class `overdue`.

```js
assert.lengthOf(document.querySelectorAll('tbody > tr.overdue'), 1);
```

Your overdue row should have a pale red background.

```js
assert.equal(getComputedStyle(document.querySelector('tr.overdue')).backgroundColor, 'rgb(253, 236, 234)');
```

## --solutions--

```html file=staff.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Staff Dashboard</title>
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <h1>Staff Dashboard</h1>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>ID</th><th>Room</th><th>Category</th><th>Urgency</th><th>Deadline</th><th>Status</th></tr>
        </thead>
        <tbody>
          <tr class="overdue"><td>482</td><td>B-214</td><td>Plumbing</td><td><span class="badge urgent">Urgent</span></td><td>24 hours</td><td>Open</td></tr>
          <tr><td>483</td><td>A-110</td><td>Carpentry</td><td><span class="badge low">Low</span></td><td>7 days</td><td>Resolved</td></tr>
          <tr><td>484</td><td>C-305</td><td>Electrical</td><td><span class="badge normal">Normal</span></td><td>72 hours</td><td>In Progress</td></tr>
        </tbody>
      </table>
    </div>
  </body>
</html>
```

```css file=styles.css
:root {
  --primary: #1f5c99;
  --text: #1a1a1a;
  --muted: #5b6b80;
  --urgent: #b42318;
  --normal: #b45309;
  --low: #2e7d4f;
}

body {
  font-family: system-ui, sans-serif;
  color: var(--text);
}

h1 {
  color: var(--primary);
}

.table-wrap {
  overflow-x: auto;
}

.badge {
  display: inline-block;
  padding: 0.1rem 0.6rem;
  border-radius: 999px;
  color: white;
  font-size: 0.8rem;
}

.badge.urgent { background: var(--urgent); }
.badge.normal { background: var(--normal); }
.badge.low    { background: var(--low); }

tr.overdue { background: #fdecea; }
```

## --why--

The `div` with `overflow-x: auto` lets a wide table scroll inside its box. Each badge has two classes: `badge` for the shape and the urgency for the colour. The `overdue` class on a `tr` colours the whole row.
