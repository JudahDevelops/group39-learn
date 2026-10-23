---
draw: 15
pass: 12
---

## --question--

### --text--

Which line links a script and makes it wait until the page has loaded?

### --distractors--

- `<script src="js/staff.js" wait></script>`
- `<link rel="script" href="js/staff.js">`
- `<js src="js/staff.js" defer></js>`

### --answer--

`<script src="js/staff.js" defer></script>`

### --explanation--

A `script` element loads a JavaScript file, and `defer` makes it wait for the whole page. `wait` is not an attribute, a `link` element loads stylesheets, and `js` is not an element.

## --question--

### --text--

Where do you read what `console.log` prints?

### --distractors--

- On the page, under the heading
- In the page title
- In the `script` element's `src` attribute

### --answer--

In the Console tab of the browser, opened with F12

### --explanation--

`console.log` writes to the console, not to the page. The browser's developer tools show it in the Console tab, and this course shows it under each Try it.

## --question--

### --text--

Which keyword makes a variable that cannot be given a new value?

### --distractors--

- `let`
- `fixed`
- `var`

### --answer--

`const`

### --explanation--

A `const` keeps the value it was given. A `let` variable can be changed later, and `fixed` is not a JavaScript keyword. `var` is an older way to declare a variable that can be changed.

## --question--

### --text--

What is the type of the value `"168"`, with the quotation marks?

### --distractors--

- Number
- Boolean
- Array

### --answer--

String

### --explanation--

Quotes make a value a string, even when every character is a digit. `168` without quotes would be a number.

## --question--

### --text--

What does `` console.log(`${2 * 24} hours`) `` show?

### --distractors--

- 2 * 24 hours
- ${2 * 24} hours
- 24 hours

### --answer--

48 hours

### --explanation--

The calculation inside `${...}` is worked out first and its answer goes into the text. With backticks, the text is not printed as written.

## --question--

### --text--

What does the console show after this code?

```js
let status = "Open";
status = "Assigned";
console.log(status);
```

### --distractors--

- Open
- status
- An error

### --answer--

Assigned

### --explanation--

Code runs from the top. The second line gives the `let` variable a new value before the log. Only a `const` refuses a new value.

## --question--

### --text--

What is `["a", "b", "c"][1]`?

### --distractors--

- `"a"`
- `"c"`
- `1`

### --answer--

`"b"`

### --explanation--

Counting starts at 0, so index 0 is `"a"` and index 1 is `"b"`.

## --question--

### --text--

Which operator means "and", so that both conditions must be true?

### --distractors--

- `||`
- `!`
- `==`

### --answer--

`&&`

### --explanation--

`&&` is true only when both sides are true. `||` means "or", `!` means "not", and `==` compares two values.

## --question--

### --text--

Why does this code log the "else" message?

```js
const urgency = "Urgent";
if (urgency === "urgent") {
  console.log("24 hours");
} else {
  console.log("Other");
}
```

### --distractors--

- `const` values cannot be compared
- An `if` needs an `else if` before the `else`
- Text can only be compared with `==`

### --answer--

`===` compares exactly, and the capital U makes the two texts different

### --explanation--

Comparing text is exact, capital letters included. `"Urgent"` is not `"urgent"`, so the condition is false and the `else` block runs.

## --question--

### --text--

What is wrong with `if (urgency = "urgent")`?

### --distractors--

- `if` cannot test text
- The word `urgent` needs single quotes
- It needs a semicolon after the bracket

### --answer--

A single `=` gives `urgency` a value instead of comparing it

### --explanation--

One `=` assigns. Three `===` compare. Inside an `if`, the assignment hides the bug because the new value is true.

## --question--

### --text--

The array `["urgent", "low", "urgent", "normal"]` is stored in `urgencies`. What does `urgencies.length` give?

### --distractors--

- 3
- 0
- "urgent"

### --answer--

4

### --explanation--

`length` is the number of items. The last index is 3, because counting starts at 0, but there are four items.

## --question--

### --text--

How many times does the block of `for (const u of urgencies) { ... }` run?

### --distractors--

- Once, whatever the array holds
- Once for each letter in the variable name
- Until you press a key

