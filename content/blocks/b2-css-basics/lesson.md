# --screen-- concept

CSS says how a page looks. It lives in its own file, `styles.css`. The page connects to it with a `link` element in the `head`. Change a colour in `styles.css` and press Run.

::: tryit web
```html file=index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>IHMS</title>
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <h1>Intelligent Hostel Management System</h1>
    <p>Apply for a bed space, report a fault, and follow it until it's fixed.</p>
  </body>
</html>
```

```css file=styles.css
h1 {
  color: #1f5c99;
  font-size: 2rem;
}
```
:::

## --callout-- tip

Change `#1f5c99` to `red` and press Run.

# --screen-- mcq

## --question--

Which line connects a page to `styles.css`?

## --options--

- [x] `<link rel="stylesheet" href="styles.css">`
  > Yes. A `link` element joins another file to the page, and `rel="stylesheet"` says that the file is CSS.
- [ ] `<a href="styles.css">Styles</a>`
  > No. An `a` element makes a link that people click. It does not load the file as styles.
- [ ] `<style src="styles.css">`
  > No. A `style` element holds CSS written inside the page, and it has no `src` attribute.
- [ ] `<script src="styles.css">`
  > No. A `script` element loads JavaScript, not CSS.

## --why--

The `link` element goes in the `head`. It is one tag and has no closing tag.

# --screen-- concept

A CSS **rule** is a **selector** plus **declarations** inside curly braces. A declaration is a **property**, a colon, a **value** and a semicolon. In this rule the selector is `h1`, the property is `color`, and the value is `#1f5c99`.

## --code--

```css file=styles.css
h1 {
  color: #1f5c99;
  font-size: 2rem;
}
```

## --callout-- info

A colour can be a name, such as `red`, or a code that starts with `#`, such as `#1f5c99`.

# --screen-- tapbuild

## --prompt--

Build the declaration that makes the text of every paragraph red.

## --template--

```css
p {
  ___
}
```

## --tokens--

- `color: red;`
- `color = red;`
- `color: red`
- `colour: red;`
- `red: color;`

## --answer--

- `color: red;`

## --why--

A declaration is the property `color`, a colon, the value `red` and a semicolon. CSS never uses `=`, the property is spelled `color`, and without the `;` the next declaration would run into this one.

# --screen-- spotbug

## --code--

```css file=styles.css
h1 {
  color: #1f5c99
  font-size: 2rem;
}
```

## --question--

The heading has neither the blue colour nor the larger size. What is wrong?

## --options--

- [x] The first declaration is missing its semicolon.
  > Yes. Without `;` after `#1f5c99`, the browser reads the next line as part of the same declaration and drops both.
- [ ] `font-size` needs a unit such as `px`.
  > No. `2rem` already has a unit. The unit is `rem`.
- [ ] The colour needs quotation marks.
  > No. Values in CSS are not put in quotation marks the way HTML attribute values are.
- [ ] The selector should be `.h1`.
  > No. A dot means a class. `h1` is the name of the element, so `h1` is correct.

## --why--

A semicolon ends each declaration. Leave one out and the browser throws away the broken declaration and the one that follows it.

# --screen-- concept

Five properties style most text. `color` is the text colour, `font-size` its size, `font-family` its typeface, `line-height` the space between lines, and `text-align` how the lines line up. A `rem` is the browser's base text size, so `rem` sizes respect users who set larger text.

::: tryit web
```html file=index.html
<h1>Student Portal</h1>
<p>Apply for a bed space, report a fault, and follow it until it's fixed.</p>
```

```css file=styles.css
body {
  font-family: system-ui, sans-serif;
  line-height: 1.5;
}

h1 {
  color: #1f5c99;
  font-size: 2rem;
  text-align: center;
}
```
:::

## --callout-- tip

Change `center` to `left` and press Run.

# --screen-- concept

A selector says which elements a rule styles. A plain name such as `p` matches every `p`. A dot matches a **class**, an attribute you add yourself. A hash matches an **id**, a name that only one element has. A comma lets one rule style several selectors.

::: tryit web
```html file=index.html
<h1 id="title">Hall Notice</h1>
<p>Water will be off on Friday.</p>
<ul>
  <li class="note">Pay at the bursary.</li>
  <li>Collect your key.</li>
</ul>
```

```css file=styles.css
p {
  color: #5b6b80;
}

.note {
  color: #b42318;
}

#title {
  color: #1f5c99;
}
```
:::

## --callout-- info

`class` and `id` are attributes, so they go inside the opening tag, like `href`.

# --screen-- tapbuild

## --prompt--

Which selector matches `<span class="badge">`? Build a rule that makes its text smaller.

## --template--

```css
___ {
  ___
}
```

## --tokens--

- `.badge`
- `#badge`
- `badge`
- `font-size: 0.8rem;`
- `font-size: 0.8rem`
- `font-size = 0.8rem;`
- `font-size: 0.8;`

## --answer--

- `.badge`
- `font-size: 0.8rem;`

## --why--

A dot in front of a name matches a class. A hash matches an id, and a bare `badge` matches an element called `badge`, which does not exist. The declaration needs a colon, a unit such as `rem`, and a semicolon.

# --screen-- match

## --prompt--

Match each selector to what it matches.

## --pairs--

- `p`
  - Every `p` element
- `.badge`
  - Every element with `class="badge"`
- `#complaints`
  - The one element with `id="complaints"`
- `h1, h2`
  - Every `h1` element and every `h2` element

## --why--

The first character tells you the kind of selector: nothing for an element, a dot for a class and a hash for an id. A comma joins selectors.

# --screen-- predict

## --code--

```css file=styles.css
h1 {
  color: green;
}

.note {
  color: red;
}
```

## --question--

