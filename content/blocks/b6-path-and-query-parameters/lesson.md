# --screen-- concept

This app has two endpoints for complaints. Press Run, then send these requests one at a time: `/api/complaints`, `/api/complaints?status=Open`, `/api/complaints/2`, `/api/complaints/99` and `/api/complaints/abc`. Expect a list, a shorter list, one complaint, a 404 and a 422.

::: tryit fastapi
```python file=main.py
from fastapi import FastAPI, HTTPException

app = FastAPI(title="IHMS")

COMPLAINTS = [
    {"id": 1, "room": "B-214", "urgency": "urgent", "status": "Open"},
    {"id": 2, "room": "A-110", "urgency": "low", "status": "Resolved"},
]


@app.get("/api/complaints")
def list_complaints(status: str | None = None):
    if status is None:
        return COMPLAINTS
    return [c for c in COMPLAINTS if c["status"] == status]


@app.get("/api/complaints/{complaint_id}")
def get_complaint(complaint_id: int):
    for c in COMPLAINTS:
        if c["id"] == complaint_id:
            return c
    raise HTTPException(status_code=404, detail="Complaint not found")
```
:::

## --callout-- tip

Click a route under the Requests panel to fill in its path. Then replace `{complaint_id}` with a number.

# --screen-- concept

`{complaint_id}` in the path is a **path parameter**. FastAPI hands its value to the function argument with the same name. The type hint says `int`, so FastAPI turns the text `2` into the number 2. It rejects `/api/complaints/abc` with a 422 for you.

## --code--

```python file=main.py
@app.get("/api/complaints/{complaint_id}")
def get_complaint(complaint_id: int):
    for c in COMPLAINTS:
        if c["id"] == complaint_id:
            return c
    raise HTTPException(status_code=404, detail="Complaint not found")
```

# --screen-- predict

## --code--

```python file=main.py
from fastapi import FastAPI, HTTPException

app = FastAPI(title="IHMS")

COMPLAINTS = [
    {"id": 1, "room": "B-214", "urgency": "urgent", "status": "Open"},
    {"id": 2, "room": "A-110", "urgency": "low", "status": "Resolved"},
]


@app.get("/api/complaints/{complaint_id}")
def get_complaint(complaint_id: int):
    for c in COMPLAINTS:
        if c["id"] == complaint_id:
            return c
    raise HTTPException(status_code=404, detail="Complaint not found")
```

## --question--

What does `GET /api/complaints/2` send back?

## --options--

- [x] The complaint for room A-110, with status 200
  > Yes. The loop reaches the complaint whose `id` is 2 and returns it.
- [ ] The complaint for room B-214
  > No. B-214 is complaint 1. The path says 2.
- [ ] A 404, because 2 is a position in the list
  > No. The function compares the `id` field, not the position in the list.
- [ ] Both complaints
  > No. This route returns one complaint. The route that returns the whole list has no ID in its path.

## --why--

The `2` in the path becomes `complaint_id`, and the loop returns the complaint with that `id`.

# --screen-- mcq

## --question--

Why does `/api/complaints/abc` give a 422?

## --options--

- [x] The type hint says `int`, and FastAPI checks it
  > Yes. `abc` cannot become a whole number, so FastAPI refuses the request before your function runs.
- [ ] There is no complaint called abc
  > No. That would be a 404. Here FastAPI never gets as far as looking for a complaint.
- [ ] Paths cannot contain letters
  > No. Paths can contain letters, as in `/api/complaints`. This parameter is declared as a number.
- [ ] The function crashed
  > No. The function did not run at all. FastAPI stopped the request first.

## --why--

A type hint on a path parameter is a rule. FastAPI turns a wrong value into a 422 for you.

# --screen-- spotbug

## --code--

```python file=main.py
@app.get("/api/complaints/{complaint_id}")
def get_complaint(complaint_id: int):
    for c in COMPLAINTS:
        if c["id"] == complaint_id:
            return c
    raise HTTPException(status=404, detail="Complaint not found")
```

## --question--

A request for a complaint that does not exist gets status 500 instead of 404. What is wrong?

## --options--

- [x] `HTTPException` takes `status_code`, not `status`.
  > Yes. The wrong keyword makes Python raise an error of its own, so the server answers 500.
- [ ] `raise` should be `return`.
  > No. `raise` is right. It stops the function and sends the error response.
- [ ] `detail` must be a number.
  > No. `detail` is the message, so it is text.
