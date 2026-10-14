# --screen-- concept

**Step 1: triage.** When a complaint arrives, the engine compares its description with keyword lists. This sets a **category**: plumbing, electrical, carpentry, sanitation or other. The category decides which maintenance unit gets the complaint.

It also sets an **urgency**, and the urgency sets the deadline *d* (Table IV of the paper).

| Urgency | Example keywords | Deadline *d* |
|---|---|---|
| Urgent | burst, flood, spark, exposed wire, no water, broken lock | 24 hours |
| Normal | leaking tap, faulty socket, broken bed, blocked drain | 72 hours |
| Low | paint, loose handle, squeaking door | 7 days |

# --screen-- concept

**Step 2: escalation.** Every 15 minutes a timer checks each open complaint. It takes *t*, the time since the complaint was submitted, and works out the escalation level *L* (equation 1 in the paper).

- *L* = 0 if *t* < *d*. Nothing happens.
- *L* = 1 if *d* ≤ *t* < 2*d*. The **hall warden** is emailed.
- *L* = 2 if *t* ≥ 2*d*. **Student Affairs** is emailed, and the complaint is flagged on the Admin Dashboard.

## --callout-- info

Every escalation is written to the audit log. An email goes out at the first check after the deadline, so it is at most 15 minutes late. That is about 1% of the shortest deadline.

# --screen-- widget

## --prompt--

Slide *t*, the time a normal complaint has been open (*d* = 72 hours). Watch *L* and who has been emailed.

## --widget-- escalation-slider

```json
{ "deadlineHours": 72, "maxHours": 216 }
```

## --why--

*L* is 0 before the deadline *d*, 1 from *d* until 2*d*, and 2 from 2*d* on.

# --screen-- widget

## --prompt--

Now an urgent complaint, with *d* = 24 hours.

## --widget-- escalation-slider

```json
{ "deadlineHours": 24, "maxHours": 72, "target": 2 }
```

## --why--

Student Affairs is emailed as soon as *t* reaches 2*d*. For an urgent complaint that is 48 hours.

# --screen-- mcq

## --question--

Worksheet row a. An urgent complaint was submitted on Monday at 08:00. It is now Monday at 20:00. What is *L*, and who has been emailed?

## --options--

- [x] *L* = 0. Nobody has been emailed.
  > Yes. *t* = 12 hours, which is less than *d* = 24 hours.
- [ ] *L* = 1. The hall warden has been emailed.
  > No. Level 1 starts when *t* reaches *d*. Here *t* = 12 hours and *d* = 24 hours.
- [ ] *L* = 2. The hall warden and Student Affairs have been emailed.
  > No. Level 2 starts at 2*d*, which is 48 hours. Only 12 hours have passed.

## --why--

*t* = 12 h and 12 < 24, so *L* = 0 and nobody is emailed.

# --screen-- mcq

## --question--

Worksheet row b. An urgent complaint was submitted on Monday at 08:00. It is now Tuesday at 09:00. What is *L*, and who has been emailed?

## --options--

- [ ] *L* = 0. Nobody has been emailed.
  > No. *t* = 25 hours, which is more than *d* = 24 hours. The deadline has passed.
- [x] *L* = 1. The hall warden has been emailed.
  > Yes. *t* = 25 hours, and 24 ≤ 25 < 48.
- [ ] *L* = 2. The hall warden and Student Affairs have been emailed.
  > No. Level 2 starts at 2*d*, which is 48 hours. Only 25 hours have passed.

## --why--

*t* = 25 h, and 24 ≤ 25 < 48, so *L* = 1 and the hall warden is emailed.

# --screen-- mcq

## --question--

Worksheet row c. A normal complaint was submitted on Monday at 08:00. It is now Friday at 08:00. What is *L*, and who has been emailed?

## --options--

- [ ] *L* = 0. Nobody has been emailed.
  > No. *t* = 96 hours, which is more than *d* = 72 hours.
- [x] *L* = 1. The hall warden has been emailed.
  > Yes. *t* = 96 hours, and 72 ≤ 96 < 144.
- [ ] *L* = 2. The hall warden and Student Affairs have been emailed.
  > No. Level 2 starts at 2*d*, which is 144 hours. Only 96 hours have passed.

## --why--

*t* = 96 h, and 72 ≤ 96 < 144, so *L* = 1 and the hall warden is emailed.

# --screen-- mcq

## --question--

Worksheet row d. A normal complaint was submitted on Monday at 08:00. It is now Sunday at 08:00. What is *L*, and who has been emailed?

## --options--

- [ ] *L* = 0. Nobody has been emailed.
  > No. *t* = 144 hours, which is far past *d* = 72 hours.
- [ ] *L* = 1. The hall warden has been emailed.
  > No. *t* = 144 hours is exactly 2*d*, and level 2 starts at 2*d*, so *L* is not 1.
- [x] *L* = 2. The hall warden and Student Affairs have been emailed.
  > Yes. *t* = 144 hours, and 144 ≥ 144. The warden was emailed at level 1, and Student Affairs is emailed now.

