---
draw: 15
pass: 12
---

## --question--

### --text--

In the restaurant analogy, FastAPI sorting a complaint and setting its deadline matches which part of the restaurant?

### --distractors--

- The menu
- The pantry
- The waiter bringing the food

### --answer--

The kitchen

### --explanation--

FastAPI is the backend server, which applies the rules, like the kitchen. The pantry is the database, the menu is the web page, and the waiter bringing the food is the response.

## --question--

### --text--

What does `POST /api/complaints` do?

### --distractors--

- It deletes all complaints
- It opens the complaints page
- It lists every complaint in the database

### --answer--

It sends a new complaint to the server

### --explanation--

`POST` means "create something", and `/api/complaints` is the endpoint that handles complaints. The server replies with a response such as `201 Created`.

## --question--

### --text--

In `POST /api/complaints`, what is `/api/complaints`?

### --distractors--

- The status code the server sends back
- The JSON that holds the complaint
- The name of the database table

### --answer--

The endpoint: the address on the server that handles complaints

### --explanation--

An endpoint is one address on the server. The status code is the number in the response, such as `201`. The JSON is the text in braces.

## --question--

### --text--

A `complaints` table has a `room_id` column whose values point to rows in the `rooms` table. What is `room_id` called?

### --distractors--

- A primary key
- An endpoint
- A response

### --answer--

A foreign key

### --explanation--

A foreign key is a column that points to a row in another table. The primary key is the column that identifies each row of its own table, which here is `id`.

## --question--

### --text--

What is a tier?

### --distractors--

- A copy of the database kept for safety
- A kind of user, such as a student or a hall warden
- A programming language used for the web pages

### --answer--

A layer of the system with one job

### --explanation--

The IHMS has four tiers: client, logic, data and output. Requests travel down through the tiers and results come back up.

## --question--

### --text--

Why are the IHMS access rules enforced on the server and not in the web page?

### --distractors--

- Web pages cannot run any code
- The server is faster than the browser
- The lecturer banned rules in web pages

### --answer--

A user can change a web page in their own browser but cannot change the server

### --explanation--

Anything that runs in the browser can be edited by the person using it. Because the rules run on the server, no portal can reach data its role does not permit.

## --question--

### --text--

What is the lecturer's rule about every box in the architecture diagram?

### --distractors--

- It must have its own table in the database
- It must be tested in front of the lecturer
- It must use a different technology from every other box

### --answer--

It must directly translate into an implemented software module

### --explanation--

The rule means we draw only what we will build. If a box is in the diagram, it has to be built in Track B.

## --question--

### --text--

In the lecturer's attendance example, which tier holds the ★ Alert Module?

### --distractors--

- Client
- Data
- Output

### --answer--

Logic

### --explanation--

The Alert Module decides when to alert, which is business logic. The client tier holds the pages, the data tier stores the records, and the output tier sends the notifications.

## --question--

### --text--

What stops one bed space being given to two students, even if the code has a bug?

### --distractors--

- A rule in the Admin Dashboard
- The email service checking each allocation
- The Reporting module's occupancy counts

### --answer--

A unique constraint on active allocations in the database

### --explanation--

The database itself refuses to save a second active allocation for the same bed space, so even a bug in the code cannot save a double allocation.

## --question--

### --text--

What counts as a recurring fault in the Reporting module?

### --distractors--

- Any room with a complaint
- A complaint that is escalated twice
- Two complaints in one room in one week

### --answer--

Three or more complaints of the same category in one room within 30 days

### --explanation--

A recurring fault needs the same category, the same room, three or more complaints and a window of 30 days. Escalation is about one complaint passing its deadline.

## --question--

### --text--

Which box sets a complaint's category, urgency and deadline?

### --distractors--

- Complaint Management
- Reporting
- User Management

### --answer--

The ★ Complaint Triage and Escalation Engine

### --explanation--

Complaint Management records the complaint and tracks its status. Reporting computes figures, and User Management handles logins and roles. The ★ engine does the triage.

## --question--

### --text--

Which flow is started by no person?

### --distractors--

- F1 Room allocation
- F2 Complaint triage
- F4 Resolution and reporting

### --answer--

F3 Overdue escalation, started by the scheduler

### --explanation--

A student starts F1 and F2, and a maintenance officer or administrator starts F4. F3 is started by a timer inside the server that checks open complaints every 15 minutes.

## --question--

### --text--

In flow F2, who is emailed?

### --distractors--

- The hall warden
- Student Affairs
- The student

### --answer--

The maintenance officer

### --explanation--

F2 emails the maintenance officer. The hall warden and Student Affairs are emailed in F3, when a deadline has passed. The student sees a message in the Student Portal and is notified in F4.

## --question--

### --text--

Which is the correct order for flow F1?

### --distractors--

- The system checks fee clearance, the student applies, a bed space is assigned, confirmation is emailed
- The student applies, a bed space is assigned, the system checks fee clearance, gender, level and vacancy, confirmation is emailed
- The student applies, confirmation is emailed, the system checks fee clearance, gender, level and vacancy, a bed space is assigned

### --answer--

