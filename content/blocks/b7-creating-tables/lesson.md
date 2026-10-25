# --screen-- concept

You make a table with `create table`: the table's name, then each column and its type. Press Run. The second query lists the columns PostgreSQL just made.

::: tryit sql
```sql file=query.sql
create table hostels (
  id     integer generated always as identity primary key,
  name   text not null unique,
  gender text not null check (gender in ('male', 'female')),
  level  integer not null
);

select column_name, data_type
from information_schema.columns
where table_name = 'hostels'
order by ordinal_position;
```
:::

## --callout-- info

SQL ignores capitals in keywords. Appendix D writes `CREATE TABLE`. Here you write `create table`. Both work.

# --screen-- concept

Every column has a **data type**. It says what kind of value the column can hold.

| Type | Holds | Example |
|---|---|---|
| `integer` | A whole number | `100` |
| `text` | Words | `'Block A'` |
| `boolean` | True or false | `true` |
| `timestamptz` | A moment in time, with its time zone | `'2026-10-23 08:00+01'` |

# --screen-- mcq

## --question--

Which type stores a complaint's deadline?

## --options--

- [x] `timestamptz`
  > Yes. It stores a moment in time, and PostgreSQL can compare it and add hours to it.
- [ ] `text`
  > No. Text would keep the characters of a date, but PostgreSQL could not add 24 hours to them.
- [ ] `integer`
  > No. A whole number cannot hold a date and a time of day.
- [ ] `boolean`
  > No. A boolean is only true or false.

## --why--

A deadline is a moment in time, so it needs a type for moments: `timestamptz`.

# --screen-- tapbuild

## --prompt--

Build the `name` column of `hostels`: text that must have a value, and that no two hostels share.

## --template--

```sql
name ___ ___ ___,
```

## --tokens--

- `text`
- `not null`
- `unique`
- `integer`
- `null`
- `check`

## --answer--

- `text`
- `not null`
- `unique`

## --why--

`text` is the type. `not null` means the column must have a value. `unique` means no two rows can share it.

# --screen-- concept

After the type come the **constraints**. They are rules the database enforces.

| Part | Means |
|---|---|
| `generated always as identity primary key` | PostgreSQL numbers the rows for you |
| `not null` | Must have a value |
| `unique` | No two rows can share it |
| `check (...)` | Must pass this test |
| `references hostels(id)` | A foreign key: must match a real hostel |
| `default false` | The value used when none is given |

# --screen-- match

## --prompt--

Match each part of a column to what it does.

## --pairs--

- `not null`
  - The column must have a value
- `unique`
  - No two rows can share the value
- `check (gender in ('male', 'female'))`
  - The value must pass a test
- `references hostels(id)`
  - The value must match a real hostel
- `default false`
  - The value used when none is given

## --why--

Each part is one rule. A column can have several, one after the other.

# --screen-- mcq

## --question--

What does `references hostels(id)` guarantee?

## --options--

- [x] Every room points to a hostel that exists
  > Yes. PostgreSQL refuses a room whose `hostel_id` is not the `id` of a real hostel.
- [ ] Every hostel has at least one room
  > No. A hostel with no rooms is allowed. The rule only checks the room's side.
- [ ] Every hostel has a different name
  > No. That is what `unique` does, and it is on a different column.

## --why--

`references` is a foreign key. The value in the column must match a row in the other table.

# --screen-- spotbug

## --code--

```sql
create table rooms (
  id        integer generated always as identity primary key,
  hostel_id integer not null references hostels(id)
  number    text not null,
  unique (hostel_id, number)
);
```

## --question--

PostgreSQL says: `syntax error at or near "number"`. What is wrong?

## --options--

- [x] A comma is missing after the `hostel_id` line.
  > Yes. Each column is separated from the next by a comma, so PostgreSQL is surprised to meet `number`.
- [ ] Every column line needs a semicolon at the end.
  > No. A semicolon ends a whole statement, once, after the closing bracket.
- [ ] `unique (hostel_id, number)` has to come before the columns.
  > No. A rule that uses two columns goes after the columns it names.
- [ ] `text` is not a valid type.
  > No. `text` is one of the types you just met.

## --why--

When the error points at a word, look at the end of the line before it. A missing comma is the usual cause.

# --screen-- order

## --prompt--

`rooms` has a foreign key to `hostels`, and `bed_spaces` has one to `rooms`. Put the three `create table` statements in the order PostgreSQL needs them.

## --items--

- `create table hostels`
- `create table rooms`
- `create table bed_spaces`

## --why--

A foreign key can only point at a table that already exists. `hostels` points at nothing, so it goes first.

# --screen-- predict

## --code--

```sql
create table hostels (id integer);
create table hostels (id integer);
```

## --question--

What happens when you run this?

## --options--

- [x] The second line fails: the table `hostels` already exists.
  > Yes. PostgreSQL says `relation "hostels" already exists`. A table name can be used once.
