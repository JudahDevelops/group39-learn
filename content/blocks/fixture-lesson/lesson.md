# --screen-- concept

A web page is built from **elements**. An element has an opening tag, some content, and a closing tag.

## --code--

```html file=index.html
<p>Hello, Hall A.</p>
```

## --callout-- info

The closing tag has a `/` in front of the name.

# --screen-- concept

Change the text between the tags, then press Run. The page updates.

::: tryit web
```html file=index.html
<h1>Hall Notice</h1>
<p>Water will be off on Friday.</p>
```
:::

## --callout-- tip

Nothing you type here can break the course.

# --screen-- mcq

## --question--

Which element is the main heading of a page?

## --options--

- [x] `h1`
  > Yes. `h1` is the top-level heading.
- [ ] `p`
  > No. `p` holds a paragraph of text.
- [ ] `button`
  > No. `button` makes something to click.

## --why--

Headings use `h1` (the biggest) down to `h6`. Paragraphs use `p`.

# --screen-- multi

## --question--

Select every closing tag.

## --options--

- [x] `</p>`
  > Yes. The `/` marks a closing tag.
- [ ] `<p>`
  > No. This is an opening tag: it has no `/`.
- [x] `</h1>`
  > Yes. It closes an `h1` element.
- [ ] `<h1>`
  > No. This is an opening tag.

## --why--

A closing tag repeats the element name with a `/` in front.

# --screen-- tapbuild

## --prompt--

Build a heading that says Notice.

## --template--

```html
___Notice___
```

## --tokens--

- `<h1>`
- `</h1>`
- `<p>`
- `</p>`
- `<\h1>`

## --answer--

- `<h1>`
- `</h1>`

## --why--

An `h1` element opens with `<h1>` and closes with `</h1>`. The slash goes after the `<`, not backwards.

# --screen-- typein

## --prompt--

Add a `p` element with any text inside the `body`.

## --seed-contents--

```html file=index.html
<body>
--editable-region--

--editable-region--
</body>
```

## --tests--

Your page needs a `p` element.

```js
assert.exists(document.querySelector('p'));
```

Your `p` element should have some text.

```js
assert.isAbove(document.querySelector('p').textContent.trim().length, 0);
```

## --solutions--

```html file=index.html
<body>
  <p>Water will be off on Friday.</p>
</body>
```

## --why--

A paragraph is a `p` element: `<p>`, the text, then `</p>`.

# --screen-- predict

## --code--

```html file=index.html
<p>Rice</p>
<p>Beans</p>
<p>Stew</p>
```

## --question--

How many paragraphs will the page show?

## --options--

- [x] 3
  > Yes. There are three `p` elements.
- [ ] 1
  > No. Each `p` element is its own paragraph.
- [ ] 6
  > No. Count elements, not tags.

## --why--

Each `p` element, from its opening tag to its closing tag, makes one paragraph.

# --screen-- spotbug

## --code--

```html file=index.html
<h1>Hall Notice
<p>Water will be off on Friday.</p>
```

## --question--

What is wrong with this code?

## --options--

- [x] The `h1` element is missing its closing tag.
  > Yes. It needs `</h1>` after the text.
- [ ] The `p` element is missing its opening tag.
  > No. `<p>` is there.
- [ ] A `p` element cannot come after an `h1` element.
  > No. Any element can follow another.

## --why--

Without `</h1>` the browser keeps treating the next lines as part of the heading.

# --screen-- order

## --prompt--

Put the parts of an element in order.

## --items--

- The opening tag, such as `<p>`
- The content, such as `Hello`
- The closing tag, such as `</p>`

## --why--

An element opens, holds its content, then closes.

# --screen-- match

## --prompt--

Match each element to what it makes.

## --pairs--

- `h1`
  - The main heading
- `p`
  - A paragraph
- `button`
  - Something to click
- `li`
  - One item in a list

## --why--

Each element has one job. You choose the element that matches what you want on the page.

# --screen-- flashcard

## --question--

What are the three parts of an HTML element?

## --answer--

An opening tag, the content, and a closing tag.

# --screen-- widget

## --prompt--

Slide the time a complaint has been open and watch the escalation level change.

## --widget-- escalation-slider

```json
{ "deadlineHours": 24, "maxHours": 72 }
```

## --why--

The level L is 0 before the deadline d, 1 from d until 2d, and 2 from 2d on.

# --screen-- checklist

## --items--

- Install Python 3.11 or newer, then run the command below and paste what it prints.
  - command: `python --version`
  - pattern: `^Python 3\.1[1-3]`
  - hint: Your Python is older than 3.11. Install a newer one from python.org.
- Create a folder called `ihms` for your project.
