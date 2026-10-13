# --screen-- concept

This is the home page of the IHMS, the Intelligent Hostel Management System. It is about 15 lines of HTML. Change a word in the code and press Run. By the end of this lesson you will write a page like this yourself.

::: tryit web
```html file=index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>IHMS</title>
  </head>
  <body>
    <h1>Intelligent Hostel Management System</h1>
    <p>Apply for a bed space, report a fault, and follow it until it's fixed.</p>
    <a href="student.html">Student Portal</a>
    <a href="staff.html">Staff Dashboard</a>
    <a href="admin.html">Admin Dashboard</a>
  </body>
</html>
```
:::

# --screen-- concept

A web page uses three languages. **HTML** says what is on the page. **CSS** says how it looks. **JavaScript** says what it does.

Think of a restaurant. HTML is the food, CSS is how it is put on the plate, and JavaScript is the waiter.

# --screen-- mcq

## --question--

Which language controls how a page looks, such as its colours, spacing and layout?

## --options--

- [ ] HTML
  > No. HTML says what is on the page: headings, text, forms and tables.
- [x] CSS
  > Yes. CSS is the plating: colours, spacing and layout.
- [ ] JavaScript
  > No. JavaScript says what the page does, such as reacting to a click.

## --why--

HTML is the food, CSS is the plating and JavaScript is the waiter. This chapter is about HTML.

# --screen-- concept

HTML is written as **elements**. Most elements have an opening tag, some content, and a closing tag. Here, `<h1>` opens a top-level heading and `</h1>` closes it.

## --code--

```html file=index.html
<h1>Intelligent Hostel Management System</h1>
```

## --callout-- info

The closing tag has a `/` in front of the name.

# --screen-- tapbuild

## --prompt--

Build the heading for the IHMS home page.

## --template--

```html
___Intelligent Hostel Management System___
```

## --tokens--

- `<h1>`
- `</h1>`
- `<\h1>`
- `</h1`
- `<h1/>`
- `<p>`

## --answer--

- `<h1>`
- `</h1>`

## --why--

An `h1` element opens with `<h1>` and closes with `</h1>`. The slash goes after the `<`, not backwards, and the closing tag ends with `>` just like the opening tag.

# --screen-- spotbug

## --code--

```html file=index.html
<h1>Hostel Fees<h1>
<p>Pay at the bursary before Friday.</p>
```

## --question--

The heading does not work. What is wrong?

## --options--

- [x] The closing tag is missing its `/`.
  > Yes. The second `<h1>` starts a new heading. It should be `</h1>`.
- [ ] The text needs quotation marks.
  > No. Text between tags is written as it is, with no quotation marks.
- [ ] The opening tag needs a `/` too.
  > No. Only the closing tag has a `/`.
- [ ] A `p` element cannot come after an `h1` element.
  > No. A heading followed by a paragraph is how most pages start.

## --why--

Without the `/`, the browser sees a second heading start, and the paragraph below ends up inside it. Check that every opening tag has a matching closing tag.

# --screen-- concept

Every page has the same skeleton. The first line says the page is HTML. The `head` holds information about the page, such as its title in the browser tab. The `body` holds everything you see.

## --code--

```html file=index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>IHMS</title>
  </head>
  <body>
    <h1>Intelligent Hostel Management System</h1>
  </body>
</html>
```

## --callout-- tip

Copy the two `meta` lines as they are. One lets the page show symbols such as ₦. The other makes it fit phone screens.

# --screen-- mcq

## --question--

Which part of the page holds what you see?

## --options--

- [ ] `<head>`
  > No. The `head` holds information about the page, such as its title. It is not shown on the page.
- [x] `<body>`
  > Yes. Headings, paragraphs, links and images all go in the `body`.
- [ ] `<title>`
  > No. The `title` only sets the text in the browser tab, and it sits inside the `head`.

## --why--

`head` is for information about the page. `body` is for everything on the page.

# --screen-- predict

## --code--

```html file=index.html
<head>
  <title>IHMS</title>
</head>
<body>
  <h1>Student Portal</h1>
</body>
```

## --question--

What does the browser tab say?

## --options--

