# --screen-- concept

A **REST API** is organised around *resources*: complaints, allocations, rooms. The path names the resource, and the method says what to do with it. `GET /api/complaints` reads the complaints. `POST /api/complaints` adds one.

## --callout-- info

Every IHMS path starts with `/api`, so the API is easy to tell apart from the pages.

# --screen-- concept

The IHMS API, part 1: logging in and bed spaces. F1 to F4 are the four flows of the architecture.

| Method | Path | Who | Does | Flow |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | Everyone | Log in; returns a token | |
| `GET` | `/api/me` | Everyone | Who am I? | |
| `POST` | `/api/allocations` | Student | Apply for a bed space | F1 |
| `GET` | `/api/allocations/me` | Student | My bed space | F1 |

# --screen-- concept

Part 2: complaints.

| Method | Path | Who | Does | Flow |
|---|---|---|---|---|
| `POST` | `/api/complaints` | Student | Lodge a complaint | F2 |
| `GET` | `/api/complaints` | Everyone, filtered by role | List complaints; `?status=Open` | F2, F4 |
| `GET` | `/api/complaints/{id}` | Owner or staff | One complaint with its history | F4 |
| `PATCH` | `/api/complaints/{id}/advance` | Maintenance officer | Move to the next status | F4 |

# --screen-- concept

| Method | Path | Who | Does | Flow |
|---|---|---|---|---|
| `PATCH` | `/api/students/{id}/fees-cleared` | Admin | Mark fees cleared | F1 |
| `GET` | `/api/reports/occupancy` | Admin | Occupancy by hostel | F4 |
| `GET` | `/api/reports/overdue.csv` | Admin | Download overdue complaints | F4 |

## --callout-- warning

How fee clearance gets in is one of the six open design decisions. Placeholder: an admin marks it. See <a href="/reference/decisions" target="_blank" rel="noopener">Group decisions</a>.

# --screen-- match

## --prompt--

Match each request to what it does.

## --pairs--

- `POST /api/auth/login`
  - Log in and get a token
- `GET /api/me`
  - Who am I?
- `POST /api/allocations`
  - Apply for a bed space
- `GET /api/complaints/{id}`
  - One complaint with its history
- `PATCH /api/complaints/{id}/advance`
  - Move a complaint to the next status
- `GET /api/reports/overdue.csv`
  - Download overdue complaints

## --why--

The method says the kind of action and the path says which resource. `{id}` stands for the number of one complaint, such as `7`.

# --screen-- mcq

## --question--

Which endpoint lodges a complaint?

## --options--

- [x] `POST /api/complaints`
  > Yes. `POST` creates something, and `/api/complaints` is the resource.
- [ ] `GET /api/complaints`
  > No. `GET` reads the list of complaints. It does not add one.
- [ ] `POST /api/complaints/{id}/advance`
  > No. The advance endpoint moves an existing complaint to its next status, and it uses `PATCH`.
- [ ] `PATCH /api/complaints`
  > No. `PATCH` changes part of something that already exists. A new complaint does not exist yet.

## --why--

Creating a complaint is `POST` on the complaints resource.

# --screen-- order

## --prompt--

A new student uses the IHMS for the first time. Put the requests in the order the student sends them.

## --items--

- `POST /api/auth/login`
- `POST /api/allocations`
- `GET /api/allocations/me`
- `POST /api/complaints`

## --why--

The student logs in first. Then they apply for a bed space and check it. A complaint is about a room, so it comes after the student has a bed space.

# --screen-- mcq

## --question--

A hall warden wants to see only the open complaints. Which request is it?

## --options--

- [ ] `GET /api/complaints/open`
  > No. A path with a word in the last place would look for one complaint called `open`. The IDs in this API are numbers.
- [x] `GET /api/complaints?status=Open`
  > Yes. The query `?status=Open` filters the list, and the server also limits it to what a warden may see.
- [ ] `POST /api/complaints?status=Open`
  > No. `POST` creates a complaint. Reading a list is `GET`.
- [ ] `PATCH /api/complaints/status`
  > No. `PATCH` changes a complaint. A warden who only wants to look uses `GET`.

## --why--

Reading is `GET`. A filter is an extra option, so it goes in the query after the `?`.

# --screen-- tapbuild

## --prompt--

Build the request a maintenance officer sends to move complaint 7 to its next status.

## --template--

```text
___ /api/complaints/7/___
```

## --tokens--

- `PATCH`
- `POST`
- `GET`
- `advance`
- `status`
- `in-progress`

## --answer--

- `PATCH`
- `advance`

## --why--

`PATCH` changes part of an existing complaint. `advance` moves it one step along: Open, Assigned, In Progress, Resolved. The server picks the next status, so the path does not name it.

# --screen-- concept

Not every flow has an endpoint. F3, overdue escalation, has none. No user starts it. The scheduler, a timer that runs inside the server, checks for overdue complaints by itself.

# --screen-- mcq

## --question--

Why does F3 have no endpoint?

## --options--

- [x] No user starts it; a timer inside the server does
  > Yes. The scheduler runs the check on its own, so nobody needs an address to call.
- [ ] It was forgotten
  > No. Leaving it out is deliberate. Nothing outside the server needs to start the escalation.
- [ ] The Student Portal calls it directly
  > No. The portal talks to the endpoints in the table. Escalation is not one of them.
- [ ] Only admins may call it
  > No. If it were an admin action, it would have an endpoint. It has none.

## --why--

An endpoint exists so that someone outside the server can ask for something. Escalation needs no one to ask.

# --screen-- match

## --prompt--

Match each endpoint to the role that uses it.

## --pairs--

- `POST /api/allocations`
  - Student
- `PATCH /api/complaints/{id}/advance`
  - Maintenance officer
- `GET /api/reports/occupancy`
  - Admin
- `GET /api/me`
  - Everyone

## --why--

Most endpoints belong to one role. `/api/me` and the login are for everyone, because every user needs to log in and see who they are.

# --screen-- predict

## --code--

```text
PATCH /api/students/5/fees-cleared
Authorization: Bearer <a student's token>
```

## --question--

A student sends this request to clear their own fees. In the placeholder design, only an admin may do this. Which status code comes back?

## --options--

- [x] 403
  > Yes. The server knows who the student is, and a student may not use an admin endpoint.
- [ ] 401
  > No. 401 means no valid token. This student sent one.
- [ ] 200
  > No. 200 would mean the fees were cleared. The server must refuse, or any student could clear their own fees.
- [ ] 404
  > No. The endpoint exists. The student is not allowed to use it.

## --why--

A logged-in user calling an endpoint for another role gets 403, whatever the endpoint does.
