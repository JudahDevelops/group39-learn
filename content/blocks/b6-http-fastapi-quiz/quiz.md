---
draw: 15
pass: 12
---

## --question--

### --text--

Which part of the URL `http://127.0.0.1:8000/api/complaints?status=Open` is the query?

### --distractors--

- `/api/complaints`
- `8000`
- `http`

### --answer--

`?status=Open`

### --explanation--

The query starts with `?` and holds extra options. `/api/complaints` is the path, `8000` is the port and `http` is the scheme.

## --question--

### --text--

A request is meant to lodge a new complaint. Which method does it use?

### --distractors--

- `GET`
- `PATCH`
- `DELETE`

### --answer--

`POST`

### --explanation--

`POST` sends data so that the server creates something. `GET` only reads, `PATCH` changes part of something that already exists, and `DELETE` removes something.

## --question--

### --text--

A student who is logged in calls an admin-only endpoint. Which status code does the server send?

### --distractors--

- 401
- 404
- 409

### --answer--

403

### --explanation--

403 means the server knows who you are and you may not do this. 401 would mean it does not know who you are, and 404 would mean nothing exists at that address.

## --question--

### --text--

A request to a protected endpoint carries no token. Which status code does the server send?

### --distractors--

- 403
- 400
- 422

### --answer--

401

### --explanation--

401 means the server does not know who you are, for example when there is no token or it has expired. 403 is for someone who is known but not allowed.

## --question--

### --text--

A student whose fees are not cleared applies for a bed space. Which status code does the IHMS send?

### --distractors--

- 401
- 409
- 422

### --answer--

400

### --explanation--

The IHMS uses 400 when fees are not cleared. 409 is for a clash with the current state, such as no vacant bed or a bed that is already allocated, and 422 is for data that does not fit the model.

## --question--

### --text--

No vacant bed space matches a student's gender and level. Which status code does the IHMS send?

### --distractors--

- 400
- 403
- 404

### --answer--

409

### --explanation--

409 means the request clashes with the current state of the system, here the lack of a matching vacancy. 400 is used for fees that are not cleared.

## --question--

### --text--

Which header says that the body of a request is JSON?

### --distractors--

- `Authorization: Bearer <token>`
- `Method: POST`
- `Status: 201`

### --answer--

`Content-Type: application/json`

### --explanation--

`Content-Type` names the kind of data in the body. `Authorization` says who is logged in, the method is the first word of the request, and a status code belongs to a response.

## --question--

### --text--

Why does the IHMS have no endpoint for F3, overdue escalation?

### --distractors--

- It was forgotten
- The browser runs it every 15 minutes
- Hall wardens start it by hand

### --answer--

No user starts it; a timer inside the server does

### --explanation--

Escalation is not something a user asks for. The scheduler runs inside the server and checks for overdue complaints itself.

## --question--

### --text--

A hall warden wants only the open complaints. Which request is it?

### --distractors--

- `GET /api/complaints/open`
- `POST /api/complaints?status=Open`
- `PATCH /api/complaints/status`

### --answer--

`GET /api/complaints?status=Open`

### --explanation--

The query `?status=Open` filters the list, and reading a list is `GET`. A word in the last place of the path would look for one complaint called `open`, and `POST` creates.

## --question--

### --text--

Which endpoint moves a complaint to its next status?

### --distractors--

- `POST /api/complaints`
- `GET /api/complaints/{id}`
- `DELETE /api/complaints/{id}`

### --answer--

`PATCH /api/complaints/{id}/advance`

### --explanation--

`PATCH` changes part of something that exists, and `advance` names the change. `POST` lodges a new complaint, `GET` only reads and `DELETE` removes.

## --question--

### --text--

What does `@app.get("/api/health")` do?

### --distractors--

- Fetches a web page from `/api/health`
- Creates the app
- Sends a GET request each time you save the file

### --answer--

Runs the function below it for GET requests to that path

### --explanation--

A decorator sits on top of a function and tells FastAPI when to run it. It does not send any request itself, and the app is made by `FastAPI(...)`.

## --question--

### --text--

