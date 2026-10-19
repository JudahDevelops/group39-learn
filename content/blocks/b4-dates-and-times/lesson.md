# --screen-- concept

A `datetime` is a moment in time. A `timedelta` is a length of time. Add a `timedelta` to a `datetime` and you get a later moment. This is the deadline of an urgent complaint. Change `24` and press Run.

::: tryit python
```python file=main.py
from datetime import datetime, timedelta, timezone

created_at = datetime(2026, 10, 5, 9, 0, tzinfo=timezone.utc)
deadline = created_at + timedelta(hours=24)
print(deadline)
```
:::

## --callout-- info

`datetime(2026, 10, 5, 9, 0)` is the year, month, day, hour and minute: 9:00 on 5 October 2026.

# --screen-- mcq

## --question--

What is `datetime(...) + timedelta(hours=72)`?

## --options--

- [x] The moment 72 hours later
  > Yes. A moment plus a length of time is a later moment.
- [ ] The number 72
  > No. The result is another `datetime`, not a number.
- [ ] A length of time of 72 hours
  > No. That is the `timedelta` on its own. Added to a `datetime`, it gives a moment.

## --why--

A `datetime` plus a `timedelta` gives a `datetime`.

# --screen-- predict

## --code--

```python file=main.py
from datetime import datetime, timezone

created_at = datetime(2026, 10, 5, 9, 0, tzinfo=timezone.utc)
now = datetime(2026, 10, 6, 21, 0, tzinfo=timezone.utc)
elapsed = now - created_at
print(elapsed.total_seconds() / 3600)
```

## --question--

What does this print?

## --options--

- [x] `36.0`
  > Yes. From 9:00 on the 5th to 21:00 on the 6th is 36 hours.
- [ ] `12.0`
  > No. That is only the gap between 9:00 and 21:00 on the clock. The date changed as well.
- [ ] `1.5`
  > No. That is the number of days. Dividing the seconds by 3600 gives hours.
- [ ] `129600.0`
  > No. That is the number of seconds, before the division by 3600.

## --why--

Taking one `datetime` from another gives a `timedelta`. `total_seconds()` turns it into seconds, and dividing by 3600 gives hours.

# --screen-- concept

Subtract one `datetime` from another and you get a `timedelta`. Compare two datetimes with `>` to see whether a deadline has passed. The numbers change each time you press Run, because `now` is the real time.

::: tryit python
```python file=main.py
from datetime import datetime, timedelta, timezone

created_at = datetime(2026, 10, 5, 9, 0, tzinfo=timezone.utc)
deadline = created_at + timedelta(hours=24)

now = datetime.now(timezone.utc)
elapsed = now - created_at              # a timedelta: a length of time
print(elapsed.total_seconds() / 3600)   # elapsed hours
print(now > deadline)                   # True if overdue
```
:::

# --screen-- concept

Three things do most of the work.

| Thing | Is |
|---|---|
| `datetime` | A moment in time |
| `timedelta` | A length of time. You can add it to a datetime, multiply it, compare it. |
| `timezone.utc` | Universal time. Nigeria is UTC+1. |

# --screen-- match

## --prompt--

Match each name to what it is.

## --pairs--

- `datetime`
  - A moment in time
- `timedelta`
  - A length of time
- `timezone.utc`
  - Universal time
- `now - created_at`
  - A timedelta: how long the complaint has been open

## --why--

A moment is a `datetime`. The gap between two moments is a `timedelta`. `timezone.utc` is the zone that the moments are written in.

# --screen-- concept

**Always store times in UTC with the time zone attached.** A time without a zone is ambiguous. Mixing the two causes deadlines that are an hour wrong. PostgreSQL's `timestamptz` type stores times this way (chapter B7).

## --callout-- info

Nigeria is UTC+1, one hour ahead of UTC. That is why a mix-up shows up as one hour.

# --screen-- mcq

## --question--

Why store times in UTC with the zone attached?

## --options--

- [x] So there is no doubt which moment a time means.
  > Yes. A time with its zone names exactly one moment, wherever the code runs.
- [ ] UTC is faster.
  > No. UTC makes no difference to speed. It makes a time mean one thing.
- [ ] Because Nigeria uses UTC.
  > No. Nigeria is UTC+1, an hour ahead. That is why mixing zones gives deadlines an hour wrong.

## --why--

A time with no zone could mean two moments an hour apart. Storing UTC with the zone removes the doubt.

# --screen-- spotbug

## --code--

```python file=main.py
from datetime import datetime, timezone

created_at = datetime(2026, 10, 5, 9, 0, tzinfo=timezone.utc)
deadline = created_at + timedelta(hours=24)
print(deadline)
```

## --question--

Python stops with a `NameError` on line 4, saying `timedelta` is not defined. What is wrong?

## --options--

- [x] The import line does not bring in `timedelta`.
  > Yes. `from datetime import datetime, timezone` loads only those two names. `timedelta` has to be in the list too.
- [ ] `created_at` needs a time zone.
  > No. It has one: `tzinfo=timezone.utc`.
- [ ] `hours=24` should be `hours = 24`.
  > No. Spaces make no difference here. The name is what Python cannot find.
- [ ] `deadline` should be written `Deadline`.
  > No. Names must match from line to line, and `deadline` is used the same way each time.

## --why--

Each name has to be imported before it is used. Add `timedelta` to the `from datetime import` line.

# --screen-- tapbuild

## --prompt--

Build the deadline of an urgent complaint: 24 hours after it was created.

## --template--

```python
deadline = created_at + ___(___=24)
```

## --tokens--

