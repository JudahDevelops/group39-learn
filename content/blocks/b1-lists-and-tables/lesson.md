# --screen-- concept

A list groups items that belong together. `<ul>` makes a bulleted list and `<ol>` makes a numbered one. Each item inside is an `<li>`.

::: tryit web
```html file=index.html
<ul>
  <li>Plumbing</li>
  <li>Electrical</li>
</ul>
```
:::

## --callout-- tip

Change both `ul` tags to `ol` and press Run. The bullets become numbers.

# --screen-- mcq

## --question--

A student must follow these steps in order to report a fault. Which element lists them?

## --options--

- [ ] `<ul>`
  > No. A `ul` shows bullets, so the steps would look like they have no order.
- [x] `<ol>`
  > Yes. An `ol` numbers its items 1, 2, 3, so the order is clear.
- [ ] `<li>`
  > No. An `li` is one item. It needs a `ul` or an `ol` around it.
- [ ] `<table>`
  > No. A table is for rows and columns of data, not for one list of steps.

## --why--

Use `ul` when the order does not matter and `ol` when it does. Either way, each item is an `li`.

# --screen-- tapbuild

## --prompt--

Build a bulleted list of two complaint categories.

## --template--

```html
___
  ___Plumbing___
  ___Electrical___
___
```

## --tokens--

- `<ul>`
- `</ul>`
- `<li>`
- `<li>`
- `</li>`
- `</li>`
- `<ol>`
- `</ol>`
- `<il>`
- `<ul/>`

## --answer--

- `<ul>`
- `<li>`
- `</li>`
- `<li>`
- `</li>`
- `</ul>`

## --why--

A bulleted list is a `ul` element, and each item is an `li` element that opens and closes. `<ol>` would number the items, and `<il>` is a misspelling of `<li>`.

# --screen-- concept

A table shows data in rows and columns. `<table>` wraps it. `<tr>` is one row. Inside a row, `<th>` is a header cell and `<td>` is a data cell.

::: tryit web
```html file=index.html
<table>
  <tr>
    <th>Room</th><th>Status</th>
  </tr>
  <tr>
    <td>B-214</td><td>Open</td>
  </tr>
</table>
```
:::

## --callout-- info

Browsers show `th` text in bold, so you can spot the header row at a glance.

# --screen-- match

## --prompt--

Match each table tag to what it makes.

## --pairs--

- `<table>`
  - The whole table
- `<tr>`
  - One row
- `<th>`
  - A header cell
- `<td>`
  - A data cell

## --why--

A table is made of rows. Each row is made of cells: `th` cells name a column and `td` cells hold the data.

# --screen-- mcq

## --question--

Which tag is one row?

## --options--

- [x] `<tr>`
  > Yes. "Table row" is where the name comes from.
- [ ] `<td>`
  > No. A `td` is one data cell inside a row, not the whole row.
- [ ] `<th>`
  > No. A `th` is one header cell inside a row, not the whole row.

## --why--

`tr` is the row. The cells `th` and `td` sit inside it.

# --screen-- concept

Group the rows. `<thead>` holds the header row. `<tbody>` holds the data rows. The Staff Dashboard is a table like this, with one data row for each complaint.

## --code--

```html file=index.html
<table>
  <thead>
    <tr><th>Room</th><th>Status</th></tr>
  </thead>
  <tbody>
    <tr><td>B-214</td><td>Open</td></tr>
  </tbody>
</table>
```

# --screen-- mcq

## --question--

Where do the column names go?

## --options--

- [x] In `<th>` cells inside `<thead>`
  > Yes. The header row names each column, and `thead` marks it as the header.
- [ ] In `<td>` cells inside `<tbody>`
  > No. `tbody` holds the data rows, and `td` cells hold data, not column names.
- [ ] In a `<p>` above the `<table>`
  > No. A paragraph is not tied to any column. The names must be cells in the table's header row.

## --why--

Column names are `th` cells in the header row, inside `thead`. Everything else is a `td` cell in `tbody`.

# --screen-- predict

## --code--