### --answer--

Once for each item in `urgencies`

### --explanation--

A `for ... of` loop takes the items one at a time, and `u` holds the current item inside the block.

## --question--

### --text--

What does `return` do inside a function?

### --distractors--

- Prints the value in the console
- Runs the function again
- Saves the value in the page

### --answer--

Ends the function and hands a value back to the line that called it

### --explanation--

`return` sends a value back to the caller. Printing is the job of `console.log`.

## --question--

### --text--

What does this log?

```js
function hoursToMinutes(hours) {
  hours * 60;
}
console.log(hoursToMinutes(24));
```

### --distractors--

- `1440`
- `24`
- An error

### --answer--

`undefined`

### --explanation--

The function works out the answer but never returns it, so the call gives back `undefined`. Write `return hours * 60;`.

## --question--

### --text--

How do you read the `room` of an object called `complaint`?

### --distractors--

- `complaint(room)`
- `complaint->room`
- `room.complaint`

### --answer--

`complaint.room`

### --explanation--

A dot and the property name read the value. Round brackets call a function, and JavaScript has no `->`.

## --question--

### --text--

What does `filter` give back?

### --distractors--

- The first item that passes the test
- `true` or `false`
- The number of items that pass

### --answer--

A new array of the items that pass the test

### --explanation--

`filter` keeps the items where the test is true and returns them as a new array. `find` returns the first matching item.

## --question--

### --text--

`complaints` has three complaints and one is Resolved. How many items are in `complaints.filter(c => c.status !== "Resolved")`?

### --distractors--

- 1
- 3
- 0

### --answer--

2

### --explanation--

Two complaints pass the test `!== "Resolved"`. The Resolved one is left out.

## --question--

### --text--

Which line builds an array of every complaint's room?

### --distractors--

- `complaints.filter(c => c.room)`
- `complaints.find(c => c.room)`
- `complaints.room`

### --answer--

`complaints.map(c => c.room)`

### --explanation--

`map` changes every item, so it makes the array of rooms. `filter` keeps items, `find` returns one item, and an array has no `room` of its own.

## --question--

### --text--

The console shows `undefined` for `found.room`. What is wrong?

```js
const found = complaints.filter(c => c.id === 483);
console.log(found.room);
```

### --distractors--

- `room` should be written `Room`
- `c.id === 483` should be `c.id = 483`
- `complaints` needs `.length` after it

### --answer--

`filter` gives back an array, which has no `room`. Use `find` to get the complaint itself

### --explanation--

`found` is a list holding one complaint. `find` returns the complaint itself, so `found.room` would work.

## --question--

### --text--

Why show a complaint description with `textContent` instead of inserting it as HTML?

### --distractors--

- It is faster
- HTML cannot show text
- `textContent` makes the text bold

### --answer--

So text a user typed cannot run as code on someone else's page

### --explanation--

A description could contain tags or code. With `textContent` it is only ever shown, never run.

## --question--

### --text--

What does `event.preventDefault()` do in a form's `submit` listener?

### --distractors--

- Clears the form
- Sends the form to the server
- Stops the user typing

### --answer--

Stops the browser reloading the page

### --explanation--

A submit makes the browser load the page again. `preventDefault()` stops that, so your code can handle the form itself.

## --question--

### --text--

Which event fires when the user picks a different option in a drop-down?

### --distractors--

- `submit`
- `load`
- `select`

### --answer--

`change`

### --explanation--

A `select` element fires `change` when its value changes. `submit` belongs to forms.

## --question--

### --text--

A script in the `head` has no `defer`, and `document.querySelector("h1")` gives `null`. Why?

### --distractors--

- `querySelector` cannot find headings
- The selector should be `.h1`
- `null` is what `querySelector` gives for every element

### --answer--

The script runs before the `h1` exists on the page

### --explanation--

A script can only find elements that already exist. `defer` holds it back until the whole page has loaded.

## --question--

### --text--

The first line of `render(list)` is `tbody.replaceChildren();`. What is it for?

### --distractors--

- It makes the table body bigger
- It copies the rows to a new table
- It sorts the list

### --answer--

It clears the old rows, so calling `render` again does not pile up rows