- [ ] Both lines run, and there are two tables called `hostels`.
  > No. Two tables in the same place cannot share a name.
- [ ] The second line replaces the first table.
  > No. `create table` never replaces a table. It stops with an error.
- [ ] Nothing runs, because the table has no rows.
  > No. A table can exist with no rows. Rows are added later.

## --why--

Run `create table` once for each table. If you need to start again, the Try it and the workshop rebuild everything on every Run.

# --screen-- typein

## --prompt--

Create the `bed_spaces` table. Its columns are `id` (numbered by PostgreSQL, the primary key), `room_id` (a whole number that must have a value and must point to a real room) and `label` (text that must have a value). A room cannot have two beds with the same `label`.

## --seed-contents--

```sql file=query.sql
-- Create the bed_spaces table.
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

insert into hostels (name, gender, level) values ('Block A', 'female', 100), ('Block B', 'male', 100);

insert into rooms (hostel_id, number) values (1, 'A-101'), (1, 'A-102'), (2, 'B-101'), (2, 'B-102');
```

## --tests--

Your code should create a table called `bed_spaces`.

```js
const { rows } = await db.query(
  "select table_name from information_schema.tables where table_schema = 'public' and table_name = 'bed_spaces'",
);
assert.lengthOf(rows, 1);
```

The table should have the columns `id`, `room_id` and `label`, in that order.

```js
const { rows } = await db.query(
  "select column_name from information_schema.columns where table_name = 'bed_spaces' order by ordinal_position",
);
assert.deepEqual(
  rows.map((r) => r.column_name),
  ['id', 'room_id', 'label'],
);
```

`id` and `room_id` should be whole numbers (`integer`) and `label` should be `text`.

```js
const { rows } = await db.query(
  "select data_type from information_schema.columns where table_name = 'bed_spaces' order by ordinal_position",
);
assert.deepEqual(
  rows.map((r) => r.data_type),
  ['integer', 'integer', 'text'],
);
```

`id` should be the primary key. Add `primary key` after its type.

```js
const { rows } = await db.query(
  "select a.attname from pg_index i join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey) where i.indrelid = 'bed_spaces'::regclass and i.indisprimary",
);
assert.deepEqual(
  rows.map((r) => r.attname),
  ['id'],
);
```

PostgreSQL should number the rows for you. Write `generated always as identity` before `primary key`.

```js
const { rows } = await db.query(
  "select is_identity from information_schema.columns where table_name = 'bed_spaces' and column_name = 'id'",
);
assert.equal(rows[0]?.is_identity, 'YES');
```

`room_id` and `label` must have a value. Add `not null` after each type.

```js
const { rows } = await db.query(
  "select column_name from information_schema.columns where table_name = 'bed_spaces' and is_nullable = 'NO'",
);
assert.includeMembers(
  rows.map((r) => r.column_name),
  ['room_id', 'label'],
);
```

`room_id` should point to a real room. Add `references rooms(id)` after its type.

```js
const { rows } = await db.query(
  "select confrelid::regclass::text as ref from pg_constraint where conrelid = 'bed_spaces'::regclass and contype = 'f'",
);
assert.deepEqual(
  rows.map((r) => r.ref),
  ['rooms'],
);
```

A room should not be able to have two beds with the same `label`. Add `unique (room_id, label)` after the columns.

```js
await db.query("insert into bed_spaces (room_id, label) values (1, 'X')");
let error;
try {
  await db.query("insert into bed_spaces (room_id, label) values (1, 'X')");
} catch (e) {
  error = e;
}
assert.exists(error);
assert.equal(error.code, '23505');
```

## --solutions--

```sql file=query.sql
-- Create the bed_spaces table.
create table bed_spaces (
  id      integer generated always as identity primary key,
  room_id integer not null references rooms(id),
  label   text not null,
  unique (room_id, label)
);
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

## --why--

Each column is a name, a type and its rules. `unique (room_id, label)` is a rule about two columns together, so it goes after the columns.

# --screen-- concept

Everything so far ran in your browser. The real IHMS database runs on PostgreSQL on your laptop, so install it now. At the end of this chapter, once you have written the IHMS tables yourself, you create the `ihms` database in pgAdmin and load the full schema.

# --screen-- checklist

## --items--

- Install PostgreSQL on your laptop. On Windows, use the installer from postgresql.org, which includes pgAdmin, a visual tool. On a Mac, use Postgres.app. Then run the command below and paste what it prints.
  - command: `psql --version`
  - pattern: `psql \(PostgreSQL\) \d+`
  - hint: The output should look like `psql (PostgreSQL) 16.4`. On Windows the installer does not add `psql` to your PATH, so run it by its full path in PowerShell: `& "C:\Program Files\PostgreSQL\16\bin\psql.exe" --version`, with your version number in place of 16. If it still fails, ask the group.
- During setup you choose a password for the `postgres` user. Write it down. This is your local database, not a university account.
