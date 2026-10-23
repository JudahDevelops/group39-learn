# --screen-- concept

SQL asks a database for rows. `select *` means every column, and `from rooms` names the table. Change the query, then press Run. The rows appear under the code.

::: tryit sql
```sql file=query.sql
select * from rooms;
```

```sql file=setup.sql
create table rooms (
  id integer primary key,
  room_number text not null,
  hall text not null,
  beds integer not null
);

insert into rooms (id, room_number, hall, beds) values
  (1, 'A-101', 'Hall A', 4),
  (2, 'A-102', 'Hall A', 2),
  (3, 'B-214', 'Hall B', 4),
  (4, 'B-215', 'Hall B', 6),
  (5, 'B-216', 'Hall B', 2);
```
:::

## --callout-- tip

The `rooms` table is rebuilt from `setup.sql` every time you run. Nothing you do can break it.

# --screen-- typein

## --prompt--

Create a table called `complaints` with two columns: `id`, a whole number, and `description`, text.

## --seed-contents--

```sql file=query.sql
-- Create the complaints table.
--editable-region--

--editable-region--
```

```sql file=setup.sql
create table rooms (
  id integer primary key,
  room_number text not null,
  hall text not null,
  beds integer not null
);

insert into rooms (id, room_number, hall, beds) values
  (1, 'A-101', 'Hall A', 4),
  (2, 'A-102', 'Hall A', 2),
  (3, 'B-214', 'Hall B', 4),
  (4, 'B-215', 'Hall B', 6),
  (5, 'B-216', 'Hall B', 2);
```

## --tests--

Your code should create a table called `complaints`.

```js
const { rows } = await db.query(
  "select table_name from information_schema.tables where table_schema = 'public' and table_name = 'complaints'",
);
assert.lengthOf(rows, 1);
```

The `complaints` table should have the columns `id` and `description`, in that order.

```js
const { rows } = await db.query(
  "select column_name from information_schema.columns where table_name = 'complaints' order by ordinal_position",
);
assert.deepEqual(
  rows.map((r) => r.column_name),
  ['id', 'description'],
);
```

`id` should be a whole number (`integer`) and `description` should be `text`.

```js
const { rows } = await db.query(
  "select data_type from information_schema.columns where table_name = 'complaints' order by ordinal_position",
);
assert.deepEqual(
  rows.map((r) => r.data_type),
  ['integer', 'text'],
);
```

## --solutions--

```sql file=query.sql
-- Create the complaints table.
create table complaints (id integer, description text);
```

```sql file=setup.sql
create table rooms (
  id integer primary key,
  room_number text not null,
  hall text not null,
  beds integer not null
);

insert into rooms (id, room_number, hall, beds) values
  (1, 'A-101', 'Hall A', 4),
  (2, 'A-102', 'Hall A', 2),
  (3, 'B-214', 'Hall B', 4),
  (4, 'B-215', 'Hall B', 6),
  (5, 'B-216', 'Hall B', 2);
```

## --why--

`create table` names the table, then lists each column with its type inside brackets.
