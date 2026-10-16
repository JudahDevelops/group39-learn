# --description--

Style the Staff Dashboard, like the example. Hall wardens and maintenance officers use this page to read the complaints for their unit or hostel. The page, `staff.html`, is already written, and its stylesheet, `css/style.css`, is empty. Build the stylesheet the way you built the one for the Student Portal.

Use the user stories as your checklist: when every test passes, the lab is done. The palette and the sizes are given. You choose how to write each rule. Some stories also ask you to change `staff.html`.

# --user-stories--

1. Your `staff.html` has a `link` element in the `head` that connects `css/style.css`.
2. Your `:root` rule defines the six palette variables: `--primary` as `#1f5c99`, `--text` as `#1a1a1a`, `--muted` as `#5b6b80`, `--urgent` as `#b42318`, `--normal` as `#b45309` and `--low` as `#2e7d4f`.
3. Every element counts its padding and border in its width. Your `body` has the font `system-ui, sans-serif`, the colour `var(--text)` and no margin. Your `h1` has the colour `var(--primary)`, no margin and a padding of `1rem`.
4. Your `nav` is a bar: a flex row with a `gap` of `1rem` that wraps, a `padding` of `1rem` and the background `var(--primary)`. Its links are white with no underline.
5. Your `main` has a `max-width` of `40rem`, a `padding` of `1rem` and equal left and right margins that centre it. Your `footer` has the text colour `var(--muted)` and a `padding` of `1rem`.
6. Your `label` and `select` are inside a `div` with the class `filter`. The `.filter` is a flex row with its items centred across the row, a `gap` of at least `0.5rem` and a `margin` of `1rem 0`. Your `select` has a `padding` of at least `0.5rem`.
7. Your table fills the width of the `main`, and its cells share one border, with `border-collapse` set to `collapse`. Every `th` and `td` has a `padding` of at least `0.5rem` and left-aligned text. The `th` cells have the background `var(--primary)` and white text.
8. Every cell in the Urgency column holds a `span` with the class `badge` and a second class that matches its word: `urgent`, `normal` or `low`.
9. Your `.badge` is a rounded label: `inline-block`, with a `padding` of `0.1rem 0.6rem`, a `border-radius` of `999px`, a `font-size` of `0.8rem` and white text. Its background is `var(--urgent)`, `var(--normal)` or `var(--low)`, to match its second class.
10. One row in the `tbody` has the class `overdue`, and its background is `#fdecea`.
11. Your table is inside a `div` with the class `table-wrap`. On a phone, the table scrolls sideways inside this box and the page stays still.
12. On a screen 600px wide or less, your `nav` stacks its links in a column.

# --hints--

Your `head` element should have a `link` element.

```js
assert.match(code, /<head[\s>][\s\S]*<link[\s>][\s\S]*<\/head\s*>/i);
```

Your `link` element should have the attributes `rel="stylesheet"` and `href="css/style.css"`. Check the spelling of both values.

```js
assert.match(code, /<link\s[^>]*rel\s*=\s*("|')stylesheet\1[^>]*>/i);
assert.match(code, /<link\s[^>]*href\s*=\s*("|')(?:\.\/)?css\/style\.css\1[^>]*>/i);
```

Your `:root` rule should have a `--primary` variable set to `#1f5c99`.

```js
const v = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim().toLowerCase();
assert.equal(v, '#1f5c99');
```

Your `:root` rule should have a `--text` variable set to `#1a1a1a`.

```js
const v = getComputedStyle(document.documentElement).getPropertyValue('--text').trim().toLowerCase();
assert.equal(v, '#1a1a1a');
```

Your `:root` rule should have a `--muted` variable set to `#5b6b80`.

```js
const v = getComputedStyle(document.documentElement).getPropertyValue('--muted').trim().toLowerCase();
assert.equal(v, '#5b6b80');
```

Your `:root` rule should have an `--urgent` variable set to `#b42318`.

```js
const v = getComputedStyle(document.documentElement).getPropertyValue('--urgent').trim().toLowerCase();
assert.equal(v, '#b42318');
```

Your `:root` rule should have a `--normal` variable set to `#b45309`.

```js
const v = getComputedStyle(document.documentElement).getPropertyValue('--normal').trim().toLowerCase();
assert.equal(v, '#b45309');
```

Your `:root` rule should have a `--low` variable set to `#2e7d4f`.

```js
const v = getComputedStyle(document.documentElement).getPropertyValue('--low').trim().toLowerCase();
assert.equal(v, '#2e7d4f');
```

Every element on your page should have a `box-sizing` of `border-box`. Use a rule with the `*` selector.

```js
[document.body, ...document.body.querySelectorAll('*')].forEach((el) => assert.equal(getComputedStyle(el).boxSizing, 'border-box'));
```

