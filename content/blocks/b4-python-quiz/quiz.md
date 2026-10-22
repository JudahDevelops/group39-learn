---
draw: 15
pass: 12
---

## --question--

### --text--

How do you put a variable into text in Python?

### --distractors--

- `"Room ${room}"`
- `"Room {room}"`
- `` `Room ${room}` ``

### --answer--

`f"Room {room}"`

### --explanation--

The `f` in front of the quote makes an f-string, and Python replaces `{room}` with the value of `room`. Without the `f`, the braces stay in the text. `${room}` and backticks are JavaScript.

## --question--

### --text--

What is Python's "true"?

### --distractors--

- `true`
- `TRUE`
- `"true"`

### --answer--

`True`

### --explanation--

Python spells its two `bool` values `True` and `False`, each with a capital first letter. Lower-case `true` is JavaScript, and `"true"` in quotes is text.

## --question--

### --text--

What type is the value `24`?

### --distractors--

- `str`
- `float`
- `bool`

### --answer--

`int`

### --explanation--

A whole number without quotes is an `int`. `"24"` in quotes would be a `str`, `2.5` is a `float` and `True` is a `bool`.

## --question--

### --text--

Which line is a comment in Python?

### --distractors--

- `// hours = 72`
- `<!-- hours = 72 -->`
- `/* hours = 72 */`

### --answer--

`# hours = 72`

### --explanation--

A Python comment starts with `#`, and Python ignores the rest of the line. `//` is the JavaScript comment, `<!-- -->` is the HTML comment and `/* */` is the CSS comment.

## --question--

### --text--

What does `print(7 * 24)` show?

### --distractors--

- `7 * 24`
- `724`
- `31`

### --answer--

`168`

### --explanation--

Python works out the sum before it prints: 7 days of 24 hours is 168 hours. It does not print the sum as text, and `*` multiplies.

## --question--

### --text--

How does Python know which lines belong to an `if`?

### --distractors--

- They are inside `{ }`.
- They end with `;`.
- They start with `then`.

### --answer--

They are indented.

### --explanation--

The lines indented under the `if` are its block, and the block ends at the first line that is indented less. Curly braces group lines in JavaScript, and Python lines do not need a semicolon.

## --question--

### --text--

How do you add an item to a list?

### --distractors--

- `items.push(x)`
- `items.add(x)`
- `items + x`

### --answer--

`items.append(x)`

### --explanation--

`append` adds `x` at the end of the list. `push` is the JavaScript word, and a Python list has no `add`.

## --question--

### --text--

Which line correctly asks whether `urgency` is equal to `"low"`?

### --distractors--

- `if urgency = "low":`
- `if urgency == "low"`
- `if urgency equals "low":`

### --answer--

`if urgency == "low":`

### --explanation--

Two `==` ask whether two values are equal, and the colon at the end says that an indented block follows. One `=` stores a value, the version without a colon is a syntax error, and Python has no word `equals`.

## --question--

### --text--

With `urgent = True` and `hours_open = 10`, what does `urgent and hours_open > 24` give?

### --distractors--

- `True`
- `10`
- `24`

### --answer--

`False`

### --explanation--

`and` is true only when both sides are true. `urgent` is `True`, but 10 is not greater than 24, so the whole test is `False`.

## --question--

### --text--

A `for` loop goes through `["urgent", "normal", "low", "urgent"]`. It adds 1 to `urgent_count` for each item equal to `"urgent"`, and `urgent_count` starts at 0. What is `urgent_count` at the end?

### --distractors--

- `1`
- `4`
- `0`

### --answer--

`2`

### --explanation--

The loop visits all four items, and two of them are `"urgent"`. `4` is the number of items in the list, but only the matching ones add 1.

## --question--

### --text--

What does `-> int` mean in `def deadline_hours(urgency: str) -> int:`?

### --distractors--

- The function takes a whole number.
- The function prints a whole number.
- The function changes `urgency` into a whole number.

### --answer--

The function returns a whole number.

### --explanation--

