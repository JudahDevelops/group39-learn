# --screen-- concept

The audit is Table I of the paper, and it is the evidence behind the value-add. The group compared every paper on the same five variables. Table I audits 11 systems.

# --screen-- concept

The first two variables:

- **Architecture.** How is the system structured? Look in the system design section and the diagrams. Example values: three-tier, client-server, MERN, cloud.
- **Core features.** What can users do? Look in the feature lists and use-case diagrams. Example values: registration, room allocation, complaint form.

# --screen-- concept

Two more variables:

- **Tech stack.** What was it built with? Look in the implementation section. Example values: PHP and MySQL; React and Node.
- **Problem solved.** What problem did it fix? Look in the introduction and the results. Example values: manual allocation errors, long queues.

# --screen-- concept

The fifth variable is the one that matters most for us.

- **Unaddressed gap.** What's missing, relative to *our* topic? Look in the conclusion, the future work and our own comparison. Example values: no escalation, simulated data only.

## --callout-- info

The first four variables describe the paper. This one compares the paper with our project.

# --screen-- match

## --prompt--

Match each variable to where you look for it.

## --pairs--

- Architecture
  - System design section, diagrams
- Core features
  - Feature lists, use-case diagrams
- Tech stack
  - Implementation section
- Problem solved
  - Introduction, results
- Unaddressed gap
  - Conclusion, future work, our own comparison

## --why--

The gap is the only variable you don't find in one section. You build it from the conclusion, the future work and your own comparison.

# --screen-- concept

**Worked example.** Yusof et al. (2026), StaySmart, UTeM, Malaysia.

- **Architecture:** three-tier client-server with role-based access.
- **Core features:** gender-constrained allocation; occupancy across 2,700 rooms; complaints sorted by keyword into 5 types and 3 urgency levels.
- **Tech stack:** PHP, MySQL, HTML, CSS, JavaScript.

# --screen-- concept

The rest of the StaySmart row:

- **Problem solved:** inconsistent manual and semi-digital processes.
- **Unaddressed gap:** urgency is assigned but there is no deadline or escalation; notifications only inside the app; tested on 15 complaints.

The gap column is about *our* project. StaySmart is a good system. Its gap, for us, is that it stops at labelling urgency.

# --screen-- mcq

## --question--

"Unaddressed gap" means:

## --options--

- [ ] Every weakness in the paper
  > No. The gap is measured against our project, not against every possible weakness.
- [x] What the system lacks that matters for our project
  > Yes. StaySmart lacks a deadline and escalation, and those matter to us.
- [ ] Spelling mistakes in the paper
  > No. Spelling is not part of the audit.

## --why--

The gap column is about our topic. A good system can still have a gap that matters to us.

# --screen-- match

## --prompt--

These are the five cells of the HostelHQ row (Kusalkar et al., 2025) in Table I. Match each cell to its variable.

## --pairs--

- Web, role-based access
  - Architecture
- Chatbot queries and complaints; escalation of unresolved chatbot issues; fees; attendance
  - Core features
- Django, SQLite
  - Tech stack
- Delays and errors in manual records and complaints
  - Problem solved
- Escalation is a chatbot function; no urgency levels or deadlines reported
  - Unaddressed gap

## --why--

HostelHQ does escalate, but only as a chatbot function, and it reports no urgency levels or deadlines.

# --screen-- concept

**Rules the group followed.**

- If a paper didn't say, the cell says "not reported". No guessing.
- Numbers are copied exactly, with the page they're on.
- Each row also records the university and country. Nigerian systems are especially relevant.

# --screen-- mcq

## --question--

A paper doesn't mention its database. What goes under Tech stack?

## --options--

- [ ] MySQL, since most use it
  > No. The group did not guess. A detail the paper doesn't give is not filled in from other papers.
- [x] What it does mention, plus "database not reported"
  > Yes. The cell keeps what the paper says and marks what it doesn't say.
- [ ] Leave the paper out
  > No. A missing detail doesn't remove a paper. The row stays, with "not reported" in that cell.

## --why--

When a paper doesn't say, the cell says "not reported". The audit never guesses.

# --screen-- match

## --prompt--

Match each study in Table I to its unaddressed gap.

## --pairs--

- Diyaolu et al. (2024)
  - Record keeping only; no complaint workflow
- Adebanjo et al. (2026)
  - Allocation only; no complaint escalation
- Heda et al. (2025)
  - Simulation only; deployment testing outstanding
- Kumar et al. (2026)
  - Needs historical training data
- Yusof et al. (2026)
  - Urgency without deadline or escalation; in-app alerts only

## --why--

Each study leaves a different gap. The last one is closest to ours, because it has urgency but no deadline or escalation.

# --screen-- mcq

## --question--

How many systems does Table I audit?

## --options--

- [ ] 5
  > No. Five is the number of variables, not the number of systems.
- [x] 11
  > Yes. Table I has one row for each of 11 systems.
- [ ] 20
  > No. Twenty is the number of papers in each Consensus CSV. Table I audits 11 systems.

## --why--

Table I audits 11 systems on five variables.

# --screen-- flashcard

## --question--

Audit Adewuyi et al. (2026) on the five variables. Write your row first, then reveal Table I's row to compare.

## --answer--

- **Architecture:** three-tier.
- **Core features:** room requests, online complaint lodging, events, room checks.
- **Tech stack:** Next.js, Express, MongoDB.
- **Problem solved:** queues for rooms and for lodging complaints.
- **Unaddressed gap:** complaints reviewed manually; no priority or deadline.
