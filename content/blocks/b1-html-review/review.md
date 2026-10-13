## The three languages

A web page uses three languages. Each has one job.

| Language | Job | Restaurant |
|---|---|---|
| HTML | What is on the page: headings, text, forms, tables | The food on the plate |
| CSS | How it looks: colours, spacing, layout | The plating |
| JavaScript | What it does: reacting to clicks, loading data | The waiter |

## Elements and attributes

HTML is written as **elements**. Most elements have an opening tag, some content and a closing tag. The closing tag has a `/` in front of the name.

An **attribute** is extra information inside the opening tag. The `href` attribute of a link says where the link goes.

::: tryit web
```html file=index.html
<h1>Intelligent Hostel Management System</h1>
<a href="student.html">Student Portal</a>
```
:::

## The page skeleton

Every page has the same skeleton. The `head` holds information about the page, such as its title in the browser tab, and the line that makes it fit phone screens. The `body` holds what you see.

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

## Headings, paragraphs, links and images

| Element | Use |
|---|---|
| `<h1>` to `<h6>` | Headings, from most to least important. One `<h1>` per page. |
| `<p>` | A paragraph |
| `<a href="...">` | A link |
| `<img src="..." alt="...">` | An image. `alt` describes it for screen readers. No closing tag. |

::: tryit web
```html file=index.html
<h1>Hostel Fees</h1>
<h2>Second semester</h2>
<p>Pay at the bursary before Friday.</p>
<a href="index.html">IHMS home page</a>
<img src="/img/amina-bello.svg" alt="Head and shoulders of a student with a gold ID tag">
```
:::

## Lists

`<ul>` is a bulleted list and `<ol>` is a numbered one. Each item is an `<li>`.

::: tryit web
```html file=index.html
<ul>
  <li>Plumbing</li>
  <li>Electrical</li>
</ul>
<ol>
  <li>Report the fault</li>
  <li>Wait for the maintenance officer</li>
</ol>
```
:::

## Tables

| Tag | Means |
|---|---|
| `<table>` | The whole table |
| `<thead>` / `<tbody>` | Header rows / data rows |
| `<tr>` | One row |
| `<th>` | A header cell |
| `<td>` | A data cell |

The Staff Dashboard is a table of complaints.

::: tryit web
```html file=index.html
<table id="complaints">
  <thead>
    <tr>
      <th>ID</th><th>Room</th><th>Category</th><th>Urgency</th><th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>482</td><td>B-214</td><td>Plumbing</td><td>Urgent</td><td>Open</td>
    </tr>
  </tbody>
</table>
```
:::

## Forms

Students lodge complaints and log in through forms. A form does not send anything anywhere yet. In chapter B3, JavaScript will catch the submit and send the data to the server.

| Element | Use |
|---|---|
| `<form>` | Wraps the fields and the submit button |
| `<label for="x">` | The text for the field whose `id` is `x`. Clicking the label focuses the field, and screen readers read it out. Every field needs one. |
| `<input type="...">` | One-line fields: `text`, `email`, `password`, `number` |
| `<textarea>` | Multi-line text |
| `<select>` and `<option>` | A drop-down |
| `required` | The browser will not submit until the field is filled |
| `<button type="submit">` | Sends the form |

::: tryit web
```html file=index.html
<form id="complaint-form">
  <label for="description">What's wrong?</label>
  <textarea id="description" name="description" rows="4" required></textarea>
  <button type="submit">Submit complaint</button>
</form>
```
:::

A drop-down for the Staff Dashboard's status filter:

::: tryit web
```html file=index.html
<label for="status-filter">Show</label>
<select id="status-filter">
  <option value="all">All complaints</option>
  <option value="Open">Open</option>
  <option value="Assigned">Assigned</option>
  <option value="In Progress">In Progress</option>
  <option value="Resolved">Resolved</option>
</select>
```
:::

A login form uses `type="password"` to hide what you type:

::: tryit web
```html file=index.html
<form>
  <label for="email">Email</label>
  <input type="email" id="email" name="email" required>
  <label for="password">Password</label>
  <input type="password" id="password" name="password" required>
  <button type="submit">Log in</button>
</form>
```
:::

## Page structure and navigation

`header`, `nav`, `main` and `footer` name the parts of a page. They do not change how it looks. They tell the browser, screen readers and other developers what each part is. `<nav>` holds the main navigation links.

A **comment** is a note for people: `<!-- ... -->`. The browser ignores it.

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
    <!-- the page's own content -->
  </main>
  <footer>
    <p>Group 39 · COS 303 · Nile University of Nigeria</p>
  </footer>
</body>
```
:::

### Remember

- Visible content goes inside `body`. Information about the page goes inside `head`.
- A closing tag has a `/` in front of the name. `img` has no closing tag.
- Use one `h1` per page.
- Every form field needs a `label` whose `for` matches the field's `id`.
- Column names go in `th` cells inside `thead`. Data goes in `td` cells inside `tbody`.
- Comments are for people. The browser ignores them.
