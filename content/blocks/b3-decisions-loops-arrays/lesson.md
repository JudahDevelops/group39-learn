# --screen-- concept

A **decision** runs code only when a condition is true. `if` checks the first condition, `else if` checks the next one, and `else` runs when nothing above it matched. Change `urgency` and press Run.

::: tryit web
```js file=script.js
const urgency = "urgent";
if (urgency === "urgent") {
  console.log("Deadline: 24 hours");
} else if (urgency === "normal") {
  console.log("Deadline: 72 hours");
} else {
  console.log("Deadline: 7 days");
}
```
:::

## --callout-- tip

Change `"urgent"` to `"normal"`, then to `"low"`, and press Run each time.

# --screen-- predict

## --code--

```js file=script.js
const urgency = "Urgent";
if (urgency === "urgent") {
  console.log("Deadline: 24 hours");
} else if (urgency === "normal") {
  console.log("Deadline: 72 hours");
} else {
  console.log("Deadline: 7 days");
}
```

## --question--

What does the console show?

## --options--

- [x] Deadline: 7 days
  > Yes. `"Urgent"` with a capital U is not the same text as `"urgent"`. Neither condition matches, so `else` runs.
- [ ] Deadline: 24 hours
  > No. The first condition compares with `"urgent"` in small letters, and capital letters count as different text.
- [ ] Deadline: 72 hours
  > No. `"Urgent"` is not `"normal"` in any spelling.
- [ ] Nothing
  > No. A chain that ends with `else` always runs one of its blocks.

## --why--

Comparing text is exact, capital letters included. When no condition matches, the `else` block runs.

# --screen-- concept

Use `===` to compare two values, and `<`, `>`, `<=` and `>=` to compare sizes. `&&` means "and": both sides must be true. `||` means "or": one side is enough. `!` means "not": it flips true to false.

::: tryit web
```js file=script.js
const urgency = "urgent";
const status = "Open";
console.log(urgency === "urgent");
console.log(24 >= 24);
console.log(urgency === "urgent" && status === "Resolved");
console.log(urgency === "low" || status === "Open");
console.log(!(status === "Open"));
```
:::

## --callout-- warning

One `=` gives a value to a variable. Three `===` compare two values.

# --screen-- spotbug

## --code--

```js file=script.js
let urgency = "low";
if (urgency = "urgent") {
  console.log("Deadline: 24 hours");
} else {
  console.log("Deadline: 7 days");
}
```

## --question--

The urgency is `"low"`, but the console shows 24 hours. What is wrong?

## --options--

- [x] The condition uses `=`, which gives `urgency` a new value, instead of `===`, which compares.
  > Yes. `urgency = "urgent"` sets the variable to "urgent", and that counts as true, so the first block always runs.
- [ ] The `else` needs a condition of its own.
  > No. `else` runs when the conditions above it fail, so it takes no condition.
- [ ] `urgency` should be a `const`.
  > No. A `const` would make it worse: giving it a new value would raise an error.
- [ ] The text needs backticks instead of quotes.
  > No. Backticks are for template literals. Plain quotes make text.

## --why--

Inside an `if`, write `===` to compare. A single `=` changes the variable and hides the bug.

# --screen-- match

## --prompt--

Match each operator to what it means.

## --pairs--

- `===`
  - Is equal to
- `&&`
  - And: both sides must be true
- `||`
  - Or: at least one side must be true
- `!`
  - Not: flips true to false

## --why--

Operators combine conditions. `&&` is strict, `||` is generous, and `!` turns a condition around.

# --screen-- concept

An **array** holds a list of values in order. Counting starts at 0, so the first item has **index** 0. Write the index in square brackets. `.length` is how many items the array holds, and `.push(item)` adds one at the end.

::: tryit web
```js file=script.js
const urgencies = ["urgent", "low", "urgent", "normal"];
console.log(urgencies[0]);
console.log(urgencies[3]);
console.log(urgencies.length);

urgencies.push("low");
console.log(urgencies.length);
```
:::

## --callout-- warning

There are four items, but the last index is 3. Counting starts at 0.

# --screen-- predict

## --code--

```js file=script.js
const rooms = ["B-214", "A-110", "C-305"];
console.log(rooms[0]);
console.log(rooms.length);
```

## --question--

What does the console show?

## --options--

- [x] B-214, then 3
  > Yes. Index 0 is the first room, and the array holds three items.
- [ ] A-110, then 3
  > No. Counting starts at 0, so A-110 is index 1, not index 0.
- [ ] B-214, then 2
  > No. `length` counts the items. Three items give 3, even though the last index is 2.
- [ ] B-214, then C-305
  > No. `length` is a number, not the last item.

## --why--

An index says where an item sits, starting from 0. `length` says how many items there are.

# --screen-- mcq

## --question--

What is `["a", "b", "c"][1]`?

## --options--

- [ ] `"a"`
  > No. `"a"` is at index 0, because counting starts at 0.
- [x] `"b"`
  > Yes. Index 1 is the second item.
