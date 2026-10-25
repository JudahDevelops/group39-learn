---
draw: 15
pass: 12
---

## --question--

### --text--

What is a primary key?

### --distractors--

- The first column of a table
- A password that protects the table
- A column that points to another table

### --answer--

A column that uniquely identifies each row

### --explanation--

No two rows in a table share a primary key value, so other tables can name exactly one row. `id` is usually the first column, but that is not what makes it the key. A column that points to another table is a foreign key.

## --question--

### --text--

What does `rooms.hostel_id` point to?

### --distractors--

- The number of rooms in the hostel
- A row in `bed_spaces`
- The name of the hostel

### --answer--

A row in `hostels`

### --explanation--

A column that ends in `_id` is a foreign key. It holds the `id` of a row in the table named by the column, here `hostels`. The name of the hostel lives in `hostels.name`, not in `rooms`.

## --question--

### --text--

Which tables do you follow, in order, to find who sleeps in bed 2 of room B-214?

### --distractors--

- `hostels`, then `complaints`, then `users`
- `users`, then `complaints`, then `rooms`
- `rooms`, then `hostels`, then `users`

### --answer--

`rooms`, then `bed_spaces`, then `allocations`, then `users`

### --explanation--

Each step follows a foreign key: `bed_spaces.room_id` leads from the room to its beds, `allocations.bed_space_id` leads from a bed to the allocation, and `allocations.student_id` leads to the student in `users`.

## --question--

### --text--

Why does `complaints` store `room_id` rather than the room number as text?

### --distractors--

- A `complaints` table cannot hold text, so room numbers must be stored as numbers
- Room numbers such as `B-214` are not allowed in a database, because they contain a letter
- Every complaint must be about a different room, so each needs its own id

### --answer--

`room_id` points to one row in `rooms`, so the room's details are kept in one place

### --explanation--

A foreign key keeps one copy of each fact. The complaint holds only the pointer, and the number, the hostel and everything else about the room stay in `rooms`. Many complaints can point to the same room.

## --question--

### --text--

What does `complaints.escalation_level` remember?

### --distractors--

- How many times the complaint was edited
- The urgency the student chose
- The level of the student who lodged it

### --answer--

The last escalation level that was emailed

### --explanation--

Without it, the hall warden would be emailed again every time the scheduler runs, which is every 15 minutes. It is not in the paper's tables, but the escalation job needs it.

## --question--

### --text--

Which table would you read to find when a complaint was escalated?

### --distractors--

- `allocations`
- `bed_spaces`
- `hostels`

### --answer--

`complaint_history`

### --explanation--

A row of `complaint_history` is one thing that happened to a complaint, with the `event` and the time `at`. The other tables describe beds, hostels and allocations, not what happened to a complaint.

## --question--

### --text--

What does `references hostels(id)` guarantee?

### --distractors--

- Every hostel has at least one room
- Every hostel has a different name
- Every room has a different number

### --answer--

Every room points to a hostel that exists

### --explanation--

`references` makes a foreign key. PostgreSQL refuses a room whose `hostel_id` is not the `id` of a real hostel. A hostel with no rooms is still allowed, and a different name for each hostel is the job of `unique`.

## --question--

### --text--

Which type stores a complaint's deadline?

### --distractors--

- `text`
- `integer`
- `boolean`

### --answer--

`timestamptz`

### --explanation--

A deadline is a moment in time, and `timestamptz` stores a moment with its time zone. PostgreSQL can compare it with `now()` and add hours to it, which it cannot do with text.

## --question--

### --text--

What does `generated always as identity primary key` do to the `id` column?

### --distractors--

- It lets you choose any `id` you like when you insert a row
- It copies the `id` from another table
- It makes the column hold text

### --answer--

PostgreSQL numbers the rows for you

### --explanation--

With `generated always`, only PostgreSQL gives out ids, and you leave `id` out of an `insert`. If you type an id yourself, PostgreSQL refuses with `cannot insert a non-DEFAULT value into column "id"`.