- `timedelta`
- `hours`
- `datetime`
- `days`
- `hour`

## --answer--

- `timedelta`
- `hours`

## --why--

`timedelta(hours=24)` is a length of 24 hours. `datetime` is a moment, and you cannot add a moment to a moment. `days=24` would be 24 days, and `hour` is not a name that `timedelta` knows.

# --screen-- concept

The same comparisons work on lengths of time, so the escalation rule can use `timedelta` values. `elapsed` is how long the complaint has been open and `limit` is the length of its deadline.

::: tryit python
```python file=main.py
from datetime import timedelta


def escalation_level(elapsed: timedelta, limit: timedelta) -> int:
    if elapsed < limit:
        return 0
    if elapsed < 2 * limit:
        return 1
    return 2


print(escalation_level(timedelta(hours=10), timedelta(hours=24)))
```
:::

## --callout-- info

This is the rule from the last lesson, written on lengths of time. The task at the end of this lesson uses this version.

# --screen-- predict

## --code--

```python file=main.py
from datetime import timedelta


def escalation_level(elapsed: timedelta, limit: timedelta) -> int:
    if elapsed < limit:
        return 0
    if elapsed < 2 * limit:
        return 1
    return 2


print(escalation_level(timedelta(hours=30), timedelta(hours=24)))
print(escalation_level(timedelta(hours=48), timedelta(hours=24)))
```

## --question--

What do the last two lines print?

## --options--

- [x] `1`, then `2`
  > Yes. 30 hours is past the 24-hour limit but under 48. 48 hours is exactly twice the limit, which is level 2.
- [ ] `0`, then `1`
  > No. 30 hours is past the 24-hour limit, so the level is not 0.
- [ ] `1`, then `1`
  > No. For 48 hours, `elapsed < 2 * limit` is false, because 48 is not less than 48. The function reaches `return 2`.
- [ ] `2`, then `2`
  > No. 30 hours is under twice the limit, so the first answer is 1.

## --why--

The checks run from the top. At exactly twice the limit the second check is false, so the function returns 2.

# --screen-- typein

## --prompt--

Write `compute_deadline(created_at: datetime, urgency: str) -> datetime`. It returns the moment a complaint is due, using `DEADLINE_HOURS`. Then check the rule: an urgent complaint created at 09:00 UTC on 5 October 2026 has escalation level 1 at 10:00 UTC on 6 October. Make those two moments and print the level with `escalation_level`. Give it the time open and the length of the deadline. It should print `1`.

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


--editable-region--

--editable-region--
```

## --tests--

Your code should define a function called `compute_deadline`.

```py
assert has_function('compute_deadline')
```

Your function should be written `compute_deadline(created_at: datetime, urgency: str) -> datetime`. Check the names, the type hints and the arrow.

```py
import ast
fn = next(n for n in ast.walk(_tree) if isinstance(n, ast.FunctionDef) and n.name == 'compute_deadline')
assert [a.arg for a in fn.args.args] == ['created_at', 'urgency']
assert [ast.unparse(a.annotation) if a.annotation else None for a in fn.args.args] == ['datetime', 'str']
assert fn.returns is not None and ast.unparse(fn.returns) == 'datetime'
```

Your function should look up the hours in `DEADLINE_HOURS`.

```py
import ast
fn = next(n for n in ast.walk(_tree) if isinstance(n, ast.FunctionDef) and n.name == 'compute_deadline')
assert any(isinstance(n, ast.Name) and n.id == 'DEADLINE_HOURS' for n in ast.walk(fn))
```

`compute_deadline` should return a `datetime`, not a number.

```py
start = datetime(2026, 10, 5, 9, 0, tzinfo=timezone.utc)
assert isinstance(compute_deadline(start, "urgent"), datetime)
```

An urgent complaint created at 09:00 UTC on 5 October should be due at 09:00 UTC on 6 October, 24 hours later.

```py
start = datetime(2026, 10, 5, 9, 0, tzinfo=timezone.utc)
assert compute_deadline(start, "urgent") == datetime(2026, 10, 6, 9, 0, tzinfo=timezone.utc)
```

A normal complaint should be due 72 hours after it was created.

```py
start = datetime(2026, 10, 5, 9, 0, tzinfo=timezone.utc)
assert compute_deadline(start, "normal") == datetime(2026, 10, 8, 9, 0, tzinfo=timezone.utc)
```

A low complaint should be due 168 hours (7 days) after it was created.

```py
start = datetime(2026, 10, 5, 9, 0, tzinfo=timezone.utc)
assert compute_deadline(start, "low") == datetime(2026, 10, 12, 9, 0, tzinfo=timezone.utc)
```

Your check should call `escalation_level`.

```py
import ast
assert any(isinstance(n, ast.Call) and getattr(n.func, 'id', '') == 'escalation_level' for n in ast.walk(_tree))
```

Your check should print `1` on a line of its own: the escalation level at 10:00 UTC on 6 October.

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


def compute_deadline(created_at: datetime, urgency: str) -> datetime:
    return created_at + timedelta(hours=DEADLINE_HOURS[urgency])


created_at = datetime(2026, 10, 5, 9, 0, tzinfo=timezone.utc)
now = datetime(2026, 10, 6, 10, 0, tzinfo=timezone.utc)
deadline = compute_deadline(created_at, "urgent")
print(escalation_level(now - created_at, deadline - created_at))
```

## --why--

`compute_deadline` adds a `timedelta` of the right number of hours to the creation time. The time open is `now - created_at` and the length of the deadline is `deadline - created_at`: 25 hours against 24 gives level 1.
