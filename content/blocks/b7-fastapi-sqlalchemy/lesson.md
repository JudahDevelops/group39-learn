# --screen-- concept

**SQLAlchemy** lets Python work with database rows as objects, so you write less SQL by hand. A class stands for a table, an object stands for a row, and an attribute stands for a column.

| In the database | In Python |
|---|---|
| The `complaints` table | The `Complaint` class |
| One row | One `Complaint` object |
| A column such as `status` | An attribute: `complaint.status` |

## --callout-- info

You already wrote the SQL for the tables. SQLAlchemy does not replace that. It lets your endpoints read and save the rows without writing every `select` and `insert` by hand.

# --screen-- concept

In the boxes of this lesson and the next workshop, the database is **SQLite**, kept in the browser's memory. Reload the page and it is empty. On your laptop and in GitHub's checks it is **PostgreSQL**, which keeps its rows. SQLAlchemy writes the SQL for whichever database the address names, so only the address changes.

| Where | Database | Address |
|---|---|---|
| This browser | SQLite | `sqlite://` |
| Your laptop | PostgreSQL | `postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5432/ihms` |

## --callout-- warning

One difference shows up. SQLite does not keep the time zone of a timestamp, so a deadline read back in the browser has no `+00:00` on the end. PostgreSQL keeps it.

# --screen-- mcq

## --question--

Your API works with SQLite in the browser. You now run the same code against PostgreSQL on your laptop. What do you change?

## --options--

- [x] The database address
  > Yes. The address tells SQLAlchemy which database to talk to. The models and endpoints stay the same.
- [ ] Every model
  > No. A model describes a table in Python. It does not depend on which database holds the table.
- [ ] Every endpoint
  > No. The endpoints ask for sessions and objects. SQLAlchemy turns that into SQL for the right database.
- [ ] The `select` queries
  > No. `select(Complaint)` is the same for SQLite and PostgreSQL. SQLAlchemy writes the SQL.

## --why--

SQLAlchemy sits between your code and the database. It translates your models and queries into the SQL of the database it is connected to.

# --screen-- concept

The address of your PostgreSQL database contains your password, so it must not be written in the code. Put it in a file called `backend/.env`. Git ignores that file, and the app reads it when it starts.

## --code--

```text
DATABASE_URL=postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5432/ihms
```

## --callout-- warning

`YOUR_PASSWORD` stands for the password you chose when you installed PostgreSQL. Never commit `.env`, and never paste its contents into a chat.

# --screen-- concept

`database.py` builds three things and one function. `engine` is the connection to the database, made from the address. `SessionLocal` makes sessions. `Base` is the parent of every model. `get_db` gives each request a session and closes it afterwards.

## --code--

```python file=database.py
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()   # copies the lines of backend/.env into the environment
engine = create_engine(os.environ["DATABASE_URL"])
SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    with SessionLocal() as db:
        yield db
```

## --callout-- tip

A **session** is one conversation with the database: you ask for rows, add rows and save them.

# --screen-- mcq

## --question--

Why does the database address go in `.env` and not in the code?

## --options--

- [x] It contains a password, and `.env` is never committed
  > Yes. Code is pushed to GitHub. A file that Git ignores keeps the password on your laptop.
- [ ] SQLAlchemy requires it
  > No. SQLAlchemy accepts an address written in the code. It would work, but the password would end up in Git.
- [ ] PostgreSQL only accepts addresses from `.env` files
  > No. PostgreSQL never sees the file. Your app reads the address and passes it on.
- [ ] It makes the queries faster
  > No. Where the address is stored has no effect on speed.

## --why--

Anything in your repository can be read by whoever can read the repository. A password belongs in a file that is not in it.

# --screen-- concept

A **model** is a class for one table. `Mapped[int]` is a whole-number column and `Mapped[str]` is text. `Mapped[datetime | None]` may also be empty. `default=` is the value used when you give none. Models describe tables you already made with SQL. They do not create them.

## --code--

```python file=models.py
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Complaint(Base):
    __tablename__ = "complaints"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    room_id: Mapped[int] = mapped_column(ForeignKey("rooms.id"))
    description: Mapped[str]
    category: Mapped[str]
    urgency: Mapped[str]
    status: Mapped[str] = mapped_column(default="Open")
    escalation_level: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
```

## --callout-- info

Write a model the same way for each of the other six tables.

# --screen-- concept

Press Run. Send `GET /api/complaints`, then `GET /api/complaints?status=Open`. `Depends(get_db)` is **dependency injection**: FastAPI opens a session for this request, passes it in as `db`, and closes it afterwards. `select(...)` builds the query. `db.scalars(query).all()` runs it and gives a list of `Complaint` objects.