What does `fastapi dev main.py` do?

### --distractors--

- Installs FastAPI
- Deploys the app to the internet
- Opens `/docs` and nothing else

### --answer--

Runs the app and restarts it whenever you save

### --explanation--

It starts the server on your laptop and reloads it after every save. Stop it with Ctrl+C. Installing is done with `pip`.

## --question--

### --text--

A request goes to `/api/complaints/abc`, and the route has `complaint_id: int`. What does FastAPI reply?

### --distractors--

- 404, because there is no complaint called abc
- 200 with an empty reply
- 500, because Python crashes

### --answer--

422, before your function runs

### --explanation--

The type hint `int` makes FastAPI check the path, and `abc` is not a whole number, so it replies 422 for you. Your function never starts.

## --question--

### --text--

In `GET /api/complaints?status=Open`, what is `status`?

### --distractors--

- A path parameter
- A header
- A request body

### --answer--

A query parameter

### --explanation--

`status` is not in the path, so it is a query parameter. A path parameter is written in braces in the path, like `{complaint_id}`.

## --question--

### --text--

What does `raise HTTPException(status_code=404, detail="Complaint not found")` do?

### --distractors--

- Prints a message and carries on with the next line
- Returns the complaint with 404 inside it
- Restarts the server

### --answer--

Stops the function and sends a 404 error response

### --explanation--

`raise` stops the function at once, and FastAPI turns the exception into an error reply with that status code and detail.

## --question--

### --text--

`def list_complaints(status: str | None = None)` is called with no `?status=` in the URL. What is `status`?

### --distractors--

- `"Open"`
- An empty string
- FastAPI replies 422

### --answer--

`None`

### --explanation--

The default `= None` makes the parameter optional, so when the client leaves it out the function gets `None`. That is the signal to return every complaint.

## --question--

### --text--

What happens when the description is too short for `ComplaintIn`?

### --distractors--

- Your function crashes
- FastAPI saves the complaint and warns you
- FastAPI replies 404

### --answer--

FastAPI replies 422 before your function runs

### --explanation--

The model is a gate: only a body that fits it reaches your function. A short description fails `min_length=10`, so the reply is 422.

## --question--

### --text--

What does `response_model=ComplaintOut` do?

### --distractors--

- Checks the request body
- Sets the status code
- Saves the reply in the database

### --answer--

Controls which fields are sent back

### --explanation--

It shapes the reply to match the model, so a field the model does not have, such as `history`, is left out. The request is checked by the model on the function's argument.

## --question--

### --text--

A body has a good `description` and an extra key `room_id`, which `ComplaintIn` does not have. What does FastAPI do?

### --distractors--

- Refuses it with 422
- Saves `room_id` in the complaint
- Replies 400

### --answer--

Accepts the body and ignores `room_id`

### --explanation--

FastAPI checks the fields the model has. Keys it does not have are ignored, which is why a student cannot choose the room of a complaint.

## --question--

### --text--

`triage_urgency(description) or "normal"` is run on a description with no keyword. What value comes out?

### --distractors--

- `None`
- `"low"`
- An error

### --answer--

`"normal"`

### --explanation--

`triage_urgency` returns `None` when nothing matches, and `x or "normal"` replaces `None` with `"normal"`. That is a placeholder until the group decides, because it is one of the six open design decisions.

## --question--

### --text--

Why is the frontend mounted after all the `/api` routes?

### --distractors--

- Files must load last
- A mount is slower than a route
- FastAPI allows only one mount per file

### --answer--

The mount answers every path the routes above it did not

### --explanation--

A mount on `/` matches every path. If it came first, it would answer `/api/...` requests with a file that does not exist.

## --question--

### --text--

What does `JSON.stringify({ description })` do?

### --distractors--

- Reads JSON from the server
- Sends the request
- Checks the length of the description

### --answer--

Turns the object into JSON text for the request body

### --explanation--

`fetch` sends text, so the object must become JSON text first. Reading the reply is done with `response.json()`.

## --question--

### --text--

`main.py` includes a router with `prefix="/api"`. The router has `prefix="/complaints"` and a route with the path `/{complaint_id}`. What is the full path?