Your `body` should have a `font-family` of `system-ui, sans-serif`.

```js
const family = getComputedStyle(document.body).fontFamily;
assert.include(family, 'system-ui');
assert.include(family, 'sans-serif');
```

Your `body` should have a `color` of `#1a1a1a`.

```js
assert.equal(getComputedStyle(document.body).color, 'rgb(26, 26, 26)');
```

Your `body` should have a `margin` of `0` on all four sides.

```js
const cs = getComputedStyle(document.body);
['Top', 'Right', 'Bottom', 'Left'].forEach((side) => assert.equal(cs['margin' + side], '0px'));
```

Your `h1` should have a `color` of `#1f5c99`.

```js
assert.equal(getComputedStyle(document.querySelector('h1')).color, 'rgb(31, 92, 153)');
```

Your `h1` should have a `margin` of `0` and a `padding` of `1rem` on all four sides.

```js
const cs = getComputedStyle(document.querySelector('h1'));
['Top', 'Right', 'Bottom', 'Left'].forEach((side) => {
  assert.equal(cs['margin' + side], '0px');
  assert.equal(cs['padding' + side], '16px');
});
```

Your `nav` should have a `display` of `flex`.

```js
assert.equal(getComputedStyle(document.querySelector('nav')).display, 'flex');
```

Your `nav` should have a `gap` of `1rem`.

```js
assert.equal(getComputedStyle(document.querySelector('nav')).columnGap, '16px');
```

Your `nav` should have a `flex-wrap` of `wrap`.

```js
assert.equal(getComputedStyle(document.querySelector('nav')).flexWrap, 'wrap');
```

Your `nav` should have a `padding` of `1rem` on all four sides.

```js
const cs = getComputedStyle(document.querySelector('nav'));
['Top', 'Right', 'Bottom', 'Left'].forEach((side) => assert.equal(cs['padding' + side], '16px'));
```

Your `nav` should have a `background-color` of `#1f5c99`. Use the variable: `var(--primary)`.

```js
assert.equal(getComputedStyle(document.querySelector('nav')).backgroundColor, 'rgb(31, 92, 153)');
```

Your links in the `nav` should have a `color` of `white`.

```js
const links = document.querySelectorAll('nav a');
assert.lengthOf(links, 4);
links.forEach((a) => assert.equal(getComputedStyle(a).color, 'rgb(255, 255, 255)'));
```

Your links in the `nav` should have no underline. Set `text-decoration` to `none`.

```js
document.querySelectorAll('nav a').forEach((a) => assert.equal(getComputedStyle(a).textDecorationLine, 'none'));
```

Your four links should sit in one row.

```js
const tops = [...document.querySelectorAll('nav a')].map((a) => Math.round(a.getBoundingClientRect().top));
assert.lengthOf(tops, 4);
assert.equal(new Set(tops).size, 1);
```

Your `main` should have a `max-width` of `40rem`.

```js
assert.equal(getComputedStyle(document.querySelector('main')).maxWidth, '640px');
```

Your `main` should be centred. Its left and right margins should be equal, and bigger than zero on a wide screen.

```js
const cs = getComputedStyle(document.querySelector('main'));
assert.isAbove(parseFloat(cs.marginLeft), 0);
assert.equal(cs.marginLeft, cs.marginRight);
```

Your `main` should have a `padding` of `1rem` on all four sides.

```js
const cs = getComputedStyle(document.querySelector('main'));
['Top', 'Right', 'Bottom', 'Left'].forEach((side) => assert.equal(cs['padding' + side], '16px'));
```

Your `footer` should have a `color` of `#5b6b80`. Use the variable: `var(--muted)`.

```js
assert.equal(getComputedStyle(document.querySelector('footer')).color, 'rgb(91, 107, 128)');
```

Your `footer` should have a `padding` of `1rem` on all four sides.

```js
const cs = getComputedStyle(document.querySelector('footer'));
['Top', 'Right', 'Bottom', 'Left'].forEach((side) => assert.equal(cs['padding' + side], '16px'));
```

Your `label` and `select` should be inside a `div` with the class `filter`, and the `div` should be inside the `main`.

```js
assert.exists(document.querySelector('main > div.filter > label[for="status-filter"]'));
assert.exists(document.querySelector('main > div.filter > select#status-filter'));
```

Your `.filter` should have a `display` of `flex`.

```js
assert.equal(getComputedStyle(document.querySelector('.filter')).display, 'flex');
```

Your `.filter` should line its items up across the row. Set `align-items` to `center`.

```js
assert.equal(getComputedStyle(document.querySelector('.filter')).alignItems, 'center');
```

Your `.filter` should have a `gap` of at least `0.5rem`.

