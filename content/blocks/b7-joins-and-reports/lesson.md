# --screen-- concept

A complaint stores `room_id`, a number. A **join** looks up the matching row in another table. In this query `c`, `r` and `h` are short names for the tables, `on` says how the rows match, and `as` renames a column in the result.

::: tryit sql
```sql file=query.sql
select c.id, h.name as hostel, r.number as room, c.category, c.status
from complaints c
join rooms r   on r.id = c.room_id
join hostels h on h.id = r.hostel_id;
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
  ('Amina Bello', 'amina.bello@example.com', 'placeholder', 'student', 'female', 300, true),
  ('Chidi Okafor', 'chidi.okafor@example.com', 'placeholder', 'student', 'male', 200, true),
  ('Ngozi Obi', 'ngozi.obi@example.com', 'placeholder', 'student', 'female', 100, true),
  ('Emeka Eze', 'emeka.eze@example.com', 'placeholder', 'student', 'male', 200, true);

insert into complaints
  (student_id, room_id, description, category, urgency, status, escalation_level, created_at, deadline, resolved_at)
values
  (1, 1, 'Pipe burst under the sink, water on the floor', 'plumbing', 'urgent', 'Open', 1,
   now() - interval '30 hours', now() - interval '6 hours', null),
  (2, 3, 'Socket sparks when I charge my phone', 'electrical', 'urgent', 'Assigned', 2,
   now() - interval '60 hours', now() - interval '36 hours', null),
  (3, 2, 'Broken bed frame, one leg is cracked', 'carpentry', 'normal', 'In Progress', 0,
   now() - interval '2 days', now() + interval '1 day', null),
  (4, 4, 'Blocked drain in the bathroom', 'sanitation', 'normal', 'Open', 1,
   now() - interval '4 days', now() - interval '1 day', null),
  (1, 1, 'Leaking tap in the bathroom', 'plumbing', 'normal', 'Open', 0,
   now() - interval '2 days', now() + interval '1 day', null),
  (3, 2, 'Squeaking door in the corridor', 'carpentry', 'low', 'Open', 0,
   now() - interval '1 day', now() + interval '6 days', null),
  (1, 1, 'Leaking tap in the shower room', 'plumbing', 'normal', 'Resolved', 0,
   now() - interval '20 days', now() - interval '17 days', now() - interval '20 days' + interval '30 hours'),
  (2, 3, 'Socket sparks near the bed', 'electrical', 'urgent', 'Resolved', 0,
   now() - interval '12 days', now() - interval '11 days', now() - interval '12 days' + interval '6 hours'),
  (4, 4, 'Pipe burst in the bathroom', 'plumbing', 'urgent', 'Resolved', 0,
   now() - interval '9 days', now() - interval '8 days', now() - interval '9 days' + interval '10 hours');
```
:::

# --screen-- order

## --prompt--

Put the parts of the join query in order.

## --items--

- `select c.id, h.name as hostel, r.number as room`
- `from complaints c`
- `join rooms r on r.id = c.room_id`
- `join hostels h on h.id = r.hostel_id`

## --why--

`select` comes first, then `from`. The hostel join uses `r.hostel_id`, so `rooms r` has to be joined before it.

# --screen-- spotbug

## --code--

```sql
select c.id, r.number
from complaints c
join rooms r on r.id = r.id;
```

## --question--

Every complaint appears next to every room. What is wrong?

## --options--

- [x] `r.id = r.id` is always true. It should be `r.id = c.room_id`.
  > Yes. The condition compares a room with itself, so every pair of complaint and room matches.
- [ ] `join` needs the word `left` in front of it.
  > No. A plain `join` is right here. `left join` is for keeping rows that have no match.
- [ ] The alias `c` is never used.
  > No. `c.id` in the `select` list uses it.
- [ ] `number` is not a column of `rooms`.
  > No. `rooms` has the columns `id`, `hostel_id` and `number`.

## --why--

The `on` condition must connect a column of one table to a column of the other. If it does not, the join pairs every row with every row.

# --screen-- concept

**group by** turns rows into totals. This query puts the complaints into one group for each category and counts each group with `count(*)`.

