# --screen-- concept

JavaScript makes a page do things. It lives in its own file, `script.js`. A `script` element at the end of the `head` loads it. The `defer` attribute makes the script wait until the whole page has loaded, so it can find every element on the page.

::: tryit web
```html file=index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>IHMS</title>
    <script src="script.js" defer></script>
  </head>
  <body>
    <h1>Staff Dashboard</h1>
  </body>
</html>
```

```js file=script.js
console.log("Hello from the Staff Dashboard");
```
:::

## --callout-- tip

The message from `script.js` appears in the console under the preview. Change the text in the quotes and press Run.

# --screen-- concept

The **console** is where a page prints messages and errors. `console.log` prints whatever you give it. In your own browser, press F12 (or right-click and choose Inspect), then open the Console tab. In this course the console sits under each Try it.

::: tryit web
```js file=script.js
console.log("Hello from the Staff Dashboard");
console.log(24);
console.log("Room", "B-214");
```
:::

## --callout-- info

Give `console.log` several values, separated by commas, and it prints them on one line with a space between.

# --screen-- concept

A **variable** is a name for a value. Use `const` for a value that will not change, and `let` for one that will. Press Run: the status changes, the room does not.

::: tryit web
```js file=script.js
const room = "B-214";
let status = "Open";
console.log(status);
status = "Assigned";
console.log(status);
console.log(room);
```
:::

## --callout-- info

Text goes inside quotation marks, such as `"B-214"`. Those quotes are not part of the text.

# --screen-- mcq

## --question--

Which keyword makes a variable that can't be reassigned?

## --options--

- [x] `const`
  > Yes. A `const` keeps the value it was given, such as a room number.
- [ ] `let`
  > No. A `let` variable can be given a new value later, such as a status that changes.
- [ ] `set`
  > No. JavaScript has no `set` for variables. You declare one with `const` or `let`.
- [ ] `fixed`
  > No. `fixed` is not a JavaScript keyword.

## --why--

`const` is for values that stay the same. `let` is for values you plan to change.

# --screen-- predict

## --code--

```js file=script.js
let status = "Open";
status = "Assigned";
console.log(status);
```

## --question--

What does the console show?

## --options--

- [x] Assigned
  > Yes. The second line gives `status` a new value, and the log runs after it.
- [ ] Open
  > No. `status` starts as "Open", but the second line changes it before the log.
- [ ] status
  > No. `status` has no quotes, so it is the variable, and the console shows its value.
- [ ] An error
  > No. A `let` variable may be given a new value. Only a `const` refuses.

## --why--

Code runs from the top, one line at a time. By the time `console.log` runs, `status` holds "Assigned".

# --screen-- spotbug

## --code--

```js file=script.js
const room = "B-214";
room = "A-110";
console.log(room);
```

## --question--

The console shows an error instead of A-110. What is wrong?

## --options--

- [x] `room` is a `const`, so it cannot be given a new value.
  > Yes. The console says "Assignment to constant variable". Declare `room` with `let` if it needs to change.
- [ ] `console.log` cannot print text.
  > No. `console.log` prints text, numbers and other values.
- [ ] The second line needs `const` in front of `room`.
  > No. That would declare `room` a second time, which is also an error.
- [ ] The room needs single quotes instead of double quotes.
  > No. Both kinds of quotes make text. The problem is the new value.

## --why--

A `const` cannot be changed after it is set. Use `let` for a value that will change.

# --screen-- concept

Every value has a **type**. Text is a **string**, written in quotes. A **number** has no quotes. A **boolean** is `true` or `false`. The `typeof` keyword tells you the type of a value.

::: tryit web
```js file=script.js
console.log(typeof "plumbing");
console.log(typeof 24);
console.log(typeof 0.5);
console.log(typeof true);
console.log(typeof "24");
```
:::

## --callout-- warning

`"24"` has quotes, so it is text, not a number.

# --screen-- predict

## --code--

```js file=script.js
console.log(typeof "168");
```

## --question--

What does the console show?

## --options--

- [x] string
  > Yes. The quotes make it text, even though every character is a digit.
- [ ] number
  > No. A number is written without quotes. Quotes make a string.
- [ ] 168
  > No. `typeof` prints the name of the type, not the value.
- [ ] boolean
  > No. A boolean is only `true` or `false`.

## --why--

Quotes decide the type. `168` is a number and `"168"` is a string.

# --screen-- concept

A **template literal** puts values into text. Write it with backticks instead of quotes, and put each value inside `${...}`. The brackets can hold a calculation, too.

