# Mode: add

A scope exists and the argument names a single feature. Enroll one row. Do not replan.

### Step 1: Check it is not already there

Scan the scope for a row that means the same thing, even under a different name. If one exists,
say so, show it and its status, and stop. Do not create a duplicate.

### Step 2: Ask at most one question

Only if the feature name alone does not tell you what it does or why it matters.
One question, one panel. Otherwise infer and move on.

### Step 3: Write the row

Append with the next free number, in the right phase, in build order (before whatever depends
on it, after whatever it depends on). Same shape as any other feature:

- `### <N>. <Name>` plus `needs a decision` if the invent test says yes.
- Intent, 1 to 2 lines: what a user can now do. Nothing about how it is built.
- One `Done when:` line, two or three observable outcomes. Same size limits and example as
  `modes/plan.md` Step 6: details are `/architect`'s questions.
- **One box**: `/architect <feature>` if it needs a decision, otherwise `/develop <feature>`.
- A tier tag only if this one feature warrants more or less checking than the project default.

Apply the invent test exactly as in `modes/plan.md`. Unsure means yes.

Add the row to the At a glance table too.

### Step 4: Report

Two or three lines: what was enrolled, where it landed in the order, and the next step (its
entry command). Do not reprint the whole scope.
