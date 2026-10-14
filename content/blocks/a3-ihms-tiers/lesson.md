# --screen-- concept

The IHMS has four tiers. This is Table III and Figure 3.2 of the paper. Each tier has one responsibility.

| Tier | Responsibility |
|---|---|
| Client | User interaction |
| Logic | Business rules and workflow |
| Data | Persistence: keeping the data |
| Output | Notifications and reports |

![Figure 3.2: Four-Tier System Architecture of the IHMS](/img/paper/fig-architecture.webp)

## --callout-- info

Every box in the diagram is built in Track B. The next screens go through them tier by tier.

# --screen-- concept

**Client tier: the web pages.** Built in HTML, CSS and JavaScript. They talk to the logic tier through API requests.

| Box | Who uses it | What it does |
|---|---|---|
| Student Portal | Students | Apply for a bed space, see your allocation, lodge a complaint, follow its status |
| Staff Dashboard | Hall wardens, maintenance officers | See the complaints assigned to your unit, ordered by deadline, with overdue ones highlighted |
| Admin Dashboard | Student Affairs | Manage hostels, rooms and allocation; see flagged complaints; open reports |

# --screen-- mcq

## --question--

Which box shows a maintenance officer the complaints assigned to their unit, ordered by deadline?

## --options--

- [ ] Student Portal
  > No. The Student Portal is for students: applying for a bed space and lodging complaints.
- [x] Staff Dashboard
  > Yes. It shows hall wardens and maintenance officers their complaints, with overdue ones highlighted.
- [ ] Admin Dashboard
  > No. The Admin Dashboard is for Student Affairs: hostels, rooms, allocation and reports.

## --why--

Each portal serves one kind of user. Staff see their complaints in the Staff Dashboard.

# --screen-- concept

**Logic tier: the FastAPI server.** It has five boxes. The first two:

| Box | What it does | In | Out |
|---|---|---|---|
| User Management | Registers users, stores passwords safely, logs people in, enforces four roles | Name, email, password, role | A login token; allowed or refused |
| Room Allocation | Assigns bed spaces automatically. Once fees are cleared, a student gets a vacant bed in a block matching their gender and level | Application, fee status, gender, level | An allocation, or a reason for refusal |

## --callout-- info

The bursary clears fees. How that reaches the system is one of six open design decisions. Placeholder until the group decides: an admin marks it. See <a href="/reference/decisions" target="_blank" rel="noopener">Group decisions</a>.

# --screen-- mcq

## --question--

What are the four roles that User Management enforces?

## --options--

- [x] Student, maintenance officer, hall warden, administrator
  > Yes. These are the four roles in the paper.
- [ ] Student, lecturer, admin, guest
  > No. The IHMS has no lecturer or guest role. Maintenance officers and hall wardens are roles.
- [ ] Student and staff
  > No. Staff is split into three roles: maintenance officer, hall warden and administrator.

## --why--

What a user can do depends on their role. The four roles are student, maintenance officer, hall warden and administrator.

# --screen-- concept

The next two logic boxes:

| Box | What it does | In | Out |
|---|---|---|---|
| Complaint Management | Records each complaint against a room, assigns it to a maintenance unit, tracks status: Open → Assigned → In Progress → Resolved | Complaint form; status updates | Stored complaint; status changes |
| ★ Complaint Triage and Escalation Engine | Sets category, urgency and deadline. Every 15 minutes, checks for overdue complaints and escalates them | Complaint description; the clock | Category, urgency, deadline; escalation emails; audit log entries |

# --screen-- mcq

## --question--

Which box decides a complaint's urgency?

## --options--

- [ ] Complaint Management
  > No. Complaint Management records the complaint, assigns it to a unit and tracks its status.
- [x] The ★ Triage and Escalation Engine
  > Yes. It sets the category, the urgency and the deadline.
- [ ] Staff Dashboard
  > No. The Staff Dashboard only shows complaints. It is in the client tier and decides nothing.

## --why--

Complaint Management keeps the record. The ★ engine decides how urgent a complaint is and how long it has.

# --screen-- concept

The fifth logic box is **Reporting**. In: data from the database. Out: report tables and CSV files.

It computes:

- occupancy by block
- average resolution time by urgency
- overdue counts
- rooms with recurring faults

A **recurring fault** is three or more complaints of the same category in one room within 30 days.

# --screen-- mcq

## --question--

What counts as a "recurring fault"?

## --options--

- [ ] Any room with a complaint
  > No. One complaint is not a pattern.
- [x] Three or more complaints of the same category in one room within 30 days
  > Yes. That is the paper's definition: same category, same room, within 30 days.
- [ ] A complaint that is escalated twice
  > No. Escalation is about one complaint passing its deadline. A recurring fault is about repeated complaints in a room.

## --why--

The Reporting box uses the definition to list rooms that keep having the same fault.

# --screen-- concept

**Data tier: PostgreSQL.** It holds tables for users, hostels, rooms, bed spaces, allocations and complaints.

A **unique constraint** on active allocations means the database itself refuses to give one bed space to two students.

A **complaint history and audit log** records every status change and escalation with a timestamp.

## --callout-- info

The audit log proves when each person was alerted. It also supplies the data for resolution-time reports.

# --screen-- mcq

## --question--

What stops one bed space being given to two students, even if the code has a bug?

## --options--

- [ ] The Admin Dashboard
  > No. The Admin Dashboard is a web page. A bug in the server could still send a double allocation to the database.
- [x] A unique constraint in the database
  > Yes. The database refuses the second allocation, so even a bug in the code cannot save one.
- [ ] The email service
  > No. The email service only sends messages after something has happened.

## --why--

The rule is enforced at the last step, where the data is stored. That is why a double allocation cannot be saved.

# --screen-- concept

**Output tier.** Two boxes.

| Box | What it does |
|---|---|
| Email Notification Service | Sends email over SMTP when an allocation is confirmed and when a complaint is assigned, escalated or resolved |
| Report Export | Produces CSV files and printable occupancy reports for Student Affairs |

# --screen-- widget

## --prompt--

Put each box of the IHMS in its tier.

## --widget-- tier-sorter

```json
{
  "tiers": ["Client", "Logic", "Data", "Output"],
  "cards": [
    { "text": "Student Portal", "tier": "Client" },
    { "text": "Staff Dashboard", "tier": "Client" },
    { "text": "Admin Dashboard", "tier": "Client" },
    { "text": "User Management", "tier": "Logic" },
    { "text": "Room Allocation", "tier": "Logic" },
    { "text": "Complaint Management", "tier": "Logic" },
    { "text": "★ Complaint Triage and Escalation Engine", "tier": "Logic" },
    { "text": "Reporting", "tier": "Logic" },
    { "text": "PostgreSQL relational database", "tier": "Data" },
    { "text": "Complaint history and audit log", "tier": "Data" },
    { "text": "Email Notification Service", "tier": "Output" },
    { "text": "Report Export", "tier": "Output" }
  ]
}
```

## --why--

The client tier is the web pages. The logic tier is the FastAPI server, with five boxes. The data tier is PostgreSQL and the audit log. The output tier sends email and produces reports.

# --screen-- flashcard

## --question--

Name every box in the IHMS diagram, tier by tier.

## --answer--

**Client:** Student Portal, Staff Dashboard, Admin Dashboard.

**Logic:** User Management, Room Allocation, Complaint Management, ★ Complaint Triage and Escalation Engine, Reporting.

**Data:** PostgreSQL relational database, complaint history and audit log.

**Output:** Email Notification Service, Report Export.
