# --screen-- concept

**Indentation matters in Python.** The lines inside an `if` are indented by four spaces. That is how Python knows where the block ends. Change `"normal"` to `"urgent"` and press Run.

::: tryit python
```python file=main.py
urgency = "normal"
if urgency == "urgent":
    print("24 hours")
elif urgency == "normal":
    print("72 hours")
else:
    print("7 days")
```
:::

## --callout-- info

`elif` is short for "else if". Python runs the first block whose test is true, and skips the rest.

# --screen-- predict

## --code--

```python file=main.py
urgency = "low"
if urgency == "urgent":
    print("24 hours")
elif urgency == "normal":
    print("72 hours")
else:
    print("7 days")
```

## --question--

What does this print?

## --options--

- [x] `7 days`
  > Yes. `"low"` is neither `"urgent"` nor `"normal"`, so Python reaches the `else` block.
- [ ] `24 hours`
  > No. That line runs only when `urgency` is `"urgent"`.
- [ ] `72 hours`
  > No. That line runs only when `urgency` is `"normal"`.
- [ ] All three lines
  > No. Python runs one block of an `if`, `elif` and `else` and skips the others.

## --why--

Python tests from the top and runs the first block that is true. When none is, it runs `else`.

# --screen-- mcq

## --question--

How does Python know which lines belong to an `if`?

## --options--

- [x] They are indented.
  > Yes. The lines indented under the `if` are its block. The block ends at the first line that is indented less.
- [ ] They are inside `{ }`.
  > No. Curly braces group lines in JavaScript. Python uses indentation.
- [ ] They end with `;`.
  > No. A semicolon does not group lines in Python, and lines do not need one.

## --why--

Four spaces of indentation is the grouping. There are no braces to look for.

# --screen-- spotbug

## --code--

```python file=main.py
urgency = "urgent"
if urgency == "urgent":
print("24 hours")
```

## --question--

Python stops with an `IndentationError` on line 3. What is wrong?

## --options--

- [x] The `print` line is not indented under the `if`.
  > Yes. The line after `if ...:` must be indented four spaces to show that it belongs to the `if`.
- [ ] The `if` line needs braces.
  > No. Python does not use braces to group lines. Indentation does that.
- [ ] `"urgent"` needs single quotes.
  > No. Single quotes and double quotes both make text in Python.
- [ ] `print` should be written `Print`.
  > No. `print` is all lower case. `Print` is not a name Python knows.

## --why--

Every line inside an `if` or a loop starts four spaces in. A missing indent is the most common first error in Python.

# --screen-- tapbuild

## --prompt--

Build the line that checks for an urgent complaint.

## --template--

```python
___ urgency == "urgent"___
    print("24 hours")
```

## --tokens--

- `if`
- `:`
- `then`
- `;`
- `{`

## --answer--

- `if`
- `:`

## --why--

`if` starts the test, and the colon ends the line and says an indented block follows. Python has no `then`, and a `;` or `{` does not do the colon's job.

# --screen-- spotbug

## --code--

```python file=main.py
urgency = "low"
if urgency = "low":
    print("7 days")
```

## --question--

Python stops with a `SyntaxError` on line 2. What is wrong?

## --options--

- [x] The `if` line uses `=`, which stores a value. A test needs `==`.
  > Yes. `urgency == "low"` asks whether the two are equal. A single `=` stores a value, so Python cannot use it in a test.
- [ ] The `if` line is missing its colon.
  > No. The colon is there at the end of line 2.
- [ ] The `print` line is not indented.
  > No. Line 3 is indented four spaces, as it should be.
- [ ] `"low"` should not be in quotes.
  > No. Text needs quotes. Without them, Python would look for a variable called `low`.

## --why--

One `=` stores a value. Two `==` ask whether two values are equal.

# --screen-- concept

`and`, `or` and `not` are written as words. `and` is true when both sides are true. `or` is true when at least one side is. `not` flips `True` and `False`. Change `30` to `10` and press Run.

::: tryit python
```python file=main.py
urgent = True
hours_open = 30
if urgent and hours_open > 24:
    print("Overdue")
print(not urgent)
```
:::

## --callout-- tip

`>` means greater than. `<` means less than.

# --screen-- concept

A **list** holds several values in order, inside square brackets. `.append(x)` adds `x` at the end. `len()` counts the items.

