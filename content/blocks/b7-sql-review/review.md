## Tables, rows and keys

A relational database keeps data in **tables** that point to each other. A table has **columns**, one kind of fact each, and **rows**, one thing each. The IHMS keeps its data in seven tables.

| Table | One row is |
|---|---|
| `hostels` | A hostel block |
| `rooms` | A room |
| `bed_spaces` | One bed in a room |
| `users` | Anyone who logs in |
| `allocations` | A student given a bed |
| `complaints` | A complaint |
| `complaint_history` | One thing that happened to a complaint |

Every table has an `id`, its **primary key**: a number that is different for every row. A column that ends in `_id` is a **foreign key**: it holds the `id` of a row in another table. `rooms.hostel_id` points to a row in `hostels`. One hostel has many rooms, one room has many bed spaces, and one complaint has many history entries.

::: tryit sql
```sql file=query.sql
select * from rooms;
```

```sql file=setup.sql
create table hostels (
  id     integer generated always as identity primary key,
  name   text not null unique,
  gender text not null check (gender in ('male', 'female')),
  level  integer not null
);

create table rooms (
  id        integer generated always as identity primary key,
  hostel_id integer not null references hostels(id),
  number    text not null,
  unique (hostel_id, number)
);

insert into hostels (name, gender, level) values ('Block A', 'female', 100), ('Block B', 'male', 100);

insert into rooms (hostel_id, number) values (1, 'A-101'), (1, 'A-102'), (2, 'B-101'), (2, 'B-102');
```
:::

`complaints.escalation_level` is not in the paper's tables. It remembers the last level that was emailed, so the hall warden is not emailed again every 15 minutes.

## Creating tables

`create table` gives the table name, then each column with its type and its rules. Capitals in keywords do not matter: `create table` and `CREATE TABLE` both work.

| Type | Holds |
|---|---|
| `integer` | A whole number |
| `text` | Words |
| `boolean` | True or false |
| `timestamptz` | A moment in time, with its time zone |

| Rule | Means |
|---|---|
| `generated always as identity primary key` | PostgreSQL numbers the rows for you |
| `not null` | Must have a value |
| `unique` | No two rows can share it |
| `check (...)` | Must pass this test |
| `references hostels(id)` | A foreign key: must match a real hostel |
| `default false` | The value used when none is given |

A foreign key can only point at a table that already exists, so you create `hostels` before `rooms`, and `rooms` before `bed_spaces`. A rule about two columns together, such as `unique (hostel_id, number)`, goes after the columns.

::: tryit sql
```sql file=query.sql
create table bed_spaces (
  id      integer generated always as identity primary key,
  room_id integer not null references rooms(id),
  label   text not null,
  unique (room_id, label)
);

select column_name, data_type, is_nullable
from information_schema.columns
where table_name = 'bed_spaces'
order by ordinal_position;
```

```sql file=setup.sql
create table hostels (
  id     integer generated always as identity primary key,
  name   text not null unique,
  gender text not null check (gender in ('male', 'female')),
  level  integer not null
);

create table rooms (
  id        integer generated always as identity primary key,
  hostel_id integer not null references hostels(id),
  number    text not null,
  unique (hostel_id, number)
);
```
:::

## Reading and writing rows

| You want to | You write |
|---|---|
| Read rows | `select` |
| Add rows | `insert into` |
| Change rows | `update` |
| Remove rows | `delete from` |

`where` keeps only the rows that match. Text goes in single quotes, `=` compares, and `<>` means not equal. `order by` sorts, `desc` reverses the order, and `limit` stops after that many rows. Everything after `--` is a comment. In an `insert`, leave out `id`: PostgreSQL numbers the row.

**Write the `where` of an `update` or a `delete` first.** `update complaints set status = 'Resolved';` with no `where` changes every complaint.

