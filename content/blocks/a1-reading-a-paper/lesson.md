# --screen-- concept

The lecturer's slide says you don't need to read 100 papers cover to cover. You need to pull the right facts out of a few papers quickly.

This lesson shows which parts of a paper to read, which to skim, and which kinds of source are peer-reviewed.

# --screen-- concept

Parts of a paper to read first or skim:

| Part | What it tells you | Read it? |
|---|---|---|
| Title and abstract | What they did and found | Always, first |
| Introduction | The problem they saw | Skim |
| Related work | Other systems they compared | Skim; good for finding more papers |

# --screen-- concept

Parts of a paper to read closely:

| Part | What it tells you | Read it? |
|---|---|---|
| Method or system design | Architecture, features, tech stack | **Yes**: most of the audit comes from here |
| Results or evaluation | What improved and by how much | Yes, for any number you'll quote |
| Conclusion and future work | What they didn't do | **Yes**: this is where gaps are |

# --screen-- mcq

## --question--

Where do you usually find a paper's limitations?

## --options--

- [ ] The title
  > No. A title names the topic. It does not list what the paper left out.
- [x] The conclusion or future work section
  > Yes. Authors say there what they didn't do, and that is where gaps are.
- [ ] The reference list
  > No. The reference list names the sources the authors used, not the limits of their work.

## --why--

Limitations sit in the conclusion and future work. That is why the group read those sections for every paper.

# --screen-- match

## --prompt--

Match each part of a paper to what it tells you.

## --pairs--

- Title and abstract
  - What they did and found
- Introduction
  - The problem they saw
- Related work
  - Other systems they compared
- Method or system design
  - Architecture, features, tech stack
- Results or evaluation
  - What improved and by how much
- Conclusion and future work
  - What they didn't do

## --why--

Each part answers a different question, so you read each for a different reason.

# --screen-- concept

**A three-pass routine.**

1. **Abstract.** Is this a hostel or facility system that was actually built? If not, move on.
2. **System design and conclusion.** Note the architecture, features, stack, the problem solved and what's missing.
3. **Results.** Only if you'll quote a number. Copy the exact figure and the page it's on.

# --screen-- order

## --prompt--

Put the three passes in order.

## --items--

- Abstract: is this a hostel or facility system that was actually built?
- System design and conclusion: note the architecture, features, stack, problem solved and what's missing
- Results: only if you'll quote a number, and copy the exact figure and its page

## --why--

You decide first whether the paper is worth reading, then take what you need, and read the results only when you will quote a number.

# --screen-- concept

Not every source is checked the same way before it is published.

| Kind | Peer-reviewed? | Example in our paper |
|---|---|---|
| Journal article | Yes | Hevner et al. (2004) in *MIS Quarterly* |
| Conference paper | Yes, usually a lighter review | Kumar et al. (2026), IEEE conference |
| Book chapter | Edited | Azeeta et al. (2021), Springer |
| Preprint (for example arXiv) | **No** | Heda et al. (2025), labelled `[Preprint]` |

## --callout-- info

Peer-reviewed means other experts checked the paper before it was published.

# --screen-- match

## --prompt--

Match each kind of source to its example in our paper.

## --pairs--

- Journal article
  - Hevner et al. (2004) in *MIS Quarterly*
- Conference paper
  - Kumar et al. (2026), IEEE conference
- Book chapter
  - Azeeta et al. (2021), Springer
- Preprint
  - Heda et al. (2025), labelled `[Preprint]`

## --why--

The preprint is the only kind marked "No" for peer review. That is why the paper labels Heda et al. (2025) as a preprint.

# --screen-- mcq

## --question--

What is arXiv?

## --options--

- [ ] A peer-reviewed journal
  > No. arXiv is not a journal, and its papers are not peer-reviewed.
- [x] A preprint server; papers there aren't peer-reviewed
  > Yes. A preprint is shared before peer review. Heda et al. (2025) is one.
- [ ] A citation style
  > No. A citation style such as APA 7 formats references. arXiv is where preprints are posted.

## --why--

A preprint server hosts papers before peer review. Treat what you read there with more care.

# --screen-- concept

A **DOI** (Digital Object Identifier) is a paper's permanent address, such as `10.2307/25148625`. Put `https://doi.org/` in front of it and it opens the paper's page.

To get the full text, try the DOI link first, then Google Scholar (look for a [PDF] link on the right), then the authors' ResearchGate page.

# --screen-- mcq

## --question--

What does `https://doi.org/` followed by a DOI do?

## --options--

- [x] Opens the paper's official page
  > Yes. The DOI is the paper's permanent address, and this prefix turns it into a link.
- [ ] Always downloads a free PDF
  > No. It opens the paper's page. Whether the full text is free depends on the publisher, which is why Google Scholar and ResearchGate come next.
- [ ] Formats the reference in APA
  > No. A DOI is an address. It does not format anything.

## --why--

`https://doi.org/` plus a DOI opens the paper's page. That page is the first check that a source is real.

# --screen-- checklist

## --items--

- Read Yusof et al. (2026), the *StaySmart* paper, using the three-pass routine. It is the closest system to ours.
- Write three lines: what was built, for whom, and what it leaves out.

# --screen-- flashcard

## --question--

Heda et al. (2025) is labelled `[Preprint]` in our reference list. What does that mean?

## --answer--

It was posted on arXiv, a preprint server, before peer review. Papers there haven't been checked by other experts, so the label tells a reader to treat it with more care.
