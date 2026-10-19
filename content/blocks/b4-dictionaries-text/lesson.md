# --screen-- concept

A **dictionary** maps keys to values, like a JavaScript object. Square brackets look up a value by its key. `.get` does the same, but a missing key gives `None` (nothing) instead of a crash.

::: tryit python
```python file=main.py
DEADLINE_HOURS = {"urgent": 24, "normal": 72, "low": 168}
print(DEADLINE_HOURS["normal"])     # 72
print(DEADLINE_HOURS.get("other"))  # None: .get doesn't crash on a missing key
```
:::

## --callout-- tip

Change `.get("other")` to `["other"]` and press Run to see the crash.

# --screen-- predict

## --code--

```python file=main.py
DEADLINE_HOURS = {"urgent": 24, "normal": 72, "low": 168}
urgency = "normal"
print(DEADLINE_HOURS[urgency] * 2)
```

## --question--

What does this print?

## --options--

- [x] `144`
  > Yes. `urgency` holds `"normal"`, so the lookup gives 72, and 72 times 2 is 144.
- [ ] `72`
  > No. 72 is the value from the lookup, but the line then multiplies it by 2.
- [ ] `48`
  > No. 48 would be twice the `"urgent"` deadline. `urgency` here is `"normal"`.
- [ ] An error, because `urgency` is not a key
  > No. `urgency` is a variable that holds `"normal"`, and `"normal"` is a key.

## --why--

The brackets look up the value that goes with a key. A variable can hold the key.

# --screen-- mcq

## --question--

What does `DEADLINE_HOURS.get("other")` return when there is no `"other"` key?

## --options--

- [x] `None`
  > Yes. `.get` gives `None` for a missing key instead of stopping the program.
- [ ] An error
  > No. Square brackets, as in `DEADLINE_HOURS["other"]`, would stop with an error. `.get` does not.
- [ ] `0`
  > No. `None` means nothing at all. It is not the number 0.

## --why--

`.get` is the safe way to look up a key that might not be there.

# --screen-- tapbuild

## --prompt--

Build the lookup that gives the deadline for a low complaint.

## --template--

```python
DEADLINE_HOURS___"low"___
```

## --tokens--

- `[`
- `]`
- `(`
- `)`
- `{`
- `}`

## --answer--

- `[`
- `]`

## --why--

Square brackets look up a key in a dictionary. Round brackets would call it as if it were a function, and curly braces build a new dictionary.

# --screen-- concept

`.lower()` turns every letter into a small letter. `in` asks whether one piece of text is inside another. Complaints come in any capitals, so lower the text before you look for a keyword.

::: tryit python
```python file=main.py
text = "The pipe has BURST in the bathroom"
print(text.lower())              # "the pipe has burst in the bathroom"
print("burst" in text.lower())   # True
print("burst" in text)           # False: the text has capitals
```
:::

# --screen-- spotbug

## --code--

```python file=main.py
description = "The pipe has BURST in the bathroom"
if "burst" in description:
    print("urgent")
```

## --question--

The complaint says BURST, but nothing is printed. What is wrong?

## --options--

- [x] The text still has capital letters, so `"burst"` is not found. It needs `description.lower()`.
  > Yes. `"burst"` and `"BURST"` are different text. Lowering the description first makes them match.
- [ ] `in` only works on lists.
  > No. `in` works on text too. `"burst" in text` asks whether the piece is inside the text.
- [ ] The `if` line needs `==` instead of `in`.
  > No. `==` asks whether two texts are exactly equal. A keyword is only a part of the description.
- [ ] The `print` line is not indented.
  > No. It is indented four spaces under the `if`.

## --why--

Python treats `B` and `b` as different letters. Lower the description once, then compare.

# --screen-- concept

Each urgency has a list of keywords. If one of them appears in a complaint, the complaint has that urgency. The urgency keywords come from Table IV of the paper.

## --code--

