# --screen-- concept

A **test** is code that runs your code and checks the answer. `assert` stops with an error if what follows is not true. Press Run. Then change `0` to `1` and run again to see a test fail.

::: tryit python
```python file=main.py
def escalation_level(elapsed_hours, deadline_hours):
    if elapsed_hours < deadline_hours:
        return 0
    if elapsed_hours < 2 * deadline_hours:
        return 1
    return 2


assert escalation_level(10, 24) == 0
print("The check passed")
```
:::

# --screen-- predict

## --code--

```python file=main.py
def escalation_level(elapsed_hours, deadline_hours):
    if elapsed_hours < deadline_hours:
        return 0
    if elapsed_hours < 2 * deadline_hours:
        return 1
    return 2


assert escalation_level(24, 24) == 0
print("The check passed")
```

## --question--

What happens when Python runs this?

## --options--

- [x] It stops with an `AssertionError`, and nothing is printed.
  > Yes. At exactly 24 hours the level is 1, so `== 0` is not true and `assert` stops the program.
- [ ] It prints `The check passed`.
  > No. That line only runs if the `assert` above it is true.
- [ ] It sets `escalation_level(24, 24)` to 0.
  > No. `==` asks a question. It does not change anything.
- [ ] It prints `1`.
  > No. The program never prints the level. It only checks it.

## --why--

`assert` is a question with a stop sign. If the answer is yes, the program carries on. If the answer is no, it stops with an error.

# --screen-- mcq

## --question--

What does `assert x == 1` do when `x` is 2?

## --options--

- [x] It fails the test.
  > Yes. The statement after `assert` is not true, so Python raises an error and pytest marks the test as failed.
- [ ] It sets `x` to 1.
  > No. `==` compares two values. A single `=` would set a value.
- [ ] It prints `1`.
  > No. `assert` shows nothing when it passes.
- [ ] It changes the test to pass.
  > No. A test never changes itself. It reports what it found.

## --why--

`assert` checks. It stops with an error when the check is false, and that error is what pytest reports as a failed test.

# --screen-- concept

**pytest** is a library that runs your tests. It finds files named `test_*.py` and, inside them, functions named `test_*`. This is a test file for the escalation rule.

## --code--

```python file=test_escalation.py
from services.escalation import escalation_level


def test_within_deadline_is_level_0():
    assert escalation_level(10, 24) == 0


def test_reaching_deadline_is_level_1():
    assert escalation_level(24, 24) == 1


def test_twice_the_deadline_is_level_2():
    assert escalation_level(48, 24) == 2
```

# --screen-- concept

With your environment active, install pytest with `pip install pytest`. Then, from the `backend` folder, run your tests.

## --code--

```bash
python -m pytest
```

## --callout-- warning

Write `python -m pytest`, not `pytest`. It puts the current folder on Python's search path, so a test can import from `services`.

# --screen-- mcq

## --question--

Which files does pytest run?

## --options--

- [x] Files named `test_*.py`
  > Yes. A file such as `test_escalation.py` is picked up by name.
- [ ] Every `.py` file
  > No. Files like `main.py` are ignored, or pytest would run your whole program.
- [ ] Only `main.py`
  > No. `main.py` is the program. Tests live in their own files.
- [ ] Files that contain the word `assert`
  > No. pytest chooses files by their names, and then functions by theirs.

## --why--

Names tell pytest what to run: files that start with `test_`, and functions inside them that start with `test_`.

# --screen-- spotbug

## --code--

```python file=test_escalation.py
from services.escalation import escalation_level


def reaching_deadline_is_level_1():
    assert escalation_level(24, 24) == 1
```

## --question--

pytest reports `no tests ran`, even though the file is called `test_escalation.py`. What is wrong?

## --options--

- [x] The function name does not start with `test_`.
  > Yes. pytest only runs functions whose names start with `test_`. This one is skipped without a word.
- [ ] The import line is in the wrong place.
  > No. Imports go at the top of the file, which is where this one is.
- [ ] `assert` cannot be used inside a function.
  > No. Tests are functions, and each one holds one or more `assert` lines.
- [ ] The expected level should be 2.
  > No. At exactly the deadline the level is 1. A wrong number would fail the test, not hide it.

## --why--

