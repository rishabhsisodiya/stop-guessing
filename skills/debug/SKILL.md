---
name: debug
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, AskUserQuestion
description: "Run /debug when something is failing, throwing, or behaving wrong: a failing test, a bug report, a /verify failure, behavior that does not match the spec. Reproduces it first, finds the cause by evidence rather than guesswork, makes the smallest fix at the cause, and leaves a regression test. No features, no refactors, no fixing more than the bug."
---

## What this skill does

Finds why something is broken, fixes that, and nothing else.

Debugging goes wrong in two predictable ways. The first is fixing the symptom: the error
stops appearing, the cause is still there, and it comes back somewhere less convenient. The
second is the fix that grows: while in the file, three other things get tidied, and now the
change cannot be reviewed or reverted.

This skill is a loop with a hard edge around it.

## The loop

```
reproduce → localize → hypothesise → test the hypothesis → fix → verify → regression test
```

Never skip reproduce. Never skip verify.

## What this skill refuses to do

1. **Never fixes what it has not reproduced.** A fix for a bug you have not seen is a guess
   wearing a commit message. If it cannot be reproduced, say so and go no further; the
   report is what you learned and what you still need.
2. **Never fixes the symptom when the cause is reachable.** If the cause is out of scope or
   would take a redesign, say that explicitly, make the smallest safe containment, and put
   the real cause in the report. Never let a symptom fix pass as a resolution.
3. **Never refactors.** Not the function, not the file, not the "while I am here". A bug fix
   diff should be small enough to review in a minute. Improvements go in the report.
4. **Never changes a test to make it pass.** If a test is genuinely wrong, that is a finding
   to raise, not a line to edit quietly. A weakened assertion converts a real signal into a
   false one permanently.
5. **Never fixes a second bug silently.** Found another one? Name it in the report, and ask
   whether to fix it now or enroll it on the scope. One bug, one fix, one diff.
6. **Never claims fixed without re-running the reproduction.** "Should be fixed" is not a
   result.
7. **Never invents a business rule** to resolve ambiguity about what the correct behavior
   is. Ask. See `develop/SKILL.md`.
8. **Never runs a command the boundary blocks.** Hands it over. See `_shared/boundaries.md`.

## Execution

### Step 1: Reproduce it

Before reading any code. This is the step people skip, and skipping it is why debugging
takes all afternoon.

- Get the exact failure: the error, the stack trace, the wrong output, the screenshot.
- Find the smallest reliable way to trigger it: a test, a request, a sequence of clicks.
- Run it and see it fail **with your own eyes**.
- Write down what "failing" looks like precisely, because that is the thing you will check
  against at the end.

Intermittent? Run it enough times to know the rate. A bug that reproduces one time in five
is a concurrency, ordering or state leak problem, and that is already a strong clue.

**Cannot reproduce?** Stop. Report what you tried, what you observed instead, and exactly
what you need: the version, the data, the environment, the steps. Do not start changing code
to see what happens.

### Step 2: Localize by evidence

Narrow where the fault is, without guessing.

- Read the stack trace properly, including the frames that are not yours.
- Find the boundary: where is the data still right, and where is it first wrong? Print,
  log or breakpoint on both sides of the suspect region and move the boundary inward.
- `git log` and `git diff` the region. Did this ever work? `git bisect` if the answer is
  yes and the range is unclear. Knowing the commit that broke it usually ends the search.
- Check the obvious environmental causes before the clever ones: a stale build, a missing
  migration, a cached dependency, an environment variable, the wrong branch.

Read the code around the failure. Do not read the whole codebase; you have a boundary now.

### Step 3: One hypothesis at a time

State it before testing it, in a form that can be wrong:

> I think the total is wrong because the discount is applied before tax rather than after.
> If that is right, an order with no discount will be correct and one with a discount will
> be off by exactly the tax on the discount.

Then test that prediction. A hypothesis that cannot fail is not a hypothesis.

Change one thing at a time. Changing three and seeing the error disappear tells you nothing
about which one mattered, and usually leaves two unnecessary changes in the diff.

**After three failed hypotheses, stop and reconsider.** The assumption that is wrong is
usually one you have not questioned: that the code being run is the code you are reading,
that the data is what you think, that the failure is where the error message says.

### Step 4: Fix the cause, minimally

- Fix where the fault is, not where it surfaced.
- The smallest change that removes the cause. Nothing else in the diff.
- If the correct behavior is genuinely ambiguous, that is a decision, not a bug. Ask, or
  route to `/architect` if it is load bearing.
- If the cause is in a spec's design rather than the code, say so. The fix is a decision,
  and patching around it makes the code and the spec disagree.

### Step 5: Verify against the original reproduction

Run the exact thing from Step 1. It must now pass.

Then run the surrounding tests and the build. A fix that breaks something else is not done.

State both results plainly. If the reproduction still fails, the fix is wrong: say so rather
than adjusting what you are checking.

### Step 6: Leave a regression test

Write a test that fails before the fix and passes after. This is the only kind of test whose
value is certain, because the failure has already happened once.

Name it for what broke: `applies discount after tax`, not `test bug 402`.

If a test is genuinely impossible here (a timing bug, an external service), say so and say
what would need to change to make it testable.

Follow `develop/test-guide.md` for style, and `AGENTS.md` for where tests live.

### Step 7: Report

```
## /debug · <the symptom, one line>

**Cause: <the actual cause, one line>.** Fixed in <file>:<line>.
Reproduced by: <the smallest reliable trigger>
Why it happened: <the mechanism, two lines at most>
Fix: <what changed, and why this is the cause and not the symptom>
Verified: reproduction now passes · <N> tests pass · build <passes | fails>
Regression test: <name and path>                              (or why one is not possible)
Also found: <other bugs or real problems, not fixed>          (omit if none)
Not fixed: <anything left, and why>                           (omit if none)
```

`Why it happened` is the most valuable line for the next person, including you in three
months. Write the mechanism, not the fix.

## When it is not a bug

Sometimes the code is doing what it was told and the instruction is wrong. Say which:

- **The spec is wrong** → `/architect` revisits the decision. Do not patch the code to
  contradict its own spec.
- **The requirement was never decided** → this is the gate, not a bug. Ask.
- **It works as designed and the design is surprising** → not a bug. Report it as a finding
  and let the engineer decide whether to change the design.

Reporting "this is not a bug" with evidence is a good outcome. Fixing something that was not
broken is not.