::: tryit web
```js file=script.js
const hours = 24;
console.log(`Urgent complaints must be fixed within ${hours} hours`);
console.log(`That's ${hours * 60} minutes`);
```
:::

## --callout-- tip

The backtick key is usually below Esc, to the left of the 1 key.

# --screen-- tapbuild

## --prompt--

Finish the line so that it logs: Urgent complaints must be fixed within 24 hours

## --template--

```js
const hours = 24;
console.log(`Urgent complaints must be fixed within ___ hours`);
```

## --tokens--

- `${hours}`
- `{hours}`
- `$(hours)`
- `hours`
- `"hours"`

## --answer--

- `${hours}`

## --why--

A value inside a template literal goes in `${...}`. With any other brackets, or without the `$`, the console prints those characters as plain text.

# --screen-- predict

## --code--

```js file=script.js
const days = 2;
console.log(`${days * 24} hours`);
```

## --question--

What does the console show?

## --options--

- [x] 48 hours
  > Yes. The calculation 2 times 24 is worked out first, and the answer goes into the text.
- [ ] days * 24 hours
  > No. Inside `${...}` the calculation is worked out. It is not printed as written.
- [ ] 2 * 24 hours
  > No. You see the answer, 48, not the sum.
- [ ] ${48} hours
  > No. The `${...}` is replaced by the answer. It does not stay in the text.

## --why--

Everything inside `${...}` is worked out, and the answer takes its place in the text.

# --screen-- concept

Text that a visitor types into a page is always a string, even when it looks like a number. `Number()` turns a string into a number. `Math.round()` rounds to the nearest whole number. To keep two decimal places, multiply by 100, round, then divide by 100.

::: tryit web
```js file=script.js
console.log("24" + 1);
console.log(Number("24") + 1);
console.log(Math.round(8333.33));
console.log(Math.round(8333.5));
console.log(Math.round(4.1111 * 100) / 100);
```
:::

## --callout-- warning

`+` joins two strings, but it adds two numbers. `"24" + 1` joins, so it gives `241`.

# --screen-- predict

## --code--

```js file=script.js
const hours = "72";
console.log(hours + 1);
```

## --question--

What does the console show?

## --options--

- [x] 721
  > Yes. `hours` is a string, so `+` joins the text "72" and the 1.
- [ ] 73
  > No. That would need a number. `"72"` is in quotes, so it is a string, and `+` joins instead of adding.
- [ ] 72 1
  > No. `+` joins the two pieces with nothing between them.
- [ ] An error
  > No. JavaScript lets you join a string and a number. It just does not add them.

## --why--

A string and a number joined with `+` make a longer string. Write `Number(hours) + 1` to add, which gives 73.

# --screen-- typein

## --prompt--

Write the first lines of `script.js` for the Staff Dashboard. Store a room, a category and an urgency in three variables called `room`, `category` and `urgency`. Log one sentence that describes the complaint and includes all three. Then log how many hours there are in 7 days.

## --seed-contents--

```js file=script.js
--editable-region--

--editable-region--
```

## --tests--

Your code should have a variable called `room` that holds some text.

```js
assert.isString(room);
assert.isAbove(room.length, 0);
```

Your code should have a variable called `category` that holds some text.

```js
assert.isString(category);
assert.isAbove(category.length, 0);
```

Your code should have a variable called `urgency` that holds some text.

```js
assert.isString(urgency);
assert.isAbove(urgency.length, 0);
```

Your code should log one sentence that includes your `room`, your `category` and your `urgency`.

```js
const lines = [];
const real = console.log;
console.log = (...args) => lines.push(args.join(' '));
try { (0, eval)(files['script.js']); } finally { console.log = real; }
assert.isTrue(lines.some((l) => l.includes(room) && l.includes(category) && l.includes(urgency)));
```

Your code should log `168`, the number of hours in 7 days. You can write `7 * 24`.

```js
const lines = [];
const real = console.log;
console.log = (...args) => lines.push(args.join(' '));
try { (0, eval)(files['script.js']); } finally { console.log = real; }
assert.include(lines, '168');
```

## --solutions--

```js file=script.js
const room = "B-214";
const category = "plumbing";
const urgency = "urgent";

console.log(`Complaint in room ${room}: ${category}, ${urgency}`);
console.log(7 * 24);
```

## --why--

Variables hold the pieces, and a template literal puts them into one sentence. Seven days of 24 hours is `7 * 24`, which is 168.