## --question--

### --text--

Why must you create `hostels` before `rooms`?

### --distractors--

- `rooms` has more columns than `hostels`, so it has to come second
- `hostels` has a `unique` rule and `rooms` does not
- PostgreSQL always runs the statements from the shortest to the longest

### --answer--

A foreign key can only point at a table that already exists

### --explanation--

`rooms.hostel_id` references `hostels(id)`, so `hostels` must exist when `rooms` is created. The IHMS schema goes from the tables that point at nothing to the tables that point at them.

## --question--

### --text--

What does `unique (hostel_id, number)` on the `rooms` table refuse?

### --distractors--

- Two hostels with the same name
- A room without a hostel
- Two rooms with the same number in different hostels

### --answer--

Two rooms with the same number in one hostel

### --explanation--

The rule is about the two columns together. The same `number` may appear in different hostels, but never twice inside one hostel. A repeated hostel name is the job of `unique` on `hostels.name`.

## --question--

### --text--

PostgreSQL says `syntax error at or near "number"` for a `create table rooms` statement. The line just above `number` ends with `references hostels(id)` and nothing else. What is the likely cause?

### --distractors--

- `number` is not a valid column name
- The line above needs a semicolon
- `references` must come before the column type

### --answer--

A comma is missing at the end of the line above

### --explanation--

Each column in a `create table` is separated from the next by a comma. PostgreSQL meets `number` where it expects a comma, so it complains about `number`. When an error points at a word, look at the end of the line before it.

## --question--

### --text--

In pgAdmin, how do you create the `ihms` database?

### --distractors--

- Right-click Tables, then choose Create, then Database, and name it `ihms`
- Open the Query Tool, press F1, and name the database `ihms`
- Right-click the `postgres` user, choose Rename, and type `ihms`

### --answer--

Right-click Databases, then Create, then Database, and name it `ihms`

### --explanation--

A database is made under Databases in the left panel. After you save it, you right-click `ihms` and open the Query Tool on it, so that your SQL runs in the right database.

## --question--

### --text--

You ran the schema in pgAdmin on your laptop. What shows that it worked?

### --distractors--

- The Query Tool shows the word `ihms` at the top of its window
- pgAdmin asks for the `postgres` password again when you press Execute
- A file called `schema.sql` appears on your desktop after the script finishes

### --answer--

pgAdmin lists all seven tables under `ihms`, then Schemas, then public, then Tables

### --explanation--

Seven tables mean every `create table` ran: `hostels`, `rooms`, `bed_spaces`, `users`, `allocations`, `complaints` and `complaint_history`. If the list is empty, right-click Tables and choose Refresh.

## --question--

### --text--

What happens with `update complaints set status = 'Resolved';` and no `where`?

### --distractors--

- Nothing; it is an error
- Only the first complaint becomes Resolved
- Only the Open complaints become Resolved

### --answer--

Every complaint becomes Resolved

### --explanation--

`update` changes every row that the `where` keeps, and with no `where` it keeps all of them. Write the `where` of an `update` or `delete` first. `delete from complaints;` with no `where` removes every complaint.

## --question--

### --text--

Which keyword sorts the rows of a result?

### --distractors--

- `sort by`
- `group by`
- `limit`

### --answer--

`order by`

### --explanation--

`order by deadline` sorts by the deadline, and `desc` reverses the order. `sort by` is not PostgreSQL, `group by` makes totals, and `limit` only stops after some rows.

## --question--

### --text--

Which query lists only the names of the female hostels?

### --distractors--

- `select name from hostels where gender = "female";`
- `select name from hostels where gender == 'female';`
- `select * from hostels;`

### --answer--

`select name from hostels where gender = 'female';`

### --explanation--

`select` chooses the columns, `from` names the table and `where` chooses the rows. Text goes in single quotes, because double quotes name a column. SQL compares with a single `=`.

## --question--

