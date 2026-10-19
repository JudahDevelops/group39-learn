# --screen-- concept

Python is the language of the IHMS server: FastAPI is written in it. These lessons run Python in your browser. Python downloads once, the first time you press Run on a device. Press Run, then change `room` to your own room number.

::: tryit python
```python file=main.py
room = "B-214"
hours = 24
print(f"Urgent complaints in {room} must be fixed within {hours} hours")
```
:::

## --callout-- info

Later, in chapter B5, you will install Python on your laptop.

# --screen-- concept

`room = "B-214"` stores a value under a name. The name is a **variable**. An **f-string** has an `f` before the opening quote. Python replaces each `{name}` inside it with the value of that variable.

## --code--

```python file=main.py
print(f"Urgent complaints in {room} must be fixed within {hours} hours")
```

# --screen-- mcq

## --question--

How do you put a variable into text in Python?

## --options--

- [x] `f"Room {room}"`
  > Yes. The `f` in front of the quote makes it an f-string, and `{room}` is replaced by the value of `room`.
- [ ] `"Room ${room}"`
  > No. That is JavaScript's style, and it needs backticks there. Python prints `${room}` as plain text.
- [ ] `"Room {room}"`
  > No. Without the `f`, Python prints the braces as plain text: `Room {room}`.
- [ ] `` `Room ${room}` ``
  > No. Python does not use backticks for text, so this is a syntax error.

## --why--

An f-string starts with `f` and holds names in curly braces. Python fills in the values when it runs the line.

# --screen-- spotbug

## --code--

```python file=main.py
room = "B-214"
print("Room {room} has a leak")
```

## --question--

The output is `Room {room} has a leak`, with the braces still in it. What is wrong?

## --options--

- [x] The string is missing the `f` before the opening quote.
  > Yes. Without the `f`, Python does not fill in the braces. `f"Room {room} has a leak"` prints `Room B-214 has a leak`.
- [ ] The variable `room` is not defined.
  > No. `room` is set on the first line. If it were missing, Python would stop with an error instead of printing.
- [ ] The `print` line needs a semicolon at the end.
  > No. Python lines do not end with semicolons.
- [ ] The braces should be round brackets.
  > No. Round brackets are used to call functions. Curly braces are how an f-string marks a name.

## --why--

The `f` is what tells Python to look inside the braces. Check the quote first.

# --screen-- tapbuild

## --prompt--

Build the line that prints the hours inside a sentence.

## --template--

```python
hours = 24
___(___"Fixed within {hours} hours")
```

## --tokens--

- `print`
- `f`
- `console.log`
- `echo`

## --answer--

- `print`
- `f`

## --why--

`print` shows the text, and the `f` before the quote fills in `{hours}`. `console.log` is the JavaScript word for printing, and Python has no `echo`.

# --screen-- concept

If you know JavaScript, the ideas are the same. Only the spelling changes.

| Idea | Python | JavaScript, for comparison |
|---|---|---|
| Variable | `room = "B-214"` | `const room = "B-214";` |
| Text with values | `f"Room {room}"` | `` `Room ${room}` `` |
| Print | `print(...)` | `console.log(...)` |
| Comment | `# note` | `// note` |
| True/false | `True`, `False` | `true`, `false` |

# --screen-- match

## --prompt--

Match each JavaScript line to the Python line that does the same job.

## --pairs--

- `console.log(...)`
  - `print(...)`
- `// note`
  - `# note`
- `true`
  - `True`
- `const room = "B-214";`
  - `room = "B-214"`

## --why--

Python needs no `const` or `let` and no semicolon. A comment starts with `#`, and `True` and `False` start with a capital letter.

# --screen-- predict

## --code--

```python file=main.py
# hours = 72
hours = 24
print(f"Fixed within {hours} hours")
```

## --question--

What does this print?

## --options--

- [x] `Fixed within 24 hours`
  > Yes. The first line starts with `#`, so Python ignores it. `hours` is 24.
