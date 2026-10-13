# --screen-- concept

HTML has elements that name the parts of a page. They do not change how it looks. They tell the browser, screen readers and other developers what each part is.

::: tryit web
```html file=index.html
<body>
  <header>
    <h1>IHMS</h1>
    <nav>
      <a href="index.html">Home</a>
      <a href="student.html">Student Portal</a>
      <a href="staff.html">Staff Dashboard</a>
      <a href="admin.html">Admin Dashboard</a>
    </nav>
  </header>
  <main>
    <p>Apply for a bed space, report a fault, and follow it until it's fixed.</p>
  </main>
  <footer>
    <p>Group 39 · COS 303 · Nile University of Nigeria</p>
  </footer>
</body>
```
:::

# --screen-- match

## --prompt--

Match each element to the part of the page it names.

## --pairs--

- `<header>`
  - The top of the page, such as its title
- `<nav>`
  - The main navigation links
- `<main>`
  - The page's own content
- `<footer>`
  - The bottom of the page, such as who made it

## --why--

Each element names one part of the page. A visitor sees a normal page, but a screen reader can jump straight to the part it needs.

# --screen-- mcq

## --question--

What does `<nav>` hold?

## --options--

- [x] The main navigation links
  > Yes. `nav` marks the group of links that take a visitor around the site.
- [ ] The page title
  > No. The title in the browser tab is the `title` element in the `head`, and the title on the page is an `h1`.
- [ ] Comments
  > No. A comment is written with `<!-- ... -->` and can go anywhere. It is not held by `nav`.

## --why--

`nav` is for the links that move a visitor between pages.

# --screen-- predict

## --code--

```html file=index.html
<header>
  <h1>IHMS</h1>
</header>
```

## --question--

How does this `h1` look, compared with an `h1` that is not inside a `header`?

## --options--

- [x] The same
  > Yes. A `header` names a part of the page. It does not change how the heading looks.
- [ ] It has a coloured bar behind it.
  > No. Colour is CSS. A `header` adds no colour.
- [ ] It moves to the right.
  > No. A `header` does not move anything. Where things sit is CSS too.
- [ ] It is hidden.
  > No. Content inside a `header` is shown like any other content.

## --why--

Structure elements add meaning, not looks. CSS does the looks.

# --screen-- tapbuild

## --prompt--

Wrap the two links in the element for navigation.

## --template--

```html
___
  <a href="index.html">Home</a>
  <a href="student.html">Student Portal</a>
___
```

## --tokens--

- `<nav>`
- `</nav>`
- `<navigation>`
- `</navigation>`
- `<menu>`
- `<header>`
- `<nav/>`

## --answer--

- `<nav>`
- `</nav>`

## --why--

The element is called `nav`, and like most elements it opens with `<nav>` and closes with `</nav>`. `navigation` is not an element, and `header` is the top of the page, not its links.

# --screen-- concept

`<!-- ... -->` is a **comment**: a note for people that the browser ignores. Use comments to label the parts of a page. Visitors never see them.

::: tryit web
```html file=index.html
<!-- The page's own content starts here -->
<p>This line is on the page.</p>
```
:::

## --callout-- info

Press Run. The comment does not appear in the preview.

# --screen-- mcq

## --question--

What happens to `<!-- note -->`?

## --options--

- [ ] It's shown in grey
  > No. The browser does not show a comment at all, in any colour.
- [x] The browser ignores it
  > Yes. A comment is only for the people who read the code.
- [ ] It hides the next element
  > No. A comment hides only its own text. The element after it still shows.

## --why--

The browser skips everything between `<!--` and `-->`.

# --screen-- spotbug

## --code--

```html file=index.html
<!-- The main links
<nav>
  <a href="index.html">Home</a>
  <a href="student.html">Student Portal</a>
</nav>
<main>
  <p>Report a fault here.</p>
</main>
```

## --question--

The links and the paragraph have both disappeared from the page. What is wrong?

## --options--

- [x] The comment is never closed with `-->`.
  > Yes. A comment ends only at `-->`. Without it, the browser treats the rest of the page as part of the comment.
- [ ] A comment cannot come before a `nav`.
  > No. A comment can go anywhere, between any two elements.
- [ ] The `nav` is missing its closing tag.
  > No. `</nav>` is there.
- [ ] The comment needs a closing tag such as `</!-->`.
  > No. A comment has no closing tag. It simply ends with `-->`.

## --why--

A comment starts with `<!--` and ends with `-->`. Leave out the ending and everything below it is lost.