### --text--

Why does the occupancy query use `left join` for `allocations`?

### --distractors--

- It is faster than `join`
- It sorts the beds by hostel
- It removes ended allocations

### --answer--

To keep empty beds in the count

### --explanation--

A bed with no active allocation has no match. A plain `join` would drop it, and the total of beds would be too small. `left join` keeps it, and `count(a.id)` counts only the beds that have an allocation. The condition `a.status = 'active'` is what leaves out ended ones.

## --question--

### --text--

What is the difference between `where` and `having`?

### --distractors--

- None; they are two spellings of the same thing
- `where` works on numbers and `having` works on text
- `having` runs before `group by`

### --answer--

`where` filters rows; `having` filters groups after `group by`

### --explanation--

`where` runs first, on single rows. `having` runs after the groups are made, so it can use `count(*)`, as in `having count(*) >= 3`.

## --question--

### --text--

Which condition finds the overdue complaints?

### --distractors--

- `status = 'Resolved' and deadline < now()`
- `status <> 'Resolved' and deadline > now()`
- `deadline < now()` alone

### --answer--

`status <> 'Resolved' and deadline < now()`

### --explanation--

A complaint is overdue when it is not resolved and its deadline has passed. Without the status test, resolved complaints whose deadline passed long ago would be counted too.

## --question--

### --text--

Which expression gives the time a resolved complaint took to resolve?

### --distractors--

- `created_at - resolved_at`
- `deadline - created_at`
- `now() - deadline`

### --answer--

`resolved_at - created_at`

### --explanation--

Taking one moment from another gives a length of time. The later moment, `resolved_at`, comes first. `avg(resolved_at - created_at)` is the average time to resolve.

## --question--

### --text--

What is a recurring fault in the Reporting module?

### --distractors--

- Any complaint that is still open after its deadline has passed twice
- Two or more complaints from the same student about different rooms
- Three or more complaints in one hostel on the same day

### --answer--

Three or more complaints of the same category in one room within 30 days

### --explanation--

The query groups the recent complaints by `room_id` and `category`, then keeps the groups with `having count(*) >= 3`. The `where created_at >= now() - interval '30 days'` is what limits it to 30 days.

## --question--

### --text--

A query joins `hostels`, `rooms` and `bed_spaces`, then does `left join allocations a on a.bed_space_id = b.id and a.status = 'active'`. What does `count(a.id)` count?

### --distractors--

- Every bed, whether or not it has an allocation
- Every allocation ever made, ended or not
- The hostels that have a room

### --answer--

The beds that have an active allocation

### --explanation--

For a bed with no active allocation the `left join` leaves `a.id` empty, and `count(a.id)` skips empty values. `count(b.id)` counts all the beds, and the difference is the free beds.

## --question--

### --text--

What deadline does a complaint with the urgency `normal` get?

### --distractors--

- 24 hours
- 7 days
- 48 hours

### --answer--

72 hours

### --explanation--

Urgent complaints get 24 hours, normal ones 72 hours and low ones 7 days. A complaint is overdue once its deadline has passed and it is not resolved.

## --question--

### --text--

A report must list every hostel, and show 0 for a hostel with no open complaints. Which way of writing it keeps that hostel?

### --distractors--

- A plain `join`, with `where c.status <> 'Resolved'` to keep the open complaints
- A plain `join`, with `limit 10` to stop after ten rows
- A `left join`, with `where c.status <> 'Resolved'` to keep the open complaints

### --answer--

A `left join` with `and c.status <> 'Resolved'` in the `on` condition

### --explanation--

A `where` on a column of the joined table removes the rows that have no match, so the hostel with no open complaints disappears. Putting the status test in the `on` condition keeps the hostel, and `count(c.id)` then gives 0.

## --question--

### --text--

Why is a partial unique index used rather than a plain `unique` on `bed_space_id`?

### --distractors--

