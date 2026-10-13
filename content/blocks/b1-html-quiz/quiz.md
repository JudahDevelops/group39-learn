---
draw: 15
pass: 12
---

## --question--

### --text--

Which language controls how a web page looks, such as its colours, spacing and layout?

### --distractors--

- HTML
- JavaScript
- Python

### --answer--

CSS

### --explanation--

CSS is the plating: it controls how a page looks. HTML says what is on the page, and JavaScript says what the page does.

## --question--

### --text--

What is the job of HTML?

### --distractors--

- To set the colours, spacing and layout of the page
- To react to clicks and load data from the server
- To store the hostel's data in a database

### --answer--

To say what is on the page: headings, text, forms and tables

### --explanation--

HTML is the food on the plate. Colours and layout belong to CSS, and reacting to clicks belongs to JavaScript.

## --question--

### --text--

In `<h1>Welcome</h1>`, which part is the closing tag?

### --distractors--

- `<h1>`
- `Welcome`
- `<h1/>`

### --answer--

`</h1>`

### --explanation--

A closing tag repeats the element name with a `/` in front of it. `<h1>` is the opening tag, and `Welcome` is the content between the two tags.

## --question--

### --text--

What is an attribute?

### --distractors--

- The text between an opening tag and a closing tag
- A second closing tag at the end of an element
- A note for people that the browser ignores

### --answer--

Extra information inside an opening tag

### --explanation--

In `<a href="student.html">`, `href` is an attribute. The text between the tags is the content, and a note for people is a comment.

## --question--

### --text--

In `<a href="staff.html">Staff Dashboard</a>`, what is `staff.html`?

### --distractors--

- The text visitors read on the page
- The text shown in the browser tab
- The colour of the link text

### --answer--

The file the link opens

### --explanation--

The `href` attribute says where a link goes. The text visitors read is `Staff Dashboard`, between the opening and closing tags.

## --question--

### --text--

Which part of an HTML page holds what you see?

### --distractors--

- `<head>`
- `<title>`
- `<meta>`

### --answer--

`<body>`

### --explanation--

Headings, paragraphs, links and images all go in the `body`. The `head` holds information about the page.

## --question--

### --text--

What does the `head` of a page hold?

### --distractors--

- The main heading and the sub-headings of the page
- The links and images that visitors click and look at
- The footer text at the bottom of the page

### --answer--

Information about the page, such as its title in the browser tab

### --explanation--

The name is easy to confuse with a heading, but `head` is not shown on the page. Headings go in the `body`, as `h1` to `h6` elements.

## --question--

### --text--

How many `<h1>` elements should a page have?

### --distractors--

- One for every paragraph
- Six, one for each heading level
- None, because headings start at `<h2>`

### --answer--

One

### --explanation--

A page has one `<h1>`, its main heading. `<h2>` to `<h6>` are the smaller headings below it.

## --question--

### --text--

What does the `alt` attribute of an `<img>` element do?

### --distractors--

- It says where the image file is
- It sets how wide the image is
- It adds a caption under the image

### --answer--

It describes the image for screen readers

### --explanation--

`alt` is for people who cannot see the image. The `src` attribute is the one that says which file to show.

## --question--

### --text--

Which of these elements has no closing tag?

### --distractors--

- `<p>`
- `<a>`
- `<h1>`

### --answer--

`<img>`

### --explanation--

An `<img>` is written as one tag, with its `src` and `alt` attributes inside. Paragraphs, links and headings wrap content, so they need a closing tag.

## --question--

### --text--

What does the line `<meta name="viewport" content="width=device-width, initial-scale=1">` do?

### --distractors--

- It sets the title shown in the browser tab
- It adds a heading to the top of the page
- It hides the page from search engines

### --answer--

It makes the page fit phone screens

### --explanation--

This `meta` line goes in the `head`. The title in the tab comes from the `title` element.

## --question--

### --text--

In the IHMS, which file is the Staff Dashboard?

### --distractors--

- `index.html`
- `student.html`
- `admin.html`

### --answer--

`staff.html`

### --explanation--

The home page is `index.html`, the Student Portal is `student.html`, the Staff Dashboard is `staff.html` and the Admin Dashboard is `admin.html`.

## --question--

### --text--

Which element makes a numbered list?

### --distractors--

- `<ul>`
- `<li>`
- `<num>`

### --answer--

`<ol>`

### --explanation--

`<ol>` is a numbered list and `<ul>` is a bulleted one. `<li>` is one item inside either of them.

## --question--

### --text--

What does each `<li>` element hold?

### --distractors--

- A whole list
- One row of a table
- A link to another page

### --answer--

One item in a list

### --explanation--

A list element, `<ul>` or `<ol>`, wraps the list. Each item inside it is an `<li>`.

## --question--

### --text--

Which tag makes one row of a table?

### --distractors--

- `<td>`
- `<th>`
- `<thead>`

### --answer--

`<tr>`

### --explanation--

