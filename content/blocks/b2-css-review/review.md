## Linking a stylesheet

CSS says how a page looks. It lives in its own file, and every page links to it from the `head`. The IHMS keeps its styles in `css/style.css`, so all five pages use the same fonts and colours from one file.

The `link` element is one tag with no closing tag. `rel="stylesheet"` says the file is CSS, and `href` is the path to it.

::: tryit web
```html file=index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>IHMS</title>
    <link rel="stylesheet" href="css/style.css">
  </head>
  <body>
    <h1>Intelligent Hostel Management System</h1>
    <p>Apply for a bed space, report a fault, and follow it until it's fixed.</p>
  </body>
</html>
```

```css file=css/style.css
h1 {
  color: #1f5c99;
  font-size: 2rem;
}
```
:::

## Rules and selectors

A **rule** is a selector plus declarations inside curly braces. A **declaration** is a property, a colon, a value and a semicolon. Leave out a semicolon and the browser drops that declaration and the next one.

| Selector | Matches |
|---|---|
| `p` | Every `p` element |
| `.badge` | Every element with `class="badge"` |
| `#complaints` | The one element with `id="complaints"` |
| `h1, h2` | Every `h1` and every `h2` |
| `nav a` | Every link inside the `nav` |
| `.badge.urgent` | Elements that have both classes: `<span class="badge urgent">` |
| `tr.overdue` | A `tr` that has the class `overdue` |

::: tryit web
```html file=index.html
<h1 id="title">Hall Notice</h1>
<p>Water will be off on Friday.</p>
<ul>
  <li class="note">Pay at the bursary.</li>
  <li>Collect your key.</li>
</ul>
```

```css file=css/style.css
p {
  line-height: 1.5;
}

.note {
  color: #b42318;
}

#title {
  color: #1f5c99;
}
```
:::

## Variables and rem

A **variable** names a value once. Define it in `:root` with a name that starts with two hyphens, and read it with `var()`. Change the value once and every rule that uses it follows. These six colours are the IHMS palette.

| Variable | Value | Use |
|---|---|---|
| `--primary` | `#1f5c99` | Headings, the nav bar, the main colour |
| `--text` | `#1a1a1a` | Body text |
| `--muted` | `#5b6b80` | Quieter text |
| `--urgent` | `#b42318` | Urgent complaints |
| `--normal` | `#b45309` | Normal complaints |
| `--low` | `#2e7d4f` | Low-urgency complaints |

A `rem` is the browser's base text size, so `rem` sizes respect users who set larger text.

::: tryit web
```html file=index.html
<h1>Intelligent Hostel Management System</h1>
<p>Apply for a bed space, report a fault, and follow it until it's fixed.</p>
<a href="student.html">Student Portal</a>
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

body {
  font-family: system-ui, sans-serif;
  color: var(--text);
  margin: 0;
}

h1, h2 {
  color: var(--primary);
}
```
:::

## The box model

Every element is a box with four layers. From the inside out they are the content, the padding, the border and the margin.

| Layer | What it is |
|---|---|
| Content | The text or picture itself |
| Padding | Space inside the border |
| Border | The line around the padding |
| Margin | Space outside the border |

By default, `width` counts only the content. `box-sizing: border-box` makes it include the padding and the border, so a 300px box is 300px wide from border to border. The `*` selector matches every element, so one rule fixes the page. `max-width` stops a box growing wider than is comfortable to read, and still lets it shrink on a phone.

::: tryit web
```html file=index.html
<div class="card">
  <h2>Report a fault</h2>
  <p>Room B-214, plumbing, open.</p>
</div>
```

```css file=css/style.css
* {
  box-sizing: border-box;
}

.card {
  background-color: white;
  border: 1px solid #dce8f5;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  max-width: 40rem;
}
```
:::

## Flexbox and grid

**Flexbox** lines items up in a row or a column. Put `display: flex` on the parent first.

| Property | Does |
|---|---|
| `display: flex` | Lays children out in a row |
| `flex-direction: column` | Lays them out in a column |
| `gap` | Space between children |
| `justify-content` | Spreads items along the row: `space-between`, `center` |
| `align-items` | Lines items up across the row: `center` |
| `flex-wrap: wrap` | Moves items to a new line when there is no room |