- A plain `unique` is slower, and speed matters most for the allocation table
- A partial index can hold more than one bed in each of its rows
- A plain `unique` cannot be put on a foreign key column such as `bed_space_id`

### --answer--

A bed is allocated many times over the years, and only one allocation may be active

### --explanation--

A plain `unique` would let each bed be allocated only once, ever. The partial index adds `where status = 'active'`, so the rule covers the active allocations only, and ended ones stay in the table as history.

## --question--

### --text--

What enforces the one-active-allocation rule if the Python code has a bug?

### --distractors--

- Nothing
- The Student Portal
- The scheduler

### --answer--

The database constraint

### --explanation--

A constraint is checked by the database on every write, whatever program is writing. A bug in the code cannot get a bad row past it. This is the paper's answer to how double allocation is stopped.

## --question--

### --text--

A complaint is inserted with the status `'Closed'`. Which rule refuses it?

### --distractors--

- The foreign key on `room_id`, which checks that the room exists
- The primary key on `id`, which keeps the ids different
- The `not null` on `description`, which needs a description

### --answer--

The check on `status`, which allows only Open, Assigned, In Progress and Resolved

### --explanation--

`Closed` is not one of the four statuses, so the check fails. The foreign key looks at the room, the primary key keeps ids different, and `not null` needs a description.

## --question--

### --text--

Bed 1 already has an active allocation. A second student tries to take bed 1. What does PostgreSQL say?

### --distractors--

- `syntax error at or near "bed_space_id"`
- `relation "allocations" does not exist`
- `new row for relation "hostels" violates check constraint "hostels_gender_check"`

### --answer--

`duplicate key value violates unique constraint "one_active_allocation_per_bed"`

### --explanation--

The partial unique index refuses a second active allocation of the same bed. The other messages are a mistake in the SQL, a missing table and a different rule, on `hostels.gender`.

## --question--

### --text--

The index `one_active_allocation_per_bed` exists, and bed 1 has an active allocation. What happens when you insert a second allocation of bed 1 with the status `'ended'`?

### --distractors--

- It fails with a duplicate key error
- It replaces the first allocation
- It fails because `ended` is not an allowed status

### --answer--

It works, because the index covers only active allocations

### --explanation--

The index looks only at rows where `status = 'active'`, so an ended allocation is left alone. `ended` is one of the two allowed statuses, and an `insert` always adds a row.

## --question--

### --text--

Which values can `complaints.status` hold?

### --distractors--

- `open`, `assigned`, `in progress` and `resolved`, all in small letters
- `Open`, `Closed`, `Pending` and `Done`
- Any text, because the column has no check

### --answer--

`Open`, `Assigned`, `In Progress` and `Resolved`

### --explanation--

The check lists exactly those four, with capital letters. PostgreSQL compares every letter, so `open` in small letters is refused. The column has a check, and it also starts as `Open` by default.

## --question--

### --text--

Which of these is a role the `users` table accepts?

### --distractors--

- `lecturer`
- `warden`
- `porter`

### --answer--

`hall_warden`

### --explanation--

The check on `role` allows `student`, `maintenance_officer`, `hall_warden` and `admin`, spelled exactly like that. `warden` alone is refused, because the text must match.

## --question--

### --text--

Which column of `complaints` has no `check` on its values?

### --distractors--

- `urgency`
- `status`

### --answer--

`category`

### --explanation--

`urgency` must be urgent, normal or low, and `status` must be one of the four statuses. The database does not check `category`: the triage code sets it to plumbing, electrical, carpentry, sanitation or other.

## --question--

### --text--

In `complaint_history`, what is `actor_id`?

### --distractors--

- The `id` of the complaint, which must always have a value
- The time at which the complaint was lodged
- The category of the complaint, such as plumbing

### --answer--

The `id` of the user who did it, and it may be empty

### --explanation--

`actor_id` has a foreign key to `users` but no `not null`, so a history entry can be saved without a user. `complaint_id` is the column that points at the complaint, and it must have a value.
