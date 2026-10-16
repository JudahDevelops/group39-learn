# --screen-- concept

**Flexbox** lines items up in a row. Put `display: flex` on the parent, and its children become flex items in a row. `gap` sets the space between them. Change `gap` and press Run.

::: tryit web
```html file=index.html
<nav>
  <a href="index.html">Home</a>
  <a href="student.html">Student Portal</a>
  <a href="staff.html">Staff Dashboard</a>
  <a href="admin.html">Admin Dashboard</a>
</nav>
```

```css file=styles.css
nav {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background-color: #1f5c99;
}

nav a {
  color: white;
  text-decoration: none;
}
```
:::

## --callout-- info

`nav a` means every link inside the `nav`. `text-decoration: none` removes the underline.

# --screen-- mcq

## --question--

Which declaration lays out the children of an element in a row?

## --options--

- [x] `display: flex`
  > Yes. `display: flex` on the parent puts its children in a row.
- [ ] `display: row`
  > No. `row` is not a value of `display`, so the browser ignores the declaration.
- [ ] `flex-direction: row`
  > No. `flex-direction` only picks the direction. It does nothing until the parent has `display: flex`.
- [ ] `justify-content: row`
  > No. `row` is not a value of `justify-content`. That property spreads items along a row that already exists.

## --why--

The parent needs `display: flex` first. The other flex properties then change how the row behaves.

# --screen-- concept

`justify-content` spreads the items along the row. `space-between` pushes the first item to the left, the last to the right, and shares the space between them. `center` bunches them in the middle. This is how a name and a price sit at opposite ends of a line.

::: tryit web
```html file=index.html
<div class="row">
  <span>Water leak in B-214</span>
  <span>Urgent</span>
</div>
```

```css file=styles.css
.row {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  border: 1px solid #5b6b80;
}
```
:::

## --callout-- tip

Change `space-between` to `center` and press Run.

# --screen-- spotbug

## --code--

```css file=styles.css
.row {
  justify-content: space-between;
}
```

## --question--

The name and the price stay together on the left. What is wrong?

## --options--

- [x] The rule is missing `display: flex`.
  > Yes. `justify-content` only works on a flex container, so without `display: flex` it does nothing.
- [ ] `space-between` needs quotation marks.
  > No. Words in CSS values are not put in quotation marks.
- [ ] `justify-content` should be `align-items`.
  > No. `align-items` works across the row, not along it, and it needs `display: flex` too.
- [ ] The rule needs a `gap`.
  > No. `gap` adds space between items. It would not push them to opposite ends.

## --why--

The flex properties only work on an element that has `display: flex`. Check the parent first.

# --screen-- concept

Flex properties you will use most:

| Property | Does |
|---|---|
| `display: flex` | Lays children out in a row |
| `flex-direction: column` | ...or in a column |
| `gap` | Space between children |
| `justify-content` | Spreads items along the row |
| `align-items` | Lines items up across the row |
| `flex-wrap: wrap` | Moves items to a new line when there is no room |

# --screen-- match

## --prompt--

Match each job to the declaration that does it.

## --pairs--

- Put space between the items
  - `gap: 1rem`
- Push the first item left and the last item right
  - `justify-content: space-between`
- Line the items up across the row
  - `align-items: center`
- Stack the items in a column
  - `flex-direction: column`
- Move items to a new line when there is no room
  - `flex-wrap: wrap`

## --why--

Each property has one job. The `display: flex` on the parent comes first, and then these change the row.

# --screen-- tapbuild

## --prompt--

Make the links in `nav` sit in a row, with space between them.

## --template--

```css
nav {
  display: ___;
  ___: 1rem;
}
```

## --tokens--

- `flex`
- `flexbox`
- `row`
- `gap`
- `spacing`
- `padding`

## --answer--

- `flex`
- `gap`

## --why--

