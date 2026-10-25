# --screen-- concept

`select` reads rows. The `*` means every column, and `from hostels` names the table. Change the query to `select name from hostels;` and press Run again.

::: tryit sql
```sql file=query.sql
select * from hostels;
```

```sql file=setup.sql
create table hostels (
  id     integer generated always as identity primary key,
  name   text not null unique,
  gender text not null check (gender in ('male', 'female')),
  level  integer not null
);

insert into hostels (name, gender, level) values ('Block A', 'female', 100), ('Block B', 'male', 100);
```
:::

## --callout-- tip

The hostels are rebuilt every time you press Run, so you cannot break them.

# --screen-- concept

`where` keeps only the rows that match a condition. Text goes in single quotes. This query lists the names of the female hostels.

::: tryit sql
```sql file=query.sql
select name from hostels where gender = 'female';
```

```sql file=setup.sql
create table hostels (
  id     integer generated always as identity primary key,
  name   text not null unique,
  gender text not null check (gender in ('male', 'female')),
  level  integer not null
);

insert into hostels (name, gender, level) values ('Block A', 'female', 100), ('Block B', 'male', 100);
```
:::

# --screen-- mcq

## --question--

Which query lists only the names of the male hostels?

## --options--

- [x] `select name from hostels where gender = 'male';`
  > Yes. It picks the `name` column and keeps only the rows where `gender` is `'male'`.
- [ ] `select * from hostels;`
  > No. This shows every column of every hostel. There is no `where` to filter the rows.
- [ ] `select name from hostels where gender = "male";`
  > No. Double quotes name a column, so PostgreSQL looks for a column called male: `column "male" does not exist`.
- [ ] `select name from hostels where gender == 'male';`
  > No. SQL uses a single `=` to compare. PostgreSQL says `operator does not exist`.

## --why--

`select` chooses the columns, `from` names the table, and `where` chooses the rows. Text values go in single quotes.

# --screen-- spotbug

## --code--

```sql
select name from hostels where gender = 'Female';
```

## --question--

Block A is a female hostel, but this query returns no rows. What is wrong?

## --options--

- [x] Text must match exactly, so `'Female'` with a capital F does not match `'female'`.
  > Yes. The value stored in the table is `female`. Copy the text exactly as it is stored.
- [ ] `where` must come before `from`.
  > No. `from` names the table first, then `where` filters its rows.
- [ ] The `gender` column must also be in the `select` list.
  > No. You can filter on a column without showing it.
- [ ] The query needs `limit` at the end.
  > No. `limit` only stops a result after some rows. It cannot make matching rows disappear.

## --why--

PostgreSQL compares every letter, capitals included. A query that runs but returns nothing often has a small spelling difference in its text.

# --screen-- concept

`order by` sorts the rows. Add `desc` after the column to sort the other way. `limit` stops after that many rows. `<>` means not equal, and everything after `--` is a comment.

::: tryit sql
```sql file=query.sql
-- Complaints that are not resolved yet, earliest deadline first.
select id, category, urgency, status, deadline
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

# --screen-- tapbuild

## --prompt--

Build the query that lists the first 10 complaints that are not resolved, earliest deadline first.

## --template--

```sql
select * from complaints
___ status <> 'Resolved'
___ deadline
___ 10;
```

## --tokens--

- `where`
- `order by`
- `limit`
- `sort by`
- `top`
- `having`

## --answer--

- `where`
- `order by`
- `limit`

## --why--

`where` filters the rows, `order by` sorts them and `limit` stops after 10. `sort by` and `top` are not PostgreSQL, and `having` belongs to groups, which you meet in the next lesson.

# --screen-- concept

`insert into` adds rows: the table, the columns, then `values`. Put a comma between rows to add several at once. Press Run to add two hostels and read them back.

::: tryit sql
```sql file=query.sql
insert into hostels (name, gender, level) values
  ('Block A', 'female', 100),
  ('Block B', 'male', 100);

select * from hostels;
```

```sql file=setup.sql
create table hostels (
  id     integer generated always as identity primary key,
  name   text not null unique,
  gender text not null check (gender in ('male', 'female')),
  level  integer not null
);
```
:::

## --callout-- info

You do not give an `id`. PostgreSQL numbers the rows, starting at 1.

# --screen-- predict

## --code--

```sql
create table hostels (
  id     integer generated always as identity primary key,
  name   text not null unique,
  gender text not null check (gender in ('male', 'female')),
  level  integer not null
);