- [ ] `Fixed within 72 hours`
  > No. A line that starts with `#` is a comment. Python skips it, so `hours` is never set to 72.
- [ ] `Fixed within {hours} hours`
  > No. The `f` before the quote fills in the braces.
- [ ] An error, because of the first line
  > No. A comment can go anywhere in a program. It is there for the reader.

## --why--

Everything after `#` on a line is a note for people. Python does not run it.

# --screen-- concept

Every value has a **type**. `type()` tells you what it is. Press Run to see four types.

::: tryit python
```python file=main.py
print(type("B-214"))
print(type(24))
print(type(2.5))
print(type(True))
```
:::

| Type | Is | Example |
|---|---|---|
| `str` | Text | `"B-214"` |
| `int` | A whole number | `24` |
| `float` | A decimal | `2.5` |
| `bool` | `True` or `False` | `True` |

# --screen-- multi

## --question--

Select every value that is a `str`.

## --options--

- [x] `"B-214"`
  > Yes. Text in quotes is a `str`.
- [x] `"24"`
  > Yes. The quotes make it text, even though it looks like a number.
- [ ] `24`
  > No. Without quotes this is an `int`, a whole number.
- [ ] `True`
  > No. `True` is a `bool`.
- [x] `"True"`
  > Yes. In quotes it is text, not a `bool`.

## --why--

Quotes make a value a `str`. Without them, `24` is an `int` and `True` is a `bool`.

# --screen-- mcq

## --question--

What is Python's "true"?

## --options--

- [x] `True`
  > Yes. It starts with a capital T.
- [ ] `true`
  > No. Lower-case `true` is JavaScript. Python does not know that name and stops with an error.
- [ ] `TRUE`
  > No. Python cares about capitals, and only `True` is the value.
- [ ] `"true"`
  > No. In quotes it is text, a `str`, not a `bool`.

## --why--

Python spells its two `bool` values `True` and `False`, each with a capital first letter.

# --screen-- typein

## --prompt--

Describe a complaint. Make three variables: `room` (text, such as `"B-214"`), `category` (text, such as `"plumbing"`) and `urgency` (one of `"urgent"`, `"normal"` or `"low"`). Use an f-string to print one sentence that has all three in it. On the next line, print the number of hours in 7 days. Let Python work it out.

## --seed-contents--

```python file=main.py
# Describe a complaint.
--editable-region--

--editable-region--
```

## --tests--

Your code should have a variable called `room`.

```py
assert defines('room')
```

Your code should have a variable called `category`.

```py
assert defines('category')
```

Your code should have a variable called `urgency`.

```py
assert defines('urgency')
```

Your `room` and `category` should be text, so put them in quotes.

```py
assert isinstance(room, str) and isinstance(category, str)
```

Your `urgency` should be `"urgent"`, `"normal"` or `"low"`.

```py
assert urgency in ('urgent', 'normal', 'low')
```

Your sentence should be an f-string: put an `f` before the opening quote.

```py
import ast
assert any(isinstance(n, ast.JoinedStr) for n in ast.walk(_tree))
```

Your sentence should have your `room`, your `category` and your `urgency` in it. Put each one in curly braces.

```py
assert room in _stdout and category in _stdout and urgency in _stdout
```

Your code should print `168`, the number of hours in 7 days, on a line of its own.

```py
assert '168' in _stdout.splitlines()
```

Let Python work out the 168 with a calculation, such as `7 * 24`, instead of typing the answer.

```py
import ast
assert any(isinstance(n, ast.BinOp) for n in ast.walk(_tree))
```

## --solutions--

```python file=main.py
# Describe a complaint.
room = "B-214"
category = "plumbing"
urgency = "urgent"
print(f"Complaint in {room}: {category}, {urgency}")
print(7 * 24)
```

## --why--

A variable stores a value under a name, and an f-string puts those values into a sentence. Python can also do the sum for you: `7 * 24` is 168.