```html file=index.html
<table>
  <thead>
    <tr><th>Room</th><th>Status</th></tr>
  </thead>
  <tbody>
    <tr><td>B-214</td><td>Open</td></tr>
    <tr><td>B-107</td><td>Resolved</td></tr>
  </tbody>
</table>
```

## --question--

How many rows does this table have, counting the header row?

## --options--

- [x] 3
  > Yes. There is one header row and two data rows, and each is a `tr`.
- [ ] 2
  > No. That counts only the data rows. The header row is a `tr` too.
- [ ] 6
  > No. That counts the cells. Each row is one `tr`, however many cells it holds.

## --why--

Count the `tr` elements, not the cells. Here there are three, one in `thead` and two in `tbody`.

# --screen-- spotbug

## --code--

```html file=index.html
<table>
  <thead>
    <tr><th>Room</th><th>Category</th><th>Status</th></tr>
  </thead>
  <tbody>
    <tr><td>B-214</td><td>Open</td></tr>
  </tbody>
</table>
```

## --question--

The word `Open` sits under the Category heading. What is wrong?

## --options--

- [x] The data row has two cells, but the header row has three.
  > Yes. The Category cell is missing, so `Open` slides left into the Category column.
- [ ] The `th` cells should be `td` cells.
  > No. Header cells are `th`. Changing them would not add the missing cell.
- [ ] The `thead` should come after the `tbody`.
  > No. The header row goes first, so it sits above the data.
- [ ] A table cannot have only one data row.
  > No. A table can have one data row or a hundred.

## --why--

Every row needs one cell for every column. Count the cells in each row, and make sure the counts match.

# --screen-- order

## --prompt--

Put these in order, from the outside of a table to the inside.

## --items--

- The whole table, `<table>`
- A group of rows, `<thead>` or `<tbody>`
- One row, `<tr>`
- One cell, `<th>` or `<td>`

## --why--

A table holds groups of rows, a row holds cells, and a cell holds the text.

# --screen-- typein

## --prompt--

Build the complaints table for `staff.html`. Inside the `body`, add a `table` with a `thead` and a `tbody`. The header row has six columns: ID, Room, Category, Urgency, Deadline and Status. Add three sample complaints, and fill in all six cells of every row.

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
--editable-region--

--editable-region--
  </body>
</html>
```

## --tests--

Your page should have a `table` element.

```js
assert.exists(document.querySelector('table'));
```

Your table should have a `thead` element that holds the header row, which is a `tr` element.

```js
assert.exists(document.querySelector('table > thead > tr'));
```

Your header row should have six `th` cells, in this order: ID, Room, Category, Urgency, Deadline and Status. Check the spelling.

```js
const heads = [...document.querySelectorAll('thead th')].map((th) => th.textContent.trim());
assert.deepEqual(heads, ['ID', 'Room', 'Category', 'Urgency', 'Deadline', 'Status']);
```

Your table should have a `tbody` element that holds the data rows.

```js
assert.exists(document.querySelector('table > tbody'));
```

Your `tbody` should have exactly three rows. Each row is a `tr` element.

```js
assert.lengthOf(document.querySelectorAll('tbody > tr'), 3);
```

Each data row should have six `td` cells, one for each column. A row with fewer cells puts its values under the wrong headings.

```js
document.querySelectorAll('tbody > tr').forEach((tr) => assert.lengthOf(tr.querySelectorAll('td'), 6));
```

Every `td` cell needs some text. A column looks empty if one of its cells has nothing in it.

```js
document.querySelectorAll('tbody td').forEach((td) => assert.isAbove(td.textContent.trim().length, 0));
```

## --solutions--

```html file=staff.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Staff Dashboard</title>
  </head>
  <body>
    <table>
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
          <td>483</td><td>A-110</td><td>Carpentry</td><td>Low</td><td>7 days</td><td>Resolved</td>
        </tr>
        <tr>
          <td>484</td><td>C-305</td><td>Electrical</td><td>Normal</td><td>72 hours</td><td>In Progress</td>
        </tr>
      </tbody>
    </table>
  </body>
</html>
```

## --why--

A table is a `table` element holding a `thead` with one header row of `th` cells, and a `tbody` with one `tr` of `td` cells for each complaint. This is the shape of the Staff Dashboard.