::: tryit sql
```sql file=query.sql
select category, count(*) as complaints
from complaints
group by category
order by category;
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
  ('Amina Bello', 'amina.bello@example.com', 'placeholder', 'student', 'female', 300, true),
  ('Chidi Okafor', 'chidi.okafor@example.com', 'placeholder', 'student', 'male', 200, true),
  ('Ngozi Obi', 'ngozi.obi@example.com', 'placeholder', 'student', 'female', 100, true),
  ('Emeka Eze', 'emeka.eze@example.com', 'placeholder', 'student', 'male', 200, true);

insert into complaints
  (student_id, room_id, description, category, urgency, status, escalation_level, created_at, deadline, resolved_at)
values
  (1, 1, 'Pipe burst under the sink, water on the floor', 'plumbing', 'urgent', 'Open', 1,
   now() - interval '30 hours', now() - interval '6 hours', null),
  (2, 3, 'Socket sparks when I charge my phone', 'electrical', 'urgent', 'Assigned', 2,
   now() - interval '60 hours', now() - interval '36 hours', null),
  (3, 2, 'Broken bed frame, one leg is cracked', 'carpentry', 'normal', 'In Progress', 0,
   now() - interval '2 days', now() + interval '1 day', null),
  (4, 4, 'Blocked drain in the bathroom', 'sanitation', 'normal', 'Open', 1,
   now() - interval '4 days', now() - interval '1 day', null),
  (1, 1, 'Leaking tap in the bathroom', 'plumbing', 'normal', 'Open', 0,
   now() - interval '2 days', now() + interval '1 day', null),
  (3, 2, 'Squeaking door in the corridor', 'carpentry', 'low', 'Open', 0,
   now() - interval '1 day', now() + interval '6 days', null),
  (1, 1, 'Leaking tap in the shower room', 'plumbing', 'normal', 'Resolved', 0,
   now() - interval '20 days', now() - interval '17 days', now() - interval '20 days' + interval '30 hours'),
  (2, 3, 'Socket sparks near the bed', 'electrical', 'urgent', 'Resolved', 0,
   now() - interval '12 days', now() - interval '11 days', now() - interval '12 days' + interval '6 hours'),
  (4, 4, 'Pipe burst in the bathroom', 'plumbing', 'urgent', 'Resolved', 0,
   now() - interval '9 days', now() - interval '8 days', now() - interval '9 days' + interval '10 hours');
```
:::

# --screen-- predict

## --code--

```sql
select category, count(*) as complaints
from complaints
group by category;
```

## --question--

Suppose `complaints` holds 3 plumbing complaints and 1 electrical complaint. How many rows does this query return?

## --options--

- [x] 2
  > Yes. There is one row for each category: plumbing with 3 and electrical with 1.
- [ ] 4
  > No. That would be one row for each complaint. `group by` merges the complaints of one category into a row.
- [ ] 1
  > No. One row would mean one group. There are two categories.
- [ ] 3
  > No. Three is the count in the plumbing row, not the number of rows.

## --why--

`group by` makes one output row for each different value. `count(*)` then counts the rows in that group.

# --screen-- concept

The Reporting module counts beds with a four-table query. `left join` keeps every bed, even one with no active allocation. `count(a.id)` counts only the beds that have one.

::: tryit sql
```sql file=query.sql
select h.name,
       count(b.id) as beds,
       count(a.id) as occupied
from hostels h
join rooms r            on r.hostel_id = h.id
join bed_spaces b       on b.room_id = r.id
left join allocations a on a.bed_space_id = b.id and a.status = 'active'
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
  ('Amina Bello', 'amina.bello@example.com', 'placeholder', 'student', 'female', 300, true),
  ('Chidi Okafor', 'chidi.okafor@example.com', 'placeholder', 'student', 'male', 200, true),
  ('Ngozi Obi', 'ngozi.obi@example.com', 'placeholder', 'student', 'female', 100, true),
  ('Emeka Eze', 'emeka.eze@example.com', 'placeholder', 'student', 'male', 200, true);

insert into allocations (student_id, bed_space_id, status) values
  (1, 1, 'active'),
  (3, 3, 'active'),
  (2, 5, 'active'),
  (4, 6, 'ended');
```
:::

