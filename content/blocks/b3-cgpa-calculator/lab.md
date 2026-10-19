# --description--

<!-- TODO(source): course-content.md does not give a grade-point scale. The A 5, B 4, C 3, D 2, E 1, F 0 scale in user story 2 and in gradePoints tests is the usual 5-point scale, used here as an exercise rule. Confirm it with the group or the lecturer before publishing. -->

Build a CGPA calculator for a university student, like the example. Use the user stories as your checklist: when every test passes, the lab is done. The page, `cgpa.html`, is written except for the link to your script. `script.js` is empty. You write all of the JavaScript.

CGPA is the average of the grade points a student earned, weighted by credit units: a 4-unit course counts twice as much as a 2-unit course.

# --user-stories--

1. Your `cgpa.html` has a `script` element in the `head` that loads `script.js` and has the `defer` attribute.
2. Your `script.js` has a function `gradePoints(grade)` that returns the grade points for a letter on the 5-point scale: A is 5, B is 4, C is 3, D is 2, E is 1 and F is 0.
3. Your `script.js` has a function `calculateCgpa(list)` that takes an array of course objects, each with `units` and `grade`. It returns the total of units times grade points, divided by the total units, rounded to 2 decimal places. For an empty array it returns 0.
4. Your `script.js` has an array called `courses` that starts empty.
5. When the user clicks `#add`, your code adds one object to `courses` with the `code` text, the `units` as a number, and the `grade` letter.
6. It also adds a row to the `tbody` of `#courses` with three cells: the code, the units and the grade.
7. After each course is added, the `#cgpa` paragraph shows `CGPA: ` followed by the CGPA of all the courses so far, such as `CGPA: 4.6`.
8. After a course is added, the `#code` and `#units` fields are empty, ready for the next course.
9. If the course code is empty, no course is added and the `#message` paragraph says `Enter a course code.`
10. If the units are empty or 0, no course is added and the `#message` paragraph says `Enter the credit units, 1 or more.`
11. A course added successfully clears the `#message` paragraph.
12. A course code is shown as plain text in its row. A code such as `<b>GST 102</b>` appears with its tags visible and does not turn bold.

# --hints--

Your `head` element should have a `script` element.

```js
assert.match(code, /<head[\s>][\s\S]*<script[\s>][\s\S]*<\/head\s*>/i);
```

Your `script` element should have the attribute `src="script.js"` and the `defer` attribute.

```js
assert.match(code, /<script\s[^>]*src\s*=\s*("|')(?:\.\/)?script\.js\1[^>]*>/i);
assert.match(code, /<script\s[^>]*\bdefer\b[^>]*>/i);
```

Your code should define a function called `gradePoints`.

```js
assert.isFunction(gradePoints);
```

`gradePoints("A")` should return `5` and `gradePoints("B")` should return `4`.

```js
assert.strictEqual(gradePoints('A'), 5);
assert.strictEqual(gradePoints('B'), 4);
```

`gradePoints("C")` should return `3` and `gradePoints("D")` should return `2`.

```js
assert.strictEqual(gradePoints('C'), 3);
assert.strictEqual(gradePoints('D'), 2);
```

`gradePoints("E")` should return `1` and `gradePoints("F")` should return `0`.

```js
assert.strictEqual(gradePoints('E'), 1);
assert.strictEqual(gradePoints('F'), 0);
```

Your code should define a function called `calculateCgpa`.

```js
assert.isFunction(calculateCgpa);
```

`calculateCgpa([])` should return `0`. Check for zero total units before you divide.

```js
assert.strictEqual(calculateCgpa([]), 0);
```

A 3-unit A and a 2-unit B should give a CGPA of `4.6`: the units count as weights.

```js
assert.strictEqual(calculateCgpa([{ units: 3, grade: 'A' }, { units: 2, grade: 'B' }]), 4.6);
```

The CGPA should be rounded to 2 decimal places. A 3-unit A, a 3-unit A and a 3-unit B should give `4.67`.

```js
assert.strictEqual(calculateCgpa([{ units: 3, grade: 'A' }, { units: 3, grade: 'A' }, { units: 3, grade: 'B' }]), 4.67);
```

Your code should have an array called `courses` that starts empty.

```js
assert.isArray(courses);
assert.lengthOf(courses, 0);
```

Clicking `#add` with the code `GST101`, 3 units and the grade A should add one object to `courses`. Its `code` should be `GST101`, its `units` the number `3` and its `grade` the letter `A`.