```python file=main.py
URGENCY_KEYWORDS = {
    "urgent": ["burst", "flood", "spark", "exposed wire", "no water", "broken lock"],
    "normal": ["leaking tap", "faulty socket", "broken bed", "blocked drain"],
    "low": ["paint", "loose handle", "squeaking door"],
}
```

# --screen-- concept

`triage_urgency` lowers the description, then checks the most serious urgency first. The first keyword it finds ends the function with `return`. If none is found, it returns `None`.

::: tryit python
```python file=main.py
URGENCY_KEYWORDS = {
    "urgent": ["burst", "flood", "spark", "exposed wire", "no water", "broken lock"],
    "normal": ["leaking tap", "faulty socket", "broken bed", "blocked drain"],
    "low": ["paint", "loose handle", "squeaking door"],
}


def triage_urgency(description: str) -> str | None:
    text = description.lower()
    for urgency in ["urgent", "normal", "low"]:      # most serious first
        for keyword in URGENCY_KEYWORDS[urgency]:
            if keyword in text:
                return urgency
    return None   # nothing matched: what happens next is a group decision


print(triage_urgency("The pipe in the bathroom has burst"))
```
:::

## --callout-- info

`str | None` means "text, or nothing". What the engine does when no keyword matches is one of six open design decisions. Placeholder until the group decides: urgency normal. See <a href="/reference/decisions" target="_blank" rel="noopener">Group decisions</a>.

# --screen-- order

## --prompt--

Put the steps of `triage_urgency` in the order it takes them.

## --items--

- Lower the description
- Take the urgencies one at a time, urgent first
- Check each keyword of that urgency against the text
- Return the urgency at the first keyword found
- If nothing matched, return `None`

## --why--

The text is lowered once. Then two loops run: one over the urgencies and, inside it, one over that urgency's keywords. `None` comes last, after both loops have finished with no match.

# --screen-- mcq

## --question--

Why does the function check the "urgent" keywords before the "low" ones?

## --options--

- [x] If a complaint matches both, the more serious urgency wins.
  > Yes. The function returns at the first match, so the order of the list decides which urgency wins.
- [ ] Python requires it.
  > No. Python runs the list in whatever order you write it. The order is our choice.
- [ ] Urgent keywords are shorter, so they are quicker to find.
  > No. Length has nothing to do with it. The order of the list does.

## --why--

A complaint can match more than one list. Checking the most serious first means a serious fault is never filed as a minor one.

# --screen-- predict

## --code--

```python file=main.py
print(triage_urgency("A spark near the squeaking door"))
print(triage_urgency("My tap is leaking"))
```

## --question--

`triage_urgency` is the function from the last screens. What do these two lines print?

## --options--

- [x] `urgent`, then `None`
  > Yes. `spark` is an urgent keyword and urgent is checked first. The normal keyword is `leaking tap`, and "my tap is leaking" has those words in a different order.
- [ ] `low`, then `normal`
  > No. Urgent is checked first, and `spark` matches it. And "leaking tap" is not found in "my tap is leaking".
- [ ] `urgent`, then `normal`
  > No. The second complaint has the right words in the wrong order, so no keyword is found and the answer is `None`.
- [ ] `low`, then `None`
  > No. `squeaking door` is a low keyword, but `spark` matches first because urgent is checked before low.

## --why--

A keyword has to appear exactly as written, with its words in the same order.

# --screen-- multi

## --question--

Which of these complaints get no urgency from `triage_urgency`?

## --options--

- [x] "My tap is leaking"
  > Yes. The keyword is `leaking tap`, with the words in a different order.
- [x] "water dey drip from ceiling since morning"
  > Yes. None of the urgency keywords is in it. `no water` is a keyword, but `water` on its own is not.
- [ ] "The pipe in the bathroom has burst"
  > No. `burst` is an urgent keyword.
- [ ] "There's a spark coming from the socket"
  > No. `spark` is an urgent keyword.
