# --description--

The hall wardens and Student Affairs want answers from the IHMS database. Write the ten queries below in `query.sql`, in this order, one under each comment, and end each with a semicolon. The tests read your queries in order and run each one.

The database is the seven tables from the last workshop, filled with a few weeks of fictional hostel life. `setup.sql` builds it every time you run. You can read it, but you cannot change it. Two words are used all the way through. A complaint is **open** when its status is not `Resolved`. It is **overdue** when it is open and its `deadline` is before `now()`.

Use the user stories as your checklist. When every test passes, the lab is done.

# --user-stories--

1. Query 1 shows the number of open complaints in each hostel, as `hostel` and `open_complaints`, sorted by `hostel`. Hostels with no open complaints are left out.
2. Query 2 shows every hostel, including a hostel with no open complaints, as `hostel` and `open_complaints`, sorted by `hostel`. A hostel with none shows 0.
3. Query 3 counts the overdue complaints and returns one row with one column, `overdue`.
4. Query 4 lists the overdue complaints with the columns `id`, `hostel`, `room`, `category`, `urgency` and `deadline`, earliest deadline first.
5. Query 5 returns one row: the hostel with the most overdue complaints, as `hostel` and `overdue`.
6. Query 6 shows the average time to resolve a complaint for each urgency, as `urgency` and `average_time`, sorted by `urgency`. Only resolved complaints count.
7. Query 7 lists the recurring faults: the `room_id`, `category` and number of `complaints` of every room and category with 3 or more complaints created in the last 30 days, sorted by `room_id`.
8. Query 8 shows the same recurring faults with the hostel name and the room number instead of `room_id`: `hostel`, `room`, `category` and `complaints`, sorted by `hostel`, then `room`.
9. Query 9 shows the bed occupancy of each hostel: `name`, `beds` and `occupied`, sorted by `name`. A bed is occupied when it has an allocation with the status `active`.
10. Query 10 lists the rooms where every bed is taken: `hostel`, `room`, `beds` and `occupied`, sorted by `hostel`, then `room`.

# --hints--

Write query 1 below its comment, and end it with a semicolon. The tests read your queries in order.

```js
const queries = code.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
const query = queries[0];
assert.exists(query);
```

Your first query should show the columns `hostel` and `open_complaints`, in that order.

```js
const queries = code.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
const query = queries[0];
assert.exists(query);
const { rows } = await db.query(query);
assert.deepEqual(Object.keys(rows[0] ?? {}), ['hostel', 'open_complaints']);
```

Your first query should return 2 rows: Block A with 3 open complaints and Block B with 4, sorted by hostel. A complaint is open when its status is not `Resolved`.

```js
const queries = code.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
const query = queries[0];
assert.exists(query);
const { rows } = await db.query(query);
assert.deepEqual(
  rows.map((r) => [r.hostel, Number(r.open_complaints)]),
  [['Block A', 3], ['Block B', 4]],
);
```

Write query 2 below its comment, and end it with a semicolon. The tests read your queries in order.

```js
const queries = code.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
const query = queries[1];
assert.exists(query);
```

Your second query should show the columns `hostel` and `open_complaints`, in that order.

```js
const queries = code.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
const query = queries[1];
assert.exists(query);
const { rows } = await db.query(query);
assert.deepEqual(Object.keys(rows[0] ?? {}), ['hostel', 'open_complaints']);
```

Block C has no open complaints, but your second query should still show it, with 0. Keep every hostel, and count only the complaints that are open.

```js
const queries = code.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
const query = queries[1];
assert.exists(query);
const { rows } = await db.query(query);
assert.deepEqual(
  rows.map((r) => [r.hostel, Number(r.open_complaints)]),
  [['Block A', 3], ['Block B', 4], ['Block C', 0]],
);
```

Write query 3 below its comment, and end it with a semicolon. The tests read your queries in order.

```js
const queries = code.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
const query = queries[2];
assert.exists(query);
```

Your third query should show the columns `overdue`, in that order.

```js
const queries = code.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
const query = queries[2];
assert.exists(query);
const { rows } = await db.query(query);
assert.deepEqual(Object.keys(rows[0] ?? {}), ['overdue']);
```

