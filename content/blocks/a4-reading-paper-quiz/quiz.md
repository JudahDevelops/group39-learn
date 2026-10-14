---
draw: 12
pass: 10
---

## --question--

### --text--

Where in the paper is the value-add stated?

### --distractors--

- 3.1 Research Design
- The abstract
- Table IV

### --answer--

2.6 and Table II

### --explanation--

2.6 is "Proposed Improvement and Value-Add Delta", and Table II compares existing practice with the IHMS. 3.1 is the research design, Table IV holds the deadlines, and the abstract is blank.

## --question--

### --text--

Which table holds the urgency levels, the deadlines and the escalation targets?

### --distractors--

- Table I
- Table III
- Table VI

### --answer--

Table IV

### --explanation--

Table IV gives each urgency level its deadline and who is emailed at level 1 and level 2. Table I is the audit, Table III the tiers and Table VI the technology stack.

## --question--

### --text--

Which figure shows the four-tier architecture?

### --distractors--

- Figure 3.1
- Figure 3.3

### --answer--

Figure 3.2

### --explanation--

Figure 3.2 is the four-tier system architecture. Figure 3.1 is the design science research cycle, and Figure 3.3 shows the data flows.

## --question--

### --text--

Where does the paper state its three research questions?

### --distractors--

- Introduction, paragraph 1
- 2.4 Cross-cutting Limitations
- 3.1 Research Design

### --answer--

Introduction, paragraph 5

### --explanation--

Paragraph 5 of the Introduction begins "This study is guided by three research questions." Paragraph 1 sets the scene, and the other sections come later in the paper.

## --question--

### --text--

Why is the paper's abstract blank?

### --distractors--

- It is added after the system is built and tested
- The group could not agree on one
- The paper is too short to need one

### --answer--

The lecturer asked for it to be left blank

### --explanation--

The lecturer's group-chat messages said to leave the abstract blank. Results and Conclusion are the sections that wait until the system is built and tested.

## --question--

### --text--

At Babcock University, how long did students wait on average at the hall office to be given a room, before the new system?

### --distractors--

- 8 minutes
- 30 minutes
- 5 minutes

### --answer--

45 minutes

### --explanation--

The wait was an average of 45 minutes (Adewuyi et al., 2026). Their system cut it to 8. The 30 minutes is the walk to report a fault, and 5 minutes is the time to lodge a complaint online.

## --question--

### --text--

What does the 30 to 5 minute figure in Adewuyi et al. (2026) measure?

### --distractors--

- The time to get a room
- The time to fix a fault
- The time for a hall warden to reply

### --answer--

The time to lodge a complaint

### --explanation--

The saving is for lodging a complaint, from 30 minutes on foot to 5 minutes online. The abstract of Adewuyi et al. calls it resolution time, but the paper says what it really measures.

## --question--

### --text--

Which paper reports 93.3% category accuracy on 15 test complaints?

### --distractors--

- Kumar et al. (2026)
- Heda et al. (2025)
- Kusalkar et al. (2025)

### --answer--

Yusof et al. (2026)

### --explanation--

Yusof et al. (2026) built StaySmart, which sorts complaints with keyword rules. Kumar et al. report 94.2% allocation precision, and Heda et al. report 92% satisfaction in simulation.

## --question--

### --text--

Which paper reports 94.2% allocation precision under a simulated load of 5,000 users?

### --distractors--

- Yusof et al. (2026)
- Heda et al. (2025)
- Adebanjo et al. (2026)

### --answer--

Kumar et al. (2026)

### --explanation--

Kumar et al. (2026) used a Random Forest model to recommend room assignments. Heda et al. report 92% student satisfaction in simulation, and Yusof et al. report complaint classification accuracy.

## --question--

### --text--

According to Section 2.4, where does complaint handling stop in the reviewed systems?

### --distractors--

- At escalation to Student Affairs
- At room allocation
- At the first email to the hall warden

### --answer--

At intake

### --explanation--

The systems make complaints easier to submit, but they leave follow-up to staff who must remember to check. Where urgency is assigned, it carries no consequence.

## --question--

### --text--

Why does the paper choose rule-based allocation over machine learning?

### --distractors--

- Machine learning is too slow
- Machine learning is not allowed in the NJC template
- Rules are always more accurate

### --answer--

A hostel moving off paper records has no historical data to train a model

### --explanation--

The model of Kumar et al. (2026) must be trained on historical occupancy and complaint data. Speed is not the reason, since that system reported a mean API response time of 80 ms.

## --question--

### --text--

What is the main output of a study that follows Design Science Research?

### --distractors--

- A prediction of how people will behave
- A survey of students' opinions
- A list of existing systems

### --answer--

An artefact built to solve a practical problem

### --explanation--

Design science builds and evaluates new artefacts. Behavioural research is the kind that explains or predicts how people act.

## --question--

### --text--

Whose design science cycle does Figure 3.1 apply to the IHMS?

### --distractors--

- Hevner et al. (2004)
- Kumar et al. (2026)
- Yusof et al. (2026)

### --answer--

Wieringa (2014)

### --explanation--

Wieringa (2014) describes a cycle between designing an artefact and investigating how it performs. Hevner et al. (2004) set out design science for information systems, but Figure 3.1 is Wieringa's cycle.

## --question--

### --text--

Which design decision answers StaySmart's reliance on in-application notices?

### --distractors--

- The unique bed-space constraint
- Rule-based allocation
- Keyword triage at submission

### --answer--

Email notifications

### --explanation--

In-application notices reach staff only when they open the application (Yusof et al., 2026). Email reaches them without that. The other decisions answer other gaps.

## --question--

### --text--

Which design decision answers the misallocation reported under manual systems?

### --distractors--

- Email notifications
- Deadlines and two-level escalation
- Keyword triage at submission

### --answer--

The unique bed-space constraint

### --explanation--

Section 3.6 cites Adebanjo et al. (2026) for the misallocation reported under manual systems. The database refuses a second allocation of the same bed space.

## --question--

### --text--

How will the escalation timing be tested?

### --distractors--

- By asking hall wardens how quickly they reply
- By waiting for real complaints to become overdue
- By comparing the engine's categories with staff labels

### --answer--

By creating complaints with past submission times and checking that level 1 and level 2 alerts fire at *d* and 2*d* and appear in the audit log

### --explanation--

Complaints with past submission times let the group test the clock without waiting. Comparing the engine's categories with staff labels is the triage accuracy test.

## --question--

### --text--

What does "et al." tell you in a citation?

### --distractors--

- The paper is a preprint
- The source is old
- Two sources are cited for one claim

### --answer--

There are three or more authors

### --explanation--

"Et al." stands in for the authors after the first, as in Hevner et al. (2004). Age is shown by the year, and a preprint is marked in its reference.

## --question--

### --text--

How many systems does Table I audit?

### --distractors--

- 5
- 15
- 3

### --answer--

11

### --explanation--

Table I audits 11 systems across five variables. The reference list has 15 entries because it also holds the two method sources and the two TypeSafe pages.