# --screen-- mcq

## --question--

Why does the occupancy query use `left join` for `allocations`?

## --options--

- [x] To keep empty beds in the count
  > Yes. A bed with no active allocation has no match. `left join` keeps it, with an empty `a.id`, and `count(a.id)` does not count the empty ones.
- [ ] Because it is faster
  > No. Speed is not the reason. A plain `join` would drop every empty bed, and the bed total would be too small.
- [ ] To sort the beds by hostel
  > No. Sorting is done by `order by`.
- [ ] To remove ended allocations
  > No. The condition `a.status = 'active'` does that. `left join` only decides what happens to beds with no match.

## --why--

`join` drops rows with no match. `left join` keeps them, and that is what an occupancy report needs.

# --screen-- concept

A complaint is **overdue** when it is not Resolved and its deadline has passed. The deadline comes from the urgency: 24 hours for urgent, 72 hours for normal, 7 days for low. `now()` is the current moment.

::: tryit sql
```sql file=query.sql
select count(*) from complaints
where status <> 'Resolved' and deadline < now();
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
  ('Amina Bello', 'amina.bello@example.com', 'placeholder', 'student', 'female', 300, true),
  ('Chidi Okafor', 'chidi.okafor@example.com', 'placeholder', 'student', 'male', 200, true),
  ('Ngozi Obi', 'ngozi.obi@example.com', 'placeholder', 'student', 'female', 100, true),
  ('Emeka Eze', 'emeka.eze@example.com', 'placeholder', 'student', 'male', 200, true);

insert into complaints
  (student_id, room_id, description, category, urgency, status, escalation_level, created_at, deadline, resolved_at)
values
  (1, 1, 'Pipe burst under the sink, water on the floor', 'plumbing', 'urgent', 'Open', 1,
   now() - interval '30 hours', now() - interval '6 hours', null),
  (2, 3, 'Socket sparks when I charge my phone', 'electrical', 'urgent', 'Assigned', 2,
   now() - interval '60 hours', now() - interval '36 hours', null),
  (3, 2, 'Broken bed frame, one leg is cracked', 'carpentry', 'normal', 'In Progress', 0,
   now() - interval '2 days', now() + interval '1 day', null),
  (4, 4, 'Blocked drain in the bathroom', 'sanitation', 'normal', 'Open', 1,
   now() - interval '4 days', now() - interval '1 day', null),
  (1, 1, 'Leaking tap in the bathroom', 'plumbing', 'normal', 'Open', 0,
   now() - interval '2 days', now() + interval '1 day', null),
  (3, 2, 'Squeaking door in the corridor', 'carpentry', 'low', 'Open', 0,
   now() - interval '1 day', now() + interval '6 days', null),
  (1, 1, 'Leaking tap in the shower room', 'plumbing', 'normal', 'Resolved', 0,
   now() - interval '20 days', now() - interval '17 days', now() - interval '20 days' + interval '30 hours'),
  (2, 3, 'Socket sparks near the bed', 'electrical', 'urgent', 'Resolved', 0,
   now() - interval '12 days', now() - interval '11 days', now() - interval '12 days' + interval '6 hours'),
  (4, 4, 'Pipe burst in the bathroom', 'plumbing', 'urgent', 'Resolved', 0,
   now() - interval '9 days', now() - interval '8 days', now() - interval '9 days' + interval '10 hours');
```
:::

# --screen-- typein

## --prompt--

Count the plumbing complaints that are overdue: not Resolved, with a deadline in the past. Call the count `overdue`.

## --seed-contents--

