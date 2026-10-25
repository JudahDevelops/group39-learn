# --screen-- concept

**Constraints** are rules the database enforces on every write, whatever program is writing. If the Python code has a bug, the rule still holds. This is the paper's answer to the question "How do you stop double allocation?"

# --screen-- mcq

## --question--

What enforces the rule if the Python code has a bug?

## --options--

- [x] The database constraint
  > Yes. The database checks every write itself, so a bug in the code cannot get a bad row past it.
- [ ] Nothing
  > No. That would be true if the rule lived only in the Python code. A constraint lives in the database.
- [ ] The Student Portal
  > No. The portal is the client tier. A person can skip it and send a request straight to the server.
- [ ] The scheduler
  > No. The scheduler runs the escalation job every 15 minutes. It does not check each write.

## --why--

A rule in the database holds for every program that writes to it, now and in future.

# --screen-- concept

You have met three kinds of rule: `check`, `references` and `unique`. Each refuses a bad row with its own message. Remove the `--` in front of one insert at a time, press Run, and read the error.

::: tryit sql
```sql file=query.sql
-- A hostel with the gender 'other' (a check rule):
-- insert into hostels (name, gender, level) values ('Block C', 'other', 100);

-- A room in hostel 999 (a foreign key):
-- insert into rooms (hostel_id, number) values (999, 'Z-101');

-- A second hostel called Block A (a unique rule):
-- insert into hostels (name, gender, level) values ('Block A', 'female', 200);

select * from hostels;
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

# --screen-- match

## --prompt--

Match each bad row to the error PostgreSQL gives.

## --pairs--

- A hostel with the gender `'other'`
  - `new row for relation "hostels" violates check constraint "hostels_gender_check"`
- A room in hostel 999
  - `insert or update on table "rooms" violates foreign key constraint "rooms_hostel_id_fkey"`
- A second hostel called Block A
  - `duplicate key value violates unique constraint "hostels_name_key"`

## --why--

The message names the kind of rule and the rule itself. `hostels_gender_check` is the check on `gender`, and `rooms_hostel_id_fkey` is the foreign key on `hostel_id`.

# --screen-- mcq

## --question--

A complaint is inserted with the status `'Closed'`. Which rule refuses it?

## --options--

- [x] The check on `status`, which allows only Open, Assigned, In Progress and Resolved
  > Yes. `Closed` is not one of the four statuses, so the check fails.
- [ ] The foreign key on `room_id`
  > No. That rule checks that the room exists. It does not look at the status.
- [ ] The primary key on `id`
  > No. The primary key keeps the `id` different for every row. It does not look at the status.
- [ ] The `not null` on `description`
  > No. That rule needs a description. It says nothing about the status.

## --why--

The `check` on `complaints.status` lists the only four values the column may hold.

# --screen-- concept

A bed is given to students many times over the years, but only one allocation can be **active**. A **partial unique index** makes `bed_space_id` unique among active allocations only. Old, ended allocations do not count.

## --code--

```sql
create unique index one_active_allocation_per_bed
  on allocations (bed_space_id) where status = 'active';
```

# --screen-- mcq

## --question--

Why is a partial unique index used, rather than a plain `unique` on `bed_space_id`?

## --options--

- [x] A bed is allocated many times over the years, and only one allocation may be active
  > Yes. A plain `unique` would allow each bed to be allocated only once, ever.
- [ ] A plain `unique` is slower
  > No. Speed is not the reason. A plain `unique` would be the wrong rule.
- [ ] A partial index can hold more than one bed
  > No. Each row of `allocations` points at one bed. The `where` only chooses which rows the rule covers.
- [ ] A plain `unique` cannot be used on a foreign key
  > No. It can. The rule would simply be too strict for this table.

## --why--

The history of a bed has many rows, and only the active one is limited. The `where status = 'active'` is what says that.

# --screen-- concept

Student 1 takes bed 1. Now student 2 tries to take the same bed: remove the `--` in front of the second insert and press Run. PostgreSQL says no, even if the Python code had a bug.

::: tryit sql
```sql file=query.sql
insert into allocations (student_id, bed_space_id) values (1, 1);

