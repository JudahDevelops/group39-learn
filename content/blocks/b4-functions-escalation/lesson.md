# --screen-- concept

A **function** is a named block of code you can run again. `def` defines it, and `return` hands back the answer. This one turns an urgency into a deadline in hours. Writing `deadline_hours("normal")` runs it. Change the urgency and press Run.

::: tryit python
```python file=main.py
def deadline_hours(urgency: str) -> int:
    """Return the resolution deadline in hours for an urgency level."""
    if urgency == "urgent":
        return 24
    if urgency == "normal":
        return 72
    return 168


print(deadline_hours("urgent"))
```
:::

# --screen-- concept

Each part of the first line has a job.

| Part | Meaning |
|---|---|
| `def name(...):` | Defines a function |
| `urgency: str` | A **type hint**: this parameter should be text. FastAPI relies on these heavily. |
| `-> int` | The function returns a whole number |
| `"""..."""` | A docstring: says what the function does |

# --screen-- match

## --prompt--

Match each part of the function to its meaning.

## --pairs--

- `def`
  - Starts the definition of a function
- `urgency: str`
  - A type hint: this parameter should be text
- `-> int`
  - The function returns a whole number
- `"""..."""`
  - A docstring that says what the function does

## --why--

A type hint tells the reader, and FastAPI, what kind of value to expect. A docstring tells the reader what the function is for.

# --screen-- tapbuild

## --prompt--

Build the first line of `deadline_hours`.

## --template--

```python
___ deadline_hours(urgency: str) ___ int___
```

## --tokens--

- `def`
- `->`
- `:`
- `function`
- `=>`
- `;`

## --answer--

- `def`
- `->`
- `:`

## --why--

`def` starts a function, `->` comes before the type it returns, and the line ends with a colon. `function` and `=>` are JavaScript. A semicolon does not end a Python `def` line.

# --screen-- spotbug

## --code--

```python file=main.py
def deadline_hours(urgency: str) -> int
    if urgency == "urgent":
        return 24
    return 168
```

## --question--

Python stops with a `SyntaxError` on line 1. What is wrong?

## --options--

- [x] The `def` line is missing its colon.
  > Yes. A `def`, `if` or `for` line must end with `:` before its indented block.
- [ ] `-> int` should be `=> int`.
  > No. `=>` is JavaScript. Python writes the arrow as `->`.
- [ ] The `return` lines are not indented.
  > No. They are indented four spaces under the `if` and the `def`.
- [ ] `urgency: str` should be `str urgency`.
  > No. In Python the name comes first, then a colon and the type.

## --why--

The colon at the end of the line tells Python that an indented block follows.

# --screen-- predict

## --code--

```python file=main.py
def deadline_hours(urgency: str) -> int:
    """Return the resolution deadline in hours for an urgency level."""
    if urgency == "urgent":
        return 24
    if urgency == "normal":
        return 72
    return 168


print(deadline_hours("normal"))
```

## --question--

What does this print?

## --options--

- [x] `72`
  > Yes. `"normal"` fails the first test and passes the second, so the function returns 72.
- [ ] `24`
  > No. The function returns 24 only when `urgency` is `"urgent"`.
- [ ] `168`
  > No. The function reaches `return 168` only when neither test matched. `"normal"` matches the second.
- [ ] `None`
  > No. A function gives back `None` only when it ends without a `return`. This one returns on the second test.

## --why--

The first `return` that runs ends the function. For `"normal"` that is `return 72`.

# --screen-- mcq

## --question--

What does `-> int` mean?

## --options--

- [x] The function returns a whole number.
  > Yes. The arrow shows the type of the answer the function hands back.
- [ ] The function takes a whole number.
  > No. What the function takes is written inside the brackets, such as `urgency: str`.
- [ ] The function prints a whole number.
  > No. `return` hands a value back. `print` is what shows a value on the screen.

## --why--

Inside the brackets are the inputs. After the arrow is the output.

# --screen-- concept

Recall the escalation rule from chapter A3. *t* is the time a complaint has been open, and *d* is its deadline. *L* is the escalation level.

- *L* = 0 if *t* < *d*
- *L* = 1 if *d* ≤ *t* < 2*d*
- *L* = 2 if *t* ≥ 2*d*

# --screen-- concept

A comparison gives `True` or `False`. `<` is less than, `<=` is less than or equal to, and `>=` is greater than or equal to. Change `elapsed_hours` and watch the answers.

