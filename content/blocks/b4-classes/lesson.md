# --screen-- concept

FastAPI's request models and SQLAlchemy's database models are classes. You need to read them, not design big ones. A **class** is a template for objects that share the same fields and functions. `Complaint` is the template, and `c` is one complaint made from it.

::: tryit python
```python file=main.py
from datetime import datetime, timedelta, timezone

DEADLINE_HOURS = {"urgent": 24, "normal": 72, "low": 168}


class Complaint:
    def __init__(self, room: str, urgency: str, created_at: datetime):
        self.room = room
        self.urgency = urgency
        self.created_at = created_at

    def deadline(self) -> datetime:
        return self.created_at + timedelta(hours=DEADLINE_HOURS[self.urgency])

    def is_overdue(self, now: datetime) -> bool:
        return now >= self.deadline()


c = Complaint("B-214", "urgent", datetime(2026, 10, 5, 9, 0, tzinfo=timezone.utc))
print(c.deadline())
```
:::

# --screen-- concept

Four parts of a class are worth knowing.

| Part | Meaning |
|---|---|
| `class Complaint:` | Defines the template |
| `__init__` | Runs when you create one; sets its fields |
| `self` | The particular object the function is working on |
| A function inside a class | Called a **method**: `c.deadline()` |

# --screen-- match

## --prompt--

Match each part of the class to its meaning.

## --pairs--

- `class Complaint:`
  - Defines the template
- `__init__`
  - Runs when you create an object, and sets its fields
- `self`
  - The particular object a method is working on
- A function inside a class
  - A method, called like `c.deadline()`

## --why--

The class is the template. `__init__` fills in one object when it is made. `self` is that object, and a method is a function that works on it.

# --screen-- mcq

## --question--

What is `self`?

## --options--

- [x] The particular object a method is working on
  > Yes. When you call `c.deadline()`, Python passes `c` in as `self`.
- [ ] The class name
  > No. The class name is `Complaint`. `self` stands for one object made from the class.
- [ ] A word that only appears in `__init__`
  > No. Every method has `self` as its first parameter, not only `__init__`.

## --why--

Inside a method, `self.room` means the `room` of the object the method was called on.

# --screen-- mcq

## --question--

What do you call a function inside a class?

## --options--

- [x] A method
  > Yes. `deadline` and `is_overdue` are methods of `Complaint`.
- [ ] A module
  > No. A module is a Python file that you import.
- [ ] A field
  > No. A field holds a value, such as `self.room`. A method is a function.

## --why--

A method is a function that belongs to a class, and you call it on an object: `c.deadline()`.

# --screen-- multi

## --question--

Which names are fields of a `Complaint` object? Select all that apply.

## --options--

- [x] `room`
  > Yes. `__init__` stores it as `self.room`.
- [x] `urgency`
  > Yes. `__init__` stores it as `self.urgency`.
- [x] `created_at`
  > Yes. `__init__` stores it as `self.created_at`.
- [ ] `deadline`
  > No. `deadline` is a function inside the class, so it is a method.
- [ ] `is_overdue`
  > No. `is_overdue` is a method too. You call it with brackets: `c.is_overdue(now)`.

## --why--

Fields hold the values that `__init__` sets with `self.name = ...`. Methods are the functions that work with those values.

# --screen-- tapbuild

## --prompt--

Build the start of the class and its `deadline` method.

## --template--

```python
___ Complaint___
    def deadline(___) -> datetime:
        return self.created_at + timedelta(hours=DEADLINE_HOURS[self.urgency])
```

## --tokens--

- `class`
- `:`
- `self`
- `def`
- `this`
- `;`

## --answer--

- `class`
- `:`
- `self`

## --why--

`class` starts a template, and its line ends with a colon. The first parameter of a method is `self`. `def` makes a function, so `def Complaint` would not make a class. `this` is the JavaScript word, and Python lines have no semicolons.

# --screen-- predict

## --code--

```python file=main.py
from datetime import datetime, timedelta, timezone

DEADLINE_HOURS = {"urgent": 24, "normal": 72, "low": 168}


class Complaint:
    def __init__(self, room: str, urgency: str, created_at: datetime):
        self.room = room
        self.urgency = urgency
        self.created_at = created_at

    def deadline(self) -> datetime:
        return self.created_at + timedelta(hours=DEADLINE_HOURS[self.urgency])

    def is_overdue(self, now: datetime) -> bool:
        return now >= self.deadline()


c = Complaint("B-214", "urgent", datetime(2026, 10, 5, 9, 0, tzinfo=timezone.utc))
print(c.room)
print(c.is_overdue(datetime(2026, 10, 6, 9, 0, tzinfo=timezone.utc)))
```

## --question--

What do the last two lines print?

## --options--

- [x] `B-214`, then `True`
  > Yes. `c.room` is the room that `__init__` stored. The deadline is 09:00 on 6 October, and `now >= deadline` is true at that exact moment.
- [ ] `B-214`, then `False`
  > No. The deadline is exactly 09:00 on 6 October. The `>=` counts that moment as overdue.
- [ ] `room`, then `True`
  > No. `c.room` is the value stored, `"B-214"`. `room` is only the name of the field.
- [ ] An error, because `room` is not defined
  > No. `__init__` stored `self.room`, so `c.room` exists.

## --why--

`c.room` reads a field. `c.is_overdue(...)` calls a method, which compares the given time with the deadline.

# --screen-- spotbug

## --code--

```python file=main.py
class Complaint:
    def __init__(self, room: str, urgency: str):
        room = room
        urgency = urgency


c = Complaint("B-214", "urgent")
print(c.room)
```

## --question--

Python stops on the last line with an `AttributeError`: the complaint has no `room`. What is wrong?