`<tr>` is one row. Inside a row, `<th>` is a header cell and `<td>` is a data cell.

## --question--

### --text--

Where do the column names of a table go?

### --distractors--

- In `<td>` cells inside `<tbody>`
- In `<td>` cells inside `<thead>`
- In `<th>` cells inside `<tbody>`

### --answer--

In `<th>` cells inside `<thead>`

### --explanation--

The header row uses `<th>` cells inside `<thead>`. Data rows use `<td>` cells inside `<tbody>`.

## --question--

### --text--

What does the `<tbody>` element hold?

### --distractors--

- The header row
- The whole table
- The title of the table

### --answer--

The data rows

### --explanation--

`<thead>` holds the header rows and `<tbody>` holds the data rows. `<table>` wraps both.

## --question--

### --text--

Which page of the IHMS is a table of complaints?

### --distractors--

- The home page
- The Student Portal
- The login page

### --answer--

The Staff Dashboard

### --explanation--

The Staff Dashboard shows complaints as a table with columns such as ID, Room, Category, Urgency and Status. Students lodge complaints through a form on the Student Portal.

## --question--

### --text--

Why does every form field need a `<label>`?

### --distractors--

- So the browser will allow the form to be submitted
- To make the text typed in the field bold
- So the browser can check that the typed value is correct

### --answer--

So users and screen readers know what the field is for

### --explanation--

A label names the field. Clicking the label also focuses the field, and screen readers read the label out.

## --question--

### --text--

How is a `<label>` joined to its field?

### --distractors--

- The label's `for` matches the field's `name`
- The label is written directly after the field
- The label has the same text as the field's `name`

### --answer--

The label's `for` matches the field's `id`

### --explanation--

In `<label for="email">`, the field must have `id="email"`. The two are joined by `for` and `id`, not by their position or their `name`.

## --question--

### --text--

Which input type hides what you type?

### --distractors--

- `text`
- `hidden`
- `number`

### --answer--

`password`

### --explanation--

`type="password"` hides the characters as you type. Other one-line types are `text`, `email` and `number`.

## --question--

### --text--

Which pair of elements makes a drop-down?

### --distractors--

- `<form>` and `<input>`
- `<textarea>` and `<label>`
- `<ul>` and `<li>`

### --answer--

`<select>` and `<option>`

### --explanation--

`<select>` is the drop-down and each `<option>` is a choice in it. The Staff Dashboard's status filter is built this way.

## --question--

### --text--

Which element is for writing several lines of text?

### --distractors--

- `<input type="text">`
- `<label>`
- `<select>`

### --answer--

`<textarea>`

### --explanation--

`<input type="text">` is a one-line field. A complaint description needs several lines, so it uses `<textarea>`.

## --question--

### --text--

What does the `required` attribute do?

### --distractors--

- It makes the field's label bold so visitors notice it
- It hides the field until the visitor needs it
- It sends the form to the server straight away

### --answer--

The browser will not submit the form until the field is filled

### --explanation--

`required` stops an empty field from being submitted. It does not change how the field looks.

## --question--

### --text--

For now the complaint form sends nothing anywhere. What will later catch the submit and send the data to the server?

### --distractors--

- CSS
- The `required` attribute
- A `<label>` element

### --answer--

JavaScript

### --explanation--

HTML builds the form, and JavaScript will catch the submit and send the data. CSS only changes how the form looks.

## --question--

### --text--

What does the `<nav>` element hold?

### --distractors--

- The title of the page
- The text at the bottom of the page
- Notes for people that the browser ignores

### --answer--

The main navigation links

### --explanation--

`<nav>` names the part of the page that holds the main links, such as Home, Student Portal, Staff Dashboard and Admin Dashboard.

## --question--

### --text--

What do elements such as `header`, `main` and `footer` do?

### --distractors--

- They add a border around each part of the page
- They make each part of the page load faster
- They turn each part of the page into its own page

### --answer--

They name the parts of the page without changing how it looks

### --explanation--

These elements tell the browser, screen readers and other developers what each part is. Looks are the job of CSS.

## --question--

### --text--

What does the browser do with `<!-- note -->`?

### --distractors--

- It shows it in grey text
- It shows it as a tooltip when the mouse is over it
- It shows it in the browser tab

### --answer--

It ignores it

### --explanation--

`<!-- ... -->` is a comment: a note for people. Visitors never see it on the page.

## --question--

### --text--

On a page that uses `<header>`, `<main>` and `<footer>`, where does the page's own content go?

### --distractors--

- Inside `<header>`
- Inside `<nav>`
- Inside `<footer>`

### --answer--

Inside `<main>`

### --explanation--

The header and footer repeat on every page, so each page's own content goes in `<main>`.

## --question--

### --text--

How many pages of the IHMS get the same header, nav and footer?

### --distractors--

- One, the home page only
- Three, one for each portal
- Four, all except the login page

### --answer--

Five: index, student, staff, admin and login

### --explanation--

All five pages share the same header, nav and footer, so you can reach every page from every other page through the nav.