- [x] IHMS
  > Yes. The `title` element in the `head` sets the text in the tab.
- [ ] Student Portal
  > No. That is the `h1` in the `body`, so it shows on the page, not in the tab.
- [ ] index.html
  > No. A tab shows the file name only when the page has no `title`.
- [ ] Nothing, because the `head` is hidden.
  > No. The `head` is not shown on the page, but its `title` still appears in the tab.

## --why--

The `title` is the one part of the `head` you can see, and it shows in the tab. Everything else you see comes from the `body`.

# --screen-- concept

Tags can carry **attributes**: extra information inside the opening tag. A link's `href` attribute says where it goes. The text between the tags is what the visitor reads.

::: tryit web
```html file=index.html
<a href="student.html">Student Portal</a>
```
:::

## --callout-- info

In the preview, clicking a link does nothing. The page it points to does not exist yet.

# --screen-- mcq

## --question--

What does `href` do on a link?

## --options--

- [x] Says where the link goes
  > Yes. In `href="student.html"` the browser is told to open the file `student.html`.
- [ ] Makes the link bold
  > No. How text looks, such as bold, is CSS. `href` is only the address.
- [ ] Names the link
  > No. The name people see is the text between the tags. `href` is where the link goes.

## --why--

The text between `<a>` and `</a>` is what people read. The `href` attribute is where they end up.

# --screen-- concept

Headings run from `<h1>`, the most important, to `<h6>`, the least. Use one `<h1>` per page. A `<p>` element is a paragraph. An `<img>` element shows a picture: `src` is the file and `alt` describes it for screen readers. It has no closing tag.

::: tryit web
```html file=index.html
<h1>Hostel Fees</h1>
<h2>Second semester</h2>
<p>Pay at the bursary before Friday.</p>
<img src="/img/amina-bello.svg" alt="Head and shoulders of a student with a gold ID tag">
```
:::

# --screen-- match

## --prompt--

Match each element to what it makes.

## --pairs--

- `<h1>`
  - The main heading
- `<p>`
  - A paragraph
- `<a href="...">`
  - A link
- `<img src="..." alt="...">`
  - A picture

## --why--

Each element has one job. You choose the element that matches what you want on the page.

# --screen-- typein

## --prompt--

Build `index.html`, the IHMS home page. Inside the `body`, add a heading, one sentence about the system, and links to the three portals: `student.html`, `staff.html` and `admin.html`.

## --seed-contents--

```html file=index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>IHMS</title>
  </head>
  <body>
--editable-region--

--editable-region--
  </body>
</html>
```

## --tests--

Your page should have an `h1` element.

```js
assert.exists(document.querySelector('h1'));
```

Your `h1` element should have some text between its tags.

```js
assert.isAbove(document.querySelector('h1').textContent.trim().length, 0);
```

Your page should have a `p` element with one sentence about the system.

```js
const p = document.querySelector('p');
assert.exists(p);
assert.isAbove(p.textContent.trim().length, 0);
```

Your page should have three links. Each link is an `a` element.

```js
assert.lengthOf(document.querySelectorAll('a'), 3);
```

Each link needs some text for visitors to read between its tags.

```js
document.querySelectorAll('a').forEach((a) => assert.isAbove(a.textContent.trim().length, 0));
```

Your links should go to `student.html`, `staff.html` and `admin.html`. Check that each `href` has the file name spelled exactly.

```js
const hrefs = [...document.querySelectorAll('a')].map((a) => a.getAttribute('href')).sort();
assert.deepEqual(hrefs, ['admin.html', 'staff.html', 'student.html']);
```

## --solutions--

```html file=index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>IHMS</title>
  </head>
  <body>
    <h1>Intelligent Hostel Management System</h1>
    <p>Apply for a bed space, report a fault, and follow it until it's fixed.</p>
    <a href="student.html">Student Portal</a>
    <a href="staff.html">Staff Dashboard</a>
    <a href="admin.html">Admin Dashboard</a>
  </body>
</html>
```

## --why--

A heading is `h1`, a sentence is `p`, and each link is an `a` element whose `href` is the file it opens. These three pieces make up the IHMS home page.
