# --description--

Build the Staff Dashboard page, like the example. Hall wardens and maintenance officers use it to see the complaints for their unit or hostel. Use the user stories as your checklist: when every test passes, the lab is done. The nav, the filter and the table headings are given exactly. You choose the complaints in the table.

# --user-stories--

1. Your page has a `<!DOCTYPE html>` declaration and an `html` element with the `lang` attribute set to `en`.
2. Your `html` element has a `head` element. It holds a `meta` element with `charset` set to `UTF-8`, and a `title` element with the text `Staff Dashboard`.
3. Your `html` element has a `body` element. It holds a `header` element, a `main` element and a `footer` element, in that order.
4. Your `footer` element has a `p` element with some text.
5. Your page has exactly one `h1` element. It is inside the `header` and has the text `Staff Dashboard`.
6. Your `header` element has a `nav` element with four links, in order: `Home` to `index.html`, `Student Portal` to `student.html`, `Staff Dashboard` to `staff.html` and `Admin Dashboard` to `admin.html`.
7. Your `main` element has a `label` element with the text `Show` and a `select` element. The `label` has `for` set to `status-filter` and the `select` has `id` set to `status-filter`.
8. Your `select` element has five `option` elements. Their text is `All complaints`, `Open`, `Assigned`, `In Progress` and `Resolved`, and their `value` attributes are `all`, `Open`, `Assigned`, `In Progress` and `Resolved`.
9. Below the `select` element, your `main` element has a `table` element with the `id` `complaints`. Its `thead` element has one header row of six `th` cells: `ID`, `Room`, `Category`, `Urgency`, `Deadline` and `Status`.
10. Your `table` element has a `tbody` element with at least three rows. Every row has six `td` cells with text in them.
11. In every row, the Category is plumbing, electrical, carpentry, sanitation or other. The Urgency is urgent, normal or low. The Status is Open, Assigned, In Progress or Resolved.
12. In every row, the Deadline matches the Urgency: `24 hours` for urgent, `72 hours` for normal and `7 days` for low.

# --hints--

Your staff page should have the doctype `<!DOCTYPE html>`.

```js
assert.match(code, /<!DOCTYPE html>/i);
```

Your page should have an `html` element with the attribute `lang="en"`.

```js
assert.match(code, /<html\s[^>]*lang\s*=\s*("|')en\1[^>]*>/i);
```

Your `html` element needs a closing tag. Closing tags have a `/` just after the `<`.

```js
assert.match(code, /<\/html\s*>/i);
```

Your `html` element should have a `head` element with an opening tag and a closing tag.

```js
assert.match(code, /<head[\s>][\s\S]*<\/head\s*>/i);
```

Your `head` element should have a `meta` element with the attribute `charset="UTF-8"`.

```js
const meta = document.querySelector('head > meta[charset]');
assert.exists(meta);
assert.equal(meta.getAttribute('charset').toUpperCase(), 'UTF-8');
```

Your `head` element should have a `title` element with the text `Staff Dashboard`, and the `title` needs a closing tag.

```js
assert.match(code, /<\/title\s*>/i);
assert.equal(document.querySelector('head > title')?.textContent.trim(), 'Staff Dashboard');
```

Your `html` element should have a `body` element with an opening tag and a closing tag.

```js
assert.match(code, /<body[\s>][\s\S]*<\/body\s*>/i);
```

Your `body` element should have a `header` element, a `main` element and a `footer` element, in that order. Each needs an opening tag and a closing tag.

```js
const names = [...document.body.children].map((el) => el.tagName);
const header = names.indexOf('HEADER');
const main = names.indexOf('MAIN');
const footer = names.indexOf('FOOTER');
assert.isAtLeast(header, 0);
assert.isAbove(main, header);
assert.isAbove(footer, main);
```

Your `footer` element should have a `p` element with some text.

