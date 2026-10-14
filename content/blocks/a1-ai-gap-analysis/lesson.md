# --screen-- concept

This is the step where AI helps most, and where it can mislead most.

Upload the CSVs (or paste the abstracts) into an AI assistant and use the lecturer's exact words:

> Analyze these research papers. Identify the features and functions that existing systems provide. Identify common limitations and suggest useful features missing across the reviewed systems.

# --screen-- concept

**Checking the answer.** Every claim the AI made was checked against the abstracts and, where needed, the full text.

AI tools often say "most systems lack X" when one paper mentions X in its future work. The group counted for itself. An AI error that reaches the paper is the group's error.

# --screen-- mcq

## --question--

Who is responsible for an AI error that ends up in the paper?

## --options--

- [ ] The AI tool
  > No. A tool can't answer questions at the defence. The group put the claim in the paper.
- [x] The group
  > Yes. The lecturer's slide says unverified AI fabrications result in immediate project failure.
- [ ] The lecturer
  > No. The lecturer grades the paper. He doesn't write or check the group's claims.

## --why--

The AI suggests and the group decides. Whatever reaches the paper belongs to the group.

# --screen-- concept

What existing systems provide, once checked. The first four functions:

| Function | Found in |
|---|---|
| Student registration and records | Every built system audited |
| Rule-based room allocation (gender, category, availability) | Azeeta 2021, Adebanjo 2026, Yusof 2026, Adewuyi 2026 |
| Optimised allocation (genetic algorithm, random forest) | M 2025, Kumar 2026 |
| Occupancy dashboards | Azeeta 2021, Adebanjo 2026, Yusof 2026, Kumar 2026 |

# --screen-- concept

The last three functions:

| Function | Found in |
|---|---|
| Complaint submission with status tracking | Adewuyi 2026, Yusof 2026, Eweoya 2025, Gnanagurusubbiah 2026, Heda 2025 |
| Complaint classification by type and urgency | Yusof 2026 only |
| Escalation of unresolved issues | Kusalkar 2025 only, as a chatbot function, with no urgency or deadlines |

# --screen-- mcq

## --question--

The AI says "none of the systems handle complaints". The audit shows five do. What's right?

## --options--

- [ ] Trust the AI; it read all the papers
  > No. Reading all the papers doesn't make an AI's claim true. The audit is where the group checked each paper.
- [x] The audit. The claim is wrong.
  > Yes. Five systems take complaints with status tracking, so "none" is false.
- [ ] Keep the claim but change "none" to "most"
  > No. Changing the word doesn't check the claim. The audit says what each system does.

## --why--

A claim that the audit contradicts is wrong, whoever made it. The audit is the group's own count.

# --screen-- match

## --prompt--

Match each function to the systems that provide it.

## --pairs--

- Rule-based room allocation
  - Azeeta 2021, Adebanjo 2026, Yusof 2026, Adewuyi 2026
- Optimised allocation (genetic algorithm, random forest)
  - M 2025, Kumar 2026
- Occupancy dashboards
  - Azeeta 2021, Adebanjo 2026, Yusof 2026, Kumar 2026
- Complaint classification by type and urgency
  - Yusof 2026 only
- Escalation of unresolved issues
  - Kusalkar 2025 only

## --why--

Allocation and dashboards are common. Complaint classification and escalation each appear in one system only.

# --screen-- mcq

## --question--

Which system was the only one to classify complaints by urgency?

## --options--

- [ ] HostelHQ
  > No. HostelHQ (Kusalkar et al., 2025) has an escalation process, but it reports no urgency levels or deadlines.
- [x] StaySmart (Yusof et al., 2026)
  > Yes. StaySmart sorts complaints by keyword into 5 types and 3 urgency levels.
- [ ] DHMS
  > No. DHMS (Heda et al., 2025) combines allotment with a campus chatbot and predictive maintenance planning. The audit does not credit it with urgency classification.

## --why--

StaySmart is the only system that classifies complaints by type and urgency. It still sets no deadline.

# --screen-- concept

**The common limitations**, checked. The first three:

1. Complaints are logged, not managed. Staff review them by hand.
2. Where urgency is assigned, nothing happens when urgent work is ignored.
3. No reviewed system ties urgency to a deadline and alerts someone automatically when it passes.

# --screen-- concept

The other two limitations:

4. Machine-learning allocation needs historical data that a hostel moving off paper doesn't have.
5. Much of the evidence comes from simulations or small tests, not live hostels.

# --screen-- multi

## --question--

Select every common limitation the group found.

## --options--

- [x] Complaints are logged, not managed
  > Yes. Staff review them by hand.
- [x] No reviewed system ties urgency to a deadline and alerts someone automatically when it passes
  > Yes. This is the gap the value-add fills.
- [x] Machine-learning allocation needs historical data that a hostel moving off paper doesn't have
  > Yes. The model of Kumar et al. (2026) needs historical data to train on.
- [x] Much of the evidence comes from simulations or small tests
  > Yes. Studies such as Yusof et al. (2026) and Heda et al. (2025) rest on simulations or small tests, not live hostel operation.
- [ ] Rule-based room allocation doesn't exist yet
  > No. Four systems provide it: Azeeta 2021, Adebanjo 2026, Yusof 2026 and Adewuyi 2026.
- [ ] No reviewed system keeps student records
  > No. Every built system audited provides student registration and records.

## --why--

The limitations are about complaints, deadlines, data and evidence. Allocation rules and student records are already common.

# --screen-- concept

The checked findings were grouped into three themes. They became the paper's Related Works subsections:

- 2.1 Record digitisation and rule-based allocation
- 2.2 Optimisation-based allocation
- 2.3 Complaint and maintenance handling

# --screen-- checklist

## --items--

- Run the lecturer's prompt on `RQ3.csv` in any AI assistant.
- Pick three claims from its answer.
- Check each claim against the abstracts.
- Mark each claim ✔ supported, ✘ wrong or ? can't tell.

# --screen-- flashcard

## --question--

A panel member asks, "How do you know nobody has built this?" What do you say?

## --answer--

We audited 11 systems on five variables and checked each against its published record. None of the reviewed systems reports tying urgency to a resolution deadline, or escalating a complaint automatically once that deadline passes.

StaySmart assigns urgency but sets no deadline. HostelHQ escalates, but as a chatbot function with no urgency levels or deadlines. Our claim is about the systems we reviewed.
