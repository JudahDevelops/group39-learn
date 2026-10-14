# --screen-- concept

The lecturer said:

> *Don't just paste a diagram. Describe exactly what each part does and how data flows between them.*

The paper does this with four **flows**, F1 to F4 (Table V and Figure 3.3). Each flow has someone or something that starts it.

![Figure 3.3: End-to-End System Operational Data Flows](/img/paper/fig-data-flows.webp)

# --screen-- concept

The first two flows are both started by a student.

| Flow | Who starts it | What happens |
|---|---|---|
| F1 Room allocation | Student | Submits an application → the system checks fee clearance, gender, level and vacancy → assigns a bed space → emails confirmation |
| F2 Complaint triage | Student | Lodges a complaint → the system sets category, urgency, maintenance unit and deadline → emails the maintenance officer |

# --screen-- concept

The other two flows are started by the scheduler and by staff.

| Flow | Who starts it | What happens |
|---|---|---|
| F3 Overdue escalation | The scheduler (a timer) | Every 15 minutes, checks open complaints → emails the hall warden after the deadline, Student Affairs after twice the deadline → logs each escalation |
| F4 Resolution and reporting | Maintenance officer, administrator | Officer marks a complaint resolved → student is notified → reports update resolution times, overdue counts and recurring faults |

F3 is the only flow no person starts. A timer inside the server starts it.

# --screen-- mcq

## --question--

Who or what starts F3?

## --options--

- [ ] The hall warden
  > No. The hall warden is emailed by F3. The warden does not start it.
- [x] A scheduled job that runs every 15 minutes
  > Yes. A timer inside the server starts F3, so no person does.
- [ ] The student
  > No. A student starts F1 and F2, by applying for a bed space or lodging a complaint.

## --why--

F3 needs no person to press anything. The scheduler checks the open complaints on its own, every 15 minutes.

# --screen-- match

## --prompt--

Match each flow to what starts it.

## --pairs--

- F1 Room allocation
  - A student submitting an application
- F2 Complaint triage
  - A student lodging a complaint
- F3 Overdue escalation
  - The scheduler, a timer inside the server
- F4 Resolution and reporting
  - A maintenance officer or an administrator

## --why--

Students start F1 and F2, staff start F4, and only F3 is started by no person.

# --screen-- widget

## --prompt--

Follow flow F2 from Amina's complaint to the email. For each step, tap the tier that handles it.

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

Requests travel down through the tiers and results come back up. F2 starts in the client tier, is handled by the logic tier, is saved in the data tier, sends an email from the output tier, and ends in the client tier.

# --screen-- mcq

## --question--

In F2, who is emailed?

## --options--

- [x] The maintenance officer
  > Yes. F2 emails the maintenance officer of the unit that handles the complaint.
- [ ] The hall warden
  > No. The hall warden is emailed in F3, when a deadline has passed.
- [ ] Student Affairs
  > No. Student Affairs is emailed in F3, after twice the deadline.
- [ ] The student
  > No. In F2 the student sees a message in the Student Portal. The student is notified in F4, when the complaint is resolved.

## --why--

F2 sends the complaint to the person who can fix it. The hall warden and Student Affairs come into F3 only when a deadline passes.

# --screen-- widget

## --prompt--

Now follow flow F1. These are the four steps in Table V, and nothing else. Tap the tier that handles each one.

## --widget-- data-flow-tracer

```json
{
  "title": "F1 Room allocation",
  "tiers": ["Client", "Logic", "Data", "Output"],
  "steps": [
    { "text": "A student submits an application.", "tier": "Client" },
    { "text": "The system checks fee clearance, gender, level and vacancy.", "tier": "Logic" },
    { "text": "The system assigns a bed space.", "tier": "Logic" },
    { "text": "The system emails confirmation.", "tier": "Output" }
  ]
}
```

## --why--

The student acts in the client tier. The Room Allocation module in the logic tier checks the rules and assigns the bed space. The confirmation email is sent from the output tier.

# --screen-- mcq

## --question--

Which is the correct order for F1?

## --options--

- [ ] Check fee clearance, student applies, assign bed space, email confirmation
  > No. The student has to apply before anything can be checked.
- [x] Student applies, check fee clearance, assign bed space, email confirmation
  > Yes. The application comes first, then the checks, then the bed space, then the email.
- [ ] Student applies, assign bed space, check fee clearance, email confirmation
  > No. The checks come before the assignment. A bed space is only assigned to a student who passes them.

## --why--

F1 runs: apply, check, assign, confirm.

# --screen-- checklist

## --items--

- Write F1 as a numbered story like the F2 story, with one line for each step.
- Write the tier at the end of each line: client, logic, data or output.
- Check your story against the F1 row of Table V in the paper.

# --screen-- flashcard

## --question--

Describe flow F2, from the student pressing Submit to the email.

## --answer--

The student lodges a complaint in the Student Portal (client). The portal sends it to the server, where Complaint Management checks the login and finds the room (logic). The ★ engine sets the category, urgency and deadline (logic). The complaint and a history entry are saved in PostgreSQL (data). The Email Notification Service emails the maintenance officer (output). The student sees that the complaint was received, with its urgency and deadline (client).
