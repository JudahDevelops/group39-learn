## Values, text and types

A **variable** stores a value under a name. An **f-string** has an `f` before the opening quote, and Python replaces each `{name}` inside it with the value of that variable. If you know JavaScript, the ideas are the same. Only the spelling changes.

| Idea | Python | JavaScript, for comparison |
|---|---|---|
| Variable | `room = "B-214"` | `const room = "B-214";` |
| Text with values | `f"Room {room}"` | `` `Room ${room}` `` |
| Print | `print(...)` | `console.log(...)` |
| Comment | `# note` | `// note` |
| True/false | `True`, `False` | `true`, `false` |

::: tryit python
```python file=main.py
room = "B-214"
hours = 24
print(f"Urgent complaints in {room} must be fixed within {hours} hours")
print(7 * 24)
```
:::

Every value has a **type**, and `type()` tells you what it is.

| Type | Is | Example |
|---|---|---|
| `str` | Text | `"B-214"` |
| `int` | A whole number | `24` |
| `float` | A decimal | `2.5` |
| `bool` | `True` or `False` | `True` |

::: tryit python
```python file=main.py
print(type("B-214"))
print(type(24))
print(type(2.5))
print(type(True))
```
:::

## Decisions

**Indentation matters in Python.** The lines inside an `if`, `elif`, `else` or loop are indented by four spaces, and the line before them ends with a colon. Python runs the first block whose test is true and skips the rest.

`==` asks whether two values are equal. A single `=` stores a value. `and`, `or` and `not` are written as words.

::: tryit python
```python file=main.py
urgency = "normal"
if urgency == "urgent":
    print("24 hours")
elif urgency == "normal":
    print("72 hours")
else:
    print("7 days")

urgent = True
hours_open = 30
if urgent and hours_open > 24:
    print("Overdue")
print(not urgent)
```
:::

## Lists and loops

A **list** holds several values in order, inside square brackets. `.append(x)` adds `x` at the end, and `len()` counts the items. A `for` loop runs its indented lines once for each item. `+=` adds to a counter.

::: tryit python
```python file=main.py
urgencies = ["urgent", "normal", "low", "urgent", "low", "low"]
urgencies.append("normal")
print(len(urgencies))

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
:::

## Functions and the escalation rule

A **function** is a named block of code you can run again. `def` defines it, and `return` hands back the answer. The first `return` that runs ends the function.

| Part | Meaning |
|---|---|
| `def name(...):` | Defines a function |
| `urgency: str` | A **type hint**: this parameter should be text. FastAPI relies on these heavily. |
| `-> int` | The function returns a whole number |
| `"""..."""` | A docstring: says what the function does |

The escalation rule: *t* is the time a complaint has been open, *d* is its deadline and *L* is the escalation level.

| Time open | Level |
|---|---|
| *t* < *d* | *L* = 0 |
| *d* ≤ *t* < 2*d* | *L* = 1 |
| *t* ≥ 2*d* | *L* = 2 |

Reaching the deadline counts as overdue, so `escalation_level(24, 24)` is 1, not 0. A comparison gives `True` or `False`: `<` is less than, `<=` is less than or equal to, and `>=` is greater than or equal to.

::: tryit python
```python file=main.py
def deadline_hours(urgency: str) -> int:
    """Return the resolution deadline in hours for an urgency level."""
    if urgency == "urgent":
        return 24
    if urgency == "normal":
        return 72
    return 168


def escalation_level(elapsed_hours: float, deadline_hours: float) -> int:
    if elapsed_hours < deadline_hours:
        return 0
    if elapsed_hours < 2 * deadline_hours:
        return 1
    return 2


print(deadline_hours("normal"))
print(escalation_level(10, 24))
print(escalation_level(24, 24))
print(escalation_level(47, 24))
print(escalation_level(48, 24))
print(escalation_level(100, 72))
print(escalation_level(144, 72))
```
:::

## Dictionaries and keyword triage

A **dictionary** maps keys to values, like a JavaScript object. Square brackets look up a value by its key. `.get` does the same, but a missing key gives `None` (nothing) instead of a crash.

`.lower()` turns every letter into a small letter, and `in` asks whether one piece of text is inside another. Complaints come in any capitals, so lower the text before you look for a keyword.

::: tryit python
```python file=main.py
DEADLINE_HOURS = {"urgent": 24, "normal": 72, "low": 168}
print(DEADLINE_HOURS["normal"])
print(DEADLINE_HOURS.get("other"))