-- Remove the -- in front of the next line and press Run.
-- insert into allocations (student_id, bed_space_id) values (2, 1);

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

insert into hostels (name, gender, level) values ('Block A', 'female', 100), ('Block B', 'male', 100);

insert into rooms (hostel_id, number) values (1, 'A-101'), (1, 'A-102'), (2, 'B-101'), (2, 'B-102');

insert into bed_spaces (room_id, label) values
  (1, '1'), (1, '2'), (2, '1'), (2, '2'), (3, '1'), (3, '2'), (4, '1'), (4, '2');

insert into users (full_name, email, password_hash, role, gender, level, fees_cleared) values
  ('Amina Bello', 'amina.bello@example.com', 'placeholder', 'student', 'female', 300, true),
  ('Chidi Okafor', 'chidi.okafor@example.com', 'placeholder', 'student', 'male', 200, true),
  ('Ngozi Obi', 'ngozi.obi@example.com', 'placeholder', 'student', 'female', 100, true),
  ('Emeka Eze', 'emeka.eze@example.com', 'placeholder', 'student', 'male', 200, true);
```
:::

## --callout-- info

The error reads `duplicate key value violates unique constraint "one_active_allocation_per_bed"`.

# --screen-- predict

## --code--

```sql
insert into allocations (student_id, bed_space_id) values (1, 1);
insert into allocations (student_id, bed_space_id, status) values (2, 1, 'ended');
```

## --question--

The index `one_active_allocation_per_bed` exists, and bed 1 already has an active allocation from the first line. What happens on the second line?

## --options--

- [x] It works, because an ended allocation is not covered by the index
  > Yes. The index only looks at rows where `status = 'active'`. The new row is `ended`, so it is left alone.
- [ ] It fails with a duplicate key error
  > No. A duplicate key error needs two active allocations of the same bed.
- [ ] It fails because the status is not allowed
  > No. `ended` is one of the two statuses the check allows: `active` and `ended`.
- [ ] It replaces the first allocation
  > No. An insert always adds a row. It never replaces one.

## --why--

That is why old allocations of a bed can stay in the table as history.

# --screen-- spotbug

## --code--

```sql
create unique index one_active_allocation_per_bed
  on allocations (bed_space_id);
```

## --question--

This index should stop two active allocations of one bed. What is wrong with it?

## --options--

- [x] Without `where status = 'active'`, it also blocks a bed's old, ended allocations.
  > Yes. Every allocation of a bed would have to be the only one, ever. The `where` limits the rule to active rows.
- [ ] It should be on `student_id`, not `bed_space_id`.
  > No. That would be the other rule, one active allocation for each student.
- [ ] `create unique index` is not a PostgreSQL command.
  > No. It is the command for this job.
- [ ] The index needs a `check`.
  > No. A `check` belongs in a table definition. The `where` goes on the index.

## --why--

A partial unique index has two parts: the column that must be unique, and the `where` that says which rows the rule covers.

# --screen-- tapbuild

## --prompt--

Build the second rule: a student can have only one active allocation.

## --template--

```sql
create unique index one_active_allocation_per_student
  on allocations (___) ___ status = 'active';
```

## --tokens--

- `student_id`
- `bed_space_id`
- `where`
- `having`
- `and`

## --answer--

- `student_id`
- `where`

## --why--

The rule is about students, so the column is `student_id`. The `where` limits it to active allocations. `having` filters groups, not rows.

# --screen-- typein

## --prompt--

The index `one_active_allocation_per_bed` is already there. Add the second rule: create a unique index called `one_active_allocation_per_student` on `allocations (student_id)` that covers only active allocations.

## --seed-contents--

```sql file=query.sql
-- A student can have only one active allocation.
--editable-region--

