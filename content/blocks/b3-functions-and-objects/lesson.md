# --screen-- concept

A **function** packages code you can reuse. It takes **parameters**, the values it needs, and it can **return** a value. Calling `deadlineHours("normal")` runs the function with `urgency` set to `"normal"`.

::: tryit web
```js file=script.js
function deadlineHours(urgency) {
  if (urgency === "urgent") return 24;
  if (urgency === "normal") return 72;
  return 168;
}

console.log(deadlineHours("urgent"));
console.log(deadlineHours("normal"));
console.log(deadlineHours("low"));
```
:::

## --callout-- info

An urgent complaint has 24 hours, a normal one 72 hours, and a low one 7 days, which is 168 hours.

# --screen-- predict

## --code--

```js file=script.js
function deadlineHours(urgency) {
  if (urgency === "urgent") return 24;
  if (urgency === "normal") return 72;
  return 168;
}

console.log(deadlineHours("low"));
```

## --question--

What does the console show?

## --options--

- [x] 168
  > Yes. Neither `if` matches `"low"`, so the function reaches its last line and returns 168.
- [ ] 72
  > No. 72 is returned only when `urgency` is `"normal"`.
- [ ] undefined
  > No. The last line of the function returns 168, so a value always comes back.
- [ ] low
  > No. The function returns a deadline in hours. It does not return the word it was given.

## --why--

`return` ends the function and hands a value back to the line that called it. When no `if` matches, the last line runs.

# --screen-- spotbug

## --code--

```js file=script.js
function hoursToMinutes(hours) {
  hours * 60;
}

console.log(hoursToMinutes(24));
```

## --question--

The console shows `undefined` instead of 1440. What is wrong?

## --options--

- [x] The function works out `hours * 60` but never returns it.
  > Yes. Without `return`, the answer is thrown away and the call gives back `undefined`.
- [ ] `hours` should be declared with `const`.
  > No. A parameter is already a variable. The caller gives it its value.
- [ ] `console.log` cannot show the result of a function.
  > No. `console.log` prints whatever the call gives back. Here that is nothing.
- [ ] The 24 needs quotation marks.
  > No. 24 is a number, so it is written without quotes.

## --why--

A function gives something back only when it uses `return`. Write `return hours * 60;`.

# --screen-- tapbuild

## --prompt--

Finish the function that turns hours into minutes. The call below it shows the name.

## --template--

```js
function ___(hours) {
  ___ hours * 60;
}

console.log(hoursToMinutes(24));
```

## --tokens--

- `hoursToMinutes`
- `return`
- `hours`
- `minutes`
- `console.log`
- `let`

## --answer--

- `hoursToMinutes`
- `return`

## --why--

The function must have the name that the call uses. `return` hands the answer back, so `console.log` has something to print.

# --screen-- concept

An **object** groups related values under names. Each **property** is a name, a colon and a value, and properties are separated by commas. Read a property with a dot: `complaint.room`.

::: tryit web
```js file=script.js
const complaint = {
  id: 482,
  room: "B-214",
  category: "plumbing",
  urgency: "urgent",
  status: "Open",
};

console.log(complaint.room);
console.log(complaint.status);
```
:::

## --callout-- tip

Add `console.log(complaint.category);` at the end and press Run.

# --screen-- predict

## --code--

```js file=script.js
const complaint = { id: 482, room: "B-214", category: "plumbing" };
console.log(complaint.category);
console.log(complaint.id + 1);
```

## --question--

What does the console show?

## --options--

- [x] plumbing, then 483
  > Yes. `complaint.category` is the value "plumbing". `complaint.id` is the number 482, so `+ 1` adds.
- [ ] category, then 483
  > No. `complaint.category` reads the value of the property, not its name.
- [ ] plumbing, then 4821
  > No. `482` has no quotes, so it is a number and `+ 1` adds instead of joining.
- [ ] plumbing, then 482
  > No. The `+ 1` is still worked out, so 482 becomes 483.

## --why--

A dot reads the value stored under a name. That value has a type like any other, and numbers can be added.

# --screen-- mcq

## --question--

How do you read the `room` of `complaint`?

## --options--

- [x] `complaint.room`
  > Yes. A dot and the property name read the value.
- [ ] `complaint(room)`
  > No. Round brackets call a function. `complaint` is an object, not a function.
- [ ] `complaint->room`
  > No. JavaScript has no `->`. Use a dot.
- [ ] `room.complaint`
  > No. That is the wrong way round. It reads a property called `complaint` from something called `room`.

## --why--

Write the object, a dot, then the name of the property.

# --screen-- concept

A list of records is an **array of objects**. This is also how the server will send complaints to the dashboards. `complaints[1].room` is the room of the second complaint.

::: tryit web
```js file=script.js
const complaints = [
  { id: 482, room: "B-214", category: "plumbing", urgency: "urgent", status: "Open" },
  { id: 483, room: "A-110", category: "carpentry", urgency: "low", status: "Resolved" },
  { id: 484, room: "C-305", category: "electrical", urgency: "normal", status: "In Progress" },
];

console.log(complaints.length);
console.log(complaints[1].room);
```
:::

## --callout-- tip

Read it from left to right: the array, the item at index 1, then its `room`.

# --screen-- concept

Array methods go through a list for you. Each takes a small function written with an **arrow**. In `c => c.room`, the arrow means: for each complaint `c`, give back `c.room`. `filter` keeps some items, `map` changes every item, and `find` gets the first match.