```sql file=query.sql
-- How many plumbing complaints are overdue?
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
  ('Amina Bello', 'amina.bello@example.com', 'placeholder', 'student', 'female', 300, true),
  ('Chidi Okafor', 'chidi.okafor@example.com', 'placeholder', 'student', 'male', 200, true),
  ('Ngozi Obi', 'ngozi.obi@example.com', 'placeholder', 'student', 'female', 100, true),
  ('Emeka Eze', 'emeka.eze@example.com', 'placeholder', 'student', 'male', 200, true);

insert into complaints
  (student_id, room_id, description, category, urgency, status, escalation_level, created_at, deadline, resolved_at)
values
  (1, 1, 'Pipe burst under the sink, water on the floor', 'plumbing', 'urgent', 'Open', 1,
   now() - interval '30 hours', now() - interval '6 hours', null),
  (2, 3, 'Socket sparks when I charge my phone', 'electrical', 'urgent', 'Assigned', 2,
   now() - interval '60 hours', now() - interval '36 hours', null),
  (3, 2, 'Broken bed frame, one leg is cracked', 'carpentry', 'normal', 'In Progress', 0,
   now() - interval '2 days', now() + interval '1 day', null),
  (4, 4, 'Blocked drain in the bathroom', 'sanitation', 'normal', 'Open', 1,
   now() - interval '4 days', now() - interval '1 day', null),
  (1, 1, 'Leaking tap in the bathroom', 'plumbing', 'normal', 'Open', 0,
   now() - interval '2 days', now() + interval '1 day', null),
  (3, 2, 'Squeaking door in the corridor', 'carpentry', 'low', 'Open', 0,
   now() - interval '1 day', now() + interval '6 days', null),
  (1, 1, 'Leaking tap in the shower room', 'plumbing', 'normal', 'Resolved', 0,
   now() - interval '20 days', now() - interval '17 days', now() - interval '20 days' + interval '30 hours'),
  (2, 3, 'Socket sparks near the bed', 'electrical', 'urgent', 'Resolved', 0,
   now() - interval '12 days', now() - interval '11 days', now() - interval '12 days' + interval '6 hours'),
  (4, 4, 'Pipe burst in the bathroom', 'plumbing', 'urgent', 'Resolved', 0,
   now() - interval '9 days', now() - interval '8 days', now() - interval '9 days' + interval '10 hours');
```

## --tests--

Your query should count rows with `count(*)`.

```js
assert.match(code, /count\s*\(/i);
```

Your query should read from `complaints` and filter with `where`.

```js
assert.match(code, /from\s+complaints\b[\s\S]*\bwhere\b/i);
```

Compare the `deadline` with `now()` to find the complaints that are overdue.

```js
assert.match(code, /deadline\s*<\s*now\s*\(\s*\)/i);
```

Your query should return one row, with one number in it.

```js
const { rows } = await db.query(code);
assert.lengthOf(rows, 1);
```

Call the count `overdue`, with `as overdue`.

```js
const { rows } = await db.query(code);
assert.deepEqual(Object.keys(rows[0] ?? {}), ['overdue']);
```

The count should be 1. Only one plumbing complaint is both unresolved and past its deadline.

```js
const { rows } = await db.query(code);
assert.equal(Number(rows[0].overdue), 1);
```

## --solutions--

```sql file=query.sql
-- How many plumbing complaints are overdue?
select count(*) as overdue
from complaints
where category = 'plumbing' and status <> 'Resolved' and deadline < now();
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
  ('Amina Bello', 'amina.bello@example.com', 'placeholder', 'student', 'female', 300, true),
  ('Chidi Okafor', 'chidi.okafor@example.com', 'placeholder', 'student', 'male', 200, true),
  ('Ngozi Obi', 'ngozi.obi@example.com', 'placeholder', 'student', 'female', 100, true),
  ('Emeka Eze', 'emeka.eze@example.com', 'placeholder', 'student', 'male', 200, true);

insert into complaints
  (student_id, room_id, description, category, urgency, status, escalation_level, created_at, deadline, resolved_at)
values
  (1, 1, 'Pipe burst under the sink, water on the floor', 'plumbing', 'urgent', 'Open', 1,
   now() - interval '30 hours', now() - interval '6 hours', null),
  (2, 3, 'Socket sparks when I charge my phone', 'electrical', 'urgent', 'Assigned', 2,
   now() - interval '60 hours', now() - interval '36 hours', null),
  (3, 2, 'Broken bed frame, one leg is cracked', 'carpentry', 'normal', 'In Progress', 0,
   now() - interval '2 days', now() + interval '1 day', null),
  (4, 4, 'Blocked drain in the bathroom', 'sanitation', 'normal', 'Open', 1,
   now() - interval '4 days', now() - interval '1 day', null),
  (1, 1, 'Leaking tap in the bathroom', 'plumbing', 'normal', 'Open', 0,
   now() - interval '2 days', now() + interval '1 day', null),
  (3, 2, 'Squeaking door in the corridor', 'carpentry', 'low', 'Open', 0,
   now() - interval '1 day', now() + interval '6 days', null),
  (1, 1, 'Leaking tap in the shower room', 'plumbing', 'normal', 'Resolved', 0,
   now() - interval '20 days', now() - interval '17 days', now() - interval '20 days' + interval '30 hours'),
  (2, 3, 'Socket sparks near the bed', 'electrical', 'urgent', 'Resolved', 0,
   now() - interval '12 days', now() - interval '11 days', now() - interval '12 days' + interval '6 hours'),
  (4, 4, 'Pipe burst in the bathroom', 'plumbing', 'urgent', 'Resolved', 0,
   now() - interval '9 days', now() - interval '8 days', now() - interval '9 days' + interval '10 hours');
```