::: tryit sql
```sql file=query.sql
update complaints set status = 'Assigned' where id = 4;

select id, category, urgency, status
from complaints
where status <> 'Resolved'
order by deadline
limit 10;
```

```sql file=setup.sql
create table hostels (
  id     integer generated always as identity primary key,
  name   text not null unique,
  gender text not null check (gender in ('male', 'female')),
  level  integer not null
);

create table rooms (
  id        integer generated always as identity primary key,
  hostel_id integer not null references hostels(id),
  number    text not null,
  unique (hostel_id, number)
);

create table users (
  id            integer generated always as identity primary key,
  full_name     text not null,
  email         text not null unique,
  password_hash text not null,
  role          text not null check (role in ('student', 'maintenance_officer', 'hall_warden', 'admin')),
  gender        text check (gender in ('male', 'female')),
  level         integer,
  fees_cleared  boolean not null default false,
  unit          text,                              -- maintenance officers: plumbing, electrical, ...
  hostel_id     integer references hostels(id)     -- hall wardens: the hostel they run
);

create table complaints (
  id               integer generated always as identity primary key,
  student_id       integer not null references users(id),
  room_id          integer not null references rooms(id),
  description      text not null,
  category         text not null,
  urgency          text not null check (urgency in ('urgent', 'normal', 'low')),
  status           text not null default 'Open'
                   check (status in ('Open', 'Assigned', 'In Progress', 'Resolved')),
  escalation_level integer not null default 0,
  created_at       timestamptz not null default now(),
  deadline         timestamptz not null,
  resolved_at      timestamptz
);

insert into hostels (name, gender, level) values ('Block A', 'female', 100), ('Block B', 'male', 100);

insert into rooms (hostel_id, number) values (1, 'A-101'), (1, 'A-102'), (2, 'B-101'), (2, 'B-102');

insert into users (full_name, email, password_hash, role, gender, level, fees_cleared) values
  ('Amina Bello', 'amina.bello@example.com', 'placeholder', 'student', 'female', 100, true),
  ('Chidi Okafor', 'chidi.okafor@example.com', 'placeholder', 'student', 'male', 100, true),
  ('Ngozi Obi', 'ngozi.obi@example.com', 'placeholder', 'student', 'female', 100, true);

insert into complaints
  (student_id, room_id, description, category, urgency, status, escalation_level, created_at, deadline, resolved_at)
values
  (1, 1, 'Pipe burst under the sink, water on the floor', 'plumbing', 'urgent', 'Open', 1,
   now() - interval '30 hours', now() - interval '6 hours', null),
  (2, 3, 'Socket sparks when I charge my phone', 'electrical', 'urgent', 'Assigned', 2,
   now() - interval '60 hours', now() - interval '36 hours', null),
  (3, 2, 'Broken bed frame, one leg is cracked', 'carpentry', 'normal', 'In Progress', 0,
   now() - interval '2 days', now() + interval '1 day', null),
  (1, 1, 'Leaking tap in the bathroom', 'plumbing', 'normal', 'Open', 0,
   now() - interval '2 days', now() + interval '1 day', null),
  (3, 2, 'Squeaking door in the corridor', 'carpentry', 'low', 'Resolved', 0,
   now() - interval '8 days', now() - interval '1 day', now() - interval '8 days' + interval '96 hours');
```
:::

## Joins and reports

A **join** looks up the matching row in another table. `on` says how the rows match, and a short name after the table, such as `c` for `complaints`, saves typing. **group by** turns rows into totals. `having` filters the groups the way `where` filters rows. `left join` keeps the rows that have no match, and `join` drops them.

The deadline of a complaint comes from its urgency.

| Urgency | Deadline |
|---|---|
| urgent | 24 hours |
| normal | 72 hours |
| low | 7 days |

These are the reports of the Reporting module.

