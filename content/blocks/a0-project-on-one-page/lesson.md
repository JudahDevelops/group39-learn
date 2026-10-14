# --screen-- concept

The title of our group paper is:

> *Intelligent Hostel Management System: Automated Complaint Triage and Escalation for University Hostels*

This lesson explains what that title means, in plain words.

# --screen-- concept

University hostels still run on paper registers, spreadsheets and what the porter remembers. Some universities now have digital systems for registration and room allocation. But complaints are only *recorded*. A burst pipe waits in the same queue as a squeaking door, and nobody is told when a complaint is ignored.

# --screen-- mcq

## --question--

Which sentence sums up the problem?

## --options--

- [x] An urgent complaint waits like a minor one, and nobody is told when a complaint is ignored.
  > Yes. Complaints are recorded, but nothing ranks them and nothing chases them.
- [ ] Universities have no digital hostel systems at all.
  > No. Some already have digital systems for registration and room allocation.
- [ ] Students are not allowed to report faults.
  > No. Complaints are taken. What goes wrong is what happens to them afterwards.
- [ ] Complaints are never written down.
  > No. They are recorded, in a book or in a system. Recording is all that happens.

## --why--

Complaints are recorded, but nothing ranks them and nothing chases them. A burst pipe waits in the same queue as a squeaking door.

# --screen-- concept

The IHMS is a web application that:

1. allocates rooms automatically once a student's fees are cleared;
2. takes maintenance complaints from students;
3. sorts each complaint by type and urgency and gives it a deadline;
4. emails the hall warden if the deadline passes, then Student Affairs if it passes twice over;
5. gives Student Affairs reports on occupancy and complaints.

## --callout-- info

The bursary clears fees. How that reaches the system is one of six design decisions the group has not settled yet. See <a href="/reference/decisions" target="_blank" rel="noopener">Group decisions</a>.

# --screen-- mcq

## --question--

When does a student become eligible for a bed space?

## --options--

- [ ] When they apply first
  > No. The order of applications does not decide it. Cleared fees do.
- [x] When their fees are marked as cleared
  > Yes. Once fees are cleared, the system matches the student's gender and level to a vacant bed space.
- [ ] When the warden approves them by hand
  > No. Allocation is automatic. The warden has no approval step in this rule.

## --why--

Allocation is automatic once a student's fees are cleared. The system then finds a vacant bed space that matches their gender and level.

# --screen-- concept

Items 3 and 4 are the **value-add module**: the Complaint Triage and Escalation Engine. It is marked ★ throughout the course. Triage means sorting each complaint by type and urgency. Escalation means alerting someone more senior when the deadline passes.

## --callout-- info

Value-add means what our system adds. None of the systems the group reviewed reports tying urgency to a deadline, or escalating automatically when it passes.

# --screen-- mcq

## --question--

What is the ★ value-add module?

## --options--

- [ ] Automatic room allocation
  > No. Allocation is a feature, but it is not the ★ module. Many of the reviewed systems already allocate rooms.
- [x] Complaint triage and escalation
  > Yes. It sorts each complaint, sets a deadline, and emails the hall warden and then Student Affairs when the deadline passes.
- [ ] An AI chatbot
  > No. A chatbot is not part of the engine. The engine works from keyword and time rules.

## --why--

The ★ module is the Complaint Triage and Escalation Engine. Each complaint gets a category, an urgency and a deadline, and is escalated by email when the deadline passes.

# --screen-- concept

Four kinds of user:

- **Student:** applies for a bed space, sees their room, lodges and follows complaints.
- **Maintenance officer:** sees complaints for their unit, ordered by deadline, and updates and resolves them.
- **Hall warden:** receives first-level escalation emails.
- **Administrator (Student Affairs):** manages hostels, rooms and allocation, receives second-level escalations, and opens reports.

# --screen-- match

## --prompt--

Match each user to what they do in the system.

## --pairs--

- Student
  - Applies for a bed space and follows their complaints
- Maintenance officer
  - Updates and resolves complaints for their unit
- Hall warden
  - Receives first-level escalation emails
- Administrator (Student Affairs)
  - Manages hostels, rooms and allocation, and receives second-level escalations

## --why--

Each kind of user gets the part of the system that matches their job. The warden is the first person alerted when a deadline passes, and Student Affairs is the second.

# --screen-- mcq

## --question--

Who receives the first escalation email?

## --options--

- [ ] Student Affairs
  > No. Student Affairs is emailed second, when the complaint passes twice its deadline.
- [x] The hall warden
  > Yes. The warden is emailed first, when the deadline passes.
- [ ] The student
  > No. Escalation emails go to the hall warden and then Student Affairs. The student is told when the complaint is resolved.

## --why--

First the hall warden, then Student Affairs. Each escalation is alerting someone more senior.

# --screen-- concept

The system has four layers, called tiers:

- **Client:** the web pages each kind of user sees.
- **Logic:** the FastAPI server that applies the rules.
- **Data:** the PostgreSQL database that stores everything.
- **Output:** emails and downloadable reports.

# --screen-- match

## --prompt--

Match each tier to what it is.

## --pairs--

- Client
  - The web pages each kind of user sees
- Logic
  - The FastAPI server that applies the rules
- Data
  - The PostgreSQL database that stores everything
- Output
  - Emails and downloadable reports

## --why--

The tiers separate what users see, the rules, the stored data and what the system sends out.

# --screen-- flashcard

## --question--

What is the full title of the group paper?

## --answer--

*Intelligent Hostel Management System: Automated Complaint Triage and Escalation for University Hostels*

# --screen-- checklist

## --items--

- Record a voice note of 60 seconds or less explaining the IHMS to someone who has never heard of it.
- Your voice note does not use the words "tier", "API" or "module".