Your third query should return one row with the number of overdue complaints. A complaint is overdue when it is not `Resolved` and its `deadline` is before `now()`. The answer is 4.

```js
const queries = code.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
const query = queries[2];
assert.exists(query);
const { rows } = await db.query(query);
assert.lengthOf(rows, 1);
assert.equal(Number(rows[0].overdue), 4);
```

Write query 4 below its comment, and end it with a semicolon. The tests read your queries in order.

```js
const queries = code.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
const query = queries[3];
assert.exists(query);
```

Your fourth query should show the columns `id`, `hostel`, `room`, `category`, `urgency` and `deadline`, in that order.

```js
const queries = code.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
const query = queries[3];
assert.exists(query);
const { rows } = await db.query(query);
assert.deepEqual(Object.keys(rows[0] ?? {}), ['id', 'hostel', 'room', 'category', 'urgency', 'deadline']);
```

Your fourth query should list the 4 overdue complaints, earliest deadline first: complaints 11, 7, 8 and 1.

```js
const queries = code.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
const query = queries[3];
assert.exists(query);
const { rows } = await db.query(query);
assert.deepEqual(
  rows.map((r) => Number(r.id)),
  [11, 7, 8, 1],
);
```

Each overdue complaint should show its hostel, room, category and urgency. Complaint 11 is in Block B, room B-102, a normal sanitation complaint.

```js
const queries = code.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
const query = queries[3];
assert.exists(query);
const { rows } = await db.query(query);
assert.deepEqual(
  rows.map((r) => [r.hostel, r.room, r.category, r.urgency]),
  [
    ['Block B', 'B-102', 'sanitation', 'normal'],
    ['Block B', 'B-101', 'electrical', 'urgent'],
    ['Block B', 'B-101', 'electrical', 'normal'],
    ['Block A', 'A-101', 'plumbing', 'urgent'],
  ],
);
```

Write query 5 below its comment, and end it with a semicolon. The tests read your queries in order.

```js
const queries = code.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
const query = queries[4];
assert.exists(query);
```

Your fifth query should show the columns `hostel` and `overdue`, in that order.

```js
const queries = code.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
const query = queries[4];
assert.exists(query);
const { rows } = await db.query(query);
assert.deepEqual(Object.keys(rows[0] ?? {}), ['hostel', 'overdue']);
```

Your fifth query should return only one row: the hostel with the most overdue complaints. Block B has 3 and Block A has 1.

```js
const queries = code.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
const query = queries[4];
assert.exists(query);
const { rows } = await db.query(query);
assert.deepEqual(
  rows.map((r) => [r.hostel, Number(r.overdue)]),
  [['Block B', 3]],
);
```

Write query 6 below its comment, and end it with a semicolon. The tests read your queries in order.

```js
const queries = code.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
const query = queries[5];
assert.exists(query);
```

Your sixth query should show the columns `urgency` and `average_time`, in that order.

```js
const queries = code.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
const query = queries[5];
assert.exists(query);
const { rows } = await db.query(query);
assert.deepEqual(Object.keys(rows[0] ?? {}), ['urgency', 'average_time']);
```

Your sixth query should return one row for each urgency, sorted by urgency, and count only resolved complaints. Urgent complaints take 8 hours on average, normal ones 55 hours and low ones 96 hours.

```js
const queries = code.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
const query = queries[5];
assert.exists(query);
const { rows } = await db.query(
  `select urgency, extract(epoch from average_time) / 3600 as hours from (${query}) t order by urgency`,
);
assert.deepEqual(
  rows.map((r) => r.urgency),
  ['low', 'normal', 'urgent'],
);
assert.closeTo(Number(rows[0].hours), 96, 0.01);
assert.closeTo(Number(rows[1].hours), 55, 0.01);
assert.closeTo(Number(rows[2].hours), 8, 0.01);
```

Write query 7 below its comment, and end it with a semicolon. The tests read your queries in order.

```js
const queries = code.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
const query = queries[6];
assert.exists(query);
```

Your seventh query should show the columns `room_id`, `category` and `complaints`, in that order.

```js
const queries = code.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
const query = queries[6];
assert.exists(query);
const { rows } = await db.query(query);
assert.deepEqual(Object.keys(rows[0] ?? {}), ['room_id', 'category', 'complaints']);
```

