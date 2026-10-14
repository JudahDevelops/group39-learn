## The research in eight lessons

The first eight of the lecturer's 15 steps are the research. The group did them in this order.

| Lesson | What the group did |
|---|---|
| 1.1 Understanding the topic | Broke the topic into four prompts and answered each in plain words |
| 1.2 The three research questions | Wrote exactly three questions: domain, current methods, improvement |
| 1.3 Searching Consensus and the CSV | Searched each question on Consensus and exported `RQ1.csv`, `RQ2.csv` and `RQ3.csv` |
| 1.4 Reading a research paper quickly | Read the abstract, then the system design and conclusion, then the results only for numbers |
| 1.5 The five-variable audit | Compared 11 systems on five variables (Table I) |
| 1.6 How every source was verified | Ran four checks on every source |
| 1.7 Using AI to find gaps | Ran the lecturer's prompt on the CSVs and checked every claim |
| 1.8 The value-add | Turned the gaps into one sentence and the ★ module |

## Understanding the topic

| Prompt | The question it asks |
|---|---|
| Domain friction | What's the basic problem with how things are done now? |
| Affected stakeholders | Who exactly suffers from it? |
| Current flaws | What human errors, delays or fraud happen today? |
| Improvement scope | What can software realistically fix, and what can't it fix? |

The group's answers for student hostels:

- **Domain friction.** Allocation, bed-space records, check-in and check-out and complaints run on paper registers, spreadsheets and porter memory.
- **Affected stakeholders.** Students; porters and hall wardens; Student Affairs; the maintenance unit; the bursary.
- **Current flaws.** Double or skipped allocations; long queues at resumption; complaints in a book with no follow-up; no live view of vacant bed spaces; fee clearance checked by hand.
- **Improvement scope.** Software can digitise allocation, track occupancy, route and follow up complaints and report. It can't fix buildings or funding.

Improvement scope includes what software *can't* fix. That stops a project promising things it can't build.

## The three research questions

The lecturer's standard: exactly three questions, each *simple, clear and directly related to your project scope*. A weak question has a yes or no answer, is far too broad, or is about hardware.

| Question | Wording |
|---|---|
| RQ1, the domain | How can a computerised system be applied to manage student hostel accommodation in universities? |
| RQ2, current methods | What methods have been used to allocate hostel rooms and to record hostel occupancy and complaints? |
| RQ3, improvement | What intelligent features can improve room allocation, maintenance handling and reporting in hostel management systems? |

RQ3 was kept broad on purpose, so the gap analysis (not a guess) would decide the value-add.

## Searching Consensus and the CSV

1. Sign in at consensus.app.
2. Paste the research question into the search box exactly as written.
3. Keep to recent papers. The NJC template asks for sources from the last five years. The two methodology sources are the exception.
4. Export the results as a CSV.
5. Repeat for RQ2 and RQ3.

Each CSV holds 20 papers, exported on 7 Oct 2026. They are the group's proof of discovery. Every hostel paper we cite must trace to a row in one of them.

| Column | Use |
|---|---|
| `Title`, `Authors`, `Year`, `Journal` | Identify the paper |
| `Takeaway` | Consensus's one-line summary: a starting point, not a source |
| `Abstract` | The authors' own summary. Read this. |
| `Citations`, `Journal SJR Quartile` | Signals, not proof |
| `DOI` | The paper's permanent ID, used to verify it |

Consensus can return different results on different days. A verified paper that wasn't in the exported files was dropped.

## Reading a research paper quickly

| Part | Read it? |
|---|---|
| Title and abstract | Always, first |
| Introduction, related work | Skim |
| Method or system design | Yes: most of the audit comes from here |
| Results or evaluation | Yes, for any number you'll quote |
| Conclusion and future work | Yes: this is where gaps are |

**Three passes.** Abstract (was a hostel or facility system actually built?), then system design and conclusion, then results only if you'll quote a number.

| Kind of source and peer review | Example in our paper |
|---|---|
| Journal article: peer-reviewed | Hevner et al. (2004) |
| Conference paper: peer-reviewed, usually a lighter review | Kumar et al. (2026) |
| Book chapter: edited | Azeeta et al. (2021) |
| Preprint: **not** peer-reviewed | Heda et al. (2025), labelled `[Preprint]` |

A DOI is a paper's permanent address. Put `https://doi.org/` in front of it to open the paper's page. For the full text, try the DOI link, then Google Scholar, then ResearchGate.

## The five-variable audit