## --why--

Three conditions joined with `and`: the category, a status that is not Resolved, and a deadline before now. `count(*) as overdue` names the result.

# --screen-- concept

`avg` finds the average. Taking one moment from another gives a length of time, so `avg(resolved_at - created_at)` is the average time to resolve. Only resolved complaints have a `resolved_at`.

::: tryit sql
```sql file=query.sql
select urgency, avg(resolved_at - created_at) as average_time
from complaints
where status = 'Resolved'
group by urgency;
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
  ('Amina Bello', 'amina.bello@example.com', 'placeholder', 'student', 'female', 300, true),
  ('Chidi Okafor', 'chidi.okafor@example.com', 'placeholder', 'student', 'male', 200, true),
  ('Ngozi Obi', 'ngozi.obi@example.com', 'placeholder', 'student', 'female', 100, true),
  ('Emeka Eze', 'emeka.eze@example.com', 'placeholder', 'student', 'male', 200, true);

insert into complaints
  (student_id, room_id, description, category, urgency, status, escalation_level, created_at, deadline, resolved_at)
values
  (1, 1, 'Pipe burst under the sink, water on the floor', 'plumbing', 'urgent', 'Open', 1,
   now() - interval '30 hours', now() - interval '6 hours', null),
  (2, 3, 'Socket sparks when I charge my phone', 'electrical', 'urgent', 'Assigned', 2,
   now() - interval '60 hours', now() - interval '36 hours', null),
  (3, 2, 'Broken bed frame, one leg is cracked', 'carpentry', 'normal', 'In Progress', 0,
   now() - interval '2 days', now() + interval '1 day', null),
  (4, 4, 'Blocked drain in the bathroom', 'sanitation', 'normal', 'Open', 1,
   now() - interval '4 days', now() - interval '1 day', null),
  (1, 1, 'Leaking tap in the bathroom', 'plumbing', 'normal', 'Open', 0,
   now() - interval '2 days', now() + interval '1 day', null),
  (3, 2, 'Squeaking door in the corridor', 'carpentry', 'low', 'Open', 0,
   now() - interval '1 day', now() + interval '6 days', null),
  (1, 1, 'Leaking tap in the shower room', 'plumbing', 'normal', 'Resolved', 0,
   now() - interval '20 days', now() - interval '17 days', now() - interval '20 days' + interval '30 hours'),
  (2, 3, 'Socket sparks near the bed', 'electrical', 'urgent', 'Resolved', 0,
   now() - interval '12 days', now() - interval '11 days', now() - interval '12 days' + interval '6 hours'),
  (4, 4, 'Pipe burst in the bathroom', 'plumbing', 'urgent', 'Resolved', 0,
   now() - interval '9 days', now() - interval '8 days', now() - interval '9 days' + interval '10 hours');
```
:::

# --screen-- concept

A **recurring fault** is 3 or more complaints of the same category in one room within 30 days. `having` filters groups the way `where` filters rows.