Your seventh query should return the 2 recurring faults, sorted by `room_id`: room 1 with 3 plumbing complaints and room 3 with 4 electrical complaints. Count only complaints created in the last 30 days. Room 4 has 3 plumbing complaints in all, but only 2 are recent.

```js
const queries = code.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
const query = queries[6];
assert.exists(query);
const { rows } = await db.query(query);
assert.deepEqual(
  rows.map((r) => [Number(r.room_id), r.category, Number(r.complaints)]),
  [[1, 'plumbing', 3], [3, 'electrical', 4]],
);
```

Write query 8 below its comment, and end it with a semicolon. The tests read your queries in order.

```js
const queries = code.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
const query = queries[7];
assert.exists(query);
```

Your eighth query should show the columns `hostel`, `room`, `category` and `complaints`, in that order.

```js
const queries = code.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
const query = queries[7];
assert.exists(query);
const { rows } = await db.query(query);
assert.deepEqual(Object.keys(rows[0] ?? {}), ['hostel', 'room', 'category', 'complaints']);
```

Your eighth query should show the same two recurring faults with the hostel name and the room number: Block A, A-101, plumbing, 3 and Block B, B-101, electrical, 4. Sort by hostel, then room.

```js
const queries = code.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
const query = queries[7];
assert.exists(query);
const { rows } = await db.query(query);
assert.deepEqual(
  rows.map((r) => [r.hostel, r.room, r.category, Number(r.complaints)]),
  [['Block A', 'A-101', 'plumbing', 3], ['Block B', 'B-101', 'electrical', 4]],
);
```

Write query 9 below its comment, and end it with a semicolon. The tests read your queries in order.

```js
const queries = code.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
const query = queries[8];
assert.exists(query);
```

Your ninth query should show the columns `name`, `beds` and `occupied`, in that order.

```js
const queries = code.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
const query = queries[8];
assert.exists(query);
const { rows } = await db.query(query);
assert.deepEqual(Object.keys(rows[0] ?? {}), ['name', 'beds', 'occupied']);
```

Your ninth query should return 3 rows sorted by name: Block A with 4 beds and 2 occupied, Block B with 4 and 3, and Block C with 4 and 1. A bed is occupied only when its allocation is `active`: ended allocations do not count.

```js
const queries = code.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
const query = queries[8];
assert.exists(query);
const { rows } = await db.query(query);
assert.deepEqual(
  rows.map((r) => [r.name, Number(r.beds), Number(r.occupied)]),
  [['Block A', 4, 2], ['Block B', 4, 3], ['Block C', 4, 1]],
);
```

Write query 10 below its comment, and end it with a semicolon. The tests read your queries in order.

```js
const queries = code.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
const query = queries[9];
assert.exists(query);
```

Your tenth query should show the columns `hostel`, `room`, `beds` and `occupied`, in that order.

```js
const queries = code.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
const query = queries[9];
assert.exists(query);
const { rows } = await db.query(query);
assert.deepEqual(Object.keys(rows[0] ?? {}), ['hostel', 'room', 'beds', 'occupied']);
```

Your tenth query should return only the rooms where the number of occupied beds equals the number of beds. Only room B-101 in Block B is full: both of its beds are active.

```js
const queries = code.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
const query = queries[9];
assert.exists(query);
const { rows } = await db.query(query);
assert.deepEqual(
  rows.map((r) => [r.hostel, r.room, Number(r.beds), Number(r.occupied)]),
  [['Block B', 'B-101', 2, 2]],
);
```

# --seed--

## --seed-contents--

```sql file=query.sql
-- 1. Open complaints in each hostel.

-- 2. Open complaints in every hostel, including those with none.

-- 3. How many complaints are overdue?

-- 4. The overdue complaints, earliest deadline first.

-- 5. The hostel with the most overdue complaints.

-- 6. Average time to resolve a complaint, for each urgency.

-- 7. Recurring faults: rooms with 3 or more complaints of one category in the last 30 days.

-- 8. The same recurring faults, with the hostel name and the room number.

-- 9. Bed occupancy of each hostel.

-- 10. Rooms where every bed is taken.
```