## --options--

- [x] `__init__` does not store the values on the object. It needs `self.room = room`.
  > Yes. `room = room` only sets a name inside `__init__`, and it is gone when the method ends. `self.room = room` keeps it on the object.
- [ ] `room` should be a number.
  > No. The hint `room: str` says it is text, and `"B-214"` is text.
- [ ] `Complaint` should be written in lower case.
  > No. The class and the call use the same name, `Complaint`. The capital letter is the usual style for a class.
- [ ] The `print` line needs `self`.
  > No. `self` is only used inside methods. Outside the class you write `c.room`.

## --why--

A field exists only if `__init__` stores it on `self`. Without that, the object has nothing to read.

# --screen-- concept

Libraries often let you write classes more briefly, listing only the fields. You will see this in chapter B6, where FastAPI reads the data of a request.

## --code--

```python file=main.py
from pydantic import BaseModel


class ComplaintIn(BaseModel):
    description: str
```

# --screen-- typein

## --prompt--

Add an `escalation(now)` method to `Complaint`. It returns the escalation level, 0, 1 or 2, by calling `escalation_level` with the time the complaint has been open (`now - self.created_at`) and the length of its deadline. The last lines make a Low complaint created 10 days ago and print its level. It should print `1`.

## --seed-contents--

```python file=main.py
from datetime import datetime, timedelta, timezone

DEADLINE_HOURS = {"urgent": 24, "normal": 72, "low": 168}


def escalation_level(elapsed: timedelta, limit: timedelta) -> int:
    if elapsed < limit:
        return 0
    if elapsed < 2 * limit:
        return 1
    return 2


class Complaint:
    def __init__(self, room: str, urgency: str, created_at: datetime):
        self.room = room
        self.urgency = urgency
        self.created_at = created_at

    def deadline(self) -> datetime:
        return self.created_at + timedelta(hours=DEADLINE_HOURS[self.urgency])

    def is_overdue(self, now: datetime) -> bool:
        return now >= self.deadline()

--editable-region--

--editable-region--

now = datetime(2026, 10, 15, 9, 0, tzinfo=timezone.utc)
low = Complaint("B-214", "low", now - timedelta(days=10))
print(low.escalation(now))
```

## --tests--

Your `Complaint` class should have a method called `escalation`. Check that it is indented four spaces, inside the class.

```py
assert hasattr(Complaint, 'escalation')
```

An urgent complaint open for 10 hours should have escalation level `0`.

```py
t = datetime(2026, 10, 15, 9, 0, tzinfo=timezone.utc)
assert Complaint("B-214", "urgent", t - timedelta(hours=10)).escalation(t) == 0
```

An urgent complaint open for 24 hours should have escalation level `1`. Reaching the deadline counts as overdue.

```py
t = datetime(2026, 10, 15, 9, 0, tzinfo=timezone.utc)
assert Complaint("B-214", "urgent", t - timedelta(hours=24)).escalation(t) == 1
```

An urgent complaint open for 48 hours should have escalation level `2`.

```py
t = datetime(2026, 10, 15, 9, 0, tzinfo=timezone.utc)
assert Complaint("B-214", "urgent", t - timedelta(hours=48)).escalation(t) == 2
```

A normal complaint open for 144 hours should have escalation level `2`. Use the deadline of its own urgency.

```py
t = datetime(2026, 10, 15, 9, 0, tzinfo=timezone.utc)
assert Complaint("B-214", "normal", t - timedelta(hours=144)).escalation(t) == 2
```

A low complaint created 10 days ago should have escalation level `1`.

```py
t = datetime(2026, 10, 15, 9, 0, tzinfo=timezone.utc)
assert Complaint("B-214", "low", t - timedelta(days=10)).escalation(t) == 1
```

Your `escalation` method should call `escalation_level` instead of repeating the rule.

```py
import ast
cls = next(n for n in ast.walk(_tree) if isinstance(n, ast.ClassDef) and n.name == 'Complaint')
fn = next(n for n in ast.walk(cls) if isinstance(n, ast.FunctionDef) and n.name == 'escalation')
assert any(isinstance(n, ast.Call) and getattr(n.func, 'id', '') == 'escalation_level' for n in ast.walk(fn))
```

Your code should print `1` on a line of its own: the level of the Low complaint.

```py
assert '1' in _stdout.splitlines()
```

## --solutions--

```python file=main.py
from datetime import datetime, timedelta, timezone

DEADLINE_HOURS = {"urgent": 24, "normal": 72, "low": 168}


def escalation_level(elapsed: timedelta, limit: timedelta) -> int:
    if elapsed < limit:
        return 0
    if elapsed < 2 * limit:
        return 1
    return 2


class Complaint:
    def __init__(self, room: str, urgency: str, created_at: datetime):
        self.room = room
        self.urgency = urgency
        self.created_at = created_at

    def deadline(self) -> datetime:
        return self.created_at + timedelta(hours=DEADLINE_HOURS[self.urgency])

    def is_overdue(self, now: datetime) -> bool:
        return now >= self.deadline()

    def escalation(self, now: datetime) -> int:
        return escalation_level(now - self.created_at, timedelta(hours=DEADLINE_HOURS[self.urgency]))


now = datetime(2026, 10, 15, 9, 0, tzinfo=timezone.utc)
low = Complaint("B-214", "low", now - timedelta(days=10))
print(low.escalation(now))
```

## --why--

A method is a function inside the class, and `self` gives it the complaint's own fields. The time open is `now - self.created_at`. The deadline length comes from `DEADLINE_HOURS` for this complaint's urgency. A Low complaint is open for 240 hours against a 168-hour deadline, which is level 1.