### --explanation--

`render` draws whatever list it is given. Clearing first means the table shows only that list.

## --question--

### --text--

What is the `.value` of a `textarea`?

### --distractors--

- The number of lines in it
- The id of the element
- Always an empty text

### --answer--

The text inside it, at that moment

### --explanation--

`.value` reads whatever the user has typed. Read it inside the listener, so you get the text at the moment of the submit.

## --question--

### --text--

What do you get when you subtract one `Date` from another?

### --distractors--

- A new date
- The difference in days
- A string such as `"1 day"`

### --answer--

The difference in milliseconds

### --explanation--

Subtracting dates gives a plain number of milliseconds. Divide it to get hours.

## --question--

### --text--

What does this log?

```js
const x = 5;
console.log(x > 0 ? "yes" : "no");
```

### --distractors--

- no
- true
- `x > 0`

### --answer--

yes

### --explanation--

The part after `?` is used when the condition is true, and 5 is greater than 0. The condition picks one of the two texts. It does not print true or false.

## --question--

### --text--

A normal complaint was submitted 100 hours ago. Its deadline length d is 72 hours. What is its escalation level L?

### --distractors--

- 0
- 2
- 3

### --answer--

1

### --explanation--

L is 1 when d ≤ t < 2d. Here 72 ≤ 100 < 144. Level 0 is for t below d, and level 2 starts at 2d, which is 144.

## --question--

### --text--

An urgent complaint, with d = 24 hours, has been open for exactly 48 hours. What is its escalation level L?

### --distractors--

- 0
- 1
- 24

### --answer--

2

### --explanation--

L is 2 when t ≥ 2d. Here 2d is 48, so exactly 48 hours is level 2. The edge belongs to the higher level.

## --question--

### --text--

What does `await` do?

### --distractors--

- Makes the code run faster
- Repeats the request
- Turns the reply into JavaScript objects

### --answer--

Waits for the result before the code carries on

### --explanation--

`await` pauses the function until the slow thing finishes. Turning the reply into objects is the job of `response.json()`.

## --question--

### --text--

When does the `catch` block run?

### --distractors--

- Always, after `try`
- Before the `try` block
- Only when the page loads

### --answer--

When something in the `try` block fails

### --explanation--

If everything in `try` works, `catch` is skipped. A thrown error, a failed `fetch` or a broken JSON file all send the code to `catch`.

## --question--

### --text--

`fetch("complaints-old.json")` asks for a file that is not in the project. What happens?

### --distractors--

- `fetch` throws an error straight away
- The reply has status 200 and an empty list
- The page reloads

### --answer--

A reply comes back with status 404 and `response.ok` is `false`

### --explanation--

A missing file still gets a reply. Your code has to check `response.ok` and turn a bad reply into an error.

## --question--

### --text--

For which statuses is `response.ok` true?

### --distractors--

- Only 200
- Any status the server sends
- 400 to 499

### --answer--

200 to 299

### --explanation--

`ok` is true for every success status, 200 to 299. A 404 or a 500 is outside that range.

## --question--

### --text--

What does `await response.json()` give you?

### --distractors--

- The status number of the reply
- The same JSON text as a string
- A copy of the file name

### --answer--

The JSON text turned into JavaScript objects

### --explanation--

`json()` reads the reply and turns the JSON into objects and arrays you can loop over. Use `response.status` for the status number.

## --question--

### --text--

Which of these is valid JSON?

### --distractors--

- `{ id: 482, room: "B-214" }`
- `{ 'id': 482, 'room': 'B-214' }`
- `{ "id": 482, "room": "B-214", }`

### --answer--

`{ "id": 482, "room": "B-214" }`

### --explanation--

In JSON every key and every piece of text is in double quotes, and there is no comma after the last item.

## --question--

### --text--

A `catch` block only runs `console.log(err.message)`. Why is that not enough for the student using the page?

### --distractors--

- `err.message` is always empty
- `console.log` cannot show text
- The `try` block would stop working

### --answer--

The student never opens the console, so the page itself has to show the message

### --explanation--

The console is for the developer. A message in an element on the page, such as `#error`, is how the user finds out what went wrong.
