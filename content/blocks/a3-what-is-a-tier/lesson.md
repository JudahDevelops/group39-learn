# --screen-- concept

The lecturer requires a multi-tier architecture diagram, and he may ask why the system is split into tiers.

A **tier** is a layer of the system with one job. Requests travel down through the tiers, and results come back up.

# --screen-- concept

Why separate the tiers?

- You can change one tier without redesigning the others. You can restyle the pages without touching the database.
- Security rules live on the server. A user can edit a web page in their own browser, but cannot edit the server.
- Different people can work on different tiers at the same time.

# --screen-- multi

## --question--

Select every reason for splitting a system into tiers.

## --options--

- [x] You can change one tier without redesigning the others.
  > Yes. You can restyle the pages without touching the database.
- [x] Security rules can live on the server.
  > Yes. The server is the part a user cannot edit.
- [x] Different people can work on different tiers at the same time.
  > Yes. Each person can work on one layer.
- [ ] Every tier has to be written in the same programming language.
  > No. The client tier is HTML, CSS and JavaScript, and the logic tier is FastAPI in Python.

## --why--

Separate tiers are easier to change, easier to secure and easier to share out between people.

# --screen-- mcq

## --question--

Why are security rules enforced in the logic tier, not in the web page?

## --options--

- [x] A user can change a web page in their browser but cannot change the server.
  > Yes. Anything that runs in the browser can be edited by the person using it. The server cannot.
- [ ] Web pages cannot run code.
  > No. Web pages do run code. JavaScript says what a page does.
- [ ] The lecturer said so.
  > No. There is a technical reason. A rule in the web page can be edited away by the user.

## --why--

Because the server is out of the user's reach, it can refuse access to data a user's role does not allow.

# --screen-- concept

The lecturer's example is an attendance system. These are its boxes, tier by tier.

| Tier | Boxes |
|---|---|
| 1. Client | Lecturer Web Portal, Admin Dashboard, Student Attendance View |
| 2. Logic | Student Profiler, Attendance Logger, Report Generator, ★ Alert Module |
| 3. Data | Relational DB (MySQL/PostgreSQL), Attendance & Audit Logs |
| 4. Output | Automated Notification Services (Email/SMS), Eligibility & Dean Reports |

# --screen-- widget

## --prompt--

Put each box of the lecturer's attendance system in its tier.

## --widget-- tier-sorter

```json
{
  "tiers": ["Client", "Logic", "Data", "Output"],
  "cards": [
    { "text": "Lecturer Web Portal", "tier": "Client" },
    { "text": "Admin Dashboard", "tier": "Client" },
    { "text": "Student Attendance View", "tier": "Client" },
    { "text": "Student Profiler", "tier": "Logic" },
    { "text": "Attendance Logger", "tier": "Logic" },
    { "text": "Report Generator", "tier": "Logic" },
    { "text": "★ Alert Module", "tier": "Logic" },
    { "text": "Relational DB (MySQL/PostgreSQL)", "tier": "Data" },
    { "text": "Attendance & Audit Logs", "tier": "Data" },
    { "text": "Automated Notification Services (Email/SMS)", "tier": "Output" },
    { "text": "Eligibility & Dean Reports", "tier": "Output" }
  ]
}
```

## --why--

The client tier is what users see. The logic tier holds the modules that do the work, including the ★ Alert Module. The data tier stores the data. The output tier sends notifications and produces reports.

# --screen-- mcq

## --question--

Which tier holds the ★ module in the lecturer's example?

## --options--

- [ ] Client
  > No. The client tier holds the pages users see: the portal, the dashboard and the attendance view.
- [x] Logic
  > Yes. The ★ Alert Module is one of the four modules of the logic tier.
- [ ] Data
  > No. The data tier stores the attendance records and audit logs. It does not decide anything.
- [ ] Output
  > No. The output tier sends the notifications. The Alert Module decides when they are needed.

## --why--

The ★ module is the value-add. It decides when to alert, which is business logic, so it sits in the logic tier.

# --screen-- concept

Under his slide, the lecturer wrote a rule:

> *Every single box in this architecture diagram must directly translate into an implemented software module.*

So we draw only what we will build. If a box is in our diagram, you build it in Track B.

# --screen-- mcq

## --question--

What does the lecturer's rule mean for each box in the diagram?

## --options--

- [x] It must be implemented as a software module.
  > Yes. Every box has to become something that is built.
- [ ] It must have its own table in the database.
  > No. The rule is about building the box as software. A database table is only one of the things that gets built.
- [ ] It must be shown to the lecturer before the defence.
  > No. The rule says nothing about showing boxes early. It says each box must be built.

## --why--

A box nobody builds is a claim the project cannot defend. Draw only what you will implement.

# --screen-- flashcard

## --question--

Say what a tier is and why systems are split into tiers.

## --answer--

A tier is a layer of the system with one job. Requests travel down through the tiers and results come back up. Tiers are separate so that you can change one without redesigning the others, so that security rules live on the server, and so that different people can work on different tiers at the same time.