- [ ] `"c"`
  > No. `"c"` is at index 2.
- [ ] `1`
  > No. The 1 is the index. The expression gives the item at that index.

## --why--

Read the number in the brackets as a position counted from 0: 0 is first, 1 is second, 2 is third.

# --screen-- concept

A **loop** repeats code for each item in an array. In `for (const u of urgencies)`, the block runs once per item, and `u` holds the current item. This loop counts the urgent ones.

::: tryit web
```js file=script.js
const urgencies = ["urgent", "low", "urgent", "normal"];
let urgentCount = 0;
for (const u of urgencies) {
  if (u === "urgent") {
    urgentCount = urgentCount + 1;
  }
}
console.log(urgentCount);
```
:::

## --callout-- tip

Add `console.log(u);` as the first line inside the loop and press Run. You will see each item go by.

# --screen-- order

## --prompt--

Put the steps of counting the urgent complaints in order.

## --items--

- Start a counter at 0
- Take the next urgency from the array
- Check whether it is "urgent"
- If it is, add 1 to the counter
- After the last item, log the counter

## --why--

The counter starts before the loop. The check and the addition happen once for each item, inside the loop. The log comes after the loop has ended.

# --screen-- predict

## --code--

```js file=script.js
const rooms = ["B-214", "A-110", "C-305"];
for (const room of rooms) {
  console.log(`Room ${room}`);
}
```

## --question--

What does the console show?

## --options--

- [x] Three lines: Room B-214, Room A-110 and Room C-305
  > Yes. The log is inside the loop, so it runs once for each room.
- [ ] One line: Room B-214,A-110,C-305
  > No. The log is inside the loop, so it runs once for each room, not once for the whole array.
- [ ] Only Room B-214
  > No. A loop goes through every item in the array, not just the first.
- [ ] Room rooms, three times
  > No. `${room}` is the variable that holds the current item, so each line shows a real room.

## --why--

The block between the curly brackets runs once for each item. `room` holds a different room each time.

# --screen-- tapbuild

## --prompt--

Finish the loop that counts the urgent complaints.

## --template--

```js
let urgentCount = 0;
for (const u of urgencies) {
  if (u ___ "urgent") {
    urgentCount = ___ + 1;
  }
}
```

## --tokens--

- `===`
- `=`
- `urgentCount`
- `u`
- `urgencies`

## --answer--

- `===`
- `urgentCount`

## --why--

The condition compares with `===`. A single `=` would change `u` instead. The counter grows by taking its own value and adding 1, so `urgentCount` goes on the right.

# --screen-- typein

## --prompt--

The array below holds the urgency of six complaints. Count how many are urgent, how many are normal and how many are low. Use a loop. Then log three lines: `urgent 2`, `normal 1` and `low 3`.

## --seed-contents--

```js file=script.js
const urgencies = ["urgent", "normal", "low", "urgent", "low", "low"];

--editable-region--

--editable-region--
```

## --tests--

Your code should use a `for` loop to go through the array.

```js
assert.match(files['script.js'], /\bfor\s*\(/);
```

Your code should log `urgent 2`. Log the word and the count: `console.log("urgent", urgentCount)`.

```js
const lines = [];
const real = console.log;
console.log = (...args) => lines.push(args.join(' '));
try { (0, eval)(files['script.js']); } finally { console.log = real; }
assert.include(lines, 'urgent 2');
```

Your code should log `normal 1`.

```js
const lines = [];
const real = console.log;
console.log = (...args) => lines.push(args.join(' '));
try { (0, eval)(files['script.js']); } finally { console.log = real; }
assert.include(lines, 'normal 1');
```

Your code should log `low 3`.

```js
const lines = [];
const real = console.log;
console.log = (...args) => lines.push(args.join(' '));
try { (0, eval)(files['script.js']); } finally { console.log = real; }
assert.include(lines, 'low 3');
```

Your counts should come from the `urgencies` array, not from numbers you typed. Change the array and the counts should change with it.

```js
const lines = [];
const real = console.log;
console.log = (...args) => lines.push(args.join(' '));
const changed = files['script.js'].replace(/\[[^\]]*\]/, '["low", "low", "urgent"]');
try { (0, eval)(changed); } finally { console.log = real; }
assert.include(lines, 'urgent 1');
assert.include(lines, 'normal 0');
assert.include(lines, 'low 2');
```

## --solutions--

```js file=script.js
const urgencies = ["urgent", "normal", "low", "urgent", "low", "low"];

let urgentCount = 0;
let normalCount = 0;
let lowCount = 0;

for (const u of urgencies) {
  if (u === "urgent") {
    urgentCount = urgentCount + 1;
  } else if (u === "normal") {
    normalCount = normalCount + 1;
  } else {
    lowCount = lowCount + 1;
  }
}

console.log("urgent", urgentCount);
console.log("normal", normalCount);
console.log("low", lowCount);
```

## --why--

Three counters start at 0. The loop looks at each urgency once and adds 1 to the matching counter. The three logs come after the loop, when the counting is finished.
