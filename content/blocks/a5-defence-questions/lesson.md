# --screen-- concept

The lecturer's slide says:

> *Ensure all members understand and can defend every diagram.*

So the lecturer can ask any member about any part of the project.

# --screen-- mcq

## --question--

The lecturer asks you about the database, but you prepared the slides. What do you do?

## --options--

- [ ] Pass the question to whoever prepared that part
  > No. Every member must be able to defend every part, so passing the question shows a gap.
- [x] Answer it
  > Yes. Every member must be able to defend every part, not only the part they prepared.
- [ ] Say it was not your part and ask the lecturer to move on
  > No. The lecturer can question any member on any part. Not your part is not an answer.

## --why--

Every member must be able to defend every part.

# --screen-- concept

The group has 14 likely questions, each with the group's answer. Each question checks something: a step in the research, the literature, the value-add, the ★ engine, a design choice, a tier, the stack, traceability, a known weakness, Objective 3 or the method.

Learn each answer, and what it checks.

# --screen-- concept

Look at how the group's answers are built. A design question gets a reason, often with a number: the worst delay is 15 minutes, about 1% of the shortest deadline. A choice gets a source where there is one, such as Kumar et al. (2026). A weakness gets an honest answer.

# --screen-- mcq

## --question--

The lecturer asks: "What if a student uses words that aren't on the keyword list?" Which answer matches the group's?

## --options--

- [x] "That's the known weakness of keywords. Jev is the alternative: it reads meaning, and falls back to keywords or a warden when unsure."
  > Yes. The group admits the weakness, then names the alternative. The paper itself says keyword rules fail on words the list does not contain.
- [ ] "That cannot happen, because the keyword list covers every complaint."
  > No. The paper says keyword rules fail when students use words the list does not contain.
- [ ] "That question is unfair, so we will not answer it."
  > No. A known weakness is a fair question. The group's answer admits it and gives the alternative.

## --why--

Weakness questions get an honest answer, then the alternative.

# --screen-- mcq

## --question--

Which source do you cite when asked why the group did not use machine learning for allocation?

## --options--

- [x] Kumar et al. (2026)
  > Yes. Their model needs historical data, which a hostel leaving paper records does not have.
- [ ] Hevner et al. (2004)
  > No. Hevner et al. (2004) is the source for the research method, DSR.
- [ ] Yusof et al. (2026)
  > No. Yusof et al. (2026) is the source for keyword triage and for StaySmart, not for the allocation choice.

## --why--

The answer to "Why not machine learning for allocation?" cites Kumar et al. (2026).

# --screen-- mcq

## --question--

What is the longest an escalation email can be late?

## --options--

- [ ] 24 hours
  > No. 24 hours is the shortest deadline, for urgent complaints. It is not the delay in checking.
- [x] 15 minutes after the deadline passes
  > Yes. A scheduled job runs every 15 minutes, so the worst delay is 15 minutes.
- [ ] 1 hour
  > No. The job runs every 15 minutes, not every hour.

## --why--

The scheduled job checks every 15 minutes. The worst delay after a deadline passes is 15 minutes.

# --screen-- flashcard

## --question--

What problem does your system solve?

## --answer--

Hostel complaints are recorded but not managed. Urgent faults wait like minor ones, and nobody is alerted when one is ignored.

**What it checks:** Step 1

# --screen-- flashcard

## --question--

What's new compared with existing systems?

## --answer--

Existing systems provide registration, rule-based allocation and complaint logging; ours adds automatic triage with deadline-based escalation.

**What it checks:** Step 8

# --screen-- flashcard

## --question--

How is it different from StaySmart?

## --answer--

StaySmart labels urgency but sets no deadline, doesn't escalate and notifies only inside the app. Ours sets deadlines and emails the warden, then Student Affairs.

**What it checks:** Literature

# --screen-- flashcard

## --question--

What makes it "intelligent"?

## --answer--

It triages each complaint automatically and acts on time: overdue complaints escalate without anyone having to chase them. Jev is an option for understanding free-text wording.

**What it checks:** Value-add

# --screen-- flashcard

## --question--

How does the system know a deadline has passed?

## --answer--

A scheduled job runs every 15 minutes and compares the time elapsed with the deadline.

**What it checks:** ★ engine

# --screen-- flashcard

## --question--

Why every 15 minutes?

## --answer--

The worst delay is 15 minutes, about 1% of the shortest deadline (24 hours), without checking constantly.

**What it checks:** Design

# --screen-- flashcard

## --question--

How do you stop a bed going to two students?

## --answer--

A unique constraint in PostgreSQL on active allocations. The database refuses the second one, even if the code has a bug.

**What it checks:** Data tier

# --screen-- flashcard

## --question--

Why FastAPI?

## --answer--

It's the course stack, it validates every request automatically and it generates API documentation for testing.

**What it checks:** Stack

# --screen-- flashcard

## --question--

Why PostgreSQL and not MongoDB?

## --answer--

Allocations need relational integrity and unique constraints; deadlines need time-zone-aware timestamps.

**What it checks:** Stack

# --screen-- flashcard

## --question--

Why not machine learning for allocation?

## --answer--

ML needs historical data a hostel leaving paper doesn't have (Kumar et al., 2026). Rules already work in Nigerian universities.

**What it checks:** Traceability

# --screen-- flashcard

## --question--

Why email and not SMS?

## --answer--

Email works with existing university accounts at no cost per message.

**What it checks:** Stack

# --screen-- flashcard

## --question--

What if a student uses words that aren't on the keyword list?

## --answer--

That's the known weakness of keywords. Jev is the alternative: it reads meaning, costs about US$0.21 per 10,000 complaints, and falls back to keywords or a warden when unsure.

**What it checks:** Weakness

# --screen-- flashcard

## --question--

How will you test it?

## --answer--

Unit tests on the allocation rules, including a double-allocation attempt; triage accuracy against staff-labelled complaints; escalation timing with backdated complaints; usability sessions.

**What it checks:** Objective 3

# --screen-- flashcard

## --question--

What is DSR?

## --answer--

Research that builds an artefact to solve a practical problem and then evaluates it (Hevner et al., 2004).

**What it checks:** Method

# --screen-- concept

**Questions the group still has to settle.** The paper doesn't answer these yet. Agree on answers before the defence; Track B needs them too:

1. What urgency does a complaint get if no keyword matches?
2. Who handles complaints in the "other" category?
3. Can a warden correct a wrong category or urgency? If so, does the deadline reset?
4. What happens if an escalation email fails to send?
5. The bursary clears fees, but there's no bursary role. How does fee clearance get into the system: an admin marks it, or an upload from the bursary?
6. Does the deadline clock pause at night or at weekends?

## --callout-- info

The paper does not answer these, so this course does not either. Track B uses placeholders until the group decides. See <a href="/reference/decisions" target="_blank" rel="noopener">Group decisions</a>.

# --screen-- checklist

## --items--

- Pair up. Ask each other five random questions from the fourteen cards, without looking at the answers. Swap.