::: tryit python
```python file=main.py
urgencies = ["urgent", "low", "urgent", "normal"]
urgencies.append("low")
print(len(urgencies))      # 5
```
:::

# --screen-- mcq

## --question--

How do you add an item to a list?

## --options--

- [x] `items.append(x)`
  > Yes. `append` adds `x` at the end of the list.
- [ ] `items.push(x)`
  > No. `push` is the JavaScript word. A Python list has no `push`.
- [ ] `items.add(x)`
  > No. A list has no `add`. The method is `append`.

## --why--

`append` is the Python word for adding to the end of a list.

# --screen-- concept

A `for` loop runs its indented lines once for each item in a list. Here `u` is the item the loop is looking at now. `urgent_count += 1` is short for `urgent_count = urgent_count + 1`.

::: tryit python
```python file=main.py
urgencies = ["urgent", "low", "urgent", "normal", "low"]

urgent_count = 0
for u in urgencies:
    if u == "urgent":
        urgent_count += 1  # short for urgent_count = urgent_count + 1
print(urgent_count)        # 2
```
:::

# --screen-- tapbuild

## --prompt--

Build the line that goes through every urgency in the list.

## --template--

```python
___ u ___ urgencies___
    print(u)
```

## --tokens--

- `for`
- `in`
- `:`
- `of`
- `each`
- `;`

## --answer--

- `for`
- `in`
- `:`

## --why--

A `for` loop reads as "for each `u` in `urgencies`", and the line ends with a colon. `of` and `each` are not Python words.

# --screen-- predict

## --code--

```python file=main.py
urgencies = ["urgent", "low", "urgent", "normal"]
urgencies.append("low")

low_count = 0
for u in urgencies:
    if u == "low":
        low_count += 1
print(low_count)
```

## --question--

What does this print?

## --options--

- [x] `2`
  > Yes. After the `append` the list holds two `"low"` items, and each one adds 1 to `low_count`.
- [ ] `1`
  > No. That would be the count before `append("low")` added the second one.
- [ ] `5`
  > No. That is how many items the list has. The loop counts only the ones equal to `"low"`.
- [ ] `0`
  > No. The loop starts at 0, but it finds two items equal to `"low"` and adds 1 for each.

## --why--

The loop visits every item, and the `if` adds 1 only for a `"low"`. The `append` came first, so there are two.

# --screen-- match

## --prompt--

Match each word to its job.

## --pairs--

- `if`
  - Runs the indented lines when its test is true
- `elif`
  - Tries another test when the earlier ones were false
- `else`
  - Runs when none of the tests were true
- `for`
  - Repeats the indented lines for each item in a list
- `append`
  - Adds an item to the end of a list

## --why--

`if`, `elif` and `else` choose one block to run. `for` repeats a block, and `append` grows a list.

# --screen-- typein

## --prompt--

Count the urgencies in `urgencies`. Use a `for` loop with an `if` inside it, and keep one count for each urgency. Then print three lines: `urgent 2`, `normal 1` and `low 3`.

## --seed-contents--

```python file=main.py
urgencies = ["urgent", "normal", "low", "urgent", "low", "low"]
--editable-region--

--editable-region--
```

## --tests--

Your code should use a `for` loop to go through `urgencies`.

```py
import ast
assert any(isinstance(n, ast.For) for n in ast.walk(_tree))
```

Your loop should have an `if` inside it, to decide which count to add 1 to.

```py
import ast
assert any(isinstance(n, ast.If) for n in ast.walk(_tree))
```

Your code should print the line `urgent 2`.

```py
assert 'urgent 2' in _stdout.splitlines()
```

Your code should print the line `normal 1`.

```py
assert 'normal 1' in _stdout.splitlines()
```

Your code should print the line `low 3`.

```py
assert 'low 3' in _stdout.splitlines()
```

## --solutions--

```python file=main.py
urgencies = ["urgent", "normal", "low", "urgent", "low", "low"]
urgent_count = 0
normal_count = 0
low_count = 0
for u in urgencies:
    if u == "urgent":
        urgent_count += 1
    elif u == "normal":
        normal_count += 1
    else:
        low_count += 1
print("urgent", urgent_count)
print("normal", normal_count)
print("low", low_count)
```

## --why--

Each pass of the loop looks at one item. The `if`, `elif` and `else` choose which count gets 1 added. When the loop ends, the counts are ready to print.