A page has an `h1`, a `<p class="note">` and a plain `<p>`. What colour is the text of the plain `p`?

## --options--

- [x] The browser's default colour, black
  > Yes. Neither rule matches a plain `p`. The first is for `h1` elements and the second needs `class="note"`.
- [ ] Red
  > No. `.note` matches only elements that have `class="note"`, and the plain `p` has no class.
- [ ] Green
  > No. That rule is for `h1` elements only.
- [ ] No colour, because the text is hidden
  > No. Text with no colour rule still shows, in the browser's default colour.

## --why--

A rule styles only the elements its selector matches. Everything else keeps the browser's defaults.

# --screen-- concept

A **variable** names a value once. Define it in `:root`, with a name that starts with two hyphens, and read it with `var()`. Change `--primary` once and every rule that uses it follows. These six colours are the IHMS palette.

::: tryit web
```html file=index.html
<h1>Intelligent Hostel Management System</h1>
<p>Apply for a bed space, report a fault, and follow it until it's fixed.</p>
<a href="student.html">Student Portal</a>
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

a {
  color: var(--primary);
}

p {
  color: var(--muted);
}
```
:::

## --callout-- tip

Change `--primary` to `#b42318` and press Run. The heading and the link change together.

# --screen-- predict

## --code--

```css file=styles.css
:root {
  --primary: #1f5c99;
  --urgent: #b42318;
}

h1 {
  color: var(--urgent);
}
```

## --question--

What colour is the text of the `h1`?

## --options--

- [x] Red, `#b42318`
  > Yes. `var(--urgent)` is replaced by the value of `--urgent`.
- [ ] Blue, `#1f5c99`
  > No. That is `--primary`, and the `h1` rule does not use it.
- [ ] Black
  > No. The variable has a value, so the rule sets the colour.
- [ ] No colour, because `--urgent` is not a CSS property
  > No. A name with two hyphens in front is a variable you define yourself, and `var()` reads it.

## --why--

`var(--urgent)` stands for the value of `--urgent`. `--primary` is defined, but this rule does not use it.

# --screen-- mcq

## --question--

Why use CSS variables?

## --options--

- [x] You change a colour in one place and it updates everywhere.
  > Yes. Every rule that uses `var(--primary)` follows when you change `--primary` once.
- [ ] They make the page load faster.
  > No. Variables do not change speed. They save you from repeating a value.
- [ ] HTML requires them.
  > No. HTML does not need CSS at all, and CSS works without variables.

## --why--

A variable is a name for a value. Change the value where it is defined and everything that uses the name follows.

# --screen-- typein

## --prompt--

Style the IHMS home page. `index.html` already links `styles.css`. In `styles.css`, define three variables in `:root`: `--primary` as `#1f5c99`, `--text` as `#1a1a1a` and `--muted` as `#5b6b80`. Then set the `body` font to `system-ui, sans-serif` and its colour to `var(--text)`. Colour the `h1` and `h2` headings with `var(--primary)` and the `p` with `var(--muted)`.

## --seed-contents--

```html file=index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>IHMS</title>
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <h1>Intelligent Hostel Management System</h1>
    <p>Apply for a bed space, report a fault, and follow it until it's fixed.</p>
    <h2>Portals</h2>
    <a href="student.html">Student Portal</a>
    <a href="staff.html">Staff Dashboard</a>
    <a href="admin.html">Admin Dashboard</a>
  </body>
</html>
```

```css file=styles.css
--editable-region--

--editable-region--
```

## --tests--

Your `styles.css` should have a `:root` rule. It starts with `:root {` and ends with `}`.

```js
assert.match(files['styles.css'], /:root\s*\{[\s\S]*?\}/);
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

Your `body` should have a `font-family` of `system-ui, sans-serif`. Check the spelling and the comma.

```js
const family = getComputedStyle(document.body).fontFamily;
assert.include(family, 'system-ui');
assert.include(family, 'sans-serif');
```

Your `body` should have a `color` of `#1a1a1a`.

```js
assert.equal(getComputedStyle(document.body).color, 'rgb(26, 26, 26)');
```

Your `h1` should have a `color` of `#1f5c99`.

```js
assert.equal(getComputedStyle(document.querySelector('h1')).color, 'rgb(31, 92, 153)');
```

Your `h2` should have a `color` of `#1f5c99`.

```js
assert.equal(getComputedStyle(document.querySelector('h2')).color, 'rgb(31, 92, 153)');
```

Your `p` should have a `color` of `#5b6b80`.

```js
assert.equal(getComputedStyle(document.querySelector('p')).color, 'rgb(91, 107, 128)');
```

Your rules should read the variables with `var()`: `var(--text)`, `var(--primary)` and `var(--muted)`.

```js
const css = files['styles.css'];
assert.match(css, /var\(\s*--text\s*\)/);
assert.match(css, /var\(\s*--primary\s*\)/);
assert.match(css, /var\(\s*--muted\s*\)/);
```

## --solutions--

```html file=index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>IHMS</title>
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <h1>Intelligent Hostel Management System</h1>
    <p>Apply for a bed space, report a fault, and follow it until it's fixed.</p>
    <h2>Portals</h2>
    <a href="student.html">Student Portal</a>
    <a href="staff.html">Staff Dashboard</a>
    <a href="admin.html">Admin Dashboard</a>
  </body>
</html>
```

```css file=styles.css
:root {
  --primary: #1f5c99;
  --text: #1a1a1a;
  --muted: #5b6b80;
}

body {
  font-family: system-ui, sans-serif;
  color: var(--text);
}

h1,
h2 {
  color: var(--primary);
}

p {
  color: var(--muted);
}
```

## --why--

A stylesheet is a list of rules. The variables go in `:root`, and every other rule reads them with `var()`. Change a colour once, in `:root`, and the whole page follows.
