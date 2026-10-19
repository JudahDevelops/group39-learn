# --description--

A class is hiring a bus for a trip to Abuja, and the riders share the cost. Each rider pays the same amount, rounded up to the next ₦50, so that the group always covers the bus. Use the user stories as your checklist: when every test passes, the lab is done.

To round up you need one new tool. `ceil` comes from the `math` module and rounds a number up to the next whole number, so `ceil(2.1)` is `3`. Import it the same way you imported from `datetime`: `from math import ceil`.

The trip is already set up at the top of `main.py`: `TRIP_TOTAL` is the cost of the bus, and `RIDER_COUNTS` lists the numbers of riders to show in the table. You write the rest.

# --user-stories--

1. Your `main.py` has a function `split_fare(total, riders)`.
2. `split_fare` returns what each rider pays, in naira. When the split is exact, it returns that amount: `split_fare(3000, 3)` returns `1000`.
3. `split_fare` rounds the amount up to the next ₦50: `split_fare(1000, 3)` returns `350`, because one third of 1000 is 333.33.
4. A share that is already a multiple of ₦50 is not rounded up again: `split_fare(5000, 4)` returns `1250`.
5. `split_fare` returns a whole number such as `350`, not a decimal such as `350.0`.
6. With one rider, that rider pays the whole total, rounded up: `split_fare(1230, 1)` returns `1250`.
7. With 0 riders, `split_fare` returns the text `No riders to split the fare.` and does not crash.
8. Your code prints the heading `Bus fare to Abuja: ₦48500`, using `TRIP_TOTAL`.
9. Below the heading, your code prints the table header `Riders | Each pays (₦)`.
10. Below the header, your code prints one row for each number in `RIDER_COUNTS`, in order, in the form `8 | 6100`, using `split_fare`.
11. The row for 0 riders shows the message: `0 | No riders to split the fare.`

# --hints--

Your code should define a function called `split_fare`.

```py
assert has_function('split_fare')
```

Your function should be written `split_fare(total, riders)`. Check the names of the two parameters.

```py
import ast
fn = next(n for n in ast.walk(_tree) if isinstance(n, ast.FunctionDef) and n.name == 'split_fare')
assert [a.arg for a in fn.args.args] == ['total', 'riders']
```

`split_fare(3000, 3)` should return `1000`: 3000 shared between 3 riders.

```py
assert split_fare(3000, 3) == 1000
```

`split_fare(1000, 3)` should return `350`. One third of 1000 is 333.33, and the next ₦50 above that is 350.

```py
assert split_fare(1000, 3) == 350
```

Rounding goes up, never to the nearest. `split_fare(1010, 1)` should return `1050`, even though 1010 is close to 1000.

```py
assert split_fare(1010, 1) == 1050
```

A share that is already a multiple of ₦50 should stay as it is. `split_fare(5000, 4)` should return `1250`.

```py
assert split_fare(5000, 4) == 1250
```

`split_fare(3000, 3)` should return a whole number, `1000`, not a decimal such as `1000.0`.

```py
assert str(split_fare(3000, 3)) == '1000'
assert str(split_fare(1000, 3)) == '350'
```

With one rider, that rider pays the whole total, rounded up. `split_fare(1230, 1)` should return `1250`.

```py
assert split_fare(1230, 1) == 1250
```

`split_fare(48500, 0)` should return the text `No riders to split the fare.` Check for 0 riders before you divide, because dividing by 0 stops Python with an error.

```py
assert split_fare(48500, 0) == 'No riders to split the fare.'
```

Your code should print the heading `Bus fare to Abuja: ₦48500` as its first line.

```py
assert _stdout.splitlines()[0] == 'Bus fare to Abuja: ₦48500'
```

Your code should use `TRIP_TOTAL` for the cost of the bus, not type 48500 again.

```py
import ast
assert any(isinstance(n, ast.Name) and n.id == 'TRIP_TOTAL' and isinstance(n.ctx, ast.Load) for n in ast.walk(_tree))
```

Your second line should be the table header `Riders | Each pays (₦)`.

```py
assert _stdout.splitlines()[1] == 'Riders | Each pays (₦)'
```

Your table should have a row for each number of riders above 0, in the form `8 | 6100`: the riders, a space, a bar, a space and what each rider pays.

```py
lines = _stdout.splitlines()
for row in ['8 | 6100', '10 | 4850', '12 | 4050', '15 | 3250', '20 | 2450']:
    assert row in lines
```

Your table should show the message in the row for 0 riders: `0 | No riders to split the fare.`

```py
assert '0 | No riders to split the fare.' in _stdout.splitlines()
```

Your table rows should come from `split_fare`. Call it inside a `for` loop over `RIDER_COUNTS`.

```py
import ast
loops = [n for n in ast.walk(_tree) if isinstance(n, ast.For)]
assert any(isinstance(c, ast.Call) and getattr(c.func, 'id', '') == 'split_fare' for l in loops for c in ast.walk(l))
```

Your table rows should be in the same order as `RIDER_COUNTS`: 0, 8, 10, 12, 15 and 20.

```py
assert _stdout.splitlines()[2:] == ['0 | No riders to split the fare.', '8 | 6100', '10 | 4850', '12 | 4050', '15 | 3250', '20 | 2450']
```

# --seed--

## --seed-contents--

```python file=main.py
# Bus fare to Abuja
TRIP_TOTAL = 48500
RIDER_COUNTS = [0, 8, 10, 12, 15, 20]
--editable-region--

--editable-region--
```

# --solutions--

```python file=main.py
# Bus fare to Abuja
TRIP_TOTAL = 48500
RIDER_COUNTS = [0, 8, 10, 12, 15, 20]
from math import ceil


def split_fare(total: int, riders: int) -> int | str:
    """Return what each rider pays, rounded up to the next 50 naira."""
    if riders == 0:
        return "No riders to split the fare."
    return ceil(total / riders / 50) * 50


print(f"Bus fare to Abuja: ₦{TRIP_TOTAL}")
print("Riders | Each pays (₦)")
for riders in RIDER_COUNTS:
    print(f"{riders} | {split_fare(TRIP_TOTAL, riders)}")
```

# --help--

## --hint--

Think in lots of ₦50. How many whole lots of ₦50 does one share need? If even a small part of a lot is left over, you need one more lot. Turn the number of lots back into naira at the end.

## --hint--

Dividing by 0 stops Python with an error, so deal with the 0 riders case first, before you divide. A function can return text in one case and a number in another.

## --hint--

The table is a `for` loop over `RIDER_COUNTS`. Each pass calls your function and prints one line with an f-string. For 0 riders, the line shows whatever the function returned.