```js
assert.isAtLeast(parseFloat(getComputedStyle(document.querySelector('.filter')).columnGap), 8);
```

Your `.filter` should have `1rem` of margin above and below.

```js
const cs = getComputedStyle(document.querySelector('.filter'));
assert.equal(cs.marginTop, '16px');
assert.equal(cs.marginBottom, '16px');
```

Your `label` and `select` should sit side by side in one row, with the `label` on the left.

```js
const label = document.querySelector('.filter > label').getBoundingClientRect();
const select = document.querySelector('.filter > select').getBoundingClientRect();
assert.isAtLeast(select.left, label.right);
assert.approximately((label.top + label.bottom) / 2, (select.top + select.bottom) / 2, 2);
```

Your `select` should have a `padding` of at least `0.5rem` on all four sides.

```js
const cs = getComputedStyle(document.querySelector('#status-filter'));
['Top', 'Right', 'Bottom', 'Left'].forEach((side) => assert.isAtLeast(parseFloat(cs['padding' + side]), 8));
```

Your table should fill the width inside the `main`. Give it a `width` of `100%`.

```js
const main = document.querySelector('main');
const cs = getComputedStyle(main);
const inner = main.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
assert.approximately(document.querySelector('#complaints').getBoundingClientRect().width, inner, 1);
```

Your table should have a `border-collapse` of `collapse`, so that its cells share one border and no gaps show.

```js
assert.equal(getComputedStyle(document.querySelector('#complaints')).borderCollapse, 'collapse');
```

Your `th` and `td` cells should have a `padding` of at least `0.5rem` on all four sides.

```js
const cells = document.querySelectorAll('#complaints th, #complaints td');
assert.isAbove(cells.length, 0);
cells.forEach((cell) => {
  const cs = getComputedStyle(cell);
  ['Top', 'Right', 'Bottom', 'Left'].forEach((side) => assert.isAtLeast(parseFloat(cs['padding' + side]), 8));
});
```

Your `th` and `td` cells should have `text-align` set to `left`.

```js
document.querySelectorAll('#complaints th, #complaints td').forEach((cell) => assert.equal(getComputedStyle(cell).textAlign, 'left'));
```

Your `th` cells should have a `background-color` of `#1f5c99`. Use the variable: `var(--primary)`.

```js
const heads = document.querySelectorAll('#complaints th');
assert.lengthOf(heads, 6);
heads.forEach((th) => assert.equal(getComputedStyle(th).backgroundColor, 'rgb(31, 92, 153)'));
```

Your `th` cells should have a `color` of `white`.

```js
document.querySelectorAll('#complaints th').forEach((th) => assert.equal(getComputedStyle(th).color, 'rgb(255, 255, 255)'));
```

Every cell in the Urgency column should hold a `span` with the class `badge`.

```js
const rows = document.querySelectorAll('#complaints tbody tr');
assert.isAtLeast(rows.length, 3);
rows.forEach((tr) => assert.exists(tr.querySelector('td:nth-child(4) > span.badge')));
```

Your badges should keep the words Urgent, Normal and Low, as the table had them.

```js
document.querySelectorAll('#complaints tbody td:nth-child(4) > span.badge').forEach((s) => {
  assert.include(['urgent', 'normal', 'low'], s.textContent.trim().toLowerCase());
});
```

Each badge should have a second class that matches its word, in lower case: `urgent`, `normal` or `low`. Check that the `class` has `badge` and the urgency, separated by a space.

```js
document.querySelectorAll('#complaints tbody td:nth-child(4) > span.badge').forEach((s) => {
  assert.isTrue(s.classList.contains(s.textContent.trim().toLowerCase()));
});
```

Your badges should have a `display` of `inline-block`.

```js
document.querySelectorAll('#complaints td > span.badge').forEach((s) => assert.equal(getComputedStyle(s).display, 'inline-block'));
```

Your badges should have `0.1rem` of padding above and below, and `0.6rem` on the left and right.

```js
document.querySelectorAll('#complaints td > span.badge').forEach((s) => {
  const cs = getComputedStyle(s);
  assert.approximately(parseFloat(cs.paddingTop), 1.6, 0.05);
  assert.approximately(parseFloat(cs.paddingBottom), 1.6, 0.05);
  assert.approximately(parseFloat(cs.paddingLeft), 9.6, 0.05);
  assert.approximately(parseFloat(cs.paddingRight), 9.6, 0.05);
});
```

Your badges should have a `border-radius` of `999px`.

```js
document.querySelectorAll('#complaints td > span.badge').forEach((s) => assert.equal(getComputedStyle(s).borderTopLeftRadius, '999px'));
```

Your badges should have a `font-size` of `0.8rem`.