`display: flex` makes the row, and `gap` adds space between the items. `flexbox` and `row` are not values of `display`, `spacing` is not a property, and `padding` adds space inside the `nav`, not between its links.

# --screen-- mcq

## --question--

Which property puts space between flex items?

## --options--

- [x] `gap`
  > Yes. `gap` sets the space between the items, and none at the outer edges.
- [ ] `padding`
  > No. `padding` is space inside the parent, between its edge and its items.
- [ ] `align-items`
  > No. `align-items` lines the items up across the row. It does not add space between them.

## --why--

Use `gap` for the space between items and `padding` for the space around them.

# --screen-- predict

## --code--

```css file=styles.css
.row {
  display: flex;
  flex-direction: column;
}
```

## --question--

A `.row` element holds three `span` elements. How do they appear?

## --options--

- [x] One under another
  > Yes. `flex-direction: column` stacks the flex items instead of lining them up in a row.
- [ ] Side by side in a row
  > No. A row is the default for flex. `flex-direction: column` turns it round.
- [ ] In a grid with three columns
  > No. A grid needs `display: grid`.
- [ ] Only the first one shows
  > No. All three show. Flexbox changes where items go, not whether they are there.

## --why--

`flex-direction: column` makes the items run down the page instead of across it.

# --screen-- concept

**Grid** suits a set of equal cards, such as the admin summary. This rule fits as many columns at least `12rem` wide as there is room for: three on a laptop, one on a phone.

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

```css file=styles.css
.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 1rem;
}

.card {
  padding: 1rem;
  border: 1px solid #5b6b80;
  border-radius: 8px;
}
```
:::

## --callout-- tip

Change `12rem` to `20rem` and press Run. Fewer columns fit.

# --screen-- predict

## --code--

```css file=styles.css
.summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}
```

## --question--

The `.summary` element holds three cards. How are they arranged?

## --options--

- [x] Two cards in the first row and one in the second
  > Yes. There are two columns, so the third card starts a new row.
- [ ] All three cards in one row
  > No. `repeat(2, 1fr)` makes two columns, so only two cards fit in a row.
- [ ] One card under another, in one column
  > No. There are two columns, not one.
- [ ] Two rows of two cards
  > No. That needs four cards. Three cards fill two places in the first row and one in the second.

## --why--

`repeat(2, 1fr)` means two columns of equal width. Cards fill the grid row by row.

# --screen-- mcq

## --question--

What does `repeat(auto-fit, minmax(12rem, 1fr))` do?

## --options--

- [x] It fits as many columns at least `12rem` wide as there is room for.
  > Yes. `minmax(12rem, 1fr)` sets the smallest a column can be, and `auto-fit` adds columns until there is no more room.
- [ ] It makes exactly 12 columns.
  > No. `12rem` is a width, not a count of columns.
- [ ] It makes every column exactly `12rem` wide.
  > No. `12rem` is the minimum. `1fr` lets the columns grow to share the spare space.

## --why--

The number of columns changes with the width of the screen, so no media query is needed.

# --screen-- multi

## --question--

Select every layout that flexbox does well.

## --options--

- [x] A row of navigation links
  > Yes. `display: flex` puts the links in a row, and `gap` spaces them.
- [x] A name on the left and a price on the right
  > Yes. `justify-content: space-between` pushes them to opposite ends.
- [x] A column of items with space between them
  > Yes. `flex-direction: column` with a `gap` does that.
- [ ] A set of equal cards that fills as many columns as the screen allows
  > No. That is a job for grid, with `repeat(auto-fit, minmax(12rem, 1fr))`.

## --why--

Flexbox lays items out in one line, along a row or a column. Grid lays them out in rows and columns together.

# --screen-- typein

## --prompt--

Lay out `admin.html`. The page and the style of the `.card` are given. In `styles.css`, make the `nav` a row with a `gap` of `1rem`. Then make `.summary` a grid with a `gap` of `1rem` and `grid-template-columns` set to `repeat(auto-fit, minmax(12rem, 1fr))`, so that the three cards sit side by side on a wide screen and stack on a narrow one. The numbers in the cards are placeholders.

