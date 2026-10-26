# --screen-- concept

One `main.py` gets hard to read. **Routers** group endpoints by resource, each group in its own file. This app keeps the complaint endpoints in `routers/complaints.py` and the Pydantic models in `schemas.py`. Press Run and send `GET /api/complaints`.

::: tryit fastapi
```python file=main.py
from fastapi import FastAPI

from routers import complaints

app = FastAPI(title="IHMS")
app.include_router(complaints.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}
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

```python file=routers/complaints.py
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from schemas import ComplaintIn, ComplaintOut
from services.escalation import compute_deadline
from services.triage import triage_category, triage_urgency

router = APIRouter(prefix="/complaints", tags=["complaints"])

COMPLAINTS = []


@router.get("")
def list_complaints(status: str | None = None):
    if status is None:
        return COMPLAINTS
    return [c for c in COMPLAINTS if c["status"] == status]


@router.get("/{complaint_id}")
def get_complaint(complaint_id: int):
    for c in COMPLAINTS:
        if c["id"] == complaint_id:
            return c
    raise HTTPException(status_code=404, detail="Complaint not found")


@router.post("", response_model=ComplaintOut, status_code=201)
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

# --screen-- concept

A router has a `prefix` that goes in front of every path in it. `main.py` adds its own prefix when it includes the router. `tags` groups the endpoints in `/docs`.

| Where | Value |
|---|---|
| `main.py`, `include_router` | `prefix="/api"` |
| The router | `prefix="/complaints"` |
| The route | `""` (the prefix itself) |
| Full path | `/api/complaints` |

## --code--

```python file=routers/complaints.py
router = APIRouter(prefix="/complaints", tags=["complaints"])
```

# --screen-- mcq

## --question--

What is a router for?

## --options--

- [x] Grouping related endpoints in their own file
  > Yes. A router keeps the complaint endpoints together, so `main.py` stays short.
- [ ] Connecting to the internet
  > No. The server and the network already do that. A router only organises your code.
- [ ] Choosing which users may call an endpoint
  > No. A router does not check users. That is a separate job, which you will meet in the chapter on users and roles.
- [ ] Making the endpoints run faster
  > No. A router changes how the code is arranged, not how fast it runs.

## --why--

A router is a folder drawer for endpoints: one drawer for complaints, another for allocations.

# --screen-- predict

## --code--

```python file=routers/complaints.py
router = APIRouter(prefix="/complaints", tags=["complaints"])


@router.get("/{complaint_id}")
def get_complaint(complaint_id: int):
    ...
```

## --question--

`main.py` includes this router with `app.include_router(complaints.router, prefix="/api")`. What is the full path of `get_complaint`?

## --options--

- [x] `/api/complaints/{complaint_id}`
  > Yes. The include prefix `/api`, the router prefix `/complaints` and the route path `/{complaint_id}` join in that order.
- [ ] `/complaints/{complaint_id}`
  > No. This leaves out the `/api` that `main.py` adds when it includes the router.
- [ ] `/api/{complaint_id}`
  > No. This leaves out the router's own prefix, `/complaints`.
- [ ] `/{complaint_id}`
  > No. Both prefixes are put in front of the route's path.

## --why--

Every route gets the prefixes of the places it passes through: first the one in `main.py`, then the router's own, then its own path.

# --screen-- match

## --prompt--

Match each part to its job.

## --pairs--

- `APIRouter(...)`
  - A group of endpoints for one resource
- `prefix="/complaints"`
  - Text put in front of every path in the router
- `tags=["complaints"]`
  - The heading that groups the endpoints in `/docs`
- `app.include_router(...)`
  - Adds the router's endpoints to the app

## --why--

You make the router, give it a prefix and tags, fill it with routes, and then include it in the app.

# --screen-- mcq

## --question--

What does `tags=["complaints"]` do?

## --options--

- [x] Groups the endpoints under "complaints" in `/docs`
  > Yes. The tag is a heading in the documentation. It does not change any path.
- [ ] Puts `/complaints` in front of every path
  > No. That is the `prefix`. A tag only labels the endpoints.
- [ ] Limits who can call the endpoints
  > No. A tag does not check anything. It is only a label.
