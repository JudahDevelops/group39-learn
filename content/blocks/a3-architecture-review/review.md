## The four tiers

A **tier** is a layer of the system with one job. Requests travel down through the tiers and results come back up. Each tier can change without redesigning the others, and security rules live on the server.

| Tier | Responsibility | Boxes |
|---|---|---|
| Client | User interaction | Student Portal, Staff Dashboard, Admin Dashboard |
| Logic | Business rules and workflow | User Management, Room Allocation, Complaint Management, ★ Complaint Triage and Escalation Engine, Reporting |
| Data | Persistence | PostgreSQL relational database; complaint history and audit log |
| Output | Notifications and reports | Email Notification Service; Report Export |

![Figure 3.2: Four-Tier System Architecture of the IHMS](/img/paper/fig-architecture.webp)

### Remember

- The lecturer's rule: every single box in the diagram must directly translate into an implemented software module.
- Draw only what you will build.

## Client and logic boxes

| Box | What it does |
|---|---|
| Student Portal | Students apply for a bed space, see the allocation, lodge a complaint and follow its status |
| Staff Dashboard | Hall wardens and maintenance officers see the complaints assigned to their unit, ordered by deadline, overdue ones highlighted |
| Admin Dashboard | Student Affairs manage hostels, rooms and allocation, see flagged complaints and open reports |
| User Management | Registers users, hashes passwords, logs people in, enforces four roles: student, maintenance officer, hall warden, administrator |
| Room Allocation | Assigns a vacant bed in a block matching gender and level, once fees are cleared |
| Complaint Management | Records each complaint against a room, assigns it to a unit, tracks Open → Assigned → In Progress → Resolved |
| ★ Triage and Escalation Engine | Sets category, urgency and deadline; every 15 minutes checks for overdue complaints and escalates them |
| Reporting | Occupancy by block, average resolution time by urgency, overdue counts, recurring faults |

### Remember

- A **recurring fault** is three or more complaints of the same category in one room within 30 days.
- How fee clearance reaches the system is one of six open design decisions. Placeholder until the group decides: an admin marks it. See <a href="/reference/decisions" target="_blank" rel="noopener">Group decisions</a>.

## Data and output boxes

| Box | What it does |
|---|---|
| PostgreSQL relational database | Tables for users, hostels, rooms, bed spaces, allocations and complaints. A unique constraint on active allocations stops double allocation, even if the code has a bug |
| Complaint history and audit log | Every status change and escalation, with a timestamp. It proves when each person was alerted |
| Email Notification Service | Email over SMTP when an allocation is confirmed and when a complaint is assigned, escalated or resolved |
| Report Export | CSV files and printable occupancy reports for Student Affairs |

## The four flows

| Flow | Who starts it | What happens |
|---|---|---|
| F1 Room allocation | Student | Submits an application → the system checks fee clearance, gender, level and vacancy → assigns a bed space → emails confirmation |
| F2 Complaint triage | Student | Lodges a complaint → the system sets category, urgency, maintenance unit and deadline → emails the maintenance officer |
| F3 Overdue escalation | The scheduler (a timer) | Every 15 minutes, checks open complaints → emails the hall warden after the deadline, Student Affairs after twice the deadline → logs each escalation |
| F4 Resolution and reporting | Maintenance officer, administrator | Officer marks a complaint resolved → student is notified → reports update resolution times, overdue counts and recurring faults |

![Figure 3.3: End-to-End System Operational Data Flows](/img/paper/fig-data-flows.webp)

### Remember

- F3 is the only flow no person starts. A timer inside the server starts it.
- F2 order of tiers: Client, Logic, Data, Output, then back to Client.

## Urgency, deadlines and escalation

| Urgency | Example keywords | Deadline *d* | Level 1 (*t* ≥ *d*) | Level 2 (*t* ≥ 2*d*) |
|---|---|---|---|---|
| Urgent | burst, flood, spark, exposed wire, no water, broken lock | 24 hours | Hall warden | Student Affairs |
| Normal | leaking tap, faulty socket, broken bed, blocked drain | 72 hours | Hall warden | Student Affairs |
| Low | paint, loose handle, squeaking door | 7 days | Hall warden | Student Affairs |

*L* = 0 if *t* < *d*. *L* = 1 if *d* ≤ *t* < 2*d*. *L* = 2 if *t* ≥ 2*d*. Here *t* is the time since the complaint was submitted.

| Urgency | Submitted | Level 1 (warden) | Level 2 (Student Affairs) |
|---|---|---|---|
| Urgent (*d* = 24 h) | Mon 10:00 | Tue 10:00 | Wed 10:00 |
| Normal (*d* = 72 h) | Mon 10:00 | Thu 10:00 | Sun 10:00 |
| Low (*d* = 7 days) | Mon 10:00 | the next Mon, 10:00 | the Mon after that, 10:00 |

### Remember

- At level 2 the hall warden has already been emailed, and now Student Affairs is emailed too. The complaint is flagged on the Admin Dashboard.
- Every escalation is written to the audit log.
- An email goes out at the first check after the deadline, so it is at most 15 minutes late. That is about 1% of the shortest deadline.

## Keywords and Jev

| | Keyword rules (default) | Jev (optional) |
|---|---|---|
| How it decides | Matches the description against keyword lists | A TypeSafe classification model answers a question with a fixed set of answers |
| Sent | The complaint description | The complaint text, the question and a short description of each category |
| Returned | Category and urgency | The chosen category, a probability for every category and a confidence score |
| Weakness | Fails on words that are not on the list, or on mixed languages | Needs internet access and depends on an outside company |

### Remember

- Keyword triage comes from StaySmart (Yusof et al., 2026): 93.3% on category and 86.7% on urgency, on 15 test complaints.
- Jev costs US$0.042 per million input tokens, and output is free. 10,000 complaints × 500 tokens = 5,000,000 tokens. 5 × US$0.042 = about US$0.21 for a semester.
- If Jev's confidence is low, the system falls back to the keyword rules or a warden's review.
- What the engine does when no keyword matches is one of six open design decisions. Placeholder until the group decides: urgency normal. See <a href="/reference/decisions" target="_blank" rel="noopener">Group decisions</a>.

## The technology stack

| Part | Technology | Reason |
|---|---|---|
| Frontend | HTML, CSS, JavaScript (Fetch API) | Runs in any browser with no build step. The portals are forms, tables and status lists |
| Backend | FastAPI (Python) with Pydantic | Checks every request and generates interactive API documentation |
| Database | PostgreSQL with SQLAlchemy | Unique constraints prevent double allocation. Time-zone-aware timestamps keep deadlines accurate |
| Scheduling | APScheduler | Runs the 15-minute check inside the FastAPI process, with no separate server |
| Notifications | SMTP email | Works with existing university email accounts at no per-message cost |
| Security | bcrypt password hashing, JSON Web Tokens | Well-supported session handling for role-based access |
| Triage classifier (optional) | TypeSafe Jev API | Reads free-text complaints beyond a fixed keyword list |

### Remember

- The lecturer's slide: do not select tech stacks just because of popularity. Every technology needs a reason.
- MERN means MongoDB, Express, React and Node.js. Two reviewed systems used it. We use none of it, because the course scope fixes FastAPI and a relational database, and our portals do not need React.

## Drawing the diagram

1. Draw four horizontal bands, top to bottom: Client, Logic, Data, Output.
2. Add one box per component.
3. Make the ★ engine stand out with a different colour and a ★.
4. Draw arrows between the tiers and label what moves: "HTTPS / JSON", "SQL", "SMTP email".
5. Draw it again from memory and compare it with Figure 3.2 of the paper.