- [ ] The loop should be a `while` loop.
  > No. The `for` loop visits each complaint and works well.

## --why--

`raise HTTPException(status_code=404, detail="...")` stops the function and sends an error response with the status code and message you choose.

# --screen-- concept

`status` is not in the path, so FastAPI treats it as a **query parameter**: `/api/complaints?status=Open`. `str | None = None` makes it optional. If the caller leaves it out, `status` is `None`.

## --code--

```python file=main.py
@app.get("/api/complaints")
def list_complaints(status: str | None = None):
    if status is None:
        return COMPLAINTS
    return [c for c in COMPLAINTS if c["status"] == status]
```

# --screen-- mcq

## --question--

In `/api/complaints?status=Open`, what is `status`?

## --options--

- [x] A query parameter
  > Yes. It comes after the `?`, and it is not part of the path.
- [ ] A path parameter
  > No. A path parameter sits inside the path, in braces, as `{complaint_id}` does.
- [ ] A status code
  > No. A status code is a number in a response, such as 404. This `status` is something the caller sends.
- [ ] A header
  > No. Headers travel beside the request. A query is part of the URL itself.

## --why--

Path parameters pick a resource. Query parameters add options such as a filter.

# --screen-- concept

`[c for c in COMPLAINTS if c["status"] == status]` is a **list comprehension**: a short way to build a filtered list. Read it as: take each `c` in `COMPLAINTS`, and keep it if its status matches.

## --code--

```python file=main.py
COMPLAINTS = [
    {"id": 1, "room": "B-214", "urgency": "urgent", "status": "Open"},
    {"id": 2, "room": "A-110", "urgency": "low", "status": "Resolved"},
]

open_only = [c for c in COMPLAINTS if c["status"] == "Open"]
print(open_only)
```

## --callout-- info

The long way is a loop that appends each match to a new list. The comprehension does the same in one line.

# --screen-- predict

## --code--

```python file=main.py
COMPLAINTS = [
    {"id": 1, "room": "B-214", "urgency": "urgent", "status": "Open"},
    {"id": 2, "room": "A-110", "urgency": "low", "status": "Resolved"},
]

status = "Resolved"
print([c["id"] for c in COMPLAINTS if c["status"] == status])
```

## --question--

What does this print?

## --options--

- [x] `[2]`
  > Yes. Only complaint 2 has the status `Resolved`, and the comprehension collects its `id`.
- [ ] `[1, 2]`
  > No. The `if` keeps only the complaints whose status matches.
- [ ] `[]`
  > No. Complaint 2 matches, so the list is not empty.
- [ ] `[{"id": 2, "room": "A-110", "urgency": "low", "status": "Resolved"}]`
  > No. The first part of the comprehension is `c["id"]`, so it collects the ID, not the whole complaint.

## --why--

The `if` decides which complaints stay. The expression before the `for` decides what is collected from each one.

# --screen-- tapbuild

## --prompt--

Build the filter: keep each complaint whose status equals `status`.

## --template--

```python
return [c for c ___ COMPLAINTS if c["status"] ___ status]
```

## --tokens--

- `in`
- `==`
- `=`
- `of`
- `!=`

## --answer--

- `in`
- `==`

## --why--

`for c in COMPLAINTS` visits each complaint. `==` asks whether two values are equal. A single `=` stores a value, and `!=` would keep the complaints that do not match.

# --screen-- typein

## --prompt--

Add `GET /api/complaints`. With no query it returns every complaint. With `?status=Open` it returns only the complaints with that status.

## --seed-contents--

```python file=main.py
from fastapi import FastAPI, HTTPException

app = FastAPI(title="IHMS")

COMPLAINTS = [
    {"id": 1, "room": "B-214", "urgency": "urgent", "status": "Open"},
    {"id": 2, "room": "A-110", "urgency": "low", "status": "Resolved"},
]


--editable-region--

--editable-region--
```

## --tests--

Your app should answer `GET /api/complaints` with status 200.

```py
r = await client.get('/api/complaints')
assert r.status_code == 200
```

With no query, the reply should be the whole list of 2 complaints.

```py
r = await client.get('/api/complaints')
assert len(r.json()) == 2
```

`GET /api/complaints?status=Open` should return only the complaint with the status `Open`.

```py
r = await client.get('/api/complaints', params={'status': 'Open'})
assert [c['id'] for c in r.json()] == [1]
```

`GET /api/complaints?status=Resolved` should return only complaint 2.