```sql file=setup.sql
-- Hostel blocks.
create table hostels (
  id integer generated always as identity primary key,
  name text not null unique,
  gender text not null check (gender in ('male', 'female')),
  level integer not null
);

-- Rooms. Each room belongs to one hostel.
create table rooms (
  id integer generated always as identity primary key,
  hostel_id integer not null references hostels(id),
  number text not null,
  unique (hostel_id, number)
);

-- Bed spaces. Each bed space is one bed in a room.
create table bed_spaces (
  id integer generated always as identity primary key,
  room_id integer not null references rooms(id),
  label text not null,
  unique (room_id, label)
);

-- Users: students, maintenance officers, hall wardens and admins.
create table users (
  id integer generated always as identity primary key,
  full_name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null check (role in ('student', 'maintenance_officer', 'hall_warden', 'admin')),
  gender text check (gender in ('male', 'female')),
  level integer,
  fees_cleared boolean not null default false,
  unit text,                                -- maintenance officers: plumbing, electrical, ...
  hostel_id integer references hostels(id)  -- hall wardens: the hostel they run
);

-- Allocations: a student given a bed space.
create table allocations (
  id integer generated always as identity primary key,
  student_id integer not null references users(id),
  bed_space_id integer not null references bed_spaces(id),
  status text not null default 'active' check (status in ('active', 'ended')),
  created_at timestamptz not null default now()
);

-- A bed can have only one active allocation.
create unique index one_active_allocation_per_bed
  on allocations (bed_space_id) where status = 'active';

-- A student can have only one active allocation.
create unique index one_active_allocation_per_student
  on allocations (student_id) where status = 'active';

-- Complaints about a room.
create table complaints (
  id integer generated always as identity primary key,
  student_id integer not null references users(id),
  room_id integer not null references rooms(id),
  description text not null,
  category text not null,
  urgency text not null check (urgency in ('urgent', 'normal', 'low')),
  status text not null default 'Open' check (status in ('Open', 'Assigned', 'In Progress', 'Resolved')),
  escalation_level integer not null default 0,
  created_at timestamptz not null default now(),
  deadline timestamptz not null,
  resolved_at timestamptz
);

-- The history of each complaint.
create table complaint_history (
  id integer generated always as identity primary key,
  complaint_id integer not null references complaints(id),
  event text not null,
  actor_id integer references users(id),
  at timestamptz not null default now()
);

-- Fictional data: three hostels, six rooms, twelve bed spaces.
insert into hostels (name, gender, level) values
  ('Block A', 'female', 100),
  ('Block B', 'male', 100),
  ('Block C', 'female', 200);

insert into rooms (hostel_id, number) values
  (1, 'A-101'), (1, 'A-102'), (2, 'B-101'), (2, 'B-102'), (3, 'C-101'), (3, 'C-102');

insert into bed_spaces (room_id, label) values
  (1, '1'), (1, '2'), (2, '1'), (2, '2'), (3, '1'), (3, '2'),
  (4, '1'), (4, '2'), (5, '1'), (5, '2'), (6, '1'), (6, '2');

-- Students (ids 1 to 7), then staff (ids 8 to 11).
insert into users (full_name, email, password_hash, role, gender, level, fees_cleared) values
  ('Amina Bello', 'amina.bello@example.com', 'placeholder', 'student', 'female', 100, true),
  ('Chidi Okafor', 'chidi.okafor@example.com', 'placeholder', 'student', 'male', 100, true),
  ('Ngozi Obi', 'ngozi.obi@example.com', 'placeholder', 'student', 'female', 100, true),
  ('Emeka Eze', 'emeka.eze@example.com', 'placeholder', 'student', 'male', 100, true),
  ('Fatima Yusuf', 'fatima.yusuf@example.com', 'placeholder', 'student', 'female', 200, true),
  ('Tunde Bakare', 'tunde.bakare@example.com', 'placeholder', 'student', 'male', 100, true),
  ('Bola Adeyemi', 'bola.adeyemi@example.com', 'placeholder', 'student', 'female', 200, false);

insert into users (full_name, email, password_hash, role, unit, hostel_id) values
  ('Mrs Hauwa Ibrahim', 'hauwa.ibrahim@example.com', 'placeholder', 'hall_warden', null, 1),
  ('Mr Sani Garba', 'sani.garba@example.com', 'placeholder', 'maintenance_officer', 'plumbing', null),
  ('Mr Kunle Adebayo', 'kunle.adebayo@example.com', 'placeholder', 'maintenance_officer', 'electrical', null),
  ('Dr Grace Nwosu', 'grace.nwosu@example.com', 'placeholder', 'admin', null, null);

-- Six students hold a bed. Bola and Chidi had a bed before: those allocations have ended.
insert into allocations (student_id, bed_space_id, status) values
  (1, 1, 'active'),
  (3, 3, 'active'),
  (2, 5, 'active'),
  (4, 6, 'active'),
  (6, 7, 'active'),
  (5, 9, 'active'),
  (7, 2, 'ended'),
  (2, 8, 'ended');

-- Complaints. The deadline is 24 hours after created_at for urgent, 72 hours for normal, 7 days for low.
insert into complaints
  (student_id, room_id, description, category, urgency, status, escalation_level, created_at, deadline, resolved_at)
values
  (1, 1, 'Pipe burst under the sink, water on the floor', 'plumbing', 'urgent', 'Open', 1,
   now() - interval '30 hours', now() - interval '6 hours', null),
  (1, 1, 'Leaking tap in the bathroom', 'plumbing', 'normal', 'Open', 0,
   now() - interval '2 days', now() + interval '1 day', null),
  (1, 1, 'Leaking shower head', 'plumbing', 'normal', 'Resolved', 0,
   now() - interval '12 days', now() - interval '9 days', now() - interval '12 days' + interval '30 hours'),
  (3, 2, 'Broken bed frame, one leg is cracked', 'carpentry', 'normal', 'In Progress', 0,
   now() - interval '2 days', now() + interval '1 day', null),
  (3, 2, 'Squeaking door in the corridor', 'carpentry', 'low', 'Resolved', 0,
   now() - interval '8 days', now() - interval '1 day', now() - interval '8 days' + interval '96 hours'),
  (1, 1, 'Leaking tap in the shower room', 'plumbing', 'normal', 'Resolved', 0,
   now() - interval '45 days', now() - interval '42 days', now() - interval '45 days' + interval '50 hours'),
  (2, 3, 'Socket sparks when I charge my phone', 'electrical', 'urgent', 'Assigned', 2,
   now() - interval '60 hours', now() - interval '36 hours', null),
  (4, 3, 'Faulty socket near the bed', 'electrical', 'normal', 'Open', 1,
   now() - interval '4 days', now() - interval '1 day', null),
  (2, 3, 'Loose bulb holder, the light flickers', 'electrical', 'normal', 'Resolved', 0,
   now() - interval '10 days', now() - interval '7 days', now() - interval '10 days' + interval '60 hours'),
  (4, 3, 'Socket cover is missing', 'electrical', 'low', 'Open', 0,
   now() - interval '3 days', now() + interval '4 days', null),
  (6, 4, 'Blocked drain in the bathroom', 'sanitation', 'normal', 'Open', 1,
   now() - interval '5 days', now() - interval '2 days', null),
  (6, 4, 'Pipe burst in the bathroom', 'plumbing', 'urgent', 'Resolved', 0,
   now() - interval '9 days', now() - interval '8 days', now() - interval '9 days' + interval '10 hours'),
  (6, 4, 'Leaking tap in the bathroom', 'plumbing', 'normal', 'Resolved', 0,
   now() - interval '20 days', now() - interval '17 days', now() - interval '20 days' + interval '40 hours'),
  (6, 4, 'Leaking tap in the shower', 'plumbing', 'normal', 'Resolved', 0,
   now() - interval '40 days', now() - interval '37 days', now() - interval '40 days' + interval '80 hours'),
  (5, 5, 'Door lock is broken', 'carpentry', 'urgent', 'Resolved', 0,
   now() - interval '15 days', now() - interval '14 days', now() - interval '15 days' + interval '6 hours'),
  (5, 5, 'Cracked window pane', 'carpentry', 'normal', 'Resolved', 0,
   now() - interval '6 days', now() - interval '3 days', now() - interval '6 days' + interval '70 hours');

insert into complaint_history (complaint_id, event, actor_id) values
  (1, 'Lodged and triaged as urgent plumbing', 1),
  (1, 'Escalated to level 1: hall warden emailed', null),
  (7, 'Lodged and triaged as urgent electrical', 2),
  (7, 'Status changed to Assigned', 10);
```

