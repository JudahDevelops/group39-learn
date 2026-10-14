---
draw: 15
pass: 12
---

## --question--

### --text--

Which of the lecturer's four prompts asks "What can software realistically fix, and what can't it fix?"

### --distractors--

- Domain friction
- Affected stakeholders
- Current flaws

### --answer--

Improvement scope

### --explanation--

Improvement scope sets the limits of what software can do. Domain friction asks about the basic problem with how things are done now, affected stakeholders asks who suffers, and current flaws asks what errors, delays or fraud happen today.

## --question--

### --text--

Which of these is a current flaw in the group's table for student hostels?

### --distractors--

- The bursary confirms fee clearance before allocation
- Software can digitise allocation and track bed-space occupancy
- Software can't fix buildings or funding

### --answer--

Complaints are written in a book with no follow-up or escalation

### --explanation--

A current flaw is something that goes wrong today. The bursary line is a stakeholder, and the other two lines are the improvement scope: what software can fix and what it can't.

## --question--

### --text--

Why does the "Improvement scope" row say what software can't fix?

### --distractors--

- It lists the bugs the group has already found in the system
- It shows which stakeholders will refuse to use the system
- It ranks the features in the order they will be built

### --answer--

It stops a project promising things it can't build

### --explanation--

Naming the limits keeps the project honest. The group's scope says software can digitise allocation and follow up complaints, but it can't fix buildings or funding.

## --question--

### --text--

In the lecturer's attendance example, which research question was weak?

### --distractors--

- How have computerised systems been used to record student attendance in universities?
- What methods have been used to record and verify lecture attendance?
- What automated features can identify students at risk of falling below attendance thresholds?

### --answer--

Is attendance important?

### --explanation--

"Is attendance important?" has a yes or no answer, and a yes or no answer doesn't help you design anything. The other three are the lecturer's better versions of the weak questions.

## --question--

### --text--

What is the focus of RQ3?

### --distractors--

- The domain: how a computerised system can manage student hostel accommodation
- Current methods: how rooms are allocated and how complaints are recorded
- Fees: how a hostel's fees should be priced

### --answer--

Improvement: which intelligent features could improve allocation, maintenance handling and reporting

### --explanation--

RQ1 is the domain, RQ2 is current methods and RQ3 is improvement. Fee pricing is not a software question, so none of the three asks it.

## --question--

### --text--

What standard does the lecturer set for research questions?

### --distractors--

- At least three, each as broad as possible
- Exactly three, each answerable with yes or no
- As many as the project needs, one for each module

### --answer--

Exactly three, each simple, clear and directly related to the project scope

### --explanation--

The number is fixed at three. A yes or no question is weak because it doesn't help you design anything, and a very broad one can't be answered by a literature search.

## --question--

### --text--

How many papers does each of `RQ1.csv`, `RQ2.csv` and `RQ3.csv` hold?

### --distractors--

- 10
- 12
- 50

### --answer--

20

### --explanation--

Each file holds 20 papers, exported from Consensus on 7 Oct 2026. Every hostel paper cited in the paper traces to a row in one of them.

## --question--

### --text--

What is the `Takeaway` column in a Consensus CSV?

### --distractors--

- The authors' own summary of the paper
- The paper's permanent ID
- A count of how often the paper is cited

### --answer--

Consensus's one-line summary, a starting point and not a source

### --explanation--

The authors' own summary is in the `Abstract` column, and that is the one to read. The permanent ID is the `DOI`, and the citation count is in `Citations`.

## --question--

### --text--

One paper the group had verified did not appear in the exported CSV files. What happened to it?

### --distractors--

- It was kept, because verifying it was enough
- It was added to the CSV by hand
- It was kept and labelled as a preprint

### --answer--

It was dropped from the paper

### --explanation--

Every hostel paper in the paper must trace to a row in a CSV. Consensus can return different results on different days, so a paper verified earlier may not be in the export.

## --question--

### --text--

What does the first pass of the three-pass routine decide?

### --distractors--

- Whether the paper's numbers are correct
- Whether the paper's references are real
- Whether the paper is peer-reviewed

### --answer--

Whether the paper describes a hostel or facility system that was actually built

### --explanation--

Pass 1 reads only the abstract and moves on if nothing was built. Pass 2 reads the system design and the conclusion. Pass 3 reads the results, and only when you will quote a number.

## --question--

### --text--

Which source in the paper is a preprint?

### --distractors--

- Hevner et al. (2004)
- Kumar et al. (2026)
- Azeeta et al. (2021)

### --answer--

Heda et al. (2025)

### --explanation--

Heda et al. (2025) was posted on arXiv, a preprint server, and is labelled `[Preprint]` in the references. Hevner et al. is a journal article, Kumar et al. is a conference paper and Azeeta et al. is a book chapter.

## --question--

### --text--

You have a paper's DOI. How do you open the paper's page?

### --distractors--

- Paste the DOI into the Consensus search box
- Search the DOI at arxiv.org
- Add `.pdf` to the end of the DOI

### --answer--

Put `https://doi.org/` in front of the DOI

### --explanation--

A DOI is the paper's permanent address, and `https://doi.org/` turns it into a link. If the page has no free full text, try Google Scholar next, then the authors' ResearchGate page.

## --question--

### --text--

Which five variables did the group use to compare every paper?

### --distractors--

- Title, authors, year, journal and DOI
- Cost, speed, security, usability and scalability
- Aim, objectives, method, results and conclusion

### --answer--

Architecture, core features, tech stack, problem solved and unaddressed gap

### --explanation--

These five columns make up Table I of the paper. The first distractor lists CSV columns, and the other two are not variables the audit used.

## --question--

### --text--

A paper does not say what database it uses. What did the group's audit do?

### --distractors--