- [ ] Changes the status code
  > No. Status codes are set on each route, for example `status_code=201`.

## --why--

`prefix` changes the paths. `tags` changes only how `/docs` lists them.

# --screen-- spotbug

## --code--

```python file=main.py
from fastapi import FastAPI

from routers import complaints

app = FastAPI(title="IHMS")
```

## --question--

`routers/complaints.py` is correct, but `GET /api/complaints` replies 404. What is missing?

## --options--

- [x] `app.include_router(complaints.router, prefix="/api")`
  > Yes. Importing the module is not enough. The app only knows the router's endpoints once it includes the router.
- [ ] `@app.get("/api/complaints")`
  > No. The route already exists in the router. Writing it again in `main.py` would give two routes for one path.
- [ ] A second `FastAPI()` for the router
  > No. There is one app. Routers attach to it.
- [ ] `import router`
  > No. The import `from routers import complaints` is right. The router has not been added to the app.

## --why--

A router does nothing until it is included. `include_router` is the line that connects it.

# --screen-- tapbuild

## --prompt--

Build the line in `main.py` that adds the complaints router to the app, under `/api`.

## --template--

```python
app.___(complaints.router, prefix="___")
```

## --tokens--

- `include_router`
- `add_router`
- `/api`
- `/complaints`
- `include`

## --answer--

- `include_router`
- `/api`

## --why--

The method is `include_router`. The prefix is `/api`. The router already carries `/complaints`, so putting it here as well would give `/complaints/complaints`.

# --screen-- order

## --prompt--

Put the steps of moving the complaint endpoints into a router in order.

## --items--

- Create `routers/complaints.py` and make a router with `APIRouter(prefix=..., tags=...)`
- Move each complaint function into the file, and change `@app.get` to `@router.get`
- Move the Pydantic models into `schemas.py` and import them where they are used
- In `main.py`, import the router module
- Include the router in the app with `app.include_router(...)`

## --why--

Build the router and fill it first. Then connect it to the app, because the app needs something to include.

# --screen-- typein

## --prompt--

Finish `routers/complaints.py`. Make a router with the prefix `/complaints` and the tag `complaints`, and add the list route to it: `GET ""` with the optional query parameter `status`. `main.py` already includes the router.

## --seed-contents--

```python file=main.py
from fastapi import FastAPI

from routers import complaints

app = FastAPI(title="IHMS")
app.include_router(complaints.router, prefix="/api")
```

```python file=routers/complaints.py
from fastapi import APIRouter, HTTPException

COMPLAINTS = [
    {"id": 1, "room": "B-214", "urgency": "urgent", "status": "Open"},
    {"id": 2, "room": "A-110", "urgency": "low", "status": "Resolved"},
]


--editable-region--

--editable-region--


@router.get("/{complaint_id}")
def get_complaint(complaint_id: int):
    for c in COMPLAINTS:
        if c["id"] == complaint_id:
            return c
    raise HTTPException(status_code=404, detail="Complaint not found")
```

## --tests--

`routers/complaints.py` should define a `router` made with `APIRouter`.

```py
import routers.complaints as rc
from fastapi import APIRouter
assert isinstance(rc.router, APIRouter)
```

The router should have the prefix `/complaints`.

```py
import routers.complaints as rc
assert rc.router.prefix == '/complaints'
```

`GET /api/complaints` should return the 2 complaints. The route path is `""`.

```py
r = await client.get('/api/complaints')
assert r.status_code == 200
assert len(r.json()) == 2
```

`GET /api/complaints?status=Open` should return only complaint 1.

```py
r = await client.get('/api/complaints', params={'status': 'Open'})
assert [c['id'] for c in r.json()] == [1]
```

The router should have the tag `complaints`, so that `/docs` groups its endpoints.

```py
spec = app.openapi()
assert spec['paths']['/api/complaints']['get']['tags'] == ['complaints']
```

`GET /api/complaints/2` should still work.

```py
r = await client.get('/api/complaints/2')
assert r.json()['room'] == 'A-110'
```

## --solutions--

```python file=main.py
from fastapi import FastAPI

from routers import complaints

app = FastAPI(title="IHMS")
app.include_router(complaints.router, prefix="/api")
```

