# --screen-- concept

A request can carry a **body**: JSON that the client sends, such as a new complaint. To receive it, describe its shape with a **Pydantic model**. FastAPI checks every request against the model.

## --code--

```python file=schemas.py
from pydantic import BaseModel, Field


class ComplaintIn(BaseModel):
    description: str = Field(min_length=10, max_length=1000)
```

## --callout-- info

`Field(min_length=10, max_length=1000)` says the description must have between 10 and 1000 characters.

# --screen-- concept

Press Run. Send `POST /api/complaints` with the body `{"description": "The pipe in the bathroom has burst"}`. Then send `{"description": "help"}`. The files in `services` hold the triage and deadline rules you wrote in chapter B4.

::: tryit fastapi
```python file=main.py
from datetime import datetime, timezone

from fastapi import FastAPI

from schemas import ComplaintIn, ComplaintOut
from services.escalation import compute_deadline
from services.triage import triage_category, triage_urgency

app = FastAPI(title="IHMS")

COMPLAINTS = []


@app.get("/api/complaints")
def list_complaints():
    return COMPLAINTS


@app.post("/api/complaints", response_model=ComplaintOut, status_code=201)
def create_complaint(body: ComplaintIn):
    urgency = triage_urgency(body.description) or "normal"   # placeholder until the group decides
    complaint = {
        "id": len(COMPLAINTS) + 1,
        "description": body.description,
        "category": triage_category(body.description),
        "urgency": urgency,
        "status": "Open",
        "deadline": compute_deadline(datetime.now(timezone.utc), urgency),
    }
    COMPLAINTS.append(complaint)
    return complaint
```

```python file=schemas.py
from datetime import datetime

from pydantic import BaseModel, Field


class ComplaintIn(BaseModel):
    description: str = Field(min_length=10, max_length=1000)


class ComplaintOut(BaseModel):
    id: int
    description: str
    category: str
    urgency: str
    status: str
    deadline: datetime
```

```python file=services/triage.py
# IHMS triage rules, from chapter B4


def deadline_hours(urgency: str) -> int:
    """Return the resolution deadline in hours for an urgency level."""
    if urgency == "urgent":
        return 24
    if urgency == "normal":
        return 72
    return 168


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


CATEGORY_KEYWORDS = {
    "plumbing": ["pipe", "tap", "leak", "water", "drain", "toilet", "shower", "flood"],
    "electrical": ["socket", "light", "bulb", "wire", "spark", "fan", "switch", "power"],
    "carpentry": ["door", "bed", "window", "wardrobe", "handle", "lock", "chair", "table"],
    "sanitation": ["dirty", "smell", "refuse", "waste", "cockroach", "rat", "bin"],
}


def triage_category(description: str) -> str:
    text = description.lower()
    for category in ["plumbing", "electrical", "carpentry", "sanitation"]:
        for keyword in CATEGORY_KEYWORDS[category]:
            if keyword in text:
                return category
    return "other"
```

```python file=services/escalation.py
from datetime import datetime, timedelta

from services.triage import deadline_hours


def compute_deadline(created_at: datetime, urgency: str) -> datetime:
    return created_at + timedelta(hours=deadline_hours(urgency))
```
:::

## --callout-- tip

Send `GET /api/complaints` to see the stored complaints. They live in a list, so a restart empties it.

# --screen-- mcq

## --question--

What happens if the description is too short?

## --options--

- [x] FastAPI replies 422 before your function runs
  > Yes. The body does not fit `ComplaintIn`, so FastAPI refuses it and your function never starts.
- [ ] Your function crashes
  > No. Your function does not run at all. FastAPI checks the body first.
- [ ] FastAPI replies 404
  > No. 404 means nothing exists at that address. The address is right. The data is wrong.
- [ ] FastAPI saves the complaint and warns you
  > No. A body that does not fit the model is refused, so nothing is saved.

## --why--

The model is a gate. Only a body that fits it reaches your function.

# --screen-- multi

## --question--

`ComplaintIn` has one field, `description`, which must be text of 10 to 1000 characters. Select every body that FastAPI accepts.

## --options--