```js
document.querySelectorAll('#complaints td > span.badge').forEach((s) => assert.approximately(parseFloat(getComputedStyle(s).fontSize), 12.8, 0.05));
```

Your badges should have a `color` of `white`.

```js
document.querySelectorAll('#complaints td > span.badge').forEach((s) => assert.equal(getComputedStyle(s).color, 'rgb(255, 255, 255)'));
```

Your badges should show the right colours: red for Urgent, orange for Normal and green for Low.

```js
const colours = { urgent: 'rgb(180, 35, 24)', normal: 'rgb(180, 83, 9)', low: 'rgb(46, 125, 79)' };
const badges = document.querySelectorAll('#complaints td > span.badge');
assert.isAtLeast(badges.length, 3);
badges.forEach((s) => assert.equal(getComputedStyle(s).backgroundColor, colours[s.textContent.trim().toLowerCase()]));
```

Your badge colours should use the variables: `var(--urgent)`, `var(--normal)` and `var(--low)`.

```js
const css = files['css/style.css'];
assert.match(css, /var\(\s*--urgent\s*\)/);
assert.match(css, /var\(\s*--normal\s*\)/);
assert.match(css, /var\(\s*--low\s*\)/);
```

Exactly one row in your `tbody` should have the class `overdue`.

```js
assert.lengthOf(document.querySelectorAll('#complaints tbody > tr.overdue'), 1);
```

Your overdue row should have a pale red background, `#fdecea`.

```js
assert.equal(getComputedStyle(document.querySelector('tr.overdue')).backgroundColor, 'rgb(253, 236, 234)');
```

Your `table` should be inside a `div` with the class `table-wrap`, and the `div` should be inside the `main`.

```js
assert.exists(document.querySelector('main > div.table-wrap > table#complaints'));
```

Your `.table-wrap` should have an `overflow-x` of `auto`.

```js
assert.equal(getComputedStyle(document.querySelector('.table-wrap')).overflowX, 'auto');
```

Your `css/style.css` should have a media query that starts with `@media (max-width: 600px)`.

```js
const media = [...document.styleSheets].flatMap((s) => [...s.cssRules]).filter((r) => r instanceof CSSMediaRule);
assert.isTrue(media.some((r) => /max-width:\s*600px/.test(r.media.mediaText)));
```

Your media query should have a `nav` rule that sets `flex-direction` to `column`.

```js
const media = [...document.styleSheets].flatMap((s) => [...s.cssRules]).filter((r) => r instanceof CSSMediaRule && /max-width:\s*600px/.test(r.media.mediaText));
const rule = media.flatMap((r) => [...r.cssRules]).find((c) => c.selectorText === 'nav');
assert.exists(rule);
assert.equal(rule.style.flexDirection, 'column');
```

Your `nav` should still be a row on a wide screen. Check that the `flex-direction: column` rule is inside the media query, not outside it.

```js
assert.equal(getComputedStyle(document.querySelector('nav')).flexDirection, 'row');
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
      <label for="status-filter">Show</label>
      <select id="status-filter">
        <option value="all">All complaints</option>
        <option value="Open">Open</option>
        <option value="Assigned">Assigned</option>
        <option value="In Progress">In Progress</option>
        <option value="Resolved">Resolved</option>
      </select>
      <table id="complaints">
        <thead>
          <tr>
            <th>ID</th><th>Room</th><th>Category</th><th>Urgency</th><th>Deadline</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>482</td><td>B-214</td><td>Plumbing</td><td>Urgent</td><td>24 hours</td><td>Open</td>
          </tr>
          <tr>
            <td>479</td><td>A-110</td><td>Electrical</td><td>Normal</td><td>72 hours</td><td>Assigned</td>
          </tr>
          <tr>
            <td>476</td><td>C-305</td><td>Sanitation</td><td>Normal</td><td>72 hours</td><td>In Progress</td>
          </tr>
          <tr>
            <td>470</td><td>B-107</td><td>Carpentry</td><td>Low</td><td>7 days</td><td>Resolved</td>
          </tr>
        </tbody>
      </table>
    </main>
    <footer>
      <p>Group 39 · COS 303 · Nile University of Nigeria</p>
    </footer>
  </body>
</html>
```

```css file=css/style.css

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

# --help--

## --hint--

Work from the top of the page down, as you did for the Student Portal: connect the stylesheet, write the palette, then the rules for the whole page, then each part in turn. Run the tests after each story.

## --hint--

Two kinds of story change `staff.html`: wrappers around existing elements, and classes on elements. In every case, the name in the HTML and the selector in the stylesheet must match exactly.

## --hint--

A badge needs two things: the right two classes on the `span`, and rules for elements that have both classes. A highlighted row works the same way, with a class on the `tr`. A wide table scrolls inside a wrapper that has `overflow-x` set.