| Variable | Question |
|---|---|
| Architecture | How is the system structured? |
| Core features | What can users do? |
| Tech stack | What was it built with? |
| Problem solved | What problem did it fix? |
| Unaddressed gap | What's missing, relative to *our* topic? |

Where to look: architecture in the system design section and diagrams; core features in the feature lists; tech stack in the implementation section; problem solved in the introduction and results; the gap in the conclusion, the future work and our own comparison.

Rules the group followed: a detail the paper doesn't give is written "not reported", numbers are copied exactly with their page, and each row records the university and country. Table I audits 11 systems.

## How every source was verified

1. **The DOI opens the right paper.** Go to `https://doi.org/<DOI>`.
2. **Title, authors, year and journal match.** Search the DOI at search.crossref.org and compare every field.
3. **The paper says what we claim.** Read the abstract, and the full text for any number we quote.
4. **It's in a Consensus CSV.** Search the CSVs for the title.

A source that failed check 1 or 2 was dropped. A claim that failed check 3 was rewritten.

| Catch | What happened |
|---|---|
| A number that meant something else | Adewuyi et al. (2026) call it "complaint resolution time" in the abstract. The full text shows it is the time to *lodge* a complaint, 30 minutes on foot to 5 minutes online. Our paper says so |
| Papers with no DOI | Two hostel papers couldn't be found in Crossref and were dropped |
| A real paper missing from the CSVs | Sharma and Kaur (2021) was dropped |
| An out-of-scope venue | A result in a drug-delivery journal was dropped |

## Using AI to find gaps

The lecturer's prompt:

> Analyze these research papers. Identify the features and functions that existing systems provide. Identify common limitations and suggest useful features missing across the reviewed systems.

Every claim the AI made was checked against the abstracts and, where needed, the full text. An AI error that reaches the paper is the group's error.

| Function | Found in |
|---|---|
| Rule-based room allocation | Azeeta 2021, Adebanjo 2026, Yusof 2026, Adewuyi 2026 |
| Optimised allocation | M 2025, Kumar 2026 |
| Occupancy dashboards | Azeeta 2021, Adebanjo 2026, Yusof 2026, Kumar 2026 |
| Complaint submission with status tracking | Adewuyi 2026, Yusof 2026, Eweoya 2025, Gnanagurusubbiah 2026, Heda 2025 |
| Complaint classification by type and urgency | Yusof 2026 only |
| Escalation of unresolved issues | Kusalkar 2025 only, as a chatbot function, with no urgency or deadlines |

**The common limitations.**

1. Complaints are logged, not managed.
2. Where urgency is assigned, nothing happens when urgent work is ignored.
3. No reviewed system ties urgency to a deadline and alerts someone automatically when it passes.
4. Machine-learning allocation needs historical data that a hostel moving off paper doesn't have.
5. Much of the evidence comes from simulations or small tests, not live hostels.

The findings were grouped into three themes, which became the Related Works subsections: record digitisation and rule-based allocation; optimisation-based allocation; complaint and maintenance handling.

## The value-add

The lecturer's sentence: *Existing systems provide A, B and C, but our proposed system introduces D.*

Ours: *Existing systems provide registration, rule-based room allocation and complaint logging, but our system introduces automatic complaint triage with deadline-based escalation.*

| Gap | What the ★ module does about it |
|---|---|
| Complaints are logged, not managed | Each complaint gets a category, an urgency level and a maintenance unit the moment it's submitted |
| Urgency without consequence | Each urgency level has a deadline: 24 hours, 72 hours or 7 days |
| Nobody is alerted when a complaint is ignored | Overdue complaints are emailed to the hall warden, then to Student Affairs |
| Machine learning needs historical data | The engine runs on keyword and time rules, so it needs no training data |

Table II compares existing practice with the IHMS in four areas: room allocation, complaint intake, complaint follow-up (★), and occupancy and reporting.

### Remember

- The research questions are exactly three: the domain, current methods, improvement.
- The CSV files are the proof of discovery. A paper that isn't in them is dropped.
- Read the abstract first, then the system design and conclusion. Read results only for numbers you will quote.
- The audit compares 11 systems on five variables. "Not reported" means the paper didn't say.
- Every source passes four checks: the DOI opens the right paper, the details match, the paper says what we claim, and it is in a CSV.
- AI suggests and the group checks. An AI error in the paper is the group's error.
- The value-add is automatic complaint triage with deadline-based escalation. It does not have to be a new invention.