```python file=routers/complaints.py
from fastapi import APIRouter, HTTPException

COMPLAINTS = [
    {"id": 1, "room": "B-214", "urgency": "urgent", "status": "Open"},
    {"id": 2, "room": "A-110", "urgency": "low", "status": "Resolved"},
]


router = APIRouter(prefix="/complaints", tags=["complaints"])


@router.get("")
def list_complaints(status: str | None = None):
    if status is None:
        return COMPLAINTS
    return [c for c in COMPLAINTS if c["status"] == status]


@router.get("/{complaint_id}")
def get_complaint(complaint_id: int):
    for c in COMPLAINTS:
        if c["id"] == complaint_id:
            return c
    raise HTTPException(status_code=404, detail="Complaint not found")
```

## --why--

`APIRouter` takes the prefix and the tags once. The routes under it only need their own part of the path, and `""` stands for the prefix on its own.

# --screen-- typein

## --prompt--

Finish `main.py`. Include the complaints router in the app, with the prefix `/api`.

## --seed-contents--

```python file=main.py
from fastapi import FastAPI

from routers import complaints

app = FastAPI(title="IHMS")
--editable-region--

--editable-region--
```

```python file=routers/complaints.py
from fastapi import APIRouter, HTTPException

COMPLAINTS = [
    {"id": 1, "room": "B-214", "urgency": "urgent", "status": "Open"},
    {"id": 2, "room": "A-110", "urgency": "low", "status": "Resolved"},
]


router = APIRouter(prefix="/complaints", tags=["complaints"])


@router.get("")
def list_complaints(status: str | None = None):
    if status is None:
        return COMPLAINTS
    return [c for c in COMPLAINTS if c["status"] == status]


@router.get("/{complaint_id}")
def get_complaint(complaint_id: int):
    for c in COMPLAINTS:
        if c["id"] == complaint_id:
            return c
    raise HTTPException(status_code=404, detail="Complaint not found")
```

## --tests--

`GET /api/complaints` should answer with status 200.

```py
r = await client.get('/api/complaints')
assert r.status_code == 200
```

`GET /api/complaints/2` should return the complaint for room `A-110`.

```py
r = await client.get('/api/complaints/2')
assert r.json()['room'] == 'A-110'
```

The router should be included with the prefix `/api`, so `GET /complaints` without it should be a 404.

```py
r = await client.get('/complaints')
assert r.status_code == 404
```

Include the router once only. The `/api/complaints` path should appear once in the app.

```py
paths = [getattr(route, 'path', None) for route in app.routes]
assert paths.count('/api/complaints') == 1
```

## --solutions--

```python file=main.py
from fastapi import FastAPI

from routers import complaints

app = FastAPI(title="IHMS")
app.include_router(complaints.router, prefix="/api")
```

```python file=routers/complaints.py
from fastapi import APIRouter, HTTPException

COMPLAINTS = [
    {"id": 1, "room": "B-214", "urgency": "urgent", "status": "Open"},
    {"id": 2, "room": "A-110", "urgency": "low", "status": "Resolved"},
]


router = APIRouter(prefix="/complaints", tags=["complaints"])


@router.get("")
def list_complaints(status: str | None = None):
    if status is None:
        return COMPLAINTS
    return [c for c in COMPLAINTS if c["status"] == status]


@router.get("/{complaint_id}")
def get_complaint(complaint_id: int):
    for c in COMPLAINTS:
        if c["id"] == complaint_id:
            return c
    raise HTTPException(status_code=404, detail="Complaint not found")
```

## --why--

The router holds the endpoints, and `include_router` adds them to the app. The `prefix="/api"` goes in front of the router's own `/complaints`.

# --screen-- checklist

## --items--

- On your laptop, move the complaint endpoints out of `main.py` into `backend/routers/complaints.py`, and change `@app.` to `@router.` on each one.
- Move the Pydantic models into `backend/schemas.py` and import them in the router.
- In `main.py`, include the router with `app.include_router(complaints.router, prefix="/api")`.
- Check that everything works exactly as before, and that `/docs` groups the complaint endpoints under "complaints".