A test that is never run can never fail. Always start the function name with `test_`.

# --screen-- predict

## --code--

```python file=test_escalation.py
from services.escalation import escalation_level


def test_below_deadline():
    assert escalation_level(10, 24) == 0


def test_at_deadline():
    assert escalation_level(24, 24) == 0


def test_twice_deadline():
    assert escalation_level(48, 24) == 2
```

## --question--

Your `escalation_level` follows the rule. What does the last line of pytest's report say?

## --options--

- [x] `1 failed, 2 passed`
  > Yes. `test_at_deadline` expects 0, but the level at exactly 24 hours is 1. The other two are right.
- [ ] `3 passed`
  > No. The second test expects the wrong level, so it fails.
- [ ] `2 passed`
  > No. pytest also counts the failed test. The line lists both numbers.
- [ ] `1 failed`
  > No. The first and third tests are correct, so they pass.

## --why--

pytest runs every test and counts them all. A test that fails does not stop the others from running.

# --screen-- order

## --prompt--

Put the steps of working with tests in order.

## --items--

- Write a test for the next case
- Run `python -m pytest`
- Read the first failure it shows
- Fix your code
- Run `python -m pytest` again

## --why--

A failing test tells you what to fix. Run the tests again after each fix, until they all pass.

# --screen-- concept

Write one test for each of these six cases of `escalation_level`. The numbers are hours.

| Elapsed | Deadline | Level |
|---|---|---|
| 10 | 24 | 0 |
| 24 | 24 | 1 |
| 47 | 24 | 1 |
| 48 | 24 | 2 |
| 100 | 72 | 1 |
| 144 | 72 | 2 |

# --screen-- concept

Then test `triage_urgency` on these five complaints.

| Complaint | Result |
|---|---|
| The pipe in the bathroom has burst | `"urgent"` |
| There's a spark coming from the socket | `"urgent"` |
| My tap is leaking | `None` |
| The squeaking door keeps me awake | `"low"` |
| water dey drip from ceiling since morning | `None` |

# --screen-- mcq

## --question--

Two of the five complaints give `None`. Why?

## --options--

- [x] No urgency keyword matches the words in the complaint.
  > Yes. The keyword is `leaking tap`, in that order, so "My tap is leaking" does not match. The Pidgin complaint has none of the keywords.
- [ ] The function crashed on them.
  > No. A crash shows an error. `None` is the value the function returns when nothing matches.
- [ ] They are too short.
  > No. Length makes no difference. The words are what count.
- [ ] They are spelled in capital letters.
  > No. `triage_urgency` lowers the text before it looks, so capitals do not matter.

## --why--

Keyword triage only finds the exact words on its list. What the system does when nothing matches is one of the six open design decisions, with a placeholder until the group decides. See <a href="/reference/decisions" target="_blank" rel="noopener">Group decisions</a>. For now, test that the function returns `None`.

# --screen-- checklist

## --items--

- With the environment active in `practice`, run `pip install pytest`. Then run the command below and paste what it prints.
  - command: `pip show pytest`
  - pattern: `^(?=[\s\S]*Name:\s*pytest)(?=[\s\S]*Location:.*\.venv)`
  - hint: The output should show Name pytest and a Location that contains `.venv`. If the Location is somewhere else, pytest went into your main Python. Activate the environment and run `pip install pytest` again.
- In `practice/backend`, make a folder called `tests` and a file `test_escalation.py` in it. Write one test for each of the six cases. Write them yourself.
- In the same folder, make `test_triage.py` and write one test for each of the five complaints.
- Go into the `backend` folder. Run the command below and paste what it prints.
  - command: `python -m pytest`
  - pattern: `^(=+ )?[1-9]\d* passed`
  - hint: The last line should show only passed tests, such as `11 passed`. If a test failed, read the first line that starts with `E`. It shows what the function gave and what the test expected. `ModuleNotFoundError` means you are not in the `backend` folder.
- Change one expected number in a test so that it is wrong, and run the command below again. Paste what it prints. Then change the number back.
  - command: `python -m pytest`
  - pattern: `^(=+ )?1 failed`
  - hint: The last line should start with `1 failed`. If every test still passes, you changed a number that no test uses, or you did not save the file. Make the change in a test, save, and run again.
