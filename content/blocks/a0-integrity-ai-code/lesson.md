# --screen-- concept

The lecturer's slide says:

> *Plagiarism or unverified AI fabrications result in immediate project failure.*

This applies to the code as much as to the paper.

# --screen-- concept

**The rule for this course.** AI may explain code. It must not write code for you. Every member must be able to explain every line they put in the project.

## --callout-- warning

The test at the defence: can you explain every line you wrote? The lecturer's Don'ts include *never copy another group's project or existing code* and *do not draw architecture diagrams you cannot explain*. The same goes for code.

# --screen-- concept

Chat assistants write references that look real: plausible authors, a real journal name, and a DOI (a paper's permanent ID) in the right format. Some of those papers do not exist. Others exist but do not say what the AI claims.

# --screen-- mcq

## --question--

An AI gives you a reference with a DOI. What do you do before using it?

## --options--

- [ ] Use it, because the DOI proves it is real
  > No. A made-up DOI can still be in the right format. The format proves nothing.
- [x] Open the DOI, check the title, authors and year, and read the abstract
  > Yes. That checks the reference against the paper's own page, and tells you whether the paper says what the AI claims.
- [ ] Ask the AI if it is sure
  > No. The AI wrote the reference. Asking it again does not check it against anything real.

## --why--

A DOI can look right and still be wrong. Open it and compare the paper with the reference.

# --screen-- concept

That is why the group checked every source in the paper against its published record. Lesson 1.6 shows how.

If the lecturer asks, "Did you read this paper?", the honest answer is yes.

# --screen-- concept

**Allowed.** Use AI like a tutor:

- "Explain what this error message means."
- "Explain this line of code I don't understand."
- "Quiz me on how JWT tokens work."
- "Here's my function and the test that fails; give me a hint, not the answer."

## --callout-- info

A JWT is a signed token that says who is logged in. You will meet it later in Track B.

# --screen-- mcq

## --question--

Which use of AI is allowed?

## --options--

- [x] Asking it to explain an error message
  > Yes. The AI explains, and you still write the fix.
- [ ] Asking it to write a module that you then paste into the project
  > No. AI must not write your code. You could not explain every line of it.
- [ ] Asking it to write tests that make your code pass
  > No. A test written to make your code pass cannot show that the code is right.

## --why--

AI may explain. It must not write your code or your tests.

# --screen-- concept

**Not allowed.** Never let AI do the work for you:

- "Write the room allocation module for me."
- Pasting code you can't explain into the project.
- Copying another group's code or a GitHub project.
- Letting AI write your tests so they pass.

# --screen-- multi

## --question--

Select every request that is allowed.

## --options--

- [x] "Explain this line of code I don't understand."
  > Yes. Explaining a line is allowed. You then write your own code.
- [x] "Quiz me on how JWT tokens work."
  > Yes. A quiz makes you do the thinking.
- [x] "Here's my function and the test that fails; give me a hint, not the answer."
  > Yes. A hint helps you find the fix yourself.
- [ ] "Write the room allocation module for me."
  > No. AI must not write the module. You would have to explain code you did not write.
- [ ] "Copy another group's code or a GitHub project into mine."
  > No. The lecturer's Don'ts forbid copying another group's project or existing code.
- [ ] "Write tests for my function so that they pass."
  > No. Letting AI write your tests so they pass is not allowed.

## --why--

Allowed: explain, quiz and hint. Not allowed: write the module, copy someone else's code, or write tests that pass.

# --screen-- mcq

## --question--

What is the test for any code you add?

## --options--

- [ ] It runs
  > No. Code can run and still be code you cannot explain.
- [x] You can explain every line
  > Yes. At the defence, you must be able to explain every line you wrote.
- [ ] It is short
  > No. Short code you cannot explain fails the test, and long code you can explain passes it.

## --why--

The test is not whether the code works. The test is whether you can explain every line.

# --screen-- concept

When you are stuck for more than 30 minutes, write down what you expected, what happened, and what you have tried. Post that in the group chat. Someone stuck on the same thing will learn from the answer.

# --screen-- mcq

## --question--

You have been stuck for more than 30 minutes. What do you post in the group chat?

## --options--

- [x] What you expected, what happened, and what you have tried
  > Yes. That gives the group enough to help, and others stuck on the same thing learn from it.
- [ ] "My code doesn't work, help"
  > No. That tells the group nothing. Say what you expected, what happened and what you tried.
- [ ] The full answer an AI wrote for you
  > No. AI must not write your code. Pasting its answer breaks the rule.
- [ ] Nothing. Keep trying alone
  > No. After 30 minutes, ask. The answer helps everyone who is stuck on the same thing.

## --why--

Write down what you expected, what happened and what you tried. Then post it in the group chat.

# --screen-- checklist

## --items--

- Read the lecturer's <a href="/reference/dos-donts" target="_blank" rel="noopener">Do's and Don'ts</a> (Reference, Appendix C).
- Reply in the group chat: "I've read the integrity rules."

# --screen-- flashcard

## --question--

State the integrity rule for AI and code.

## --answer--

AI may explain code but must not write it. Every member must be able to explain every line.