::: tryit python
```python file=main.py
elapsed_hours = 24
deadline_hours = 24

print(elapsed_hours < deadline_hours)
print(elapsed_hours >= deadline_hours)
print(elapsed_hours < 2 * deadline_hours)
```
:::

# --screen-- predict

## --code--

```python file=main.py
elapsed_hours = 47
deadline_hours = 24

print(elapsed_hours < deadline_hours)
print(deadline_hours <= elapsed_hours)
print(elapsed_hours < 2 * deadline_hours)
```

## --question--

What does this print, line by line?

## --options--

- [x] `False`, `True`, `True`
  > Yes. 47 is not under 24, it is at least 24, and it is under 48. So the rule gives *L* = 1.
- [ ] `True`, `True`, `True`
  > No. The first line asks whether 47 is less than 24, and it is not.
- [ ] `False`, `False`, `True`
  > No. The second line asks whether 24 is less than or equal to 47, and it is.
- [ ] `False`, `True`, `False`
  > No. The third line asks whether 47 is less than 48, and it is.

## --why--

47 is past the deadline of 24 but not past twice the deadline, 48. That is level 1.

# --screen-- mcq

## --question--

The function you are about to write must return 1 for `escalation_level(24, 24)`, not 0. Why?

## --options--

- [x] The rule says *d* ≤ *t*: reaching the deadline counts as overdue.
  > Yes. With *t* = 24 and *d* = 24, the test *t* < *d* is false, so the level is at least 1.
- [ ] Because of rounding.
  > No. The numbers are whole and exact. Nothing is rounded.
- [ ] Because the function adds 1 to the deadline.
  > No. The function only compares *t* with *d* and 2*d*.

## --why--

Level 0 is only for *t* < *d*. The moment *t* reaches *d*, the complaint is overdue.

# --screen-- order

## --prompt--

Put the checks of `escalation_level` in the order the function runs them.

## --items--

- If `elapsed_hours` is less than `deadline_hours`, return 0
- If `elapsed_hours` is less than `2 * deadline_hours`, return 1
- Otherwise, return 2

## --why--

The first `return` that runs ends the function. So the second check runs only when the time is at least the deadline, and the last line is reached only from twice the deadline on.

# --screen-- typein

## --prompt--

Write `escalation_level(elapsed_hours: float, deadline_hours: float) -> int`. It returns the escalation level *L*: 0, 1 or 2.

## --seed-contents--

```python file=main.py
# Escalation level: 0, 1 or 2
--editable-region--

--editable-region--
```

## --tests--

Your code should define a function called `escalation_level`.

```py
assert has_function('escalation_level')
```

Your function should be written `escalation_level(elapsed_hours: float, deadline_hours: float) -> int`. Check the names, the type hints and the arrow.

```py
import ast
fn = next(n for n in ast.walk(_tree) if isinstance(n, ast.FunctionDef) and n.name == 'escalation_level')
assert [a.arg for a in fn.args.args] == ['elapsed_hours', 'deadline_hours']
assert [ast.unparse(a.annotation) if a.annotation else None for a in fn.args.args] == ['float', 'float']
assert fn.returns is not None and ast.unparse(fn.returns) == 'int'
```

`escalation_level(10, 24)` should return `0`. The complaint is still inside its deadline.

```py
assert escalation_level(10, 24) == 0
```

`escalation_level(24, 24)` should return `1`. Reaching the deadline counts as overdue.

```py
assert escalation_level(24, 24) == 1
```

`escalation_level(47, 24)` should return `1`. It is past the deadline but not yet twice the deadline.

```py
assert escalation_level(47, 24) == 1
```

`escalation_level(48, 24)` should return `2`. Twice the deadline is level 2.

```py
assert escalation_level(48, 24) == 2
```

`escalation_level(100, 72)` should return `1`.

```py
assert escalation_level(100, 72) == 1
```

`escalation_level(144, 72)` should return `2`.

```py
assert escalation_level(144, 72) == 2
```

## --solutions--

```python file=main.py
# Escalation level: 0, 1 or 2
def escalation_level(elapsed_hours: float, deadline_hours: float) -> int:
    if elapsed_hours < deadline_hours:
        return 0
    if elapsed_hours < 2 * deadline_hours:
        return 1
    return 2
```

## --why--

The checks run from the top, and the first `return` that runs ends the function. So the second check only runs when the time is at least the deadline.
