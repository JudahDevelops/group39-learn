# --description--

Build the occupancy report of the IHMS: for each hostel, how many bed spaces it has and how many of them are taken. Press **See the finished project** to try the example. The real report is for admins only, and login comes in a later chapter, so here anyone can ask for it.

The data is in `data.py`: four lists of dictionaries for the hostels, the rooms, the bed spaces and the allocations. Do not change `data.py`. Write the app in `main.py`, and use the user stories as your checklist.

# --user-stories--

1. `main.py` creates a FastAPI app in a variable called `app`.
2. `GET /api/health` replies with status 200 and `{"status": "ok"}`.
3. `GET /api/reports/occupancy` replies with status 200 and a JSON list.
4. The list has one item for each hostel in `data.py`.
5. Each item has exactly three keys: `name`, `beds` and `occupied`.
6. `name` is the name of the hostel, and `beds` is how many bed spaces are in its rooms.
7. `occupied` is how many of those bed spaces have an allocation with the status `active`. An allocation with the status `ended` does not count.
8. A hostel with no allocations stays in the list, with `occupied` set to `0`.
9. The items are in order of `name`, A to Z.
10. The report reads the lists each time it is asked. A hostel, room, bed space or allocation that is added later shows up in the next reply.

# --hints--

`main.py` should define `app`, a `FastAPI` app. Write `app = FastAPI(...)`.

```py
from fastapi import FastAPI
assert isinstance(app, FastAPI)
```

`GET /api/health` should answer with status 200 and the reply `{"status": "ok"}`.

```py
r = await client.get('/api/health')
assert r.status_code == 200
assert r.json() == {'status': 'ok'}
```

`GET /api/reports/occupancy` should answer with status 200.

```py
r = await client.get('/api/reports/occupancy')
assert r.status_code == 200
```

The reply of `GET /api/reports/occupancy` should be a JSON list with one item for each hostel in `data.py`.

```py
import data
r = await client.get('/api/reports/occupancy')
assert isinstance(r.json(), list)
assert len(r.json()) == len(data.HOSTELS)
```

Each item should have exactly three keys: `name`, `beds` and `occupied`.

```py
r = await client.get('/api/reports/occupancy')
rows = r.json()
assert len(rows) > 0
assert all(set(row) == {'name', 'beds', 'occupied'} for row in rows)
```

The `name` of each item should be the name of a hostel: `Block A` and `Block B`.

```py
r = await client.get('/api/reports/occupancy')
assert sorted(row['name'] for row in r.json()) == ['Block A', 'Block B']
```

`beds` should be the number of bed spaces in the hostel's rooms, as a whole number. Block A has 4 and Block B has 4.

```py
r = await client.get('/api/reports/occupancy')
rows = {row['name']: row for row in r.json()}
assert rows['Block A']['beds'] == 4
assert rows['Block B']['beds'] == 4
assert type(rows['Block A']['beds']) is int
```

`occupied` should count the allocations with the status `active` on the hostel's bed spaces. Block A has 2 active allocations, so its `occupied` should be 2.

```py
r = await client.get('/api/reports/occupancy')
rows = {row['name']: row for row in r.json()}
assert rows['Block A']['occupied'] == 2
```

An allocation with the status `ended` should not count. Block A also has 1 ended allocation, and `occupied` should still be 2.

```py
import data
statuses = sorted(a['status'] for a in data.ALLOCATIONS)
assert statuses == ['active', 'active', 'ended']
r = await client.get('/api/reports/occupancy')
rows = {row['name']: row for row in r.json()}
assert rows['Block A']['occupied'] == 2
```

A hostel with no allocations should stay in the list with `occupied` set to 0. Block B has none.

```py
r = await client.get('/api/reports/occupancy')
rows = {row['name']: row for row in r.json()}
assert 'Block B' in rows
assert rows['Block B']['occupied'] == 0
```

The report should read the lists every time: when an `active` allocation is added to a Block B bed, the next reply should show `occupied` 1 for Block B.

```py
import data
extra = {'id': 99, 'student_id': 99, 'bed_space_id': 5, 'status': 'active'}
data.ALLOCATIONS.append(extra)
try:
    r = await client.get('/api/reports/occupancy')
    rows = {row['name']: row for row in r.json()}
    assert rows['Block B']['occupied'] == 1
finally:
    data.ALLOCATIONS.remove(extra)
```

The report should read the lists every time: when an allocation ends, the next reply should count one fewer. Ending allocation 1 should make Block A show `occupied` 1.

```py
import data
first = data.ALLOCATIONS[0]
data.ALLOCATIONS[0] = dict(first, status='ended')
try:
    r = await client.get('/api/reports/occupancy')
    rows = {row['name']: row for row in r.json()}
    assert rows['Block A']['occupied'] == 1
finally:
    data.ALLOCATIONS[0] = first
```

The items should be in order of `name`, A to Z. A new hostel called `Annex`, added at the end of `HOSTELS`, should come first, with its own beds and allocations counted.