- [ ] "The squeaking door keeps me awake"
  > No. `squeaking door` is a low keyword.

## --why--

A keyword list only knows the words and the word order it holds. This is the weakness the paper describes, and the reason Jev is an optional alternative (chapter A3).

# --screen-- concept

The paper does not list category keywords, so this is a starting set for you to improve. Each category has a list of keywords, like the urgencies do.

## --code--

```python file=main.py
CATEGORY_KEYWORDS = {
    "plumbing": ["pipe", "tap", "leak", "water", "drain", "toilet", "shower", "flood"],
    "electrical": ["socket", "light", "bulb", "wire", "spark", "fan", "switch", "power"],
    "carpentry": ["door", "bed", "window", "wardrobe", "handle", "lock", "chair", "table"],
    "sanitation": ["dirty", "smell", "refuse", "waste", "cockroach", "rat", "bin"],
}
```

# --screen-- typein

## --prompt--

Write `triage_category(description) -> str`. It returns the first category whose keywords appear in the description, or `"other"` if none do. Copy the shape of `triage_urgency`. Then loop over `COMPLAINTS` and print one line for each: the complaint, its category and its urgency.

## --seed-contents--

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

COMPLAINTS = [
    "The pipe in the bathroom has burst",
    "There's a spark coming from the socket",
    "My tap is leaking",
    "The squeaking door keeps me awake",
    "water dey drip from ceiling since morning",
]


def triage_urgency(description: str) -> str | None:
    text = description.lower()
    for urgency in ["urgent", "normal", "low"]:      # most serious first
        for keyword in URGENCY_KEYWORDS[urgency]:
            if keyword in text:
                return urgency
    return None   # nothing matched: what happens next is a group decision


--editable-region--

--editable-region--
```

## --tests--

Your code should define a function called `triage_category`.

```py
assert has_function('triage_category')
```

`triage_category("The pipe in the bathroom has burst")` should return `"plumbing"`.

```py
assert triage_category("The pipe in the bathroom has burst") == "plumbing"
```

`triage_category("There's a spark coming from the socket")` should return `"electrical"`.

```py
assert triage_category("There's a spark coming from the socket") == "electrical"
```

`triage_category("The squeaking door keeps me awake")` should return `"carpentry"`.

```py
assert triage_category("The squeaking door keeps me awake") == "carpentry"
```

`triage_category("The bin is full and it smells")` should return `"sanitation"`.

```py
assert triage_category("The bin is full and it smells") == "sanitation"
```

`triage_category("water dey drip from ceiling since morning")` should return `"plumbing"`. Lower the description before you look for keywords.

```py
assert triage_category("water dey drip from ceiling since morning") == "plumbing"
```

When two categories match, your function should return the first one in `CATEGORY_KEYWORDS`. "Water is dripping on the light switch" should give `"plumbing"`.

```py
assert triage_category("Water is dripping on the light switch") == "plumbing"
```

When no category matches, your function should return `"other"`.

```py
assert triage_category("The corridor is very noisy") == "other"
```

Your code should print one line for each complaint in `COMPLAINTS`, with the complaint, its category and its urgency on the same line.

```py
lines = _stdout.splitlines()
for c in COMPLAINTS:
    line = next((l for l in lines if c in l), None)
    assert line is not None
    assert triage_category(c) in line
    assert str(triage_urgency(c)) in line
```

## --solutions--

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

COMPLAINTS = [
    "The pipe in the bathroom has burst",
    "There's a spark coming from the socket",
    "My tap is leaking",
    "The squeaking door keeps me awake",
    "water dey drip from ceiling since morning",
]


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


for complaint in COMPLAINTS:
    print(complaint, "|", triage_category(complaint), "|", triage_urgency(complaint))
```

## --why--

`triage_category` has the same shape as `triage_urgency`: lower the text, loop over the lists, return at the first match. Look at your five lines: "My tap is leaking" and the Pidgin complaint have a category but no urgency.