::: tryit fastapi
```python file=main.py
from datetime import datetime, timedelta, timezone

from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import Base, SessionLocal, engine, get_db
from models import Complaint, Room, User
from schemas import ComplaintOut

Base.metadata.create_all(engine)   # the browser database starts empty

now = datetime.now(timezone.utc)
with SessionLocal() as db:
    db.add(User(id=1, full_name="Amina Bello"))
    db.add(Room(id=1, number="A-101"))
    db.add_all(
        [
            Complaint(
                student_id=1,
                room_id=1,
                description="Pipe burst under the sink, water on the floor",
                category="plumbing",
                urgency="urgent",
                created_at=now,
                deadline=now + timedelta(hours=24),
            ),
            Complaint(
                student_id=1,
                room_id=1,
                description="Squeaking door in the corridor",
                category="carpentry",
                urgency="low",
                status="Resolved",
                created_at=now - timedelta(days=8),
                deadline=now - timedelta(days=1),
            ),
        ]
    )
    db.commit()

app = FastAPI(title="IHMS")


@app.get("/api/complaints", response_model=list[ComplaintOut])
def list_complaints(status: str | None = None, db: Session = Depends(get_db)):
    query = select(Complaint).order_by(Complaint.deadline)
    if status:
        query = query.where(Complaint.status == status)
    return db.scalars(query).all()


@app.get("/api/complaints/{complaint_id}", response_model=ComplaintOut)
def get_complaint(complaint_id: int, db: Session = Depends(get_db)):
    complaint = db.get(Complaint, complaint_id)
    if complaint is None:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint
```

```python file=database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

engine = create_engine("sqlite://")   # on your laptop this is the PostgreSQL address
SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    with SessionLocal() as db:
        yield db
```

```python file=models.py
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class User(Base):   # shortened: the real table has more columns
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str]


class Room(Base):   # shortened: the real table has more columns
    __tablename__ = "rooms"

    id: Mapped[int] = mapped_column(primary_key=True)
    number: Mapped[str]


class Complaint(Base):
    __tablename__ = "complaints"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    room_id: Mapped[int] = mapped_column(ForeignKey("rooms.id"))
    description: Mapped[str]
    category: Mapped[str]
    urgency: Mapped[str]
    status: Mapped[str] = mapped_column(default="Open")
    escalation_level: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
```

```python file=schemas.py
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ComplaintOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    description: str
    category: str
    urgency: str
    status: str
    deadline: datetime
```
:::

## --callout-- tip

The soonest deadline comes first, because of `order_by(Complaint.deadline)`. Add `/1` to the path to read one complaint with `db.get`.

# --screen-- tapbuild

## --prompt--

Build the parameter that gives `list_complaints` a database session.

## --template--

```python
def list_complaints(db: Session = ___(___)):
```

## --tokens--

- `Depends`
- `get_db`
- `SessionLocal`
- `Session`
- `Base`

## --answer--

- `Depends`
- `get_db`

## --why--

`Depends(get_db)` tells FastAPI to run `get_db` for each request and pass in the session it yields. `SessionLocal` is what `get_db` uses inside, `Session` is the type of the parameter, and `Base` is the parent of the models.

# --screen-- spotbug

## --code--

```python
class ComplaintOut(BaseModel):
    id: int
    description: str
    deadline: datetime


@router.get("", response_model=list[ComplaintOut])
def list_complaints(db: Session = Depends(get_db)):
    return db.scalars(select(Complaint)).all()
```

## --question--

The database has complaints, but `GET /api/complaints` fails while FastAPI builds the reply. What is missing?

## --options--

- [x] `ComplaintOut` needs `model_config = ConfigDict(from_attributes=True)`, so it can read a `Complaint` object.
  > Yes. `db.scalars(...).all()` returns objects, not dictionaries. With `from_attributes=True`, Pydantic reads `complaint.id`, `complaint.description` and so on.
- [ ] `db.scalars(...)` should be `db.commit()`.
  > No. `commit()` saves changes. This endpoint only reads.
- [ ] `response_model` should be removed.
  > No. `response_model` chooses the fields in the reply. The problem is that `ComplaintOut` cannot read a model object yet.
- [ ] The path should end with a slash.
  > No. The path is fine. The error comes while the reply is being built.

## --why--

A `Complaint` is a Python object. Pydantic reads dictionaries by default, so `from_attributes=True` is what lets `ComplaintOut` read the fields of an object.

# --screen-- concept

