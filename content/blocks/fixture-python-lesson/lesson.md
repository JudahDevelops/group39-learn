# --screen-- concept

Python shows text with `print()`. The text goes inside quotes. Change the words, then press Run. The output appears under the code.

::: tryit python
```python file=main.py
print("Hello, Hall A")
```
:::

## --callout-- tip

Nothing you type here can break the course.

# --screen-- typein

## --prompt--

Print the text `Room B-214`.

## --seed-contents--

```python file=main.py
# Show the room number.
--editable-region--

--editable-region--
```

## --tests--

Your code should print the text `Room B-214`.

```py
assert prints('Room B-214')
```

## --solutions--

```python file=main.py
# Show the room number.
print("Room B-214")
```

## --why--

`print()` shows whatever is inside its brackets. Text needs quotes around it.