--editable-region--
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

insert into hostels (name, gender, level) values ('Block A', 'female', 100), ('Block B', 'male', 100);

insert into rooms (hostel_id, number) values (1, 'A-101'), (1, 'A-102'), (2, 'B-101'), (2, 'B-102');

insert into bed_spaces (room_id, label) values
  (1, '1'), (1, '2'), (2, '1'), (2, '2'), (3, '1'), (3, '2'), (4, '1'), (4, '2');

insert into users (full_name, email, password_hash, role, gender, level, fees_cleared) values
  ('Amina Bello', 'amina.bello@example.com', 'placeholder', 'student', 'female', 300, true),
  ('Chidi Okafor', 'chidi.okafor@example.com', 'placeholder', 'student', 'male', 200, true),
  ('Ngozi Obi', 'ngozi.obi@example.com', 'placeholder', 'student', 'female', 100, true),
  ('Emeka Eze', 'emeka.eze@example.com', 'placeholder', 'student', 'male', 200, true);
```

## --tests--

Your code should use `create unique index`.

```js
assert.match(code, /create\s+unique\s+index/i);
```

Your index should be called `one_active_allocation_per_student`. Check the spelling.

```js
const { rows } = await db.query(
  "select indexname from pg_indexes where indexname = 'one_active_allocation_per_student'",
);
assert.lengthOf(rows, 1);
```

Your index should be on `allocations (student_id)`.

```js
const { rows } = await db.query(
  "select indexdef from pg_indexes where indexname = 'one_active_allocation_per_student'",
);
assert.match(rows[0]?.indexdef ?? '', /\(student_id\)/);
```

Your index should cover only active allocations. Add `where status = 'active'`.

```js
const { rows } = await db.query(
  "select indexdef from pg_indexes where indexname = 'one_active_allocation_per_student'",
);
assert.match(rows[0]?.indexdef ?? '', /where\s*\(?\s*\(?status\s*=\s*'active'/i);
```

A student should not be able to have two active allocations.

```js
await db.query('insert into allocations (student_id, bed_space_id) values (1, 1)');
let error;
try {
  await db.query('insert into allocations (student_id, bed_space_id) values (1, 2)');
} catch (e) {
  error = e;
}
assert.exists(error);
assert.equal(error.code, '23505');
assert.equal(error.constraint, 'one_active_allocation_per_student');
```

An ended allocation should not block a student. Check that the index covers only active rows.

```js
await db.query("insert into allocations (student_id, bed_space_id, status) values (1, 3, 'ended')");
```

Another student should still be able to take a free bed.

```js
await db.query('insert into allocations (student_id, bed_space_id) values (2, 5)');
```

## --solutions--

```sql file=query.sql
-- A student can have only one active allocation.
create unique index one_active_allocation_per_student
  on allocations (student_id) where status = 'active';
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

insert into hostels (name, gender, level) values ('Block A', 'female', 100), ('Block B', 'male', 100);

insert into rooms (hostel_id, number) values (1, 'A-101'), (1, 'A-102'), (2, 'B-101'), (2, 'B-102');

insert into bed_spaces (room_id, label) values
  (1, '1'), (1, '2'), (2, '1'), (2, '2'), (3, '1'), (3, '2'), (4, '1'), (4, '2');

insert into users (full_name, email, password_hash, role, gender, level, fees_cleared) values
  ('Amina Bello', 'amina.bello@example.com', 'placeholder', 'student', 'female', 300, true),
  ('Chidi Okafor', 'chidi.okafor@example.com', 'placeholder', 'student', 'male', 200, true),
  ('Ngozi Obi', 'ngozi.obi@example.com', 'placeholder', 'student', 'female', 100, true),
  ('Emeka Eze', 'emeka.eze@example.com', 'placeholder', 'student', 'male', 200, true);
```

## --why--

The first line names the index and the table. The column in brackets must be unique, and the `where` limits the rule to active allocations.