| Report | How it is written |
|---|---|
| Bed occupancy | `left join` the allocations with `a.status = 'active'`, then `count(b.id)` for the beds and `count(a.id)` for the occupied ones |
| Overdue complaints | The status is not `Resolved` and the `deadline` is before `now()` |
| Average time to resolve | `avg(resolved_at - created_at)` of the resolved complaints, grouped by urgency |
| Recurring faults | `group by room_id, category`, then `having count(*) >= 3`, on complaints created in the last 30 days |

::: tryit sql
```sql file=query.sql
select h.name as hostel, count(*) as overdue
from complaints c
join rooms r   on r.id = c.room_id
join hostels h on h.id = r.hostel_id
where c.status <> 'Resolved' and c.deadline < now()
group by h.name
order by h.name;
```

```sql file=setup.sql
create table hostels (
  id     integer generated always as identity primary key,
  name   text not null unique,
  gender text not null check (gender in ('male', 'female')),
  level  integer not null
);

create table rooms (
  id        integer generated always as identity primary key,
  hostel_id integer not null references hostels(id),
  number    text not null,
  unique (hostel_id, number)
);

create table users (
  id            integer generated always as identity primary key,
  full_name     text not null,
  email         text not null unique,
  password_hash text not null,
  role          text not null check (role in ('student', 'maintenance_officer', 'hall_warden', 'admin')),
  gender        text check (gender in ('male', 'female')),
  level         integer,
  fees_cleared  boolean not null default false,
  unit          text,                              -- maintenance officers: plumbing, electrical, ...
  hostel_id     integer references hostels(id)     -- hall wardens: the hostel they run
);

create table complaints (
  id               integer generated always as identity primary key,
  student_id       integer not null references users(id),
  room_id          integer not null references rooms(id),
  description      text not null,
  category         text not null,
  urgency          text not null check (urgency in ('urgent', 'normal', 'low')),
  status           text not null default 'Open'
                   check (status in ('Open', 'Assigned', 'In Progress', 'Resolved')),
  escalation_level integer not null default 0,
  created_at       timestamptz not null default now(),
  deadline         timestamptz not null,
  resolved_at      timestamptz
);

insert into hostels (name, gender, level) values ('Block A', 'female', 100), ('Block B', 'male', 100);

insert into rooms (hostel_id, number) values (1, 'A-101'), (1, 'A-102'), (2, 'B-101'), (2, 'B-102');

insert into users (full_name, email, password_hash, role, gender, level, fees_cleared) values
  ('Amina Bello', 'amina.bello@example.com', 'placeholder', 'student', 'female', 100, true),
  ('Chidi Okafor', 'chidi.okafor@example.com', 'placeholder', 'student', 'male', 100, true),
  ('Ngozi Obi', 'ngozi.obi@example.com', 'placeholder', 'student', 'female', 100, true);

insert into complaints
  (student_id, room_id, description, category, urgency, status, escalation_level, created_at, deadline, resolved_at)
values
  (1, 1, 'Pipe burst under the sink, water on the floor', 'plumbing', 'urgent', 'Open', 1,
   now() - interval '30 hours', now() - interval '6 hours', null),
  (2, 3, 'Socket sparks when I charge my phone', 'electrical', 'urgent', 'Assigned', 2,
   now() - interval '60 hours', now() - interval '36 hours', null),
  (3, 2, 'Broken bed frame, one leg is cracked', 'carpentry', 'normal', 'In Progress', 0,
   now() - interval '2 days', now() + interval '1 day', null),
  (1, 1, 'Leaking tap in the bathroom', 'plumbing', 'normal', 'Open', 0,
   now() - interval '2 days', now() + interval '1 day', null),
  (3, 2, 'Squeaking door in the corridor', 'carpentry', 'low', 'Resolved', 0,
   now() - interval '8 days', now() - interval '1 day', now() - interval '8 days' + interval '96 hours');
```
:::

## Constraints

**Constraints** are rules the database enforces on every write, whatever program is writing. If the Python code has a bug, the rule still holds. Each kind of rule refuses a bad row with its own message.

