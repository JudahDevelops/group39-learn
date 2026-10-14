# --screen-- concept

The value-add is the reason the project is worth grading. It's what examiners ask about first. The lecturer's slide says:

> *You do NOT have to invent new computing science. Meaningful contribution comes from automating a manual gap or improving an existing process.*

# --screen-- mcq

## --question--

Does the value-add have to be a new invention?

## --options--

- [ ] Yes, otherwise the project fails
  > No. The lecturer's slide says you do not have to invent new computing science.
- [x] No. Automating a manual gap is enough.
  > Yes. A meaningful contribution can be automating a manual gap or improving an existing process.
- [ ] Only if the system uses AI
  > No. The slide names two routes: automating a manual gap or improving an existing process. It does not require AI.

## --why--

A value-add can be an automated gap or an improved process. It doesn't need new science.

# --screen-- concept

The sentence the lecturer wants every group to be able to say:

> Existing systems provide A, B and C, but our proposed system introduces D.

## --callout-- info

A, B and C are what existing systems already do. D is the value-add: the one thing yours adds.

# --screen-- mcq

## --question--

Which is the correct form of the value-add sentence?

## --options--

- [x] Existing systems provide A, B and C, but our proposed system introduces D.
  > Yes. It names what exists, then the one thing yours adds.
- [ ] Our system is better than all existing systems.
  > No. This claims to be better but names nothing that exists and nothing that is added.
- [ ] We will use AI to improve hostels.
  > No. This names a tool, not a gap. The sentence must name what is added.

## --why--

The sentence has two halves: what existing systems provide, and what we introduce.

# --screen-- concept

**His example.** Standard attendance systems provide student profiles, lecturer login, attendance logging and end-of-term reports.

His value-add is an *Attendance Alert Module* that spots students below 75% and alerts administrators straight away: intervention while it still helps, instead of a report after the term.

# --screen-- concept

**Ours.**

> *Existing systems provide registration, rule-based room allocation and complaint logging, but our system introduces automatic complaint triage with deadline-based escalation.*

## --callout-- info

A, B and C are registration, rule-based room allocation and complaint logging. D is automatic complaint triage with deadline-based escalation.

# --screen-- concept

**Why this module?** Each part answers a gap from Lesson 1.7.

| Gap | What the ★ module does about it |
|---|---|
| Complaints are logged, not managed | Each complaint gets a category, an urgency level and a maintenance unit the moment it's submitted |
| Urgency without consequence | Each urgency level has a deadline: 24 hours, 72 hours or 7 days |

# --screen-- concept

The other two gaps:

| Gap | What the ★ module does about it |
|---|---|
| Nobody is alerted when a complaint is ignored | Overdue complaints are emailed to the hall warden, then to Student Affairs |
| Machine learning needs historical data | The engine runs on keyword and time rules, so it needs no training data |

# --screen-- match

## --prompt--

Match each gap to what the ★ module does about it.

## --pairs--

- Complaints are logged, not managed
  - Each complaint gets a category, an urgency level and a maintenance unit the moment it's submitted
- Urgency without consequence
  - Each urgency level has a deadline: 24 hours, 72 hours or 7 days
- Nobody is alerted when a complaint is ignored
  - Overdue complaints are emailed to the hall warden, then to Student Affairs
- Machine learning needs historical data
  - The engine runs on keyword and time rules, so it needs no training data

## --why--

Each part of the engine answers one gap from the audit.

# --screen-- mcq

## --question--

Which gap does deadline-based escalation answer?

## --options--

- [ ] Records are on paper
  > No. Paper records are the starting problem for hostels. Escalation answers what happens after a complaint is lodged.
- [x] Nobody is alerted when a complaint is ignored
  > Yes. When the deadline passes, the hall warden is emailed, then Student Affairs.
- [ ] Allocation needs historical data
  > No. That is a limitation of machine-learning allocation. The engine runs on keyword and time rules and needs no training data.

## --why--

Escalation alerts someone when a deadline passes, so an ignored complaint no longer goes unnoticed.

# --screen-- concept

**Table II of the paper** compares existing practice with the IHMS in four areas: room allocation, complaint intake, complaint follow-up (★), and occupancy and reporting.

For complaint follow-up, existing practice is that staff review complaints manually, with no deadline and, at best, an in-app notice. That row is the value-add.

# --screen-- match

## --prompt--

Match each area in Table II to what the IHMS contributes.

## --pairs--

- Room allocation
  - Automatic bed-space assignment checked against fee clearance, gender, level and vacancy
- Complaint intake
  - Keyword triage sets category, urgency and responsible maintenance unit at submission
- Complaint follow-up (★)
  - Deadline set by urgency; overdue complaints escalated by email to the hall warden, then to Student Affairs
- Occupancy and reporting
  - Live bed-space dashboard with overdue counts, resolution times and recurring-fault rooms

## --why--

Follow-up is where existing practice stops: no deadline, and at best an in-app notice. The IHMS adds the deadline and the escalation emails.

# --screen-- flashcard

## --question--

Say the value-add sentence out loud from memory.

## --answer--

Existing systems provide registration, rule-based room allocation and complaint logging, but our system introduces automatic complaint triage with deadline-based escalation.

# --screen-- checklist

## --items--

- Pick one row of the gap table: a gap, and what the ★ module does about it.
- Explain that row out loud in your own words.
- Record yourself.