::: tryit sql
```sql file=query.sql
select room_id, category, count(*) as complaints
from complaints
where created_at >= now() - interval '30 days'
group by room_id, category
having count(*) >= 3;
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
  ('Amina Bello', 'amina.bello@example.com', 'placeholder', 'student', 'female', 300, true),
  ('Chidi Okafor', 'chidi.okafor@example.com', 'placeholder', 'student', 'male', 200, true),
  ('Ngozi Obi', 'ngozi.obi@example.com', 'placeholder', 'student', 'female', 100, true),
  ('Emeka Eze', 'emeka.eze@example.com', 'placeholder', 'student', 'male', 200, true);

insert into complaints
  (student_id, room_id, description, category, urgency, status, escalation_level, created_at, deadline, resolved_at)
values
  (1, 1, 'Pipe burst under the sink, water on the floor', 'plumbing', 'urgent', 'Open', 1,
   now() - interval '30 hours', now() - interval '6 hours', null),
  (2, 3, 'Socket sparks when I charge my phone', 'electrical', 'urgent', 'Assigned', 2,
   now() - interval '60 hours', now() - interval '36 hours', null),
  (3, 2, 'Broken bed frame, one leg is cracked', 'carpentry', 'normal', 'In Progress', 0,
   now() - interval '2 days', now() + interval '1 day', null),
  (4, 4, 'Blocked drain in the bathroom', 'sanitation', 'normal', 'Open', 1,
   now() - interval '4 days', now() - interval '1 day', null),
  (1, 1, 'Leaking tap in the bathroom', 'plumbing', 'normal', 'Open', 0,
   now() - interval '2 days', now() + interval '1 day', null),
  (3, 2, 'Squeaking door in the corridor', 'carpentry', 'low', 'Open', 0,
   now() - interval '1 day', now() + interval '6 days', null),
  (1, 1, 'Leaking tap in the shower room', 'plumbing', 'normal', 'Resolved', 0,
   now() - interval '20 days', now() - interval '17 days', now() - interval '20 days' + interval '30 hours'),
  (2, 3, 'Socket sparks near the bed', 'electrical', 'urgent', 'Resolved', 0,
   now() - interval '12 days', now() - interval '11 days', now() - interval '12 days' + interval '6 hours'),
  (4, 4, 'Pipe burst in the bathroom', 'plumbing', 'urgent', 'Resolved', 0,
   now() - interval '9 days', now() - interval '8 days', now() - interval '9 days' + interval '10 hours');
```
:::

# --screen-- mcq

## --question--

What is the difference between `where` and `having`?

## --options--

- [x] `where` filters rows; `having` filters groups after `group by`
  > Yes. `where` runs first, on single rows. `having` runs after the groups are made, so it can use `count(*)`.
- [ ] There is no difference
  > No. `where` cannot use `count(*)`, because the groups do not exist yet when it runs.
- [ ] `having` is the faster way to write `where`
  > No. They do different jobs. Speed is not the reason to pick one.
- [ ] `where` works on numbers and `having` works on text
  > No. Both can compare any type of value. The difference is rows against groups.

## --why--

Filter the rows you start with using `where`. Filter the groups you end with using `having`.

# --screen-- tapbuild

## --prompt--

Build the query that counts the bed spaces in each hostel.

## --template--

```sql
select h.name, count(b.id) as beds
from hostels h
___ rooms r on r.hostel_id = h.id
___ bed_spaces b on b.room_id = r.id
___ h.name;
```

## --tokens--

- `join`
- `join`
- `group by`
- `order by`
- `where`
- `having`

## --answer--

- `join`
- `join`
- `group by`

## --why--

Each `join` connects one more table: hostels to rooms, then rooms to bed spaces. `group by h.name` makes one row for each hostel, and `count(b.id)` counts the beds in it.

# --screen-- match

## --prompt--

Match each report to the question it answers.

## --pairs--

- Occupancy by hostel
  - How many beds does each hostel have, and how many are taken?
- Overdue complaints
  - How many complaints are not resolved and past their deadline?
- Average resolution time by urgency
  - On average, how long does an urgent complaint take to fix?
- Rooms with recurring faults
  - Which rooms have 3 or more complaints of one category in 30 days?

## --why--

These are the Reporting module's queries. Each one is a join, a filter and a group built from the pieces in this lesson.