| Bad row | Rule | PostgreSQL says |
|---|---|---|
| A hostel with the gender `'other'` | `check` | `violates check constraint "hostels_gender_check"` |
| A room in hostel 999 | Foreign key | `violates foreign key constraint "rooms_hostel_id_fkey"` |
| A second hostel called Block A | `unique` | `duplicate key value violates unique constraint "hostels_name_key"` |

A bed is given to many students over the years, but only one allocation can be **active**. A **partial unique index** limits a rule to some rows. These two indexes make `bed_space_id` and `student_id` unique among the active allocations only, so ended allocations do not count.

```sql
create unique index one_active_allocation_per_bed
  on allocations (bed_space_id) where status = 'active';

create unique index one_active_allocation_per_student
  on allocations (student_id) where status = 'active';
```

::: tryit sql
```sql file=query.sql
insert into allocations (student_id, bed_space_id) values (1, 1);

-- Take off the -- in front of the next line and press Run.
-- insert into allocations (student_id, bed_space_id) values (3, 1);

select * from allocations;
```

```sql file=setup.sql
create table hostels (
  id     integer generated always as identity primary key,
  name   text not null unique,
  gender text not null check (gender in ('male', 'female')),
  level  integer not null
);

create table rooms (
  id        integer generated always as identity primary key,
  hostel_id integer not null references hostels(id),
  number    text not null,
  unique (hostel_id, number)
);

create table bed_spaces (
  id      integer generated always as identity primary key,
  room_id integer not null references rooms(id),
  label   text not null,
  unique (room_id, label)
);

create table users (
  id            integer generated always as identity primary key,
  full_name     text not null,
  email         text not null unique,
  password_hash text not null,
  role          text not null check (role in ('student', 'maintenance_officer', 'hall_warden', 'admin')),
  gender        text check (gender in ('male', 'female')),
  level         integer,
  fees_cleared  boolean not null default false,
  unit          text,                              -- maintenance officers: plumbing, electrical, ...
  hostel_id     integer references hostels(id)     -- hall wardens: the hostel they run
);

create table allocations (
  id           integer generated always as identity primary key,
  student_id   integer not null references users(id),
  bed_space_id integer not null references bed_spaces(id),
  status       text not null default 'active' check (status in ('active', 'ended')),
  created_at   timestamptz not null default now()
);

create unique index one_active_allocation_per_bed
  on allocations (bed_space_id) where status = 'active';

create unique index one_active_allocation_per_student
  on allocations (student_id) where status = 'active';

insert into hostels (name, gender, level) values ('Block A', 'female', 100), ('Block B', 'male', 100);

insert into rooms (hostel_id, number) values (1, 'A-101'), (1, 'A-102'), (2, 'B-101'), (2, 'B-102');

insert into bed_spaces (room_id, label) values
  (1, '1'), (1, '2'), (2, '1'), (2, '2'), (3, '1'), (3, '2'), (4, '1'), (4, '2');

insert into users (full_name, email, password_hash, role, gender, level, fees_cleared) values
  ('Amina Bello', 'amina.bello@example.com', 'placeholder', 'student', 'female', 100, true),
  ('Chidi Okafor', 'chidi.okafor@example.com', 'placeholder', 'student', 'male', 100, true),
  ('Ngozi Obi', 'ngozi.obi@example.com', 'placeholder', 'student', 'female', 100, true);
```
:::

This is the paper's answer to the question "How do you stop double allocation?" The rule lives in the database, so a mistake in the Python code cannot break it.

## FastAPI and the database

**SQLAlchemy** lets Python work with rows as objects. A model class stands for a table and an object stands for a row. The address of the database contains your password, so it lives in `backend/.env` and never in the code.

| Name in `database.py` | What it is |
|---|---|
| `engine` | The connection, made from the database address |
| `SessionLocal` | Makes sessions, each one a conversation with the database |
| `Base` | The parent class of every model |
| `get_db` | Gives each request a session and closes it afterwards |