- [x] `{"description": "The pipe in the bathroom has burst"}`
  > Yes. It is text, and it is long enough.
- [ ] `{"description": "help"}`
  > No. It has 4 characters. The model asks for at least 10, so FastAPI replies 422.
- [ ] `{}`
  > No. The `description` field is missing, so FastAPI replies 422.
- [x] `{"description": "Broken lock on the door of B-214", "room": "B-214"}`
  > Yes. The `room` key is not in the model, and FastAPI ignores it. The description is fine.
- [ ] `{"description": 20240315123456}`
  > No. The description must be text. A number in place of text is refused with a 422.

## --why--

FastAPI checks that required fields are there, that their types fit, and that the rules inside `Field` hold. Extra keys are ignored.

# --screen-- concept

`response_model=ComplaintOut` controls exactly which fields are sent back. `status_code=201` sets the success code, because something was created.

## --code--

```python file=main.py
@app.post("/api/complaints", response_model=ComplaintOut, status_code=201)
def create_complaint(body: ComplaintIn):
    ...
```

# --screen-- mcq

## --question--

What does `response_model` do?

## --options--

- [x] Controls which fields are sent back
  > Yes. FastAPI shapes the reply to match `ComplaintOut`, so a field that is not in the model is not sent.
- [ ] Checks the request
  > No. The request is checked by the model on the function's argument, `body: ComplaintIn`.
- [ ] Sets the status code
  > No. That is `status_code=201`. `response_model` is only about the shape of the reply.
- [ ] Stores the reply in the database
  > No. `response_model` does not store anything. It only shapes what is sent.

## --why--

`ComplaintIn` describes what comes in, and `ComplaintOut` describes what goes out. They can differ.

# --screen-- tapbuild

## --prompt--

Build the decorator for lodging a complaint: a `POST` that replies 201 when something is created.

## --template--

```python
@app.___("/api/complaints", response_model=ComplaintOut, status_code=___)
```

## --tokens--

- `post`
- `get`
- `201`
- `200`
- `422`

## --answer--

- `post`
- `201`

## --why--

Lodging a complaint creates something, so the method is `post` and the success code is 201. `200` is for a plain read, and 422 is the code for data that is refused.

# --screen-- concept

`triage_urgency` returns `None` when no keyword matches. `x or "normal"` gives `x`, unless `x` is `None`, then `"normal"`. So the route always has an urgency.

## --code--

```python file=main.py
urgency = triage_urgency(body.description) or "normal"
```

## --callout-- warning

What happens when no keyword matches is one of the six open design decisions. `"normal"` is a placeholder. See <a href="/reference/decisions" target="_blank" rel="noopener">Group decisions</a>.

# --screen-- predict

## --code--

```python file=main.py
print(None or "normal")
print("urgent" or "normal")
```

## --question--

What do the two lines print?

## --options--

- [x] `normal`, then `urgent`
  > Yes. `None` is nothing, so `or` falls back to `"normal"`. `"urgent"` is a real value, so `or` keeps it.
- [ ] `normal`, then `normal`
  > No. `"urgent"` is not `None`, so `or` keeps it and never reaches `"normal"`.
- [ ] `None`, then `urgent`
  > No. `or` replaces `None` with the value on its right.
- [ ] `urgent`, then `normal`
  > No. These are the right values in the wrong order. The first line has `None` on the left.

## --why--

`a or b` is `a` when `a` has a value, and `b` when `a` is `None`.

# --screen-- spotbug

## --code--

```python file=main.py
@app.post("/api/complaints", response_model=ComplaintOut, status_code=201)
def create_complaint(body: ComplaintIn):
    urgency = triage_urgency(body["description"]) or "normal"
```

## --question--

The server replies 500, and Python says `'ComplaintIn' object is not subscriptable`. What is wrong?

## --options--

- [x] `body` is a model, so the field is read with a dot: `body.description`.
  > Yes. Square brackets are for dictionaries and lists. A Pydantic model keeps its fields as attributes.
- [ ] `triage_urgency` should be called without an argument.
  > No. It needs the description to look for keywords.
- [ ] `status_code=201` should be `200`.
  > No. The status code has nothing to do with this error. It is about reading the field.
