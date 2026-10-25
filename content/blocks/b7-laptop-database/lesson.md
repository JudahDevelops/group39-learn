# --screen-- concept

Everything so far ran in your browser, and the database was rebuilt on every Run. The real IHMS database lives on your laptop, in the PostgreSQL you installed. It keeps its tables and rows until you delete them, and later in this chapter FastAPI connects to it.

## --callout-- info

This database is on your laptop only. Nothing you do here touches the university or anyone else's data.

# --screen-- concept

Open pgAdmin and connect to your PostgreSQL server. It asks for the `postgres` password you chose at install. In the left panel, right-click **Databases**, choose **Create**, then **Database**, and name it `ihms`. Save it. Then right-click `ihms` and choose **Query Tool**.

## --callout-- tip

The Query Tool is a text box for SQL. The Execute button, a triangle in its toolbar, runs what you typed.

# --screen-- concept

This is the whole IHMS schema: the seven tables and two indexes you wrote in the workshop. Press Run to build it in your browser. Then select all the code, copy it, paste it into the Query Tool on `ihms`, and press Execute.

::: tryit sql
```sql file=query.sql
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
```
:::

## --callout-- warning

Run it once on `ihms`. A second run stops with an error, because the tables already exist.

# --screen-- checklist

## --items--

- Create the database `ihms` in pgAdmin and open the Query Tool on it. Run the command below and paste what it shows.
  - command: `select current_database();`
  - pattern: `\bihms\b`
  - hint: The result should be `ihms`. If it says `postgres`, the Query Tool is open on the wrong database. In the left panel, right-click `ihms` and choose Query Tool.

# --screen-- checklist

## --items--

- Paste the schema into the Query Tool on `ihms` and press Execute. Then run the command below and paste the list of tables.
  - command: `select table_name from information_schema.tables where table_schema = 'public' order by table_name;`
  - pattern: `^(?=[\s\S]*\ballocations\b)(?=[\s\S]*\bbed_spaces\b)(?=[\s\S]*\bcomplaint_history\b)(?=[\s\S]*\bcomplaints\b)(?=[\s\S]*\bhostels\b)(?=[\s\S]*\brooms\b)(?=[\s\S]*\busers\b)`
  - hint: The list should hold seven tables, from `allocations` to `users`. If one is missing, read the error in the Messages tab and tell the group what it says.
- Run the command below and paste the two indexes. They are the rules that stop double allocation.
  - command: `select indexname from pg_indexes where schemaname = 'public' and indexname like 'one_active%' order by indexname;`
  - pattern: `^(?=[\s\S]*\bone_active_allocation_per_bed\b)(?=[\s\S]*\bone_active_allocation_per_student\b)`
  - hint: You should see `one_active_allocation_per_bed` and `one_active_allocation_per_student`. If they are missing, the schema stopped before it reached them. Read the error in the Messages tab and tell the group what it says.
- In the left panel, open `ihms`, then Schemas, then public, then Tables. If the list is empty, right-click Tables and choose Refresh. All seven tables should be there.