### --distractors--

- `/complaints/{complaint_id}`
- `/api/{complaint_id}`
- `/{complaint_id}`

### --answer--

`/api/complaints/{complaint_id}`

### --explanation--

The prefixes are put in front of the route's path in order: first the one from `include_router`, then the router's own. Leaving one out gives the other wrong answers.

## --question--

### --text--

In the Complaints API, how is the `deadline` of a new complaint worked out?

### --distractors--

- The id times 24 hours
- Always 72 hours
- The time a warden first opens it

### --answer--

The time it was lodged plus the hours for its urgency

### --explanation--

The deadline is `now` plus `timedelta(hours=...)`, with the hours from `triage`: 24 for urgent, 72 for normal and 168 (7 days) for low.

## --question--

### --text--

The squeaking door keeps me awake. Which category and deadline does the Complaints API give this complaint?

### --distractors--

- `carpentry`, 24 hours
- `other`, 72 hours
- `plumbing`, 7 days

### --answer--

`carpentry`, 7 days

### --explanation--

`door` is a carpentry keyword and `squeaking door` makes the urgency `low`, which has a deadline of 7 days (168 hours). The other answers mix up the category or the urgency.

## --question--

### --text--

Why does the Complaints API take `deadline` and `created_at` from the same `now`?

### --distractors--

- So Python can compare them
- Because `datetime.now()` can only be called once
- So every complaint gets the same deadline

### --answer--

So the gap between them is exactly the length of the deadline

### --explanation--

Later chapters work out how long a complaint has been open compared with its deadline. Two separate calls to `datetime.now()` would be a few microseconds apart.

## --question--

### --text--

A complaint is already `Resolved`. What does `PATCH /api/complaints/{id}/advance` reply?

### --distractors--

- 404
- 400
- 200 with the same complaint

### --answer--

409

### --explanation--

The complaint exists, so it is not a 404. The request clashes with its current state, because a resolved complaint has no next status, and that is what 409 means.

## --question--

### --text--

What does `sorted(complaints, key=by_deadline)` give?

### --distractors--

- The newest id first
- The descriptions in alphabetical order
- The same order as they were lodged

### --answer--

The complaints with the one due first at the front

### --explanation--

`key=` tells `sorted` what to compare, and `by_deadline` returns each complaint's deadline, so the earliest deadline comes first.

## --question--

### --text--

The Complaints API keeps complaints in a Python list. What happens to them when the app restarts?

### --distractors--

- They are saved in PostgreSQL automatically
- They are kept in the browser
- They stay, because the ids are saved

### --answer--

They are gone; the list starts empty again

### --explanation--

A list lives in the memory of the running program. Keeping data after a restart needs a database, which a later chapter adds.

## --question--

### --text--

A hostel has 4 bed spaces and no allocations. What does the occupancy report show for it?

### --distractors--

- Nothing: the hostel is left out
- `beds` 0 and `occupied` 0
- A 404 error

### --answer--

The hostel, with `beds` 4 and `occupied` 0

### --explanation--

Every hostel appears in the report. A hostel with no allocations counts none of its beds as occupied, which is `0`.

## --question--

### --text--

In the occupancy report, does an allocation with the status `ended` count in `occupied`?

### --distractors--

- Yes, every allocation counts
- Only if it is the newest one
- Only for the first hostel

### --answer--

No; only `active` allocations count

### --explanation--

An ended allocation means the student has left the bed, so the bed is free again. The report counts allocations whose status is `active`.

## --question--

### --text--

To build the occupancy report from lists, which chain of ids do you follow for one hostel?

### --distractors--

- Its users, then their complaints, then their rooms
- Its allocations, then their rooms, then their bed spaces
- Its bed spaces, then its hostels, then its rooms

### --answer--

Its rooms, then the bed spaces in those rooms, then the allocations on those bed spaces

### --explanation--

A room points to its hostel with `hostel_id`, a bed space points to its room with `room_id`, and an allocation points to its bed space with `bed_space_id`. You follow the pointers from the hostel down.