::: tryit web
```html file=index.html
<nav>
  <a href="index.html">Home</a>
  <a href="student.html">Student Portal</a>
  <a href="staff.html">Staff Dashboard</a>
  <a href="admin.html">Admin Dashboard</a>
</nav>
```

```css file=css/style.css
nav {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1rem;
  background-color: #1f5c99;
}

nav a {
  color: white;
  text-decoration: none;
}
```
:::

**Grid** suits a set of equal cards, such as the admin summary. `repeat(auto-fit, minmax(12rem, 1fr))` fits as many columns at least `12rem` wide as there is room for: three on a laptop, one on a phone.

::: tryit web
```html file=index.html
<div class="summary">
  <div class="card">
    <h3>Occupied beds</h3>
    <p>120</p>
  </div>
  <div class="card">
    <h3>Open complaints</h3>
    <p>14</p>
  </div>
  <div class="card">
    <h3>Overdue complaints</h3>
    <p>3</p>
  </div>
</div>
```

```css file=css/style.css
.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 1rem;
}

.card {
  padding: 1rem;
  border: 1px solid #dce8f5;
  border-radius: 8px;
}
```
:::

## Phones

A **media query** applies its rules only when its condition is true. `@media (max-width: 600px)` means a screen 600px wide or less. The `meta` viewport line in the `head` makes a phone use its real screen width, so keep it on every page.

A wide table can push the whole page sideways. Wrap it in a `div` with `overflow-x: auto`, and the table scrolls inside its box while the page stays still.

::: tryit web
```html file=index.html
<nav>
  <a href="index.html">Home</a>
  <a href="student.html">Student Portal</a>
  <a href="staff.html">Staff Dashboard</a>
</nav>
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

```css file=css/style.css
nav {
  display: flex;
  gap: 1rem;
}

.table-wrap {
  max-width: 16rem;
  overflow-x: auto;
}

@media (max-width: 600px) {
  nav {
    flex-direction: column;
  }
}
```
:::

## Urgency badges and overdue rows

A **badge** is a small coloured label. `.badge` gives every badge its shape, and a second class adds the colour. `.badge.urgent` matches an element that has both classes. A row with the class `overdue` gets a pale red background.

::: tryit web
```html file=index.html
<table>
  <tbody>
    <tr class="overdue">
      <td>482</td><td><span class="badge urgent">Urgent</span></td><td>Open</td>
    </tr>
    <tr>
      <td>479</td><td><span class="badge normal">Normal</span></td><td>Assigned</td>
    </tr>
    <tr>
      <td>470</td><td><span class="badge low">Low</span></td><td>Resolved</td>
    </tr>
  </tbody>
</table>
```

```css file=css/style.css
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

.badge.urgent { background-color: var(--urgent); }
.badge.normal { background-color: var(--normal); }
.badge.low    { background-color: var(--low); }

tr.overdue {
  background-color: #fdecea;
}
```
:::

## States

A **state** is a moment in an element's life. `:hover` applies while the pointer is over an element. `:focus` applies while a field or button is selected, for example by the keyboard.

::: tryit web
```html file=index.html
<a href="student.html">Student Portal</a>
<button>Submit complaint</button>
<label for="description">What's wrong?</label>
<textarea id="description" rows="3"></textarea>
```

```css file=css/style.css
a:hover, button:hover {
  opacity: 0.85;
}

textarea:focus {
  outline: 2px solid #1f5c99;
}
```
:::

### Remember

- Link `css/style.css` from the `head` of every page. The `link` element has no closing tag.
- A rule is a selector plus declarations. Every declaration ends with a semicolon.
- A dot matches a class, a hash matches an id, and a comma lets one rule style several selectors.
- Put the palette in `:root` and read it with `var()`.
- Padding is inside the border and margin is outside it. `box-sizing: border-box` makes `width` include the padding and the border.
- `display: flex` goes on the parent. `gap` spaces the items, and `flex-direction: column` stacks them.
- Use grid for a set of equal cards: `repeat(auto-fit, minmax(12rem, 1fr))`.
- A media query applies its rules only when its condition is true. A wide table goes in a wrapper with `overflow-x: auto`.
- `.badge.urgent` matches an element that has both classes.
- Never remove a focus outline without replacing it.