- It filled the cell from a similar paper
- It left the cell blank
- It left the paper out of the audit

### --answer--

It wrote "not reported" in the cell

### --explanation--

The group did not guess. A cell that the paper doesn't answer says "not reported", so a reader can tell a missing detail from an overlooked one.

## --question--

### --text--

In Table I, what is the unaddressed gap for Yusof et al. (2026), the StaySmart system?

### --distractors--

- No allocation; no urgency or deadline
- Needs historical training data
- Record keeping only; no complaint workflow

### --answer--

Urgency without deadline or escalation; in-app alerts only

### --explanation--

StaySmart sorts complaints by keyword and assigns urgency, but sets no deadline and sends alerts only inside the app. The first distractor is the gap for Gnanagurusubbiah et al., the second for Kumar et al. and the third for Diyaolu et al.

## --question--

### --text--

Which check compares a reference's title, authors, year and journal with the publisher's record?

### --distractors--

- Opening the DOI link at doi.org
- Reading the paper's abstract
- Searching the CSV files for the title

### --answer--

Searching the DOI at search.crossref.org

### --explanation--

That is check 2. Check 1 only shows that the DOI opens a paper, check 3 is about whether the paper says what we claim, and check 4 is about whether the paper is in a CSV.

## --question--

### --text--

Adewuyi et al. (2026) say in their abstract that "complaint resolution time" fell by 83.33%. What does the full text show it measured?

### --distractors--

- The time for a maintenance officer to fix a complaint
- The time to be given a room, from 45 minutes to 8
- The time for a complaint to reach the hall warden

### --answer--

The time to lodge a complaint, from 30 minutes on foot to 5 minutes online

### --explanation--

Only the full text shows what the figure measures. The room wait of 45 to 8 minutes is a separate result. Our paper says what the number really measures.

## --question--

### --text--

One search result was published in a drug-delivery journal. What did the group do with it?

### --distractors--

- Kept it, because it appeared in a Consensus CSV
- Kept it, but labelled it as a preprint
- Cited it only in the methodology section

### --answer--

Dropped it, because the venue is out of scope

### --explanation--

Appearing in a CSV doesn't make a source suitable. A hostel paper in a journal about drug delivery is outside the scope of this project, so it was dropped.

## --question--

### --text--

What did StaySmart (Yusof et al., 2026) do that no other reviewed system did, and what did it still lack?

### --distractors--

- It escalated unresolved complaints to wardens, but set no urgency levels
- It allocated rooms against set constraints, but had no complaint or maintenance handling
- It recommended room assignments with a Random Forest, but needed historical data

### --answer--

It classified complaints by type and urgency, but set no deadline and no escalation

### --explanation--

StaySmart is the only reviewed system that classifies complaints by type and urgency. The first distractor describes HostelHQ (Kusalkar et al., 2025), the second Azeeta et al. (2021) and the third Kumar et al. (2026).

## --question--

### --text--

An AI says "most systems lack deadline-based escalation". How did the group treat claims like this?

### --distractors--

- Accepted them, because the AI had read all the papers
- Kept them when two different AI tools agreed
- Kept them when the lecturer's prompt had been used word for word

### --answer--

Checked each one against the abstracts and, where needed, the full text

### --explanation--

AI tools often say "most systems lack X" when one paper mentions X in its future work. The group counted for itself, because an AI error that reaches the paper is the group's error.

## --question--

### --text--

Which of these is one of the common limitations the group found?

### --distractors--

- No reviewed system allocates rooms by rule
- No reviewed system has a way to submit a complaint
- No reviewed system was tested at all

### --answer--

No reviewed system ties urgency to a deadline and alerts someone automatically when it passes

### --explanation--

Rule-based allocation is found in four systems and complaint submission in five. Much of the evidence comes from simulations or small tests, but some testing was reported.

## --question--

### --text--

In the lecturer's attendance example, what is the value-add?

### --distractors--

- A fingerprint scanner that records who attends
- End-of-term attendance reports for every department
- A lecturer login that records attendance

### --answer--

An Attendance Alert Module that spots students below 75% and alerts administrators straight away

### --explanation--

Standard attendance systems already provide student profiles, lecturer login, attendance logging and end-of-term reports. The alert module adds intervention while it still helps.

## --question--

### --text--

Each urgency level in the engine has a deadline: 24 hours, 72 hours or 7 days. Which gap does this answer?

### --distractors--

- Complaints are logged, not managed
- Nobody is alerted when a complaint is ignored
- Machine-learning allocation needs historical data

### --answer--

Urgency without consequence

### --explanation--

Existing systems may assign an urgency level, but the level changes nothing. A deadline gives it a consequence. The category, urgency and maintenance unit answer the first gap, and the emails to the hall warden and Student Affairs answer the second.

## --question--

### --text--

Why does the Complaint Triage and Escalation Engine need no training data?

### --distractors--

- It learns from the first complaints students submit
- It uses the Consensus CSV files as training data
- It reuses the training data of the model in Kumar et al. (2026)

### --answer--

It runs on keyword and time rules

### --explanation--

Machine-learning allocation needs historical data that a hostel moving off paper doesn't have. Keyword rules and deadlines work from day one.

## --question--

### --text--

In Table II, what does the IHMS contribute to complaint follow-up (★)?

### --distractors--

- Staff review complaints manually, with no deadline
- Keyword triage sets category, urgency and responsible maintenance unit at submission
- A live bed-space dashboard with overdue counts and recurring-fault rooms

### --answer--

A deadline set by urgency, with overdue complaints escalated by email to the hall warden, then to Student Affairs

### --explanation--

The first distractor is existing practice for follow-up. The second is the IHMS contribution to complaint intake, and the third is its contribution to occupancy and reporting.
