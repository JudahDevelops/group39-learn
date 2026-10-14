# --screen-- concept

Most of Section III is Chapter A3: the architecture, the modules, the data flows and the stack.

This lesson covers the three parts A3 does not:

- **3.1** research design
- **3.6** design traceability
- **3.7** evaluation plan

# --screen-- concept

**3.1 Research design.** The paper follows Design Science Research (DSR). DSR is used when the main output of a study is an **artefact**: something built to solve a practical problem (Hevner et al., 2004).

Behavioural research explains or predicts how people act. Design science builds and evaluates new artefacts instead.

# --screen-- mcq

## --question--

Which study follows Design Science Research?

## --options--

- [x] One that builds a hostel system to solve a practical problem, then tests how it performs
  > Yes. The output is an artefact, and the study evaluates it.
- [ ] One that surveys students to explain how they behave
  > No. That is behavioural research. It explains or predicts how people act, and builds nothing.
- [ ] One that only lists the hostel systems that already exist
  > No. A list reviews the literature. DSR builds an artefact and then evaluates it.

## --why--

DSR is for studies whose main output is a built artefact that solves a practical problem.

# --screen-- concept

Wieringa (2014) describes DSR as a cycle between two activities. One is designing an artefact that improves something for its stakeholders. The other is investigating how the artefact performs in its context.

Figure 3.1 shows the cycle as applied to the IHMS.

![Figure 3.1: Wieringa's (2014) Design Science Research Cycle Applied to the IHMS](/img/paper/fig-dsr-cycle.webp)

# --screen-- order

## --prompt--

Put the design science cycle for the IHMS in order.

## --items--

- Take the requirements from the literature audit in Section II
- Design the architecture and modules (Sections 3.2 to 3.4)
- Investigate: test each module and the escalation behaviour against hostel scenarios (Section 3.7)
- Feed the findings back into the design

## --why--

The design takes its requirements from the literature. The investigation tests what was designed. Its findings go back into the design, which is what makes it a cycle.

# --screen-- mcq

## --question--

Why can the paper cite Hevner et al. (2004) when the rule is "last five years"?

## --options--

- [x] It is a foundational methodology source
  > Yes. The NJC template asks for sources from the last five years. The two methodology sources, Hevner et al. (2004) and Wieringa (2014), are the exception.
- [ ] Old papers are always fine
  > No. The rule still applies to the studies in the literature review. Only the two methodology sources are the exception.
- [ ] It is in the CSV
  > No. Where a source was found is not the reason. Hevner et al. (2004) is allowed because it is a foundational source for the method.

## --why--

Hevner et al. (2004) and Wieringa (2014) are older than five years. They are allowed because they are the foundational sources for the method.

# --screen-- concept

**3.6 Design traceability.** Each major design decision answers a limitation identified in Section II.

So every module that is built can be traced back to a component in the architecture and to a gap in the literature.

# --screen-- concept

Each decision and the limitation it answers:

- **Keyword triage at submission.** Complaints are logged with no priority.
- **Deadlines and two-level escalation.** No enforced follow-up.
- **Email notifications.** StaySmart's in-app notices reach staff only when they open the app.
- **Rule-based allocation.** No historical data to train a model.
- **Unique bed-space constraint.** Misallocation under manual systems.

# --screen-- match

## --prompt--

Match each design decision to the limitation it answers.

## --pairs--

- Keyword triage at submission
  - Complaints are logged with no priority
- Deadlines and two-level escalation
  - No enforced follow-up in the reviewed systems
- Email notifications
  - StaySmart's in-app notices reach staff only when they open the app
- Rule-based allocation, not machine learning
  - A hostel moving off paper has no historical data to train a model
- Unique bed-space constraint
  - Misallocation reported under manual systems

## --why--

Every decision answers a gap from Section II. The paper cites a source for each one.

# --screen-- mcq

## --question--

Which design decision answers StaySmart's in-app-only notifications?

## --options--

- [ ] Unique bed-space constraint
  > No. The unique bed-space constraint answers misallocation under manual systems, not notifications.
- [x] Email notifications
  > Yes. In-app notices reach staff only when they open the application. Email reaches them without that (Yusof et al., 2026).
- [ ] Rule-based allocation
  > No. Rule-based allocation answers the lack of historical data for machine learning.

## --why--

Email notification responds to StaySmart's reliance on in-application notices.

# --screen-- multi

## --question--

Select every source the paper uses for choosing rule-based allocation over machine learning.

## --options--

- [x] Kumar et al. (2026)
  > Yes. Their model must be trained on historical occupancy and complaint data, which a hostel moving off paper does not have.
- [x] Adebanjo et al. (2026)
  > Yes. Their constraint rules work at Babcock University.
- [x] Azeeta et al. (2021)
  > Yes. Their constraint-based allocation works at Covenant University.
- [ ] Yusof et al. (2026)
  > No. Section 3.6 cites Yusof et al. for keyword triage, deadlines and email notification, not for the allocation choice.
- [ ] Hevner et al. (2004)
  > No. Hevner et al. is the source for the research method, DSR.

## --why--

Kumar et al. give the reason against machine learning. Adebanjo et al. and Azeeta et al. show that constraint rules already work in Nigerian institutions.

# --screen-- concept

**3.7 Evaluation plan.** This is Objective 3. Following DSR practice, the IHMS will be evaluated four ways:

1. **Tests.** Unit and integration tests for each module.
2. **Triage accuracy.** Staff label sample complaints.
3. **Escalation timing.** Complaints with past submission times.
4. **Usability.** Task-based sessions, then a walkthrough.

# --screen-- match

## --prompt--

Match each part of the evaluation plan to what it does.

## --pairs--

- Unit and integration tests
  - Check each module, including an attempt to allocate a bed that is already occupied
- Triage accuracy
  - Compare the categories and urgency levels the engine assigns with the labels hostel staff gave sample complaints
- Escalation timing
  - Confirm that level 1 and level 2 alerts fire at *d* and 2*d* and appear in the audit log
- Usability sessions
  - Students, maintenance officers and hall wardens do tasks, then a walkthrough with Student Affairs staff

## --why--

Tests check the rules, triage accuracy checks the engine against people, escalation timing checks the clock, and usability checks fit with real hostel procedures.

# --screen-- flashcard

## --question--

How will the IHMS be evaluated?

## --answer--

1. Unit and integration tests for each module, including trying to allocate a bed that is already occupied.
2. Triage accuracy: hostel staff label sample complaints, and the engine's categories and urgency levels are compared with those labels.
3. Escalation timing: complaints are created with past submission times, and level 1 and level 2 alerts must fire at *d* and 2*d* and appear in the audit log.
4. Usability: task-based sessions with students, maintenance officers and hall wardens, then a walkthrough with Student Affairs staff.
