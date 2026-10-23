# --description--

The warden wants to know how many beds each hall has. Write the query in `query.sql`. The `rooms` table is made by `setup.sql` every time you run. You can read it, but you cannot change it.

# --user-stories--

1. Your query reads from the `rooms` table.
2. Your query returns one row for each hall.
3. Each row shows the `hall` and its total beds as `total_beds`.

# --hints--

Your query should read from the `rooms` table.

```js
assert.match(code, /from\s+rooms\b/i);
```

Your query should return one row for each hall.

```js
const { rows } = await db.query(code);
assert.lengthOf(rows, 2);
```

Each row should show the `hall` and the total number of beds as `total_beds`.

```js
const { rows } = await db.query(code);
const beds = Object.fromEntries(rows.map((r) => [r.hall, Number(r.total_beds)]));
assert.deepEqual(beds, { 'Hall A': 6, 'Hall B': 12 });
```

# --seed--

## --seed-contents--

```sql file=query.sql
-- Show each hall and its total beds.
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

# --solutions--

```sql file=query.sql
-- Show each hall and its total beds.
select hall, sum(beds) as total_beds from rooms group by hall order by hall;
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

# --help--

## --hint--

Some functions work on a whole group of rows at once. `sum` adds up a column.

## --hint--

`group by` makes one group for each different value in a column.
