# --screen-- concept

A web application works like a restaurant. Each part of the restaurant has a partner in the application.

| Restaurant | Web application | In the IHMS |
|---|---|---|
| Customer | The user's browser | A student on their phone |
| Menu | The web page (the **frontend**) | The complaint form |
| Waiter taking the order to the kitchen | An HTTP **request** to an **API** | "Submit complaint" sends the form to the server |

## --callout-- info

HTTP is the language browsers and servers use to talk. The API is the set of addresses the frontend uses to ask the backend for things.

# --screen-- concept

The back of the restaurant does the work.

| Restaurant | Web application | In the IHMS |
|---|---|---|
| Kitchen | The **backend** server, which applies the rules | FastAPI sorts the complaint and sets a deadline |
| Pantry | The **database** | PostgreSQL stores the complaint |
| Waiter bringing the food | The **response** | "Complaint received. Deadline: tomorrow 10:00." |
| Delivery rider | Outside services | The email service alerting the warden |

# --screen-- match

## --prompt--

Match each restaurant part to what it is in the IHMS.

## --pairs--

- Menu
  - The complaint form
- Waiter taking the order to the kitchen
  - "Submit complaint" sends the form to the server
- Kitchen
  - FastAPI sorts the complaint and sets a deadline
- Pantry
  - PostgreSQL stores the complaint
- Waiter bringing the food
  - "Complaint received. Deadline: tomorrow 10:00."
- Delivery rider
  - The email service alerting the warden

## --why--

The front of the restaurant is what the customer sees and the waiter carries. The back is the kitchen, the pantry and the riders. The IHMS has the same parts.

# --screen-- mcq

## --question--

In the restaurant analogy, what is the database?

## --options--

- [ ] The waiter
  > No. The waiter carries the request and the response between the customer and the kitchen. The waiter stores nothing.
- [x] The pantry
  > Yes. The pantry keeps what the kitchen needs, as PostgreSQL keeps every complaint.
- [ ] The menu
  > No. The menu is the web page the user sees, which is the frontend.

## --why--

The kitchen uses the pantry the way the server uses the database. The database is where the IHMS keeps its data.

# --screen-- concept

When a student submits a complaint, the browser sends a **request** to the server. `POST` means "create something". `/api/complaints` is the **endpoint**: the address on the server that handles complaints.

## --code--

```text
POST /api/complaints
{
  "description": "Water is pouring from the ceiling near the light"
}
```

# --screen-- concept

The server replies with a **response**. `201` is a status code that means "created".

The text in braces, here and in the request, is **JSON**: the format apps use to exchange data.

## --code--

```text
201 Created
{
  "id": 482,
  "category": "plumbing",
  "urgency": "urgent",
  "deadline": "2026-10-08T10:00:00+01:00",
  "status": "Open"
}
```

# --screen-- widget

## --prompt--

Step through what happens when a student submits a complaint. Press Next to follow the request down to the database and the response back.

## --widget-- request-response

```json
{
  "request": {
    "method": "POST",
    "path": "/api/complaints",
    "body": { "description": "Water is pouring from the ceiling near the light" }
  },
  "response": {
    "status": 201,
    "statusText": "Created",
    "body": {
      "id": 482,
      "category": "plumbing",
      "urgency": "urgent",
      "deadline": "2026-10-08T10:00:00+01:00",
      "status": "Open"
    }
  },
  "stops": [
    { "label": "The browser sends the form to the server as a request.", "tier": "Browser" },
    { "label": "The server applies the rules: it sorts the complaint and sets a deadline.", "tier": "Server" },
    { "label": "The database stores the complaint.", "tier": "Database" },
    { "label": "The server sends back a response.", "tier": "Server" },
    { "label": "The browser shows the response to the student.", "tier": "Browser" }
  ]
}
```

## --why--

A request goes from the browser to the server, the server uses the database, and the response comes back the same way.

# --screen-- mcq

## --question--

What does `POST /api/complaints` do?

## --options--

- [x] Sends a new complaint to the server
  > Yes. `POST` means "create something", and `/api/complaints` is the address that handles complaints.
- [ ] Deletes all complaints
  > No. `POST` asks the server to create something. It does not delete.
- [ ] Opens the complaints page
  > No. `POST` sends data to the server so that it creates something. It does not open a page.

## --why--

`POST` is what to do, `/api/complaints` is where to do it, and the JSON in braces is the complaint being sent.

# --screen-- mcq

## --question--

What is JSON?

## --options--

- [ ] A database
  > No. A database stores data in tables. JSON is text that apps send to each other.
- [x] A text format for exchanging data
  > Yes. The request and the response both carry their data as JSON.
- [ ] A programming language
  > No. JSON holds data. It does not run anything.

## --why--

JSON is how the browser and the server agree on what the data looks like.

# --screen-- concept

A database is a set of linked spreadsheets. Each table has rows and columns, and each row has an ID. This row is complaint 482:

| id | room_id | category | status |
|---|---|---|---|
| 482 | 37 | plumbing | Open |

`room_id` 37 points to row 37 in the `rooms` table. That link is a **foreign key**.

# --screen-- mcq

## --question--

Complaint 482 has `room_id` 37. What does the 37 do?

## --options--

- [x] It points to row 37 in the `rooms` table.
  > Yes. A column that points to a row in another table is a foreign key.
- [ ] It says the room has 37 bed spaces.
  > No. The 37 is a row ID. It does not count anything.
- [ ] It counts the complaints from that room.
  > No. The 37 does not count complaints. It names the room.
- [ ] It is the ID of the complaint.
  > No. The complaint's own ID is the `id` column, which is 482.

## --why--

A foreign key lets one table point to a row in another by its ID. Here the complaint points to its room.

# --screen-- mcq

## --question--

In the request you followed, which part sorts the complaint and sets the deadline?

## --options--

- [ ] The browser
  > No. The browser sends the form and shows the response.
- [x] The server
  > Yes. The server is the kitchen of the analogy, and it applies the rules.
- [ ] The database
  > No. The database stores the complaint. Sorting it and setting the deadline are the server's rules.

## --why--

The browser asks, the server decides, and the database remembers.

# --screen-- flashcard

## --question--

Explain client, server, API and database using the restaurant analogy.

## --answer--

The browser is the customer and the web page is the menu. A request to the **API** is the waiter taking the order to the kitchen. The **backend** server is the kitchen, where the rules are applied. The **database** is the pantry. The **response** is the waiter bringing the food back.