```py
r = await client.get('/api/complaints', params={'status': 'Resolved'})
assert [c['id'] for c in r.json()] == [2]
```

A status that no complaint has should give an empty list, not an error.

```py
r = await client.get('/api/complaints', params={'status': 'Assigned'})
assert r.status_code == 200
assert r.json() == []
```

## --solutions--

```python file=main.py
from fastapi import FastAPI, HTTPException

app = FastAPI(title="IHMS")

COMPLAINTS = [
    {"id": 1, "room": "B-214", "urgency": "urgent", "status": "Open"},
    {"id": 2, "room": "A-110", "urgency": "low", "status": "Resolved"},
]


@app.get("/api/complaints")
def list_complaints(status: str | None = None):
    if status is None:
        return COMPLAINTS
    return [c for c in COMPLAINTS if c["status"] == status]
```

## --why--

`status` is not in the path, so it is a query parameter. Giving it the default `None` makes it optional, and the function checks for `None` before it filters.

# --screen-- typein

## --prompt--

Add `GET /api/complaints/{complaint_id}`. It returns the complaint with that `id`. If there is none, it raises an `HTTPException` with status code 404. `HTTPException` is already imported.

## --seed-contents--

```python file=main.py
from fastapi import FastAPI, HTTPException

app = FastAPI(title="IHMS")

COMPLAINTS = [
    {"id": 1, "room": "B-214", "urgency": "urgent", "status": "Open"},
    {"id": 2, "room": "A-110", "urgency": "low", "status": "Resolved"},
]


@app.get("/api/complaints")
def list_complaints(status: str | None = None):
    if status is None:
        return COMPLAINTS
    return [c for c in COMPLAINTS if c["status"] == status]


--editable-region--

--editable-region--
```

## --tests--

`GET /api/complaints/2` should answer with status 200.

```py
r = await client.get('/api/complaints/2')
assert r.status_code == 200
```

`GET /api/complaints/2` should return the complaint for room `A-110`.

```py
r = await client.get('/api/complaints/2')
assert r.json()['room'] == 'A-110'
```

`GET /api/complaints/99` should answer with status 404, because there is no complaint 99.

```py
r = await client.get('/api/complaints/99')
assert r.status_code == 404
```

The 404 reply should carry a `detail` message.

```py
r = await client.get('/api/complaints/99')
assert isinstance(r.json().get('detail'), str) and r.json()['detail'] != ''
```

`GET /api/complaints/abc` should answer with status 422. Give the parameter the type hint `int`.

```py
r = await client.get('/api/complaints/abc')
assert r.status_code == 422
```

## --solutions--

```python file=main.py
from fastapi import FastAPI, HTTPException

app = FastAPI(title="IHMS")

COMPLAINTS = [
    {"id": 1, "room": "B-214", "urgency": "urgent", "status": "Open"},
    {"id": 2, "room": "A-110", "urgency": "low", "status": "Resolved"},
]


@app.get("/api/complaints")
def list_complaints(status: str | None = None):
    if status is None:
        return COMPLAINTS
    return [c for c in COMPLAINTS if c["status"] == status]


@app.get("/api/complaints/{complaint_id}")
def get_complaint(complaint_id: int):
    for c in COMPLAINTS:
        if c["id"] == complaint_id:
            return c
    raise HTTPException(status_code=404, detail="Complaint not found")
```

## --why--

The loop returns the first complaint with the right `id`. If the loop ends without a match, the `raise` runs and the caller gets a 404. The `int` type hint gives the 422 for free.

# --screen-- concept

A path parameter works with any method. This route removes a notice from the hall notice board. `NOTICES.remove(notice)` takes that item out of the list. Press Run, send `DELETE /api/notices/1`, then `GET /api/notices`.

::: tryit fastapi
```python file=main.py
from fastapi import FastAPI, HTTPException

app = FastAPI(title="IHMS")

NOTICES = [
    {"id": 1, "title": "Water will be off on Friday"},
    {"id": 2, "title": "Hall meeting at 6 pm"},
]


@app.get("/api/notices")
def list_notices():
    return NOTICES


@app.delete("/api/notices/{notice_id}")
def delete_notice(notice_id: int):
    for notice in NOTICES:
        if notice["id"] == notice_id:
            NOTICES.remove(notice)
            return notice
    raise HTTPException(status_code=404, detail="Notice not found")
```
:::

## --callout-- info

The route returns the notice it removed. Press Run again and the notice comes back, because the app starts again from the code.