text = "The pipe has BURST in the bathroom"
print(text.lower())
print("burst" in text.lower())
print("burst" in text)
```
:::

Keyword triage gives each urgency a list of keywords. `triage_urgency` lowers the description, checks the most serious urgency first and returns at the first keyword it finds. If nothing matches, it returns `None`. What the engine does then is one of six open design decisions. Until the group decides, the placeholder is urgency normal. See <a href="/reference/decisions" target="_blank" rel="noopener">Group decisions</a>.

The urgency keywords come from Table IV of the paper. The paper does not list category keywords, so the category lists are a starting set to improve. `triage_category` works the same way and returns `"other"` when no category matches.

::: tryit python
```python file=main.py
URGENCY_KEYWORDS = {
    "urgent": ["burst", "flood", "spark", "exposed wire", "no water", "broken lock"],
    "normal": ["leaking tap", "faulty socket", "broken bed", "blocked drain"],
    "low": ["paint", "loose handle", "squeaking door"],
}

CATEGORY_KEYWORDS = {
    "plumbing": ["pipe", "tap", "leak", "water", "drain", "toilet", "shower", "flood"],
    "electrical": ["socket", "light", "bulb", "wire", "spark", "fan", "switch", "power"],
    "carpentry": ["door", "bed", "window", "wardrobe", "handle", "lock", "chair", "table"],
    "sanitation": ["dirty", "smell", "refuse", "waste", "cockroach", "rat", "bin"],
}


def triage_urgency(description: str) -> str | None:
    text = description.lower()
    for urgency in ["urgent", "normal", "low"]:      # most serious first
        for keyword in URGENCY_KEYWORDS[urgency]:
            if keyword in text:
                return urgency
    return None   # nothing matched: what happens next is a group decision


def triage_category(description) -> str:
    text = description.lower()
    for category in ["plumbing", "electrical", "carpentry", "sanitation"]:
        for keyword in CATEGORY_KEYWORDS[category]:
            if keyword in text:
                return category
    return "other"


print(triage_category("The pipe in the bathroom has burst"), triage_urgency("The pipe in the bathroom has burst"))
print(triage_category("My tap is leaking"), triage_urgency("My tap is leaking"))
print(triage_category("water dey drip from ceiling since morning"), triage_urgency("water dey drip from ceiling since morning"))
```
:::

## Dates and times

A `datetime` is a moment in time. A `timedelta` is a length of time. A moment plus a length of time is a later moment, and one moment minus another is a length of time.

| Thing | Is |
|---|---|
| `datetime` | A moment in time |
| `timedelta` | A length of time. You can add it to a datetime, multiply it, compare it. |
| `timezone.utc` | Universal time. Nigeria is UTC+1. |

**Always store times in UTC with the time zone attached.** A time without a zone is ambiguous, and mixing the two gives deadlines that are an hour wrong. PostgreSQL's `timestamptz` type stores times this way (chapter B7).

The same comparisons work on lengths of time, so the escalation rule can use `timedelta` values.

::: tryit python
```python file=main.py
from datetime import datetime, timedelta, timezone

DEADLINE_HOURS = {"urgent": 24, "normal": 72, "low": 168}


def compute_deadline(created_at: datetime, urgency: str) -> datetime:
    return created_at + timedelta(hours=DEADLINE_HOURS[urgency])


def escalation_level(elapsed: timedelta, limit: timedelta) -> int:
    if elapsed < limit:
        return 0
    if elapsed < 2 * limit:
        return 1
    return 2


created_at = datetime(2026, 10, 5, 9, 0, tzinfo=timezone.utc)
now = datetime(2026, 10, 6, 10, 0, tzinfo=timezone.utc)
deadline = compute_deadline(created_at, "urgent")
print(deadline)
print((now - created_at).total_seconds() / 3600)
print(escalation_level(now - created_at, deadline - created_at))
```
:::

## Classes

FastAPI's request models and SQLAlchemy's database models are classes. You need to read them, not design big ones. A **class** is a template for objects that share the same fields and functions.

| Part | Meaning |
|---|---|
| `class Complaint:` | Defines the template |
| `__init__` | Runs when you create one; sets its fields |
| `self` | The particular object the function is working on |
| A function inside a class | Called a **method**: `c.deadline()` |

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
print(c.room)
print(c.deadline())
print(c.is_overdue(datetime(2026, 10, 6, 9, 0, tzinfo=timezone.utc)))
```
:::

Libraries often let you write classes more briefly, listing only the fields. You will see this in chapter B6, where FastAPI reads the data of a request.

```python
from pydantic import BaseModel


class ComplaintIn(BaseModel):
    description: str
```

### Remember

- Indentation groups lines. A line that opens a block ends with a colon.
- `==` compares two values. `=` stores one.
- `f"... {name} ..."` puts a value into text. Without the `f`, the braces stay in the text.
- `append` adds to a list, and a `for` loop visits each item once.
- A function hands back its answer with `return`. The first `return` that runs ends it.
- Reaching the deadline counts as overdue: level 1 starts at *t* = *d*, and level 2 at *t* = 2*d*.
- Lower the description before you look for a keyword. The first match wins, so check the most serious urgency first.
- `.get` gives `None` for a missing key. Square brackets stop with an error.
- Store times in UTC with the zone attached. Take one `datetime` from another to get a `timedelta`.
- `self` is the object a method is working on. Fields are set in `__init__`, and methods are called like `c.deadline()`.
