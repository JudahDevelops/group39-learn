# --description--

Student Affairs wants an API for room complaints. Build it in two files: the model goes in `models.py` and the routes go in `main.py`. Use the user stories as your checklist. Press Run, then use the Requests panel to try your app.

# --user-stories--

1. `models.py` defines a pydantic model called `Complaint` with the text fields `room` and `description`.
2. `POST /complaints` stores a complaint and returns it with an `id`, with status 201.
3. `GET /complaints` returns every complaint that was stored.
4. A complaint with no `description` is refused with status 422.

# --hints--

`models.py` should define a pydantic model called `Complaint`.

```py
import models
from pydantic import BaseModel
assert issubclass(models.Complaint, BaseModel)
```

`POST /complaints` with a room and a description should answer with status 201.

```py
r = await client.post('/complaints', json={'room': 'A-101', 'description': 'Leaking tap'})
assert r.status_code == 201
```

The reply should hold the `room` and `description` that were sent, and an `id`.

```py
r = await client.post('/complaints', json={'room': 'B-214', 'description': 'No light'})
complaint = r.json()
assert complaint['room'] == 'B-214'
assert complaint['description'] == 'No light'
assert 'id' in complaint
```

`GET /complaints` should return the complaints that were stored.

```py
posted = await client.post('/complaints', json={'room': 'A-102', 'description': 'Broken lock'})
r = await client.get('/complaints')
assert r.status_code == 200
assert posted.json() in r.json()
```

A complaint with no `description` should be refused with status 422.

```py
r = await client.post('/complaints', json={'room': 'A-101'})
assert r.status_code == 422
```

# --seed--

## --seed-contents--

```python file=main.py
from fastapi import FastAPI

app = FastAPI()
```

```python file=models.py
from pydantic import BaseModel
```

# --solutions--

```python file=main.py
from fastapi import FastAPI
from models import Complaint

app = FastAPI()

complaints = []

@app.post("/complaints", status_code=201)
async def create_complaint(complaint: Complaint):
    stored = {"id": len(complaints) + 1, **complaint.model_dump()}
    complaints.append(stored)
    return stored

@app.get("/complaints")
async def list_complaints():
    return complaints
```

```python file=models.py
from pydantic import BaseModel

class Complaint(BaseModel):
    room: str
    description: str
```

# --help--

## --hint--

Write the model first. A pydantic model is a class with one typed field per line: `room: str`.

## --hint--

`main.py` can use the model with `from models import Complaint`. A route takes it as an argument, and FastAPI refuses a body that does not fit it.

## --hint--

Keep the complaints in a list at the top of `main.py`. The POST route adds a dictionary to it and returns that dictionary. The GET route returns the list.
