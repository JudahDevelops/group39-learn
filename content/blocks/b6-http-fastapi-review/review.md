## Requests and responses

**HTTP** is the language browsers and servers use. Every exchange is one **request** and one **response**. A URL has five pieces: `http://127.0.0.1:8000/api/complaints?status=Open` is the scheme `http`, the host `127.0.0.1` (this computer), the port `8000`, the path `/api/complaints` and the query `?status=Open`.

| Method | Means | IHMS example |
|---|---|---|
| `GET` | Read | List complaints |
| `POST` | Create | Lodge a complaint |
| `PATCH` | Change part of something | Move a complaint to its next status |
| `DELETE` | Remove | Rarely used here |

| Code | Meaning | When the IHMS uses it |
|---|---|---|
| 200 | OK | A successful read |
| 201 | Created | A complaint was lodged |
| 400 | Bad request | Fees not cleared |
| 401 | Not logged in | No token, or an expired one |
| 403 | Forbidden | A student calling an admin endpoint |
| 404 | Not found | No complaint with that id |
| 409 | Conflict | No vacant bed, already allocated, or a complaint already resolved |
| 422 | Invalid data | A description that is too short (FastAPI sends this for you) |

401 means "I do not know who you are". 403 means "I know who you are, and you may not do this". Two headers matter: `Content-Type: application/json` says the body is JSON, and `Authorization: Bearer <token>` says who is logged in.

## The IHMS API

A **REST API** is organised around resources, and every path starts with `/api`. F1 to F4 are the four flows of the architecture.

| Method | Path | Who | Does |
|---|---|---|---|
| `POST` | `/api/auth/login` | Everyone | Log in; returns a token |
| `GET` | `/api/me` | Everyone | Who am I? |
| `POST` | `/api/allocations` | Student | Apply for a bed space (F1) |
| `GET` | `/api/allocations/me` | Student | My bed space (F1) |
| `POST` | `/api/complaints` | Student | Lodge a complaint (F2) |
| `GET` | `/api/complaints` | Everyone, filtered by role | List complaints; `?status=Open` |
| `GET` | `/api/complaints/{id}` | Owner or staff | One complaint with its history |
| `PATCH` | `/api/complaints/{id}/advance` | Maintenance officer | Move to the next status |
| `PATCH` | `/api/students/{id}/fees-cleared` | Admin | Mark fees cleared |
| `GET` | `/api/reports/occupancy` | Admin | Occupancy by hostel |
| `GET` | `/api/reports/overdue.csv` | Admin | Download overdue complaints |

F3, overdue escalation, has no endpoint: a timer inside the server runs it. You built the complaint endpoints and the occupancy report with the data in memory. The endpoints that name a role need login, which a later chapter adds.

## A first app

```python
from fastapi import FastAPI

app = FastAPI(title="IHMS")

@app.get("/api/health")
def health():
    return {"status": "ok"}
```

`@app.get("/api/health")` is a **decorator**. It tells FastAPI to run the function below it when a GET request comes to that path, and to send back what it returns as JSON. FastAPI writes interactive documentation at `/docs`. On your laptop, `fastapi dev main.py` runs the app and restarts it whenever you save.

## Path parameters, query parameters and errors

`{complaint_id}` in a path is a **path parameter**. The type hint `int` makes FastAPI answer 422 for `/api/complaints/abc`. An argument that is not in the path, like `status`, is a **query parameter**, and `str | None = None` makes it optional. `raise HTTPException(...)` stops the function and sends an error response.

Press Run, then send `/api/complaints?status=Open`, `/api/complaints/2`, `/api/complaints/99` and `/api/complaints/abc`.

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

## Request bodies with Pydantic

To receive data, describe its shape with a **Pydantic model**. FastAPI checks every request body against it before your function runs.

| You write | It does |
|---|---|
| `class ComplaintIn(BaseModel)` | Describes the body that comes in |
| `Field(min_length=10, max_length=1000)` | The description must have 10 to 1000 characters; otherwise FastAPI replies 422 |
| `body: ComplaintIn` | Tells FastAPI to read the body as a `ComplaintIn` |
| `response_model=ComplaintOut` | Controls exactly which fields are sent back |
| `status_code=201` | Sets the success code for something created |

Keys the model does not have are ignored. `triage_urgency(text) or "normal"` gives `"normal"` when no keyword matches. That is a placeholder until the group decides, and it is one of the six open design decisions: see <a href="/reference/decisions" target="_blank" rel="noopener">Group decisions</a>.

::: tryit fastapi
```python file=main.py
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="IHMS")

COMPLAINTS = []


class ComplaintIn(BaseModel):
    description: str = Field(min_length=10, max_length=1000)


@app.post("/api/complaints", status_code=201)
def create_complaint(body: ComplaintIn):
    complaint = {"id": len(COMPLAINTS) + 1, "description": body.description, "status": "Open"}
    COMPLAINTS.append(complaint)
    return complaint
```
:::

## Routers and the frontend

A **router** groups the endpoints of one resource in their own file. `APIRouter(prefix="/complaints", tags=["complaints"])` sets the prefix and the heading in `/docs`. A router does nothing until `main.py` includes it with `app.include_router(complaints.router, prefix="/api")`. The prefixes join in order: `/api`, then `/complaints`, then the route's own path.

::: tryit fastapi
```python file=main.py
from fastapi import FastAPI

from routers import complaints

app = FastAPI(title="IHMS")
app.include_router(complaints.router, prefix="/api")
```

```python file=routers/complaints.py
from fastapi import APIRouter

router = APIRouter(prefix="/complaints", tags=["complaints"])


@router.get("")
def list_complaints():
    return []
```
:::

To serve the `frontend` folder from FastAPI, the `app.mount("/", StaticFiles(directory=FRONTEND, html=True), name="frontend")` line goes at the bottom of `main.py`, after every `/api` route, because it answers every path the routes above it did not. The page sends the form with `fetch`, and `JSON.stringify` turns the form data into the JSON text for the body.

## What the two builds showed

| Pattern | Where you used it |
|---|---|
| Keep the data in a list, so a restart empties it | `COMPLAINTS` and the lists in `data.py` |
| Find one item by its id, and raise 404 when there is none | `find_complaint` and `GET /api/complaints/{id}` |
| Build a dictionary from a function's result | `triage(description)` fills `category`, `urgency` and the deadline |
| Use the same `now` for two times | `created_at` and `deadline`, so the gap is exactly the deadline length |
| Step through states with a dictionary | `NEXT_STATUS` for `Open`, `Assigned`, `In Progress`, `Resolved` |
| Refuse a request that clashes with the state | 409 when a resolved complaint is advanced |
| Record each change | A history entry for lodging and for every advance |
| Follow ids from one list to the next | Hostel, then its rooms, then their bed spaces, then the allocations |
| Count only what applies | `occupied` counts allocations with the status `active`, and a hostel with none shows `0` |

### Remember

- A request is a method and a path. The status code of the response says how it went.
- FastAPI checks path parameters, query parameters and bodies against their type hints and models, and answers 422 when they do not fit.
- 401 is about who you are, 403 is about what you may do, 404 is about what exists and 409 is about the current state.
- `response_model` shapes the reply, and `status_code` sets the success code.
- Put the `/api` prefix in `include_router`, and mount the frontend last.
