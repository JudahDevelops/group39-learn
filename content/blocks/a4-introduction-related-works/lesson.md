# --screen-- concept

Questions about the problem and the literature are answered from Sections I and II. For every number in them, know two things: what it measures, and which paper it comes from.

# --screen-- concept

**45 to 8 minutes.** The wait for a room at Babcock University, before and after their system.

**30 to 5 minutes.** The time to *lodge* a complaint, not to fix it.

Both come from Adewuyi et al. (2026).

## --callout-- warning

Adewuyi et al.'s abstract calls the 30 to 5 figure complaint resolution time. The paper, in 2.3, says it is the time to lodge a complaint.

# --screen-- mcq

## --question--

What does the 30 to 5 minute figure measure?

## --options--

- [x] The time to lodge a complaint
  > Yes. A complaint took 30 minutes on foot to report, and 5 minutes online.
- [ ] The time to fix a fault
  > No. The figure is for lodging a complaint. Only the abstract of Adewuyi et al. calls it resolution time.
- [ ] The wait for a room
  > No. The wait for a room fell from 45 to 8 minutes. The 30 to 5 figure is about complaints.

## --why--

The 30 to 5 minute saving is for lodging a complaint, not for fixing the fault.

# --screen-- concept

**93.3% and 86.7%.** StaySmart's accuracy for category and for priority, using keyword rules, on 15 test complaints (Yusof et al., 2026).

Priority is the urgency level: Urgent, Normal or Low.

# --screen-- concept

**94.2%.** Random Forest allocation precision, under a simulated load of 5,000 users (Kumar et al., 2026).

**92%.** Student satisfaction with room allocation, in simulation tests (Heda et al., 2025).

## --callout-- info

Much of the evidence in the reviewed studies comes from simulations or small usability tests, not from live hostel operation (Heda et al., 2025; Yusof et al., 2026).

# --screen-- match

## --prompt--

Match each claim to the paper it comes from.

## --pairs--

- The wait for a room fell from 45 to 8 minutes
  - Adewuyi et al. (2026)
- 93.3% category accuracy on 15 test complaints
  - Yusof et al. (2026)
- 94.2% allocation precision under a simulated load of 5,000 users
  - Kumar et al. (2026)
- 92% student satisfaction with room allocation in simulation
  - Heda et al. (2025)

## --why--

Adewuyi et al. measured a built system at Babcock. Yusof et al. built StaySmart. Kumar et al. and Heda et al. report simulation results.

# --screen-- mcq

## --question--

On how many test complaints was StaySmart's 93.3% category accuracy measured?

## --options--

- [x] 15
  > Yes. Yusof et al. (2026) tested on 15 complaints, which is a small test.
- [ ] 5,000
  > No. 5,000 is the simulated load of users in Kumar et al. (2026), not StaySmart's test.
- [ ] 45
  > No. 45 minutes is the wait for a room at Babcock before their new system.

## --why--

StaySmart's figures come from 15 test complaints. That is a small test, so the paper treats the evidence as thin.

# --screen-- concept

Related Works has three groups of systems:

- **2.1 Record digitisation and rule-based allocation.** Diyaolu, Azeeta, Adebanjo. Eweoya is cited at the end.
- **2.2 Optimisation-based allocation.** M, Kumar, Heda.
- **2.3 Complaint and maintenance handling.** Adewuyi, Gnanagurusubbiah, Yusof, Kusalkar.

# --screen-- match

## --prompt--

Match each group to what the paper concludes about it.

## --pairs--

- 2.1 Record digitisation and rule-based allocation
  - Rule-based allocation is established, but none of these systems describes how a reported fault is prioritised or followed up
- 2.2 Optimisation-based allocation
  - It aims at better matches, but the machine-learning versions need data that a hostel leaving paper records does not have
- 2.3 Complaint and maintenance handling
  - Complaints are easier to submit, but StaySmart sets no deadline and HostelHQ escalates only through its chatbot

## --why--

Each group moves the field forward, and each leaves a gap. The gaps add up to the one the IHMS fills.

# --screen-- mcq

## --question--

Which two systems does the paper say go further than making complaints easier to submit?

## --options--

- [x] StaySmart and HostelHQ
  > Yes. StaySmart assigns an urgency level with keyword rules. HostelHQ has a chatbot with an escalation process.
- [ ] StudentConnect and DHMS
  > No. StudentConnect routes complaints and shows live status, but has no urgency or deadline. DHMS is in group 2.2, allocation.
- [ ] Azeeta and Diyaolu
  > No. They are in group 2.1. Table I lists no complaint handling for either system.

## --why--

StaySmart classifies urgency, and HostelHQ escalates unresolved issues. Neither sets a resolution deadline.

# --screen-- mcq

## --question--

Which system is closest to ours?

## --options--

- [ ] StudentConnect
  > No. StudentConnect routes complaints and shows live status, but it has no urgency level and no deadline.
- [x] StaySmart (Yusof et al., 2026)
  > Yes. It classifies urgency with keyword rules, as our triage does. But it sets no deadline, and its alerts stay inside the application.
- [ ] DHMS
  > No. DHMS combines allotment with a chatbot and predictive maintenance planning, and its evidence is from simulation tests.

## --why--

StaySmart is the closest system. Our engine adds what it lacks: a deadline, and escalation by email.

# --screen-- concept

The gap, in the paper's words:

> *The clearest limitation shared by these systems is that complaint handling stops at intake.*

Follow-up is left to staff who must remember to check. Where urgency is assigned, it carries no consequence. No reviewed system reports tying urgency to a deadline.

# --screen-- mcq

## --question--

Why does the paper say machine-learning allocation does not suit hostels that are leaving paper records?

## --options--

- [x] It needs historical data those hostels do not have
  > Yes. The model of Kumar et al. (2026) must be trained on historical occupancy and complaint data.
- [ ] It is too slow
  > No. Kumar et al. report a mean API response time of 80 ms. Speed is not the reason.
- [ ] It is too expensive
  > No. The paper gives a data reason, not a cost reason.

## --why--

A hostel moving off paper records has no historical data to train a model. Rules already work in Nigerian institutions.

# --screen-- flashcard

## --question--

State the gap in the literature in one sentence.

## --answer--

Complaint handling stops at intake. Where urgency is assigned, it carries no consequence, and no reviewed system reports tying urgency to a resolution deadline or escalating a complaint automatically once that deadline passes.
