# --screen-- concept

Right now the IHMS keeps complaints in a Python list, and they vanish when the server restarts. A **database** keeps them. A relational database stores data in **tables**. Press Run to see one: each row is one hostel block.

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

## --callout-- info

Like Python, PostgreSQL downloads once, the first time you press Run (about 5 MB).

# --screen-- concept

A table has **columns** and **rows**. Each column holds one kind of fact. Each row is one thing. The `rooms` table has one row for every room. Run the query and read the columns: `id`, `hostel_id` and `number`.

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

# --screen-- concept

The IHMS stores its data in seven tables. Each table holds one kind of thing.

| Table | One row is |
|---|---|
| `hostels` | A hostel block |
| `rooms` | A room |
| `bed_spaces` | One bed in a room |
| `users` | Anyone who logs in |
| `allocations` | A student given a bed |
| `complaints` | A complaint |
| `complaint_history` | One thing that happened to a complaint |

# --screen-- match

## --prompt--

Match each table to what one row of it is.

## --pairs--

- `bed_spaces`
  - One bed in a room
- `users`
  - Anyone who logs in
- `allocations`
  - A student given a bed
- `complaint_history`
  - One thing that happened to a complaint
- `hostels`
  - A hostel block

## --why--

A table is named after the thing its rows describe. Names are plural, so `users` holds many users.

# --screen-- concept

Every table has a column called `id`. It is the **primary key**: a number that is different for every row. Room `id` 3 always means one room, even if two rooms have the same `number` in different hostels.

## --callout-- info

Other tables use this number to point at the row.

# --screen-- mcq

## --question--

What is a primary key?

## --options--

- [x] A column that uniquely identifies each row
  > Yes. No two rows in a table share a primary key value.
- [ ] The first column of a table
  > No. `id` is usually the first column, but what makes it a primary key is that every row has a different value.
- [ ] A password that protects the table
  > No. A primary key is not a security feature. It only tells the rows apart.
- [ ] A column that points to another table
  > No. That is a foreign key, which you meet on the next screen.

## --why--

The primary key lets the database, and other tables, name exactly one row.

# --screen-- concept

A column that ends in `_id` is a **foreign key**: it holds the `id` of a row in another table. In `rooms`, `hostel_id` says which hostel a room belongs to. Room 1 has `hostel_id` 1, so it is in hostel 1, Block A.

::: tryit sql
```sql file=query.sql
select id, hostel_id, number from rooms;
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

# --screen-- mcq

## --question--

What does `rooms.hostel_id` point to?

## --options--

- [x] A row in `hostels`
  > Yes. The number in `hostel_id` is the `id` of one hostel.
- [ ] The number of rooms in the hostel
  > No. `hostel_id` is an `id`, not a count.
- [ ] A row in `bed_spaces`
  > No. `bed_spaces` points at `rooms`, through its own `room_id`.
- [ ] The name of the hostel
  > No. It holds the hostel's `id`, a number. The name lives in the `hostels` table, in the row with that `id`.

## --why--

A foreign key is the `id` of a row somewhere else. The name of the table is in the column name: `hostel_id` points to `hostels`.

# --screen-- concept

Here is the IHMS design. `─<` means **one to many**: one hostel has many rooms, one room has many bed spaces, and one complaint has many history entries.

## --code--

```text
hostels ─┬─< rooms ─┬─< bed_spaces ──< allocations >── users
         │          │                                   │
         │          └─< complaints >────────────────────┘
         │                  │
         │                  └─< complaint_history
         └─ (wardens belong to a hostel)
```

# --screen-- predict

## --code--

```sql
insert into rooms (hostel_id, number) values
  (1, 'A-101'), (1, 'A-102'), (2, 'B-101'), (2, 'B-102');

insert into bed_spaces (room_id, label) values
  (1, '1'), (1, '2'), (2, '1'), (2, '2'),
  (3, '1'), (3, '2'), (4, '1'), (4, '2');
```

## --question--

Room `A-101` is the first room, so its `id` is 1. How many `bed_spaces` rows have `room_id` 1?

## --options--

- [x] 2
  > Yes. The first two bed spaces, labelled `1` and `2`, have `room_id` 1.
- [ ] 1
  > No. Look again at the first line of values: `(1, '1')` and `(1, '2')` both start with 1.
- [ ] 4
  > No. Four is the number of rooms, not the beds in one room.
- [ ] 8
  > No. Eight is the number of bed spaces in all four rooms together.

## --why--

One room has many bed spaces. Each bed space row stores the `id` of its room in `room_id`.

# --screen-- order

## --prompt--

Find who sleeps in bed 2 of room B-214. Put the tables in the order you follow them.

## --items--

- `rooms`: find room B-214
- `bed_spaces`: find bed `2` in that room
- `allocations`: find the allocation of that bed
- `users`: find the student it points to

## --why--

Each step follows a foreign key: `bed_spaces.room_id`, then `allocations.bed_space_id`, then `allocations.student_id`.

# --screen-- mcq

## --question--

Why does `complaints` store `room_id` rather than the room number as text?

## --options--

- [x] `room_id` points to one row in `rooms`, so the room's details are kept in one place.
  > Yes. A complaint only needs the `id`. The number, the hostel and everything else about the room stay in `rooms`.
- [ ] A complaints table cannot hold text.
  > No. `complaints` already holds text, such as `description` and `category`.
- [ ] Room numbers such as `B-214` are not allowed in a database.
  > No. `rooms.number` is a text column that holds them.
- [ ] Every complaint must have a different room.
  > No. Many complaints can point to the same room.

## --why--

A foreign key keeps one copy of each fact. The complaint holds only the pointer.

# --screen-- concept

One column in `complaints` is not in the paper's tables: `escalation_level`. It remembers the last level that was emailed. Without it, the hall warden would get an email every 15 minutes. Chapter B9 builds the escalation job.

# --screen-- typein

## --prompt--

Write a query that shows every bed space.

## --seed-contents--

```sql file=query.sql
-- Show every bed space.
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

insert into hostels (name, gender, level) values ('Block A', 'female', 100), ('Block B', 'male', 100);

insert into rooms (hostel_id, number) values (1, 'A-101'), (1, 'A-102'), (2, 'B-101'), (2, 'B-102');

insert into bed_spaces (room_id, label) values
  (1, '1'), (1, '2'), (2, '1'), (2, '2'), (3, '1'), (3, '2'), (4, '1'), (4, '2');
```

## --tests--

Your query should select from the `bed_spaces` table.

```js
assert.match(code, /select\s+[\s\S]*from\s+bed_spaces\b/i);
```

Your query should return all 8 bed spaces.

```js
const { rows } = await db.query(code);
assert.lengthOf(rows, 8);
```

Your query should show every column: `id`, `room_id` and `label`.

```js
const { rows } = await db.query(code);
assert.sameMembers(Object.keys(rows[0] ?? {}), ['id', 'room_id', 'label']);
```

## --solutions--

```sql file=query.sql
-- Show every bed space.
select * from bed_spaces;
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

insert into hostels (name, gender, level) values ('Block A', 'female', 100), ('Block B', 'male', 100);

insert into rooms (hostel_id, number) values (1, 'A-101'), (1, 'A-102'), (2, 'B-101'), (2, 'B-102');

insert into bed_spaces (room_id, label) values
  (1, '1'), (1, '2'), (2, '1'), (2, '2'), (3, '1'), (3, '2'), (4, '1'), (4, '2');
```

## --why--

`select *` shows every column, and `from bed_spaces` names the table. End the query with a semicolon.