::: tryit web
```js file=script.js
const complaints = [
  { id: 482, room: "B-214", category: "plumbing", urgency: "urgent", status: "Open" },
  { id: 483, room: "A-110", category: "carpentry", urgency: "low", status: "Resolved" },
  { id: 484, room: "C-305", category: "electrical", urgency: "normal", status: "In Progress" },
];

const unresolved = complaints.filter(c => c.status !== "Resolved");
console.log(unresolved.length);

const rooms = complaints.map(c => c.room);
console.log(rooms);

const found = complaints.find(c => c.id === 483);
console.log(found.category);
```
:::

# --screen-- match

## --prompt--

Match each array method to what it gives back.

## --pairs--

- `filter`
  - A new array of the items that pass the test
- `map`
  - A new array with every item changed
- `find`
  - The first item that passes the test

## --why--

`filter` and `map` give back a whole array. `find` gives back one item.

# --screen-- predict

## --code--

```js file=script.js
const complaints = [
  { id: 482, status: "Open" },
  { id: 483, status: "Resolved" },
  { id: 484, status: "In Progress" },
];

const unresolved = complaints.filter(c => c.status !== "Resolved");
console.log(unresolved.length);
```

## --question--

What does the console show?

## --options--

- [x] 2
  > Yes. Complaints 482 and 484 pass the test, so the new array holds two items.
- [ ] 1
  > No. Only one complaint is Resolved. `filter` keeps the other two.
- [ ] 3
  > No. Complaint 483 fails the test, so `filter` leaves it out.
- [ ] true
  > No. `filter` gives back an array, not true or false. The arrow function's test decides which items stay.

## --why--

`filter` runs the test on every item and keeps the ones where the test is true. `!==` means "is not equal to".

# --screen-- spotbug

## --code--

```js file=script.js
const complaints = [
  { id: 482, room: "B-214" },
  { id: 483, room: "A-110" },
];

const found = complaints.filter(c => c.id === 483);
console.log(found.room);
```

## --question--

The console shows `undefined` instead of A-110. What is wrong?

## --options--

- [x] `filter` gives back an array, and an array has no `room`. Use `find` to get the complaint itself.
  > Yes. `found` is a list holding one complaint. `find` gives back the complaint, so `found.room` works.
- [ ] The test should be `c.id = 483`.
  > No. A single `=` gives a value instead of comparing. The test `c.id === 483` is correct.
- [ ] `room` should be written `Room`.
  > No. The property is called `room`, in small letters, just as in the object.
- [ ] `complaints` needs `.length` after it.
  > No. `.length` is a number of items. It would not help `filter` return a single complaint.

## --why--

Use `filter` when you want a list, and `find` when you want one item.

# --screen-- tapbuild

## --prompt--

Build the line that makes an array of every complaint's room.

## --template--

```js
const rooms = complaints.___(c => ___);
```

## --tokens--

- `map`
- `filter`
- `find`
- `c.room`
- `room`
- `c.id`

## --answer--

- `map`
- `c.room`

## --why--

`map` changes every item, so it makes the array of rooms. Each item is a complaint `c`, so its room is `c.room`. A bare `room` is not defined.

# --screen-- typein

## --prompt--

Use the `complaints` array below.

1. Write a function `deadlineHours(urgency)` that returns 24 for urgent, 72 for normal and 168 for low.
2. With `filter`, make an array called `unresolved` that holds the complaints that are not Resolved.
3. With `map` and `deadlineHours`, make an array called `deadlines` that holds each complaint's deadline in hours.

## --seed-contents--

```js file=script.js
const complaints = [
  { id: 482, room: "B-214", category: "plumbing", urgency: "urgent", status: "Open" },
  { id: 483, room: "A-110", category: "carpentry", urgency: "low", status: "Resolved" },
  { id: 484, room: "C-305", category: "electrical", urgency: "normal", status: "In Progress" },
];

--editable-region--

--editable-region--
```

## --tests--

Your code should define a function called `deadlineHours`.

```js
assert.isFunction(deadlineHours);
```

`deadlineHours("urgent")` should return `24`.

```js
assert.strictEqual(deadlineHours("urgent"), 24);
```

`deadlineHours("normal")` should return `72`.

```js
assert.strictEqual(deadlineHours("normal"), 72);
```

`deadlineHours("low")` should return `168`, which is 7 days in hours.

```js
assert.strictEqual(deadlineHours("low"), 168);
```

Your array `unresolved` should hold the two complaints that are not Resolved: 482 and 484.

```js
assert.deepEqual(unresolved.map((c) => c.id), [482, 484]);
```

Make `unresolved` with `filter`.

```js
assert.match(files['script.js'], /\.filter\s*\(/);
```

Your array `deadlines` should be `[24, 168, 72]`: one deadline for each complaint, in the same order as `complaints`.

```js
assert.deepEqual(deadlines, [24, 168, 72]);
```

Make `deadlines` with `map`, and call `deadlineHours` for each complaint.

```js
const src = files['script.js'];
assert.match(src, /\.map\s*\(/);
assert.isAtLeast((src.match(/deadlineHours\s*\(/g) || []).length, 2);
```

## --solutions--

```js file=script.js
const complaints = [
  { id: 482, room: "B-214", category: "plumbing", urgency: "urgent", status: "Open" },
  { id: 483, room: "A-110", category: "carpentry", urgency: "low", status: "Resolved" },
  { id: 484, room: "C-305", category: "electrical", urgency: "normal", status: "In Progress" },
];

function deadlineHours(urgency) {
  if (urgency === "urgent") return 24;
  if (urgency === "normal") return 72;
  return 168;
}

const unresolved = complaints.filter(c => c.status !== "Resolved");
const deadlines = complaints.map(c => deadlineHours(c.urgency));
```

## --why--

The function holds the deadline rule in one place. `filter` keeps the complaints that pass a test, and `map` turns each complaint into its deadline by calling that function.