```js
const p = document.querySelector('footer > p');
assert.exists(p);
assert.isAbove(p.textContent.trim().length, 0);
```

Your page should have exactly one `h1` element, and it should be inside the `header` element.

```js
assert.lengthOf(document.querySelectorAll('h1'), 1);
assert.exists(document.querySelector('header > h1'));
```

Your `h1` element should have the text `Staff Dashboard`. Check the spelling and the capital letters.

```js
assert.equal(document.querySelector('h1')?.textContent.trim(), 'Staff Dashboard');
```

Your `header` element should have a `nav` element with four links. Each link is an `a` element.

```js
assert.lengthOf(document.querySelectorAll('header > nav > a'), 4);
```

Your links should go to `index.html`, `student.html`, `staff.html` and `admin.html`, in that order. Check that each `href` has the file name spelled exactly.

```js
const hrefs = [...document.querySelectorAll('header > nav > a')].map((a) => a.getAttribute('href'));
assert.deepEqual(hrefs, ['index.html', 'student.html', 'staff.html', 'admin.html']);
```

Your links should have the text `Home`, `Student Portal`, `Staff Dashboard` and `Admin Dashboard`, in that order. Check the spelling.

```js
const texts = [...document.querySelectorAll('header > nav > a')].map((a) => a.textContent.trim());
assert.deepEqual(texts, ['Home', 'Student Portal', 'Staff Dashboard', 'Admin Dashboard']);
```

Your `main` element should have a `label` element with the attribute `for="status-filter"`.

```js
assert.exists(document.querySelector('main label[for="status-filter"]'));
```

Your `label` element should have the text `Show`, and it needs a closing tag, `</label>`.

```js
assert.match(code, /<\/label\s*>/i);
assert.equal(document.querySelector('main label[for="status-filter"]')?.textContent.trim(), 'Show');
```

Your `main` element should have a `select` element with the attribute `id="status-filter"`. The label's `for` points to this `id`, so spell it the same.

```js
assert.exists(document.querySelector('main select#status-filter'));
assert.match(code, /<\/select\s*>/i);
```

Your `select` element should have five `option` elements, and each needs a closing tag, `</option>`.

```js
assert.lengthOf(document.querySelectorAll('#status-filter > option'), 5);
assert.lengthOf(code.match(/<\/option\s*>/gi) ?? [], 5);
```

Your `option` elements should have the text `All complaints`, `Open`, `Assigned`, `In Progress` and `Resolved`, in that order. Check the spelling and the capital letters.

```js
const texts = [...document.querySelectorAll('#status-filter > option')].map((o) => o.textContent.trim());
assert.deepEqual(texts, ['All complaints', 'Open', 'Assigned', 'In Progress', 'Resolved']);
```

Your `option` elements should have the `value` attributes `all`, `Open`, `Assigned`, `In Progress` and `Resolved`, in that order. The text a visitor reads and the value the page uses are not the same for the first option.

```js
const values = [...document.querySelectorAll('#status-filter > option')].map((o) => o.getAttribute('value'));
assert.deepEqual(values, ['all', 'Open', 'Assigned', 'In Progress', 'Resolved']);
```

Your `main` element should have a `table` element with the attribute `id="complaints"`, and the table needs a closing tag, `</table>`.

```js
assert.exists(document.querySelector('main > table#complaints'));
assert.match(code, /<\/table\s*>/i);
```

Your `table` element should come below the `select` element, not above it.

```js
const select = document.querySelector('#status-filter');
const table = document.querySelector('#complaints');
assert.exists(select);
assert.isTrue(Boolean(select.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING));
```

Your `table` element should have a `thead` element that holds one row, a `tr` element.

```js
assert.exists(document.querySelector('#complaints > thead > tr'));
assert.match(code, /<\/thead\s*>/i);
```

Your header row should have six `th` cells, and each needs a closing tag, `</th>`.