## --seed-contents--

```html file=admin.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Admin Dashboard</title>
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <header>
      <h1>Admin Dashboard</h1>
      <nav>
        <a href="index.html">Home</a>
        <a href="student.html">Student Portal</a>
        <a href="staff.html">Staff Dashboard</a>
        <a href="admin.html">Admin Dashboard</a>
      </nav>
    </header>
    <main>
      <div class="summary">
        <div class="card">
          <h2>Occupied beds</h2>
          <p>120</p>
        </div>
        <div class="card">
          <h2>Open complaints</h2>
          <p>14</p>
        </div>
        <div class="card">
          <h2>Overdue complaints</h2>
          <p>3</p>
        </div>
      </div>
    </main>
  </body>
</html>
```

```css file=styles.css
.card {
  padding: 1rem;
  border: 1px solid #5b6b80;
  border-radius: 8px;
}

--editable-region--

--editable-region--
```

## --tests--

Your `nav` should have a `display` of `flex`.

```js
assert.equal(getComputedStyle(document.querySelector('nav')).display, 'flex');
```

Your `nav` should have a `gap` of `1rem`.

```js
assert.equal(getComputedStyle(document.querySelector('nav')).columnGap, '16px');
```

Your four links should sit in one row.

```js
const tops = [...document.querySelectorAll('nav a')].map((a) => Math.round(a.getBoundingClientRect().top));
assert.lengthOf(tops, 4);
assert.equal(new Set(tops).size, 1);
```

Your `.summary` should have a `display` of `grid`.

```js
assert.equal(getComputedStyle(document.querySelector('.summary')).display, 'grid');
```

Your `.summary` should have a `gap` of `1rem`.

```js
const cs = getComputedStyle(document.querySelector('.summary'));
assert.equal(cs.columnGap, '16px');
assert.equal(cs.rowGap, '16px');
```

Your `.summary` should set `grid-template-columns` to `repeat(auto-fit, minmax(12rem, 1fr))`. Check the spelling and the brackets.

```js
assert.match(files['styles.css'], /grid-template-columns\s*:\s*repeat\(\s*auto-fit\s*,\s*minmax\(\s*12rem\s*,\s*1fr\s*\)\s*\)/);
```

Your three cards should sit side by side on a wide screen.

```js
const boxes = [...document.querySelectorAll('.summary .card')].map((c) => c.getBoundingClientRect());
assert.lengthOf(boxes, 3);
assert.equal(new Set(boxes.map((b) => Math.round(b.top))).size, 1);
assert.equal(new Set(boxes.map((b) => Math.round(b.left))).size, 3);
```

## --solutions--

```html file=admin.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Admin Dashboard</title>
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <header>
      <h1>Admin Dashboard</h1>
      <nav>
        <a href="index.html">Home</a>
        <a href="student.html">Student Portal</a>
        <a href="staff.html">Staff Dashboard</a>
        <a href="admin.html">Admin Dashboard</a>
      </nav>
    </header>
    <main>
      <div class="summary">
        <div class="card">
          <h2>Occupied beds</h2>
          <p>120</p>
        </div>
        <div class="card">
          <h2>Open complaints</h2>
          <p>14</p>
        </div>
        <div class="card">
          <h2>Overdue complaints</h2>
          <p>3</p>
        </div>
      </div>
    </main>
  </body>
</html>
```

```css file=styles.css
.card {
  padding: 1rem;
  border: 1px solid #5b6b80;
  border-radius: 8px;
}

nav {
  display: flex;
  gap: 1rem;
}

.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 1rem;
}
```

## --why--

The `nav` is a flex row, so its links line up with a `gap`. The `.summary` is a grid, and `repeat(auto-fit, minmax(12rem, 1fr))` gives it as many columns as the screen has room for: three on a laptop, one on a phone.