## --why--

*t* = 144 h, and 144 ≥ 2*d* = 144, so *L* = 2. Level 2 starts exactly at 2*d*.

# --screen-- mcq

## --question--

Worksheet row e. A low-urgency complaint was submitted on Monday at 08:00. It is now Wednesday at 08:00, 9 days later. What is *L*, and who has been emailed?

## --options--

- [ ] *L* = 0. Nobody has been emailed.
  > No. *d* is 7 days for a low-urgency complaint, and 9 days is more than 7.
- [x] *L* = 1. The hall warden has been emailed.
  > Yes. *t* = 9 days, and 7 ≤ 9 < 14.
- [ ] *L* = 2. The hall warden and Student Affairs have been emailed.
  > No. Level 2 starts at 2*d*, which is 14 days. Only 9 days have passed.

## --why--

*t* = 9 days, and 7 ≤ 9 < 14, so *L* = 1 and the hall warden is emailed. Here *d* is 7 days.

# --screen-- concept

The keyword method comes from StaySmart (Yusof et al., 2026). It scored 93.3% on category and 86.7% on urgency, on 15 test complaints.

Its weakness is that keyword lists fail when a student describes a fault in words that are not on the list, or mixes languages. Yusof et al. (2026) report this as the main limitation of their own classifier.

## --callout-- info

What the engine does when no keyword matches is one of six open design decisions. Placeholder until the group decides: urgency normal. See <a href="/reference/decisions" target="_blank" rel="noopener">Group decisions</a>.

# --screen-- concept

**Jev** is an optional alternative. It is a classification model from TypeSafe. It does not write text like a chatbot. It answers a question that has a fixed set of possible answers.

- **Sent to Jev:** the complaint text, the question ("Which maintenance category does this complaint belong to?") and a short description of each category.
- **Returned:** the chosen category, a probability for every category and a confidence score.

## --callout-- info

A second question over the same complaint returns the urgency, in the same request. Because Jev reads meaning rather than matching words, "water dey drip from ceiling since morning" can still be classed as plumbing. If confidence is low, the system falls back to the keyword rules or a warden's review.

# --screen-- concept

**What Jev costs.** US$0.042 per million input tokens, and output is free. A token is roughly part of a word. One complaint with its two questions is about 500 tokens.

- 10,000 complaints × 500 tokens = 5,000,000 tokens
- 5 × US$0.042 = **about US$0.21 for a semester**

## --callout-- info

**Trade-off.** Jev needs internet access and depends on an outside company. So the keyword rules stay the default, and Jev is a configurable option for the triage step.

# --screen-- mcq

## --question--

An urgent complaint was submitted 30 hours ago. What is *L*?

## --options--

- [ ] 0
  > No. Level 0 ends at *d*, which is 24 hours for an urgent complaint. 30 hours is past that.
- [x] 1
  > Yes. *d* = 24 hours, and 24 ≤ 30 < 48, so the hall warden has been emailed.
- [ ] 2
  > No. Level 2 starts at 2*d*, which is 48 hours. Only 30 hours have passed.

## --why--

For an urgent complaint, level 1 runs from 24 hours to 48 hours. 30 hours is inside that range.

# --screen-- mcq

## --question--

What does level 2 trigger?

## --options--

- [ ] An email to the student
  > No. Escalation alerts staff. The student is notified when the complaint is resolved, in F4.
- [x] An email to Student Affairs and a flag on the Admin Dashboard
  > Yes. Level 2 means the complaint is overdue twice over, so it goes above the hall warden.
- [ ] Deleting the complaint
  > No. Escalation alerts people and writes to the audit log. It does not delete anything.

## --why--

Level 1 alerts the hall warden. Level 2 alerts Student Affairs and flags the complaint on the Admin Dashboard.

# --screen-- mcq

## --question--

Why do keyword rules stay the default instead of Jev?

## --options--

- [ ] Jev is expensive
  > No. Jev costs about US$0.21 for 10,000 complaints.
- [x] Jev needs internet access and an outside service
  > Yes. That dependence is the trade-off. The keyword rules need neither, so they stay the default.
- [ ] Keywords are always more accurate
  > No. Keyword lists fail on words that are not on the list. Accuracy is not why they stay the default.

## --why--

Jev can read wording the keyword list misses, but it depends on an outside company. So it is an option, not the default.

# --screen-- mcq

## --question--

About how much would Jev cost for 10,000 complaints?

## --options--

- [x] US$0.21
  > Yes. 10,000 × 500 = 5,000,000 tokens, and 5 × US$0.042 is about US$0.21.
- [ ] US$21
  > No. That is 100 times too much. The price is US$0.042 per million tokens, and there are 5 million tokens.
- [ ] US$210
  > No. That is 1,000 times too much. 5 million tokens at US$0.042 per million is about US$0.21.

## --why--

The price is per million tokens. 5 million tokens cost 5 × US$0.042, which is about US$0.21.