Saving takes four calls. `db.add` puts the object in the session. `db.flush()` sends it to the database, so `complaint.id` is set. `db.commit()` makes everything permanent, together. `db.refresh` reloads the object.

## --code--

```python file=routers/complaints.py
complaint = Complaint(student_id=body.student_id, room_id=body.room_id, description=body.description,
                      category=category, urgency=urgency, created_at=now, deadline=deadline)
db.add(complaint)
db.flush()                       # sends it to the database, so complaint.id is set
db.add(ComplaintHistory(complaint_id=complaint.id, event="Lodged"))
db.commit()                      # makes both permanent together
db.refresh(complaint)
```

## --callout-- info

Until the login chapter, the student and the room come in the request body. A later chapter replaces them with the logged-in student and their allocated room.

# --screen-- predict

## --code--

```python
complaint = Complaint(student_id=1, room_id=1, description="Pipe burst under the sink",
                      category="plumbing", urgency="urgent", created_at=now, deadline=deadline)
db.add(complaint)
print(complaint.id)
db.flush()
print(complaint.id)
```

## --question--

The `complaints` table is empty. What do the two `print` lines show?

## --options--

- [x] `None`, then `1`
  > Yes. Before the flush the database has not seen the complaint, so it has no `id`. The flush sends it, and the database numbers the first row 1.
- [ ] `1`, then `1`
  > No. `db.add` only puts the object in the session. The database numbers a row when it receives it.
- [ ] `None`, then `None`
  > No. `db.flush()` sends the row to the database, and the database sends the new `id` back.
- [ ] `0`, then `1`
  > No. An object that has not been sent has no `id` at all, which Python shows as `None`, not `0`.

## --why--

An `id` is given by the database. The flush is the moment the complaint reaches it, so that is when `complaint.id` gets its value.

# --screen-- order

## --prompt--

Put the steps for saving a complaint and its history row in order.

## --items--

- Make the `Complaint` object
- `db.add(complaint)`
- `db.flush()`, so the complaint gets its `id`
- `db.add(ComplaintHistory(complaint_id=complaint.id, ...))`
- `db.commit()`, to save both rows
- `db.refresh(complaint)`

## --why--

The history row needs the complaint's `id`, so the flush comes before it. One commit at the end saves both rows or neither.

# --screen-- spotbug

## --code--

```python
@router.post("", response_model=ComplaintOut, status_code=201)
def create_complaint(body: ComplaintIn, db: Session = Depends(get_db)):
    complaint = Complaint(...)
    db.add(complaint)
    db.flush()
    db.add(ComplaintHistory(complaint_id=complaint.id, event="Lodged"))
    return complaint
```

## --question--

The endpoint replies 201 and the complaint has an `id`. After you restart the server, the complaint is gone. What is missing?

## --options--

- [x] `db.commit()` before the `return`
  > Yes. The flush sent the rows, but nothing made them permanent. When the request ends the session closes and the changes are thrown away.
- [ ] A second `db.flush()` after the history row
  > No. A flush sends rows to the database inside the open transaction, but it does not make them permanent.
- [ ] `db.refresh(complaint)` before the `return`
  > No. A refresh reloads the object. It does not save anything.
- [ ] `db.get(Complaint, complaint.id)` before the `return`
  > No. `db.get` reads a row. It does not save one.

## --why--

`db.commit()` is the call that makes the changes permanent. Without it, the session closes and the database forgets what the request did.

# --screen-- typein

## --prompt--

The function already builds the `Complaint`. Write the lines that save it: add the complaint, flush, add a `ComplaintHistory` with the event `Lodged`, commit once, and refresh the complaint. Its `category` and `urgency` are fixed here to keep the screen short.

## --seed-contents--

```python file=main.py
from datetime import datetime, timedelta, timezone

from fastapi import Depends, FastAPI
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import Complaint, ComplaintHistory
from schemas import ComplaintIn, ComplaintOut

Base.metadata.create_all(engine)

app = FastAPI(title="IHMS")


@app.post("/api/complaints", response_model=ComplaintOut, status_code=201)
def create_complaint(body: ComplaintIn, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    complaint = Complaint(
        student_id=body.student_id,
        room_id=body.room_id,
        description=body.description,
        category="plumbing",
        urgency="urgent",
        created_at=now,
        deadline=now + timedelta(hours=24),
    )
--editable-region--

--editable-region--
    return complaint
```

```python file=database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

engine = create_engine("sqlite://")
SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    with SessionLocal() as db:
        yield db
```