# --solutions--

```sql file=query.sql
-- 1. Open complaints in each hostel.
select h.name as hostel, count(*) as open_complaints
from complaints c
join rooms r   on r.id = c.room_id
join hostels h on h.id = r.hostel_id
where c.status <> 'Resolved'
group by h.name
order by h.name;

-- 2. Open complaints in every hostel, including those with none.
select h.name as hostel, count(c.id) as open_complaints
from hostels h
join rooms r on r.hostel_id = h.id
left join complaints c on c.room_id = r.id and c.status <> 'Resolved'
group by h.name
order by h.name;

-- 3. How many complaints are overdue?
select count(*) as overdue
from complaints
where status <> 'Resolved' and deadline < now();

-- 4. The overdue complaints, earliest deadline first.
select c.id, h.name as hostel, r.number as room, c.category, c.urgency, c.deadline
from complaints c
join rooms r   on r.id = c.room_id
join hostels h on h.id = r.hostel_id
where c.status <> 'Resolved' and c.deadline < now()
order by c.deadline;

-- 5. The hostel with the most overdue complaints.
select h.name as hostel, count(*) as overdue
from complaints c
join rooms r   on r.id = c.room_id
join hostels h on h.id = r.hostel_id
where c.status <> 'Resolved' and c.deadline < now()
group by h.name
order by count(*) desc
limit 1;

-- 6. Average time to resolve a complaint, for each urgency.
select urgency, avg(resolved_at - created_at) as average_time
from complaints
where status = 'Resolved'
group by urgency
order by urgency;

-- 7. Recurring faults: rooms with 3 or more complaints of one category in the last 30 days.
select room_id, category, count(*) as complaints
from complaints
where created_at >= now() - interval '30 days'
group by room_id, category
having count(*) >= 3
order by room_id;

-- 8. The same recurring faults, with the hostel name and the room number.
select h.name as hostel, r.number as room, c.category, count(*) as complaints
from complaints c
join rooms r   on r.id = c.room_id
join hostels h on h.id = r.hostel_id
where c.created_at >= now() - interval '30 days'
group by h.name, r.number, c.category
having count(*) >= 3
order by h.name, r.number;

-- 9. Bed occupancy of each hostel.
select h.name,
       count(b.id) as beds,
       count(a.id) as occupied
from hostels h
join rooms r            on r.hostel_id = h.id
join bed_spaces b       on b.room_id = r.id
left join allocations a on a.bed_space_id = b.id and a.status = 'active'
group by h.name
order by h.name;

-- 10. Rooms where every bed is taken.
select h.name as hostel, r.number as room, count(b.id) as beds, count(a.id) as occupied
from rooms r
join hostels h          on h.id = r.hostel_id
join bed_spaces b       on b.room_id = r.id
left join allocations a on a.bed_space_id = b.id and a.status = 'active'
group by h.name, r.number
having count(b.id) = count(a.id)
order by h.name, r.number;
```