```js
document.querySelector('#code').value = 'GST101';
document.querySelector('#units').value = '3';
document.querySelector('#grade').value = 'A';
document.querySelector('#add').click();
assert.lengthOf(courses, 1);
assert.strictEqual(courses[0].code, 'GST101');
assert.strictEqual(courses[0].units, 3);
assert.strictEqual(courses[0].grade, 'A');
```

Your table should have one row for the course you added, with three cells: `GST101`, `3` and `A`.

```js
const rows = document.querySelectorAll('#courses tbody tr');
assert.lengthOf(rows, 1);
const cells = [...rows[0].children].map((td) => td.textContent.trim());
assert.deepEqual(cells, ['GST101', '3', 'A']);
```

After one 3-unit A, the `#cgpa` paragraph should say `CGPA: 5`.

```js
assert.equal(document.querySelector('#cgpa').textContent.trim(), 'CGPA: 5');
```

Add `MTH101` with 2 units and the grade B. The `#cgpa` paragraph should now say `CGPA: 4.6`, and the table should have two rows.

```js
document.querySelector('#code').value = 'MTH101';
document.querySelector('#units').value = '2';
document.querySelector('#grade').value = 'B';
document.querySelector('#add').click();
assert.equal(document.querySelector('#cgpa').textContent.trim(), 'CGPA: 4.6');
assert.lengthOf(document.querySelectorAll('#courses tbody tr'), 2);
```

Add `PHY101` with 4 units and the grade C. The `#cgpa` paragraph should say `CGPA: 3.89`, and the `#code` and `#units` fields should be empty afterwards.

```js
document.querySelector('#code').value = 'PHY101';
document.querySelector('#units').value = '4';
document.querySelector('#grade').value = 'C';
document.querySelector('#add').click();
assert.equal(document.querySelector('#cgpa').textContent.trim(), 'CGPA: 3.89');
assert.equal(document.querySelector('#code').value, '');
assert.equal(document.querySelector('#units').value, '');
```

With an empty course code, the `#message` paragraph should say `Enter a course code.`

```js
document.querySelector('#code').value = '';
document.querySelector('#units').value = '3';
document.querySelector('#grade').value = 'B';
document.querySelector('#add').click();
assert.equal(document.querySelector('#message').textContent.trim(), 'Enter a course code.');
```

With an empty course code, no course should be added. `courses` and the table should stay as they were.

```js
document.querySelector('#code').value = '';
document.querySelector('#units').value = '3';
document.querySelector('#grade').value = 'B';
document.querySelector('#add').click();
assert.lengthOf(courses, 3);
assert.lengthOf(document.querySelectorAll('#courses tbody tr'), 3);
```

With empty units or 0 units, the `#message` paragraph should say `Enter the credit units, 1 or more.`

```js
const codeField = document.querySelector('#code');
const unitsField = document.querySelector('#units');
for (const value of ['', '0']) {
  codeField.value = 'GST103';
  unitsField.value = value;
  document.querySelector('#add').click();
  assert.equal(document.querySelector('#message').textContent.trim(), 'Enter the credit units, 1 or more.');
}
```

With empty units or 0 units, no course should be added.

```js
const codeField = document.querySelector('#code');
const unitsField = document.querySelector('#units');
for (const value of ['', '0']) {
  codeField.value = 'GST103';
  unitsField.value = value;
  document.querySelector('#add').click();
  assert.lengthOf(courses, 3);
  assert.lengthOf(document.querySelectorAll('#courses tbody tr'), 3);
}
```

A course added successfully should clear the `#message` paragraph. Add `MTH102` with 3 units and the grade D: the message should be empty, and the `#cgpa` paragraph should say `CGPA: 3.42`.

```js
document.querySelector('#code').value = 'MTH102';
document.querySelector('#units').value = '3';
document.querySelector('#grade').value = 'D';
document.querySelector('#add').click();
assert.equal(document.querySelector('#message').textContent.trim(), '');
assert.equal(document.querySelector('#cgpa').textContent.trim(), 'CGPA: 3.42');
```

A course code should be shown as plain text. After adding the code `<b>GST 102</b>`, the last row should show those characters as text, and the table should contain no `b` element.

```js
document.querySelector('#code').value = '<b>GST 102</b>';
document.querySelector('#units').value = '2';
document.querySelector('#grade').value = 'A';
document.querySelector('#add').click();
const rows = document.querySelectorAll('#courses tbody tr');
assert.equal(rows[rows.length - 1].children[0].textContent, '<b>GST 102</b>');
assert.lengthOf(document.querySelectorAll('#courses b'), 0);
```

# --seed--

## --seed-contents--

