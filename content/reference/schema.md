# Database schema

```sql
CREATE TABLE hostels (
  id     integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name   text NOT NULL UNIQUE,
  gender text NOT NULL CHECK (gender IN ('male', 'female')),
  level  integer NOT NULL
);

CREATE TABLE rooms (
  id        integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  hostel_id integer NOT NULL REFERENCES hostels(id),
  number    text NOT NULL,
  UNIQUE (hostel_id, number)
);

CREATE TABLE bed_spaces (
  id      integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id integer NOT NULL REFERENCES rooms(id),
  label   text NOT NULL,
  UNIQUE (room_id, label)
);

CREATE TABLE users (
  id            integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name     text NOT NULL,
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role          text NOT NULL CHECK (role IN ('student', 'maintenance_officer', 'hall_warden', 'admin')),
  gender        text CHECK (gender IN ('male', 'female')),
  level         integer,
  fees_cleared  boolean NOT NULL DEFAULT false,
  unit          text,                              -- maintenance officers: plumbing, electrical, ...
  hostel_id     integer REFERENCES hostels(id)     -- hall wardens: the hostel they run
);

CREATE TABLE allocations (
  id           integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id   integer NOT NULL REFERENCES users(id),
  bed_space_id integer NOT NULL REFERENCES bed_spaces(id),
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX one_active_allocation_per_bed
  ON allocations (bed_space_id) WHERE status = 'active';
CREATE UNIQUE INDEX one_active_allocation_per_student
  ON allocations (student_id) WHERE status = 'active';

CREATE TABLE complaints (
  id               integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id       integer NOT NULL REFERENCES users(id),
  room_id          integer NOT NULL REFERENCES rooms(id),
  description      text NOT NULL,
  category         text NOT NULL,
  urgency          text NOT NULL CHECK (urgency IN ('urgent', 'normal', 'low')),
  status           text NOT NULL DEFAULT 'Open'
                   CHECK (status IN ('Open', 'Assigned', 'In Progress', 'Resolved')),
  escalation_level integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  deadline         timestamptz NOT NULL,
  resolved_at      timestamptz
);

CREATE TABLE complaint_history (
  id           integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  complaint_id integer NOT NULL REFERENCES complaints(id),
  event        text NOT NULL,
  actor_id     integer REFERENCES users(id),
  at           timestamptz NOT NULL DEFAULT now()
);
```

**Sample data for Lesson 13.3**

```sql
INSERT INTO hostels (name, gender, level) VALUES ('Block A', 'female', 100), ('Block B', 'male', 100);
INSERT INTO rooms (hostel_id, number) VALUES (1, 'A-101'), (1, 'A-102'), (2, 'B-101'), (2, 'B-102');
INSERT INTO bed_spaces (room_id, label) VALUES
  (1, '1'), (1, '2'), (2, '1'), (2, '2'), (3, '1'), (3, '2'), (4, '1'), (4, '2');
```
