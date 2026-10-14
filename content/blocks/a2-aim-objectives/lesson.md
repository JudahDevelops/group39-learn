# --screen-- concept

A project has exactly one aim. Never list several. The aim follows a formula:

> To design and implement a **[kind of system]** that **[does the value-add]**.

## --callout-- info

The value-add is what your system adds that existing systems lack. Ours is the Complaint Triage and Escalation Engine.

# --screen-- mcq

## --question--

How many aims should a project have?

## --options--

- [x] One
  > Yes. A project has exactly one aim.
- [ ] Three
  > No. Three is the number of objectives. The aim is one.
- [ ] One per module
  > No. Modules are built to meet the objectives. The project still has one aim.

## --why--

One aim, never several. The three objectives all serve that one aim.

# --screen-- predict

## --code--

```text
Draft aim: To build a hostel app.
```

## --question--

What would the lecturer say about this draft?

## --options--

- [x] Rewrite it with the formula: say what kind of system it is and what the value-add does.
  > Yes. The formula is "To design and implement a [kind of system] that [does the value-add]". The draft has no value-add.
- [ ] Good. A short aim is a strong aim.
  > No. The aim has to say what the system does that others do not. This draft does not.
- [ ] Add two more aims so the project looks bigger.
  > No. A project has exactly one aim. Never list several.
- [ ] Replace "build" with "test", because the defence is about testing.
  > No. The aim says "design and implement". Testing is the third objective, not the aim.

## --why--

The aim is one sentence in the formula: design and implement a kind of system that does the value-add.

# --screen-- concept

The lecturer's slide says the defence is graded on whether each of the three objectives was achieved. The objectives always follow the same order: design, implement, test.

# --screen-- mcq

## --question--

What is the defence graded on?

## --options--

- [ ] The number of slides
  > No. The deck has a fixed 12 slides. The lecturer grades whether each objective was achieved.
- [x] Whether each of the three objectives was achieved
  > Yes. That is what the lecturer's slide says.
- [ ] The length of the paper
  > No. Length is not what is graded. The three objectives are.

## --why--

The defence is graded on the three objectives, so you need to be able to state each one.

# --screen-- concept

The lecturer's attendance example:

- **Design:** the architecture, database schema and user interfaces.
- **Implement:** the student, lecturer, attendance, report and alert modules.
- **Test:** system performance, alert threshold accuracy and reporting.

# --screen-- concept

Our aim, from the paper's Introduction:

> *To design and implement a web-based Intelligent Hostel Management System that automates room allocation and escalates unresolved maintenance complaints according to their urgency.*

# --screen-- concept

**Objective 1, design.** The four-tier architecture, the relational database schema, and role-based interfaces for students, maintenance officers, hall wardens and administrators.

## --callout-- info

A schema is the plan of a database: its tables and how they connect. Role-based interfaces give each kind of user their own screens.

# --screen-- concept

**Objective 2, implement.** The student, staff and administrator portals; the five logic-tier modules; and the email notification and report export services.

## --callout-- info

The five logic-tier modules are user management, room allocation, complaint management, complaint triage and escalation, and reporting.

# --screen-- mcq

## --question--

Which objective covers building the five logic-tier modules?

## --options--

- [ ] Objective 1
  > No. Objective 1 is to design the architecture, the database schema and the interfaces. Building comes in Objective 2.
- [x] Objective 2
  > Yes. Objective 2 is to implement the portals, the five logic-tier modules and the email and report export services.
- [ ] Objective 3
  > No. Objective 3 is to test the allocation rules, triage accuracy and escalation timing.

## --why--

Design is Objective 1, implement is Objective 2, and test is Objective 3. The logic-tier modules are built in Objective 2.

# --screen-- concept

**Objective 3, test.** The allocation rules, triage accuracy and escalation timing, against representative hostel scenarios.

# --screen-- match

## --prompt--

Match each objective to what it covers.

## --pairs--

- Objective 1, design
  - The four-tier architecture, the database schema and role-based interfaces
- Objective 2, implement
  - The portals, the five logic-tier modules, and the email and report export services
- Objective 3, test
  - The allocation rules, triage accuracy and escalation timing

## --why--

The three objectives follow design, implement, test, in that order.

# --screen-- concept

**Consistency check.** Every module named in Objective 2 is a box in the architecture diagram.

Track B builds them all, in this order: the portals, user management, room allocation, complaint management, the ★ engine, then email and reporting. Objective 3, testing, comes last.

# --screen-- flashcard

## --question--

State the aim and the three objectives.

## --answer--

**Aim:** to design and implement a web-based Intelligent Hostel Management System that automates room allocation and escalates unresolved maintenance complaints according to their urgency.

1. **Design:** the four-tier architecture, the relational database schema, and role-based interfaces for students, maintenance officers, hall wardens and administrators.
2. **Implement:** the student, staff and administrator portals; the five logic-tier modules (user management, room allocation, complaint management, complaint triage and escalation, reporting); and the email notification and report export services.
3. **Test:** the allocation rules, triage accuracy and escalation timing against representative hostel scenarios.