```python file=models.py
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class User(Base):   # shortened: the real table has more columns
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str]


class Room(Base):   # shortened: the real table has more columns
    __tablename__ = "rooms"

    id: Mapped[int] = mapped_column(primary_key=True)
    number: Mapped[str]


class Complaint(Base):
    __tablename__ = "complaints"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    room_id: Mapped[int] = mapped_column(ForeignKey("rooms.id"))
    description: Mapped[str]
    category: Mapped[str]
    urgency: Mapped[str]
    status: Mapped[str] = mapped_column(default="Open")
    escalation_level: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class ComplaintHistory(Base):
    __tablename__ = "complaint_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    complaint_id: Mapped[int] = mapped_column(ForeignKey("complaints.id"))
    event: Mapped[str]
    actor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
```

```python file=schemas.py
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ComplaintIn(BaseModel):
    student_id: int
    room_id: int
    description: str = Field(min_length=10, max_length=1000)


class ComplaintOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    description: str
    category: str
    urgency: str
    status: str
    deadline: datetime
```

## --tests--

`POST /api/complaints` should answer 201 and return the complaint with an `id`. Call `db.flush()` so the complaint gets one.

```py
r = await client.post('/api/complaints', json={'description': 'The pipe in the bathroom has burst', 'student_id': 1, 'room_id': 1})
assert r.status_code == 201
assert isinstance(r.json()['id'], int)
```

The complaint should be saved in the database. Add it with `db.add(complaint)` and call `db.commit()`.

```py
import database, models
r = await client.post('/api/complaints', json={'description': 'The pipe in the bathroom has burst', 'student_id': 1, 'room_id': 1})
cid = r.json()['id']
with database.SessionLocal() as db:
    c = db.get(models.Complaint, cid)
    assert c is not None
    assert c.description == 'The pipe in the bathroom has burst'
```

A history row with the event `Lodged` should be saved for the complaint. Add `ComplaintHistory(complaint_id=complaint.id, event="Lodged")`.

```py
import database, models
from sqlalchemy import select
r = await client.post('/api/complaints', json={'description': 'The pipe in the bathroom has burst', 'student_id': 1, 'room_id': 1})
cid = r.json()['id']
with database.SessionLocal() as db:
    rows = db.scalars(select(models.ComplaintHistory).where(models.ComplaintHistory.complaint_id == cid)).all()
    assert len(rows) == 1
    assert rows[0].event == 'Lodged'
```

## --solutions--

```python file=main.py
from datetime import datetime, timedelta, timezone

from fastapi import Depends, FastAPI
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import Complaint, ComplaintHistory
from schemas import ComplaintIn, ComplaintOut

Base.metadata.create_all(engine)

app = FastAPI(title="IHMS")


@app.post("/api/complaints", response_model=ComplaintOut, status_code=201)
def create_complaint(body: ComplaintIn, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    complaint = Complaint(
        student_id=body.student_id,
        room_id=body.room_id,
        description=body.description,
        category="plumbing",
        urgency="urgent",
        created_at=now,
        deadline=now + timedelta(hours=24),
    )
    db.add(complaint)
    db.flush()
    db.add(ComplaintHistory(complaint_id=complaint.id, event="Lodged"))
    db.commit()
    db.refresh(complaint)
    return complaint
```

```python file=database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

engine = create_engine("sqlite://")
SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    with SessionLocal() as db:
        yield db
```

```python file=models.py
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class User(Base):   # shortened: the real table has more columns
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str]


class Room(Base):   # shortened: the real table has more columns
    __tablename__ = "rooms"

    id: Mapped[int] = mapped_column(primary_key=True)
    number: Mapped[str]


class Complaint(Base):
    __tablename__ = "complaints"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    room_id: Mapped[int] = mapped_column(ForeignKey("rooms.id"))
    description: Mapped[str]
    category: Mapped[str]
    urgency: Mapped[str]
    status: Mapped[str] = mapped_column(default="Open")
    escalation_level: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class ComplaintHistory(Base):
    __tablename__ = "complaint_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    complaint_id: Mapped[int] = mapped_column(ForeignKey("complaints.id"))
    event: Mapped[str]
    actor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
```

```python file=schemas.py
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ComplaintIn(BaseModel):
    student_id: int
    room_id: int
    description: str = Field(min_length=10, max_length=1000)


class ComplaintOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    description: str
    category: str
    urgency: str
    status: str
    deadline: datetime
```

## --why--

`db.add` puts the object in the session. `db.flush()` gives the complaint its `id`, so the history row can point at it. One `db.commit()` saves both rows together, and `db.refresh` reloads the complaint before it is returned.