```py
import data
hostel = {'id': 3, 'name': 'Annex', 'gender': 'female', 'level': 200}
room = {'id': 5, 'hostel_id': 3, 'number': 'N-101'}
beds = [{'id': 9, 'room_id': 5, 'label': '1'}, {'id': 10, 'room_id': 5, 'label': '2'}]
allocation = {'id': 98, 'student_id': 98, 'bed_space_id': 9, 'status': 'active'}
data.HOSTELS.append(hostel)
data.ROOMS.append(room)
data.BED_SPACES.extend(beds)
data.ALLOCATIONS.append(allocation)
try:
    r = await client.get('/api/reports/occupancy')
    rows = r.json()
    assert [row['name'] for row in rows] == ['Annex', 'Block A', 'Block B']
    assert rows[0]['beds'] == 2
    assert rows[0]['occupied'] == 1
finally:
    data.HOSTELS.remove(hostel)
    data.ROOMS.remove(room)
    for bed in beds:
        data.BED_SPACES.remove(bed)
    data.ALLOCATIONS.remove(allocation)
```

# --seed--

## --seed-contents--

```python file=main.py
--editable-region--

--editable-region--
```

```python file=data.py
# Sample data for the IHMS, kept in lists for now. Chapter B7 moves it into PostgreSQL.
# The hostels, rooms and bed spaces are the sample data of the database design.
# The allocations are made up for this lab.

HOSTELS = [
    {"id": 1, "name": "Block A", "gender": "female", "level": 100},
    {"id": 2, "name": "Block B", "gender": "male", "level": 100},
]

ROOMS = [
    {"id": 1, "hostel_id": 1, "number": "A-101"},
    {"id": 2, "hostel_id": 1, "number": "A-102"},
    {"id": 3, "hostel_id": 2, "number": "B-101"},
    {"id": 4, "hostel_id": 2, "number": "B-102"},
]

BED_SPACES = [
    {"id": 1, "room_id": 1, "label": "1"},
    {"id": 2, "room_id": 1, "label": "2"},
    {"id": 3, "room_id": 2, "label": "1"},
    {"id": 4, "room_id": 2, "label": "2"},
    {"id": 5, "room_id": 3, "label": "1"},
    {"id": 6, "room_id": 3, "label": "2"},
    {"id": 7, "room_id": 4, "label": "1"},
    {"id": 8, "room_id": 4, "label": "2"},
]

ALLOCATIONS = [
    {"id": 1, "student_id": 1, "bed_space_id": 1, "status": "active"},
    {"id": 2, "student_id": 2, "bed_space_id": 2, "status": "active"},
    {"id": 3, "student_id": 3, "bed_space_id": 3, "status": "ended"},
]
```

# --solutions--

```python file=main.py
from fastapi import FastAPI
from pydantic import BaseModel

from data import ALLOCATIONS, BED_SPACES, HOSTELS, ROOMS

app = FastAPI(title="IHMS")


class OccupancyRow(BaseModel):
    name: str
    beds: int
    occupied: int


def by_name(row):
    return row["name"]


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/reports/occupancy", response_model=list[OccupancyRow])
def occupancy():
    report = []
    for hostel in HOSTELS:
        room_ids = [r["id"] for r in ROOMS if r["hostel_id"] == hostel["id"]]
        bed_ids = [b["id"] for b in BED_SPACES if b["room_id"] in room_ids]
        active = [a for a in ALLOCATIONS if a["bed_space_id"] in bed_ids and a["status"] == "active"]
        report.append({"name": hostel["name"], "beds": len(bed_ids), "occupied": len(active)})
    return sorted(report, key=by_name)
```

```python file=data.py
# Sample data for the IHMS, kept in lists for now. Chapter B7 moves it into PostgreSQL.
# The hostels, rooms and bed spaces are the sample data of the database design.
# The allocations are made up for this lab.

HOSTELS = [
    {"id": 1, "name": "Block A", "gender": "female", "level": 100},
    {"id": 2, "name": "Block B", "gender": "male", "level": 100},
]

ROOMS = [
    {"id": 1, "hostel_id": 1, "number": "A-101"},
    {"id": 2, "hostel_id": 1, "number": "A-102"},
    {"id": 3, "hostel_id": 2, "number": "B-101"},
    {"id": 4, "hostel_id": 2, "number": "B-102"},
]

BED_SPACES = [
    {"id": 1, "room_id": 1, "label": "1"},
    {"id": 2, "room_id": 1, "label": "2"},
    {"id": 3, "room_id": 2, "label": "1"},
    {"id": 4, "room_id": 2, "label": "2"},
    {"id": 5, "room_id": 3, "label": "1"},
    {"id": 6, "room_id": 3, "label": "2"},
    {"id": 7, "room_id": 4, "label": "1"},
    {"id": 8, "room_id": 4, "label": "2"},
]

ALLOCATIONS = [
    {"id": 1, "student_id": 1, "bed_space_id": 1, "status": "active"},
    {"id": 2, "student_id": 2, "bed_space_id": 2, "status": "active"},
    {"id": 3, "student_id": 3, "bed_space_id": 3, "status": "ended"},
]
```

# --help--

## --hint--

Follow the same chain as the SQL query in the database design: a hostel has rooms, a room has bed spaces, and an allocation points to a bed space. For one hostel, find its rooms first, then the bed spaces in those rooms, then the allocations on those bed spaces.

## --hint--

Use `len(...)` to count a list you built. A list comprehension can build a filtered list, and `in` checks whether a value is in a list. An allocation only counts when its `status` is `active`.

## --hint--

Build the report as a list of dictionaries, one for each hostel, then sort it by name before you return it. `sorted(report, key=...)` needs a small function that returns the name. Do all the work inside the route function, so every request sees the current lists.