The arrow shows the type of the answer the function hands back. What the function takes is written inside the brackets, and `return` hands a value back while `print` shows it on the screen.

## --question--

### --text--

Why does `escalation_level(24, 24)` return 1, not 0?

### --distractors--

- Because of rounding.
- Because the function adds 1 to the deadline.
- Because 24 is an even number.

### --answer--

The rule says *d* ≤ *t*: reaching the deadline counts as overdue.

### --explanation--

Level 0 is only for *t* < *d*. With *t* = 24 and *d* = 24 that test is false, so the level is at least 1. The numbers are exact, and nothing is rounded.

## --question--

### --text--

What does `escalation_level(47, 24)` return?

### --distractors--

- `0`
- `2`
- `47`

### --answer--

`1`

### --explanation--

47 hours is past the 24-hour deadline but under twice the deadline, 48. That is level 1. Level 2 starts at 48.

## --question--

### --text--

What does `escalation_level(48, 24)` return?

### --distractors--

- `1`
- `0`
- `48`

### --answer--

`2`

### --explanation--

48 is exactly twice the deadline of 24. The test `elapsed_hours < 2 * deadline_hours` is false for 48, so the function reaches `return 2`.

## --question--

### --text--

What does `deadline_hours("low")` return?

### --distractors--

- `24`
- `72`
- `None`

### --answer--

`168`

### --explanation--

The two `if` lines are for `"urgent"` and `"normal"`, and neither matches `"low"`. So Python reaches the last line, `return 168`: 7 days of 24 hours. `None` is what a function gives back only when it ends without a `return`.

## --question--

### --text--

A function runs `return 24` on its second line, and it has more lines below. What happens to those lines?

### --distractors--

- They run, and then the function returns 24.
- Python stops with an error.
- They run, but their results are thrown away.

### --answer--

They do not run, because the function ends at the first `return` that runs.

### --explanation--

A `return` hands back the answer and leaves the function at once. That is why `escalation_level` can test `elapsed_hours < deadline_hours` first and rely on the later lines only for longer times.

## --question--

### --text--

What does `DEADLINE_HOURS.get("other")` return when there is no `"other"` key?

### --distractors--

- An error
- `0`
- `"other"`

### --answer--

`None`

### --explanation--

`.get` gives `None` for a missing key instead of stopping the program. Square brackets, as in `DEADLINE_HOURS["other"]`, would stop with an error.

## --question--

### --text--

Why check the "urgent" keywords before the "low" ones?

### --distractors--

- Python requires it.
- Urgent keywords are shorter, so they are quicker to find.
- The "low" keywords would never match otherwise.

### --answer--

If a complaint matches both, the more serious urgency wins.

### --explanation--

The function returns at the first match, so the order of the list decides which urgency wins. Python runs the list in whatever order you write it.

## --question--

### --text--

With `text = "The pipe has BURST in the bathroom"`, what does `"burst" in text.lower()` give?

### --distractors--

- `False`
- `"burst"`
- `None`

### --answer--

`True`

### --explanation--

`.lower()` turns `BURST` into `burst`, so the keyword is found. Without `.lower()`, `"burst" in text` is `False`, because Python treats `B` and `b` as different letters.

## --question--

### --text--

`triage_urgency("My tap is leaking")` returns `None`. Why?

### --distractors--

- The capital `M` at the start stops the match.
- Only the urgent keywords are checked.
- The description is too short to match.

### --answer--

The keyword is `leaking tap`, and the words are in a different order.

### --explanation--

A keyword has to appear exactly as written, with its words in the same order. Capital letters are not the problem, because the function lowers the description first. This is the weakness of keyword matching that the paper describes.

## --question--

### --text--

What does `triage_category` return when no category keyword is found in the description?

### --distractors--

- `None`
- `"normal"`
- An error

### --answer--

`"other"`

### --explanation--

The function ends with `return "other"`, which only runs when no keyword matched. `None` is what `triage_urgency` returns when no urgency keyword matches.

## --question--

### --text--

When no urgency keyword matches, what urgency does Track B use as a placeholder until the group decides?