```js
assert.lengthOf(document.querySelectorAll('#complaints thead th'), 6);
assert.lengthOf(code.match(/<\/th\s*>/gi) ?? [], 6);
```

Your six `th` cells should have the text `ID`, `Room`, `Category`, `Urgency`, `Deadline` and `Status`, in that order. Check the spelling.

```js
const heads = [...document.querySelectorAll('#complaints thead th')].map((th) => th.textContent.trim());
assert.deepEqual(heads, ['ID', 'Room', 'Category', 'Urgency', 'Deadline', 'Status']);
```

Your `table` element should have a `tbody` element with at least three rows. Each row is a `tr` element.

```js
assert.exists(document.querySelector('#complaints > tbody'));
assert.isAtLeast(document.querySelectorAll('#complaints > tbody > tr').length, 3);
```

Each row should have six `td` cells, one for each heading, and each cell needs some text. A row with fewer cells puts its values under the wrong headings.

```js
const rows = document.querySelectorAll('#complaints > tbody > tr');
rows.forEach((tr) => {
  assert.lengthOf(tr.querySelectorAll('td'), 6);
  tr.querySelectorAll('td').forEach((td) => assert.isAbove(td.textContent.trim().length, 0));
});
```

Every `tr` and `td` element needs a closing tag, `</tr>` and `</td>`, with a `/` just after the `<`.

```js
const rowCount = document.querySelectorAll('#complaints tr').length;
assert.lengthOf(code.match(/<\/tr\s*>/gi) ?? [], rowCount);
assert.lengthOf(code.match(/<\/td\s*>/gi) ?? [], (rowCount - 1) * 6);
```

In every row, the Category should be plumbing, electrical, carpentry, sanitation or other.

```js
const rows = [...document.querySelectorAll('#complaints > tbody > tr')].map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent.replace(/\s+/g, ' ').trim()));
assert.isAbove(rows.length, 0);
rows.forEach((row) => assert.include(['plumbing', 'electrical', 'carpentry', 'sanitation', 'other'], row[2].toLowerCase()));
```

In every row, the Urgency should be urgent, normal or low.

```js
const rows = [...document.querySelectorAll('#complaints > tbody > tr')].map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent.replace(/\s+/g, ' ').trim()));
assert.isAbove(rows.length, 0);
rows.forEach((row) => assert.include(['urgent', 'normal', 'low'], row[3].toLowerCase()));
```

In every row, the Status should be Open, Assigned, In Progress or Resolved.

```js
const rows = [...document.querySelectorAll('#complaints > tbody > tr')].map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent.replace(/\s+/g, ' ').trim()));
assert.isAbove(rows.length, 0);
rows.forEach((row) => assert.include(['open', 'assigned', 'in progress', 'resolved'], row[5].toLowerCase()));
```

In every row, the Deadline should match the Urgency: `24 hours` for urgent, `72 hours` for normal and `7 days` for low.

```js
const expected = { urgent: /^24\s*(h|hrs?|hours?)$/i, normal: /^72\s*(h|hrs?|hours?)$/i, low: /^7\s*days?$/i };
const rows = [...document.querySelectorAll('#complaints > tbody > tr')].map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent.replace(/\s+/g, ' ').trim()));
assert.isAbove(rows.length, 0);
rows.forEach((row) => assert.match(row[4], expected[row[3].toLowerCase()]));
```

# --seed--

## --seed-contents--

```html file=staff.html

```

# --solutions--

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

# --help--

## --hint--

Build the page from the outside in. First write the parts every page has, then the `header`, `main` and `footer`, then fill each one a user story at a time and check after each.

## --hint--

A drop-down needs two kinds of element: one that wraps the whole list, and one for each choice. The words a visitor reads and the value the page uses are not always the same.

## --hint--

A table has a group for the header and a group for the data. Count the cells in each row: every row needs one cell for every column. Take the categories, urgencies, statuses and deadlines from the user stories.