insert into hostels (id, name, gender, level) values (7, 'Block C', 'male', 200);
```

## --question--

What happens when you run this?

## --options--

- [x] An error: PostgreSQL does not let you choose the `id`.
  > Yes. With `generated always`, only PostgreSQL gives out ids. It says `cannot insert a non-DEFAULT value into column "id"`.
- [ ] Block C is added with the `id` 7.
  > No. `generated always` refuses an `id` that you type.
- [ ] Block C is added with the `id` 1.
  > No. PostgreSQL would use 1 if you left the `id` out, but here you gave one, so it stops with an error.
- [ ] Block C is added, and the next `id` is 8.
  > No. The row is refused, so nothing is added.

## --why--

Leave `id` out of the column list and PostgreSQL fills it in for you.

# --screen-- typein

## --prompt--

Add one hostel: Block C, `male`, level `200`.

## --seed-contents--

```sql file=query.sql
-- Add Block C.
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

insert into hostels (name, gender, level) values ('Block A', 'female', 100), ('Block B', 'male', 100);
```

## --tests--

Your code should add a row with `insert into hostels`.

```js
assert.match(code, /insert\s+into\s+hostels\b/i);
```

The `hostels` table should now have 3 rows.

```js
const { rows } = await db.query('select count(*)::int as n from hostels');
assert.equal(rows[0].n, 3);
```

Block C should be a `male` hostel for level `200`. Check the spelling of the name.

```js
const { rows } = await db.query("select gender, level from hostels where name = 'Block C'");
assert.lengthOf(rows, 1);
assert.equal(rows[0].gender, 'male');
assert.equal(rows[0].level, 200);
```

## --solutions--

```sql file=query.sql
-- Add Block C.
insert into hostels (name, gender, level) values ('Block C', 'male', 200);
```

```sql file=setup.sql
create table hostels (
  id     integer generated always as identity primary key,
  name   text not null unique,
  gender text not null check (gender in ('male', 'female')),
  level  integer not null
);

insert into hostels (name, gender, level) values ('Block A', 'female', 100), ('Block B', 'male', 100);
```

## --why--

List the columns you are filling in, then the values in the same order. Leave out `id`: PostgreSQL gives the new row the next number.

# --screen-- concept

`update` changes rows. `set` gives the new value, and `where` says which rows. `delete from` removes rows the same way. Press Run to assign complaint 1.

::: tryit sql
```sql file=query.sql
update complaints set status = 'Assigned' where id = 1;

select id, category, status from complaints where id = 1;
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

## --callout-- warning

Write the `where` first. `delete from complaints;` with no `where` deletes every complaint.

# --screen-- mcq

## --question--

What happens with `update complaints set status = 'Resolved';` and no `where`?

## --options--

- [x] Every complaint becomes Resolved
  > Yes. Without a `where`, the update applies to every row of the table.
- [ ] Nothing happens, because it is an error
  > No. PostgreSQL accepts it. It trusts you to have meant every row.
- [ ] Only the first complaint changes
  > No. There is no `limit` in an update. Every row changes.
- [ ] Only the complaints that are not resolved change
  > No. Without a `where`, PostgreSQL does not decide which rows to skip.

## --why--

`where` is the only thing that picks the rows. Write it before you press Run.

# --screen-- typein

## --prompt--

Complaint 2 is now being worked on. Change its status to `In Progress`, and change no other complaint.

## --seed-contents--

```sql file=query.sql
-- Complaint 2 is in progress.
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

Your code should use `update complaints`.

```js
assert.match(code, /update\s+complaints\b/i);
```

Your update needs a `where`. Without it, every complaint changes.

```js
assert.match(code, /\bwhere\b/i);
```

Complaint 2 should have the status `In Progress`. Check the capital letters and the space.

```js
const { rows } = await db.query('select status from complaints where id = 2');
assert.equal(rows[0]?.status, 'In Progress');
```

No other complaint should change. Check that your `where` picks only complaint 2.

```js
const { rows } = await db.query('select status from complaints order by id');
assert.deepEqual(
  rows.map((r) => r.status),
  ['Open', 'In Progress', 'In Progress', 'Open', 'Open', 'Open', 'Resolved', 'Resolved', 'Resolved'],
);
```

## --solutions--

```sql file=query.sql
-- Complaint 2 is in progress.
update complaints set status = 'In Progress' where id = 2;
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

`set` names the column and the new value. `where id = 2` keeps the change to one row.

# --screen-- match

## --prompt--

Match each SQL word to its job.

## --pairs--

- `select`
  - Read rows
- `insert into`
  - Add rows
- `update`
  - Change rows
- `delete from`
  - Remove rows

## --why--

These four are the everyday jobs of a database: read, add, change and remove.