The student applies, the system checks fee clearance, gender, level and vacancy, a bed space is assigned, confirmation is emailed

### --explanation--

F1 runs: apply, check, assign, confirm. The checks have to come before the bed space is assigned, and the confirmation is sent last.

## --question--

### --text--

A student's complaint says there is an exposed wire in the room. Which deadline does the engine set?

### --distractors--

- 48 hours
- 72 hours
- 7 days

### --answer--

24 hours

### --explanation--

"Exposed wire" is an example keyword for urgent, and an urgent complaint has *d* = 24 hours. Normal has 72 hours and low has 7 days.

## --question--

### --text--

A normal complaint has been open for 100 hours. Who has been emailed?

### --distractors--

- Nobody
- The hall warden and Student Affairs
- Student Affairs only

### --answer--

The hall warden only

### --explanation--

For a normal complaint *d* = 72 hours and 2*d* = 144 hours. Since 72 ≤ 100 < 144, *L* = 1, so only the hall warden has been emailed.

## --question--

### --text--

An urgent complaint has been open for exactly 48 hours. Who has been emailed?

### --distractors--

- Nobody
- The hall warden only
- Student Affairs only

### --answer--

The hall warden and Student Affairs

### --explanation--

For an urgent complaint *d* = 24 hours, so 2*d* = 48 hours. Level 2 starts when *t* ≥ 2*d*, so *L* = 2. The warden was emailed at 24 hours, and Student Affairs is emailed now.

## --question--

### --text--

A low-urgency complaint is submitted on Monday at 10:00. When does it reach level 1?

### --distractors--

- Tuesday at 10:00
- Thursday at 10:00
- Sunday at 10:00

### --answer--

The next Monday at 10:00

### --explanation--

A low-urgency complaint has *d* = 7 days. Tuesday is level 1 for an urgent complaint, Thursday is level 1 for a normal one, and Sunday is level 2 for a normal one.

## --question--

### --text--

What is the main weakness of keyword triage?

### --distractors--

- It needs a large set of past complaints to train on
- It needs an internet connection
- It cannot set a deadline

### --answer--

It fails when a student describes a fault in words that are not on the list, or mixes languages

### --explanation--

Yusof et al. (2026) report this as the main limitation of their own classifier. Keyword and time rules need no historical training data, and they set the deadline from the urgency.

## --question--

### --text--

What does Jev return for the category question?

### --distractors--

- A written reply to the student, like a chatbot
- Only the urgency level
- A draft email to the hall warden

### --answer--

The chosen category, a probability for every category and a confidence score

### --explanation--

Jev does not write text like a chatbot. It answers a question that has a fixed set of possible answers. A second question over the same complaint returns the urgency.

## --question--

### --text--

Jev is billed at US$0.042 per million input tokens. A complaint is about 500 tokens. About what would 10,000 complaints cost?

### --distractors--

- US$2.10
- US$21
- US$210

### --answer--

About US$0.21

### --explanation--

10,000 × 500 = 5,000,000 tokens, which is 5 million. 5 × US$0.042 is about US$0.21 for a semester.

## --question--

### --text--

Why do the keyword rules stay the default for triage instead of Jev?

### --distractors--

- Jev costs more than the project can pay
- Keyword rules are always more accurate
- Jev can only read complaints written in English

### --answer--

Jev needs internet access and depends on an outside company

### --explanation--

Jev costs only about US$0.21 for 10,000 complaints, and it can read wording that is not on a keyword list. The trade-off is its dependence on an outside API, so it is a configurable option.

## --question--

### --text--

Which is a valid reason for choosing PostgreSQL?

### --distractors--

- It is the most popular database
- It generates interactive API documentation
- It sends email at no cost per message

### --answer--

Unique constraints prevent double allocation, and time-zone-aware timestamps keep deadlines accurate

### --explanation--

A reason has to name something the project needs. Popularity is not one. Generating API documentation is a reason for FastAPI, and free email is a reason for SMTP.

## --question--

### --text--

Why does the stack include APScheduler?

### --distractors--

- It sends the escalation emails over SMTP
- It hashes passwords before they are stored
- It reads free-text complaints beyond the keyword list

### --answer--

It runs the 15-minute escalation check inside the FastAPI process, so no separate server is needed

### --explanation--

APScheduler is the timer that starts flow F3. SMTP sends the emails, bcrypt hashes the passwords, and Jev is the optional classifier.

## --question--

### --text--

Why does the IHMS not use React or the MERN stack?

### --distractors--

- No reviewed system ever used React
- React cannot run in a browser
- MERN is not free to use

### --answer--

The course scope fixes FastAPI and a relational database, and the portals are forms, tables and status lists

### --explanation--

Two reviewed systems used MERN. It does not fit our scope, and plain HTML, CSS and JavaScript handle forms, tables and status lists.

## --question--

### --text--

Someone adds an "AI Chatbot" box to the diagram, but nobody plans to build it. What should happen?

### --distractors--

- Keep it, because it looks impressive
- Keep it and call it future work
- Move it to the output tier

### --answer--

Remove it

### --explanation--

Every box in the diagram must directly translate into an implemented module. A box nobody builds is a claim the project cannot defend.