An endpoint asks FastAPI for a session with `db: Session = Depends(get_db)`. This is **dependency injection**.

| You want to | You write |
|---|---|
| Read a sorted list | `db.scalars(select(Complaint).order_by(Complaint.deadline)).all()` |
| Keep some rows | `query.where(Complaint.status == status)` |
| Read one row by `id` | `db.get(Complaint, complaint_id)`, which is `None` when there is no such row |
| Add a row | `db.add(complaint)` |
| Give a new row its `id` | `db.flush()` |
| Make every change permanent, together | `db.commit()` |
| Reload an object | `db.refresh(complaint)` |

`ComplaintOut` needs `model_config = ConfigDict(from_attributes=True)` before `response_model` can read a model object. Until the login chapter, the student and the room come in the request body.

In the boxes of the lessons and the workshop, the database is SQLite in the browser's memory, and it is empty after a reload. On your laptop and in GitHub's checks it is PostgreSQL. Only the address changes. SQLite does not keep the time zone of a timestamp, and PostgreSQL does.

::: tryit fastapi
```python file=main.py
from datetime import datetime, timedelta, timezone

from fastapi import Depends, FastAPI
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import Complaint, ComplaintHistory
from schemas import ComplaintIn, ComplaintOut

Base.metadata.create_all(engine)

app = FastAPI(title="IHMS")


@app.get("/api/complaints", response_model=list[ComplaintOut])
def list_complaints(db: Session = Depends(get_db)):
    query = select(Complaint).order_by(Complaint.deadline)
    return db.scalars(query).all()


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
:::

Send `POST /api/complaints` with `{"description": "The pipe in the bathroom has burst", "student_id": 1, "room_id": 1}`, then `GET /api/complaints`.

## The IHMS database

In the workshop you wrote the whole schema, a table at a time, parents before the tables that point to them: `hostels`, `rooms`, `bed_spaces`, `users`, `allocations`, `complaints` and `complaint_history`. You added the two partial unique indexes and watched the database refuse a second active allocation of a bed. In the lab you wrote the warden's reports as queries: open and overdue complaints, the average time to resolve, recurring faults and bed occupancy. You also created the `ihms` database in pgAdmin on your laptop and loaded the same schema into it. Then you connected FastAPI to a database with SQLAlchemy, first in the browser on SQLite and then on your laptop on PostgreSQL.

### Remember

- A primary key is a number that is different for every row. A foreign key holds the `id` of a row in another table.
- Create a table before any table that points to it.
- `not null`, `unique`, `check`, `references` and `default` are rules on a column. The database enforces them on every write.
- `timestamptz` stores a moment with its time zone, so PostgreSQL can compare it and add hours to it.
- Write the `where` of an `update` or `delete` first.
- `where` filters rows. `having` filters groups after `group by`.
- `join` drops rows with no match. `left join` keeps them, which is why the occupancy report uses it.
- A complaint is overdue when it is not `Resolved` and its `deadline` is before `now()`.
- A recurring fault is 3 or more complaints of the same category in one room within 30 days.
- A partial unique index limits a rule to some rows, so a bed can have many allocations over time but only one active.
- The deadlines are 24 hours for urgent, 72 hours for normal and 7 days for low.
- A model class stands for a table and an object stands for a row. On your laptop the models describe tables that `schema.sql` made. They do not create them.
- The database address has your password in it, so it goes in `backend/.env`, which is never committed.
- `Depends(get_db)` gives an endpoint one session for one request and closes it afterwards.
- `db.flush()` sends a row so it gets its `id`. `db.commit()` makes all the changes permanent together. Without a commit, nothing is saved.
- `ComplaintOut` needs `from_attributes=True` to read model objects.
- The browser uses SQLite in memory. Your laptop and GitHub use PostgreSQL. Only the address changes.