# --screen-- concept

Every page repeats the same `header`, `nav` and `footer`. Only the content inside `main` changes. That is how a visitor can reach every page from every other page.

## --code--

```html file=index.html
<body>
  <header>
    <!-- same on every page -->
  </header>
  <main>
    <h2>Occupancy</h2>
  </main>
  <footer>
    <!-- same on every page -->
  </footer>
</body>
```

# --screen-- mcq

## --question--

You add a new page, `admin.html`. Where does its own content go?

## --options--

- [x] Inside `<main>`
  > Yes. `main` holds what is special to this page. The header, nav and footer stay the same.
- [ ] Inside `<nav>`
  > No. `nav` holds only the navigation links.
- [ ] Inside `<footer>`
  > No. The footer is the bottom of the page, for things such as who made it.
- [ ] Inside `<head>`
  > No. The `head` holds information about the page. Nothing in it is shown.

## --why--

A page's own content goes in `main`. The parts around it are shared.

# --screen-- order

## --prompt--

Put the parts of a page in the order a visitor meets them, from top to bottom.

## --items--

- `<header>`, the title and the navigation
- `<main>`, the page's own content
- `<footer>`, who made the page

## --why--

A page opens with its header, then the content a visitor came for, then the footer.

# --screen-- typein

## --prompt--

Build `admin.html`. Inside the `body`, add a `header` that holds an `h1` and a `nav`, then a `main`, then a `footer` with a `p` in it. The `nav` links to all five pages: `index.html`, `student.html`, `staff.html`, `admin.html` and `login.html`. Inside `main`, add three `h2` headings: Occupancy, Flagged complaints and Reports.

## --seed-contents--

```html file=admin.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Admin Dashboard</title>
  </head>
  <body>
--editable-region--

--editable-region--
  </body>
</html>
```

## --tests--

Your page should have a `header` element.

```js
assert.exists(document.querySelector('header'));
```

Your `header` should have a `nav` element inside it.

```js
assert.exists(document.querySelector('header nav'));
```

Your `nav` should have five links. Each link is an `a` element.

```js
assert.lengthOf(document.querySelectorAll('nav a'), 5);
```

Each link needs some text for visitors to read between its tags.

```js
document.querySelectorAll('nav a').forEach((a) => assert.isAbove(a.textContent.trim().length, 0));
```

Your links should go to `index.html`, `student.html`, `staff.html`, `admin.html` and `login.html`. Check that each `href` has the file name spelled exactly.

```js
const hrefs = [...document.querySelectorAll('nav a')].map((a) => a.getAttribute('href')).sort();
assert.deepEqual(hrefs, ['admin.html', 'index.html', 'login.html', 'staff.html', 'student.html']);
```

Your page should have a `main` element.

```js
assert.exists(document.querySelector('main'));
```

Your `main` should have three `h2` headings, in this order: Occupancy, Flagged complaints and Reports. Check the spelling.

```js
const heads = [...document.querySelectorAll('main h2')].map((h) => h.textContent.trim());
assert.deepEqual(heads, ['Occupancy', 'Flagged complaints', 'Reports']);
```

Your page should have a `footer` element with some text in it.

```js
const footer = document.querySelector('footer');
assert.exists(footer);
assert.isAbove(footer.textContent.trim().length, 0);
```

Your `header`, `main` and `footer` should come one after the other, in that order.

```js
const header = document.querySelector('header');
const main = document.querySelector('main');
const footer = document.querySelector('footer');
assert.isTrue(Boolean(header.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING));
assert.isTrue(Boolean(main.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING));
```

## --solutions--

```html file=admin.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Admin Dashboard</title>
  </head>
  <body>
    <header>
      <h1>IHMS</h1>
      <nav>
        <a href="index.html">Home</a>
        <a href="student.html">Student Portal</a>
        <a href="staff.html">Staff Dashboard</a>
        <a href="admin.html">Admin Dashboard</a>
        <a href="login.html">Log in</a>
      </nav>
    </header>
    <main>
      <h2>Occupancy</h2>
      <h2>Flagged complaints</h2>
      <h2>Reports</h2>
    </main>
    <footer>
      <p>Group 39 · COS 303 · Nile University of Nigeria</p>
    </footer>
  </body>
</html>
```

## --why--

The header holds the heading and the nav, `main` holds this page's own content, and the footer closes the page. Every page uses the same header, nav and footer, so a visitor can reach any page from any other.
