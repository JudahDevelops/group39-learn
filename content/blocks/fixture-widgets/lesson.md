# --screen-- widget

## --prompt--

Step through what happens when a student submits a complaint.

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

# --screen-- widget

## --prompt--

Put each part of the IHMS in its tier.

## --widget-- tier-sorter

```json
{
  "tiers": ["Client", "Logic", "Data", "Output"],
  "cards": [
    { "text": "Student Portal", "tier": "Client" },
    { "text": "Staff Dashboard", "tier": "Client" },
    { "text": "Room Allocation", "tier": "Logic" },
    { "text": "★ Complaint Triage and Escalation Engine", "tier": "Logic" },
    { "text": "Complaint history and audit log", "tier": "Data" },
    { "text": "Tables for users, hostels, rooms, bed spaces, allocations and complaints", "tier": "Data" },
    { "text": "Email Notification Service", "tier": "Output" },
    { "text": "Report Export", "tier": "Output" }
  ]
}
```

## --why--

The client tier is the web pages. The logic tier is the FastAPI server. The data tier is PostgreSQL. The output tier sends email and produces reports.

# --screen-- widget

## --prompt--

Follow flow F2. For each step, tap the tier that handles it.

## --widget-- data-flow-tracer

```json
{
  "title": "F2 Complaint triage",
  "tiers": ["Client", "Logic", "Data", "Output"],
  "steps": [
    {
      "text": "Amina, in room B-214, types \"water dripping from the ceiling onto the socket\" into the Student Portal and presses Submit.",
      "tier": "Client"
    },
    {
      "text": "The portal sends the complaint to the server.",
      "tier": "Client"
    },
    {
      "text": "Complaint Management checks she's logged in as a student and finds her room from her allocation.",
      "tier": "Logic"
    },
    {
      "text": "The ★ engine reads the description, sets category plumbing and urgency urgent, and a deadline 24 hours away.",
      "tier": "Logic"
    },
    {
      "text": "The complaint and a history entry are saved in PostgreSQL.",
      "tier": "Data"
    },
    {
      "text": "The Email Notification Service emails the plumbing unit's maintenance officer.",
      "tier": "Output"
    },
    {
      "text": "Amina sees \"Received. Urgent. Deadline: tomorrow, 10:00.\"",
      "tier": "Client"
    }
  ]
}
```

## --why--

Requests travel down through the tiers and results come back up.

# --screen-- widget

## --prompt--

Slide the time a normal complaint has been open and watch the escalation level change.

## --widget-- escalation-slider

```json
{ "deadlineHours": 72, "maxHours": 216 }
```

## --why--

The level L is 0 before the deadline d, 1 from d until 2d, and 2 from 2d on.

# --screen-- widget

## --widget-- escalation-slider

```json
{ "deadlineHours": 72, "maxHours": 216, "target": 1 }
```

## --why--

The hall warden is emailed as soon as t reaches the deadline d. For a normal complaint that is 72 hours.

# --screen-- order

## --prompt--

Put the lecturer's 15 steps in order.

## --items--

- Understand the topic
- Three research questions
- Search Consensus
- Study the research
- Export the CSV
- Upload to AI
- Identify gaps
- Define the value-add
- Problem statement
- Aim and three objectives
- Design the architecture
- Explain every component
- Write the Word document
- Build the slide deck
- Defend the project

## --why--

Research comes first, then the project is defined, the architecture is designed, the documents are written and the project is defended.

# --screen-- match

## --prompt--

Match each part of the stack to its technology.

## --pairs--

- Frontend
  - HTML, CSS, JavaScript (Fetch API)
- Backend
  - FastAPI (Python) with Pydantic
- Database
  - PostgreSQL with SQLAlchemy
- Scheduling
  - APScheduler
- Notifications
  - SMTP email
- Security
  - bcrypt password hashing, JSON Web Tokens
- Triage (optional)
  - TypeSafe Jev API

## --why--

Each part of the stack has one technology, and each choice needs a reason.