- [ ] `"normal"` should be `None`.
  > No. The fallback is a placeholder for the open decision. The error comes earlier, from `body["description"]`.

## --why--

The request body arrives as a `ComplaintIn` object. Read `body.description`.

# --screen-- order

## --prompt--

Put in order what happens when `POST /api/complaints` arrives.

## --items--

- FastAPI reads the request body as JSON
- FastAPI checks it against `ComplaintIn` and replies 422 if it does not fit
- `create_complaint` runs and returns a dictionary
- FastAPI shapes the dictionary with `ComplaintOut`
- FastAPI sends the reply with status 201

## --why--

The model checks the body before your function starts, and `response_model` shapes the reply after it ends.

# --screen-- typein

## --prompt--

Write `POST /api/complaints`. It takes a `ComplaintIn`, finds the urgency (use `"normal"` when there is no keyword), and stores a complaint with an `id`, the description, its category, its urgency, the status `Open` and a deadline made with `compute_deadline` from the current time in UTC. It returns the complaint with status 201.

## --seed-contents--

```python file=main.py
from datetime import datetime, timezone

from fastapi import FastAPI

from schemas import ComplaintIn, ComplaintOut
from services.escalation import compute_deadline
from services.triage import triage_category, triage_urgency

app = FastAPI(title="IHMS")

COMPLAINTS = []


@app.get("/api/complaints")
def list_complaints():
    return COMPLAINTS


--editable-region--

--editable-region--
```

```python file=schemas.py
from datetime import datetime

from pydantic import BaseModel, Field


class ComplaintIn(BaseModel):
    description: str = Field(min_length=10, max_length=1000)


class ComplaintOut(BaseModel):
    id: int
    description: str
    category: str
    urgency: str
    status: str
    deadline: datetime
```

```python file=services/triage.py
# IHMS triage rules, from chapter B4


def deadline_hours(urgency: str) -> int:
    """Return the resolution deadline in hours for an urgency level."""
    if urgency == "urgent":
        return 24
    if urgency == "normal":
        return 72
    return 168


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


CATEGORY_KEYWORDS = {
    "plumbing": ["pipe", "tap", "leak", "water", "drain", "toilet", "shower", "flood"],
    "electrical": ["socket", "light", "bulb", "wire", "spark", "fan", "switch", "power"],
    "carpentry": ["door", "bed", "window", "wardrobe", "handle", "lock", "chair", "table"],
    "sanitation": ["dirty", "smell", "refuse", "waste", "cockroach", "rat", "bin"],
}


def triage_category(description: str) -> str:
    text = description.lower()
    for category in ["plumbing", "electrical", "carpentry", "sanitation"]:
        for keyword in CATEGORY_KEYWORDS[category]:
            if keyword in text:
                return category
    return "other"
```

```python file=services/escalation.py
from datetime import datetime, timedelta

from services.triage import deadline_hours


def compute_deadline(created_at: datetime, urgency: str) -> datetime:
    return created_at + timedelta(hours=deadline_hours(urgency))
```

## --tests--

Your app should answer `POST /api/complaints` with status 201.

```py
r = await client.post('/api/complaints', json={'description': 'The pipe in the bathroom has burst'})
assert r.status_code == 201
```

The reply should hold the `description` that was sent, and an `id`.

```py
r = await client.post('/api/complaints', json={'description': 'The pipe in the bathroom has burst'})
data = r.json()
assert data['description'] == 'The pipe in the bathroom has burst'
assert isinstance(data['id'], int)
```

"The pipe in the bathroom has burst" should come back with the category `plumbing`.

```py
r = await client.post('/api/complaints', json={'description': 'The pipe in the bathroom has burst'})
assert r.json()['category'] == 'plumbing'
```

It should come back with the urgency `urgent`. Use `triage_urgency` on the description.

```py
r = await client.post('/api/complaints', json={'description': 'The pipe in the bathroom has burst'})
assert r.json()['urgency'] == 'urgent'
```

A new complaint should have the status `Open`.

```py
r = await client.post('/api/complaints', json={'description': 'The pipe in the bathroom has burst'})
assert r.json()['status'] == 'Open'
```