```sql file=setup.sql
-- Hostel blocks.
create table hostels (
  id integer generated always as identity primary key,
  name text not null unique,
  gender text not null check (gender in ('male', 'female')),
  level integer not null
);

-- Rooms. Each room belongs to one hostel.
create table rooms (
  id integer generated always as identity primary key,
  hostel_id integer not null references hostels(id),
  number text not null,
  unique (hostel_id, number)
);

-- Bed spaces. Each bed space is one bed in a room.
create table bed_spaces (
  id integer generated always as identity primary key,
  room_id integer not null references rooms(id),
  label text not null,
  unique (room_id, label)
);

-- Users: students, maintenance officers, hall wardens and admins.
create table users (
  id integer generated always as identity primary key,
  full_name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null check (role in ('student', 'maintenance_officer', 'hall_warden', 'admin')),
  gender text check (gender in ('male', 'female')),
  level integer,
  fees_cleared boolean not null default false,
  unit text,                                -- maintenance officers: plumbing, electrical, ...
  hostel_id integer references hostels(id)  -- hall wardens: the hostel they run
);

-- Allocations: a student given a bed space.
create table allocations (
  id integer generated always as identity primary key,
  student_id integer not null references users(id),
  bed_space_id integer not null references bed_spaces(id),
  status text not null default 'active' check (status in ('active', 'ended')),
  created_at timestamptz not null default now()
);

-- A bed can have only one active allocation.
create unique index one_active_allocation_per_bed
  on allocations (bed_space_id) where status = 'active';

-- A student can have only one active allocation.
create unique index one_active_allocation_per_student
  on allocations (student_id) where status = 'active';

-- Complaints about a room.
create table complaints (
  id integer generated always as identity primary key,
  student_id integer not null references users(id),
  room_id integer not null references rooms(id),
  description text not null,
  category text not null,
  urgency text not null check (urgency in ('urgent', 'normal', 'low')),
  status text not null default 'Open' check (status in ('Open', 'Assigned', 'In Progress', 'Resolved')),
  escalation_level integer not null default 0,
  created_at timestamptz not null default now(),
  deadline timestamptz not null,
  resolved_at timestamptz
);

-- The history of each complaint.
create table complaint_history (
  id integer generated always as identity primary key,
  complaint_id integer not null references complaints(id),
  event text not null,
  actor_id integer references users(id),
  at timestamptz not null default now()
);

-- Fictional data: three hostels, six rooms, twelve bed spaces.
insert into hostels (name, gender, level) values
  ('Block A', 'female', 100),
  ('Block B', 'male', 100),
  ('Block C', 'female', 200);

insert into rooms (hostel_id, number) values
  (1, 'A-101'), (1, 'A-102'), (2, 'B-101'), (2, 'B-102'), (3, 'C-101'), (3, 'C-102');

insert into bed_spaces (room_id, label) values
  (1, '1'), (1, '2'), (2, '1'), (2, '2'), (3, '1'), (3, '2'),
  (4, '1'), (4, '2'), (5, '1'), (5, '2'), (6, '1'), (6, '2');

-- Students (ids 1 to 7), then staff (ids 8 to 11).
insert into users (full_name, email, password_hash, role, gender, level, fees_cleared) values
  ('Amina Bello', 'amina.bello@example.com', 'placeholder', 'student', 'female', 100, true),
  ('Chidi Okafor', 'chidi.okafor@example.com', 'placeholder', 'student', 'male', 100, true),
  ('Ngozi Obi', 'ngozi.obi@example.com', 'placeholder', 'student', 'female', 100, true),
  ('Emeka Eze', 'emeka.eze@example.com', 'placeholder', 'student', 'male', 100, true),
  ('Fatima Yusuf', 'fatima.yusuf@example.com', 'placeholder', 'student', 'female', 200, true),
  ('Tunde Bakare', 'tunde.bakare@example.com', 'placeholder', 'student', 'male', 100, true),
  ('Bola Adeyemi', 'bola.adeyemi@example.com', 'placeholder', 'student', 'female', 200, false);

insert into users (full_name, email, password_hash, role, unit, hostel_id) values
  ('Mrs Hauwa Ibrahim', 'hauwa.ibrahim@example.com', 'placeholder', 'hall_warden', null, 1),
  ('Mr Sani Garba', 'sani.garba@example.com', 'placeholder', 'maintenance_officer', 'plumbing', null),
  ('Mr Kunle Adebayo', 'kunle.adebayo@example.com', 'placeholder', 'maintenance_officer', 'electrical', null),
  ('Dr Grace Nwosu', 'grace.nwosu@example.com', 'placeholder', 'admin', null, null);

-- Six students hold a bed. Bola and Chidi had a bed before: those allocations have ended.
insert into allocations (student_id, bed_space_id, status) values
  (1, 1, 'active'),
  (3, 3, 'active'),
  (2, 5, 'active'),
  (4, 6, 'active'),
  (6, 7, 'active'),
  (5, 9, 'active'),
  (7, 2, 'ended'),
  (2, 8, 'ended');

-- Complaints. The deadline is 24 hours after created_at for urgent, 72 hours for normal, 7 days for low.
insert into complaints
  (student_id, room_id, description, category, urgency, status, escalation_level, created_at, deadline, resolved_at)
values
  (1, 1, 'Pipe burst under the sink, water on the floor', 'plumbing', 'urgent', 'Open', 1,
   now() - interval '30 hours', now() - interval '6 hours', null),
  (1, 1, 'Leaking tap in the bathroom', 'plumbing', 'normal', 'Open', 0,
   now() - interval '2 days', now() + interval '1 day', null),
  (1, 1, 'Leaking shower head', 'plumbing', 'normal', 'Resolved', 0,
   now() - interval '12 days', now() - interval '9 days', now() - interval '12 days' + interval '30 hours'),
  (3, 2, 'Broken bed frame, one leg is cracked', 'carpentry', 'normal', 'In Progress', 0,
   now() - interval '2 days', now() + interval '1 day', null),
  (3, 2, 'Squeaking door in the corridor', 'carpentry', 'low', 'Resolved', 0,
   now() - interval '8 days', now() - interval '1 day', now() - interval '8 days' + interval '96 hours'),
  (1, 1, 'Leaking tap in the shower room', 'plumbing', 'normal', 'Resolved', 0,
   now() - interval '45 days', now() - interval '42 days', now() - interval '45 days' + interval '50 hours'),
  (2, 3, 'Socket sparks when I charge my phone', 'electrical', 'urgent', 'Assigned', 2,
   now() - interval '60 hours', now() - interval '36 hours', null),
  (4, 3, 'Faulty socket near the bed', 'electrical', 'normal', 'Open', 1,
   now() - interval '4 days', now() - interval '1 day', null),
  (2, 3, 'Loose bulb holder, the light flickers', 'electrical', 'normal', 'Resolved', 0,
   now() - interval '10 days', now() - interval '7 days', now() - interval '10 days' + interval '60 hours'),
  (4, 3, 'Socket cover is missing', 'electrical', 'low', 'Open', 0,
   now() - interval '3 days', now() + interval '4 days', null),
  (6, 4, 'Blocked drain in the bathroom', 'sanitation', 'normal', 'Open', 1,
   now() - interval '5 days', now() - interval '2 days', null),
  (6, 4, 'Pipe burst in the bathroom', 'plumbing', 'urgent', 'Resolved', 0,
   now() - interval '9 days', now() - interval '8 days', now() - interval '9 days' + interval '10 hours'),
  (6, 4, 'Leaking tap in the bathroom', 'plumbing', 'normal', 'Resolved', 0,
   now() - interval '20 days', now() - interval '17 days', now() - interval '20 days' + interval '40 hours'),
  (6, 4, 'Leaking tap in the shower', 'plumbing', 'normal', 'Resolved', 0,
   now() - interval '40 days', now() - interval '37 days', now() - interval '40 days' + interval '80 hours'),
  (5, 5, 'Door lock is broken', 'carpentry', 'urgent', 'Resolved', 0,
   now() - interval '15 days', now() - interval '14 days', now() - interval '15 days' + interval '6 hours'),
  (5, 5, 'Cracked window pane', 'carpentry', 'normal', 'Resolved', 0,
   now() - interval '6 days', now() - interval '3 days', now() - interval '6 days' + interval '70 hours');

insert into complaint_history (complaint_id, event, actor_id) values
  (1, 'Lodged and triaged as urgent plumbing', 1),
  (1, 'Escalated to level 1: hall warden emailed', null),
  (7, 'Lodged and triaged as urgent electrical', 2),
  (7, 'Status changed to Assigned', 10);
```

# --help--

## --hint--

Each report is one `select` statement. The tests read your statements in order, so keep each one under its own comment.

## --hint--

Look back at the lesson on joins and reports. `join` follows foreign keys, and `left join` keeps the rows that have no match. `count(x)` counts only the rows where `x` is not empty. `where` filters rows before they are grouped, and `having` filters groups after.

## --hint--

When a number looks wrong, run your query on its own and read the rows. A hostel that is missing usually needs a `left join`. A count that is too big usually counts rows it should have left out.