### --distractors--

- `"urgent"`
- `"low"`
- `None`

### --answer--

`"normal"`

### --explanation--

What to do when no keyword matches is one of six open design decisions, and the placeholder is urgency normal. It is not final. See <a href="/reference/decisions" target="_blank" rel="noopener">Group decisions</a>.

## --question--

### --text--

What is `datetime(...) + timedelta(hours=72)`?

### --distractors--

- The number 72
- A length of time of 72 hours
- A time zone

### --answer--

The moment 72 hours later

### --explanation--

A `datetime` plus a `timedelta` gives another `datetime`. The `timedelta` on its own is the length of time.

## --question--

### --text--

Why store times in UTC with the zone attached?

### --distractors--

- UTC is faster.
- Because Nigeria uses UTC.
- Because Python cannot store a time without UTC.

### --answer--

So there is no doubt which moment a time means.

### --explanation--

A time with its zone names exactly one moment. Nigeria is UTC+1, so a mix of zones gives deadlines that are an hour wrong. Speed has nothing to do with it.

## --question--

### --text--

`now` and `created_at` are both `datetime` values. What is `now - created_at`?

### --distractors--

- A `datetime`
- A whole number of hours
- An error, because moments cannot be subtracted

### --answer--

A `timedelta`: how long the complaint has been open

### --explanation--

Taking one `datetime` from another gives the length of time between them, a `timedelta`. Turning it into hours is a separate step.

## --question--

### --text--

`elapsed` is a `timedelta`. Which expression gives the number of hours in it?

### --distractors--

- `elapsed * 3600`
- `elapsed.hours`
- `elapsed.total_seconds() * 3600`

### --answer--

`elapsed.total_seconds() / 3600`

### --explanation--

`total_seconds()` gives the length in seconds, and there are 3600 seconds in an hour, so you divide. Multiplying by 3600 would give a number far too large.

## --question--

### --text--

An urgent complaint is created at 09:00 UTC on 5 October 2026. When is it due, if `compute_deadline` adds the urgent deadline?

### --distractors--

- 09:00 UTC on 8 October
- 10:00 UTC on 5 October
- 09:00 UTC on 12 October

### --answer--

09:00 UTC on 6 October

### --explanation--

An urgent complaint has 24 hours, which is one day, so it is due at the same time on the next day. A normal complaint would be due on 8 October and a low one on 12 October.

## --question--

### --text--

What is `self`?

### --distractors--

- The class name
- A word that only appears in `__init__`
- The file that holds the class

### --answer--

The particular object a method is working on

### --explanation--

When you call `c.deadline()`, Python passes `c` in as `self`. The class name is `Complaint`, and every method has `self` as its first parameter, not only `__init__`.

## --question--

### --text--

What do you call a function inside a class?

### --distractors--

- A module
- A field
- A docstring

### --answer--

A method

### --explanation--

`deadline` and `is_overdue` are methods of `Complaint`. A module is a Python file that you import, and a field holds a value such as `self.room`.

## --question--

### --text--

What does `__init__` do?

### --distractors--

- It deletes the object when you have finished with it.
- It prints the object.
- It runs the object's methods in order.

### --answer--

It runs when you create an object, and it sets the object's fields.

### --explanation--

In `Complaint`, `__init__` stores `room`, `urgency` and `created_at` on the object with `self.room = room` and so on. Without that, the object would have no fields to read.

## --question--

### --text--

The object `c` is a `Complaint` with a field called `room`. How do you read it?

### --distractors--

- `c["room"]`
- `c.room()`
- `room(c)`

### --answer--

`c.room`

### --explanation--

A field is read with a dot and the name, with no brackets. Brackets are for calling a method, and square brackets are for lists and dictionaries.

## --question--

### --text--

How do you call the method `deadline` on the `Complaint` object `c`?

### --distractors--

- `deadline(c)`
- `c.deadline`
- `Complaint.deadline`

### --answer--

`c.deadline()`

### --explanation--

A method is called on an object, with brackets. `c.deadline` without brackets is the method itself and does not run it.