```html file=cgpa.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>CGPA Calculator</title>
    <style>
      body { font-family: system-ui, sans-serif; max-width: 32rem; margin: 2rem auto; padding: 0 1rem; }
      label, input, select, button { display: block; margin-top: 0.75rem; }
      td, th { padding: 4px 12px; text-align: left; }
    </style>
  </head>
  <body>
    <main>
      <h1>CGPA Calculator</h1>
      <p>Add each course with its credit units and grade. The CGPA updates after every course.</p>
      <label for="code">Course code</label>
      <input type="text" id="code">
      <label for="units">Credit units</label>
      <input type="number" id="units">
      <label for="grade">Grade</label>
      <select id="grade">
        <option>A</option>
        <option>B</option>
        <option>C</option>
        <option>D</option>
        <option>E</option>
        <option>F</option>
      </select>
      <button type="button" id="add">Add course</button>
      <p id="message"></p>
      <table id="courses">
        <thead>
          <tr><th>Course</th><th>Units</th><th>Grade</th></tr>
        </thead>
        <tbody></tbody>
      </table>
      <p id="cgpa">CGPA: 0</p>
    </main>
  </body>
</html>
```

```js file=script.js

```

# --solutions--

```html file=cgpa.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>CGPA Calculator</title>
    <style>
      body { font-family: system-ui, sans-serif; max-width: 32rem; margin: 2rem auto; padding: 0 1rem; }
      label, input, select, button { display: block; margin-top: 0.75rem; }
      td, th { padding: 4px 12px; text-align: left; }
    </style>
    <script src="script.js" defer></script>
  </head>
  <body>
    <main>
      <h1>CGPA Calculator</h1>
      <p>Add each course with its credit units and grade. The CGPA updates after every course.</p>
      <label for="code">Course code</label>
      <input type="text" id="code">
      <label for="units">Credit units</label>
      <input type="number" id="units">
      <label for="grade">Grade</label>
      <select id="grade">
        <option>A</option>
        <option>B</option>
        <option>C</option>
        <option>D</option>
        <option>E</option>
        <option>F</option>
      </select>
      <button type="button" id="add">Add course</button>
      <p id="message"></p>
      <table id="courses">
        <thead>
          <tr><th>Course</th><th>Units</th><th>Grade</th></tr>
        </thead>
        <tbody></tbody>
      </table>
      <p id="cgpa">CGPA: 0</p>
    </main>
  </body>
</html>
```

```js file=script.js
const courses = [];

const codeInput = document.querySelector("#code");
const unitsInput = document.querySelector("#units");
const gradeSelect = document.querySelector("#grade");
const addButton = document.querySelector("#add");
const message = document.querySelector("#message");
const tbody = document.querySelector("#courses tbody");
const cgpaText = document.querySelector("#cgpa");

function gradePoints(grade) {
  if (grade === "A") return 5;
  if (grade === "B") return 4;
  if (grade === "C") return 3;
  if (grade === "D") return 2;
  if (grade === "E") return 1;
  return 0;
}

function calculateCgpa(list) {
  let totalPoints = 0;
  let totalUnits = 0;

  for (const course of list) {
    totalPoints = totalPoints + course.units * gradePoints(course.grade);
    totalUnits = totalUnits + course.units;
  }

  if (totalUnits === 0) {
    return 0;
  }
  return Math.round((totalPoints / totalUnits) * 100) / 100;
}

function cell(text) {
  const td = document.createElement("td");
  td.textContent = text;
  return td;
}

function addCourse() {
  const code = codeInput.value;
  const units = Number(unitsInput.value);
  const grade = gradeSelect.value;

  if (code === "") {
    message.textContent = "Enter a course code.";
    return;
  }

  if (units <= 0) {
    message.textContent = "Enter the credit units, 1 or more.";
    return;
  }

  courses.push({ code: code, units: units, grade: grade });

  const row = document.createElement("tr");
  row.append(cell(code), cell(units), cell(grade));
  tbody.append(row);

  cgpaText.textContent = `CGPA: ${calculateCgpa(courses)}`;
  message.textContent = "";
  codeInput.value = "";
  unitsInput.value = "";
}

addButton.addEventListener("click", addCourse);
```

# --help--

## --hint--

Build from the bottom up. Write the two functions that only calculate, `gradePoints` and `calculateCgpa`, and try them with `console.log` before you connect anything to the page.

## --hint--

CGPA is a weighted average. While you loop through the courses, keep two running totals: the grade points earned, which is each course's units times its grade points, and the units. The CGPA is the first total divided by the second. To keep two decimal places, multiply, round, then divide.

## --hint--

For the page, find the elements, listen for the click, read and check the values, and then change what is shown. Decide first whether the input is good. Only a good course reaches the array, the table and the CGPA. Set text with `textContent`, so a course code can never run as HTML.