The deadline of an urgent complaint should be 24 hours from now. Make it with `compute_deadline(datetime.now(timezone.utc), urgency)`.

```py
from datetime import datetime, timedelta, timezone
r = await client.post('/api/complaints', json={'description': 'The pipe in the bathroom has burst'})
deadline = datetime.fromisoformat(r.json()['deadline'])
left = deadline - datetime.now(timezone.utc)
assert timedelta(hours=23, minutes=58) < left < timedelta(hours=24, minutes=2)
```

A description that is too short, such as "help", should be refused with status 422.

```py
r = await client.post('/api/complaints', json={'description': 'help'})
assert r.status_code == 422
```

A complaint with no urgency keyword should still get a valid urgency.

```py
r = await client.post('/api/complaints', json={'description': 'My room is too hot at night'})
assert r.status_code == 201
assert r.json()['urgency'] in ('urgent', 'normal', 'low')
```

The complaint should be stored, so it appears in `GET /api/complaints`.

```py
before = len((await client.get('/api/complaints')).json())
await client.post('/api/complaints', json={'description': 'The socket near my bed has a spark'})
after = len((await client.get('/api/complaints')).json())
assert after == before + 1
```

The reply should have exactly the fields of `ComplaintOut`: `id`, `description`, `category`, `urgency`, `status` and `deadline`.

```py
r = await client.post('/api/complaints', json={'description': 'The pipe in the bathroom has burst'})
assert set(r.json()) == {'id', 'description', 'category', 'urgency', 'status', 'deadline'}
```

## --solutions--

```python file=main.py
from datetime import datetime, timezone

from fastapi import FastAPI

from schemas import ComplaintIn, ComplaintOut
from services.escalation import compute_deadline
from services.triage import triage_category, triage_urgency

app = FastAPI(title="IHMS")

COMPLAINTS = []


@app.get("/api/complaints")
def list_complaints():
    return COMPLAINTS


@app.post("/api/complaints", response_model=ComplaintOut, status_code=201)
def create_complaint(body: ComplaintIn):
    urgency = triage_urgency(body.description) or "normal"   # placeholder until the group decides
    complaint = {
        "id": len(COMPLAINTS) + 1,
        "description": body.description,
        "category": triage_category(body.description),
        "urgency": urgency,
        "status": "Open",
        "deadline": compute_deadline(datetime.now(timezone.utc), urgency),
    }
    COMPLAINTS.append(complaint)
    return complaint
```

```python file=schemas.py
from datetime import datetime

from pydantic import BaseModel, Field


class ComplaintIn(BaseModel):
    description: str = Field(min_length=10, max_length=1000)


class ComplaintOut(BaseModel):
    id: int
    description: str
    category: str
    urgency: str
    status: str
    deadline: datetime
```

```python file=services/triage.py
# IHMS triage rules, from chapter B4


def deadline_hours(urgency: str) -> int:
    """Return the resolution deadline in hours for an urgency level."""
    if urgency == "urgent":
        return 24
    if urgency == "normal":
        return 72
    return 168


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


CATEGORY_KEYWORDS = {
    "plumbing": ["pipe", "tap", "leak", "water", "drain", "toilet", "shower", "flood"],
    "electrical": ["socket", "light", "bulb", "wire", "spark", "fan", "switch", "power"],
    "carpentry": ["door", "bed", "window", "wardrobe", "handle", "lock", "chair", "table"],
    "sanitation": ["dirty", "smell", "refuse", "waste", "cockroach", "rat", "bin"],
}


def triage_category(description: str) -> str:
    text = description.lower()
    for category in ["plumbing", "electrical", "carpentry", "sanitation"]:
        for keyword in CATEGORY_KEYWORDS[category]:
            if keyword in text:
                return category
    return "other"
```

```python file=services/escalation.py
from datetime import datetime, timedelta

from services.triage import deadline_hours


def compute_deadline(created_at: datetime, urgency: str) -> datetime:
    return created_at + timedelta(hours=deadline_hours(urgency))
```

## --why--

`body: ComplaintIn` makes FastAPI check the request and hand you a model. Your function triages the description, builds the complaint and returns it, and `response_model` and `status_code` shape the reply.
