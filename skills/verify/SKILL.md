---
name: verify
allowed-tools: Bash, Read, Grep, Glob, Write, Agent, AskUserQuestion
argument-hint: "[feature] | review [feature]"
description: "Run /verify <feature> to prove a built feature meets its spec's acceptance criteria, or /verify review for a fresh-model code review before a PR. Never edits code."
---

## What this skill does

Confirms a change before it merges, in two modes.

- **`/verify <feature>`** runs the real application and checks each acceptance criterion by
  observing behavior. Not by reading the code and concluding it looks right.
- **`/verify review [feature]`** reads the diff as a senior engineer, on a **fresh model
  that did not write the code**, and reports what it finds.

Default is run mode. `review` as the first word selects review mode.

At `fast` tier neither is expected; `/develop`'s own self check is the check. At `strict`,
run mode follows every build and review mode runs before a pull request.

## The rule that makes this worth running

**A criterion is met only when it was observed being met.** Reading the code and concluding
it should work is not verification, it is a second opinion from the same source that wrote
it. If it could not be observed, it is `unverified`, and that word appears in the report.

A verify pass that reports "all criteria met" without having driven the app is worse than
no verify pass, because it converts an unknown into a false certainty.

## What this skill refuses to do

1. **Never edits code.** It reports. Fixing is `/develop` or `/debug`.
2. **Never marks a criterion met without observing it.** Unobserved is `unverified`, with
   the reason.
3. **Never hides what it could not check.** The list of unverified criteria goes in the
   report every time, even when it is long, even when everything else passed.
4. **Never reviews its own work in review mode.** The reviewing model must not be the one
   that wrote the code. If a fresh model is unavailable, say the review is unavailable
   rather than performing one that cannot be independent.
5. **Never runs a command the boundary blocks.** Starting the app, running tests and reading
   the database are fine. Seeding, resetting and migrating are handed over.
6. **Never changes a scope row other than ticking the box for its own pass.**
7. **Never invents a criterion.** It checks what the spec asked for. Things the spec should
   have asked for go in the report as findings.

## Reference files

- `modes/run.md`: how to drive the app and check criteria honestly.
- `modes/review.md`: what a senior review looks for, and in what order.
- `review-prompt.md`: the prompt for the fresh reviewing model.

## Execution

### Step 1: Pick the mode and read what is being checked

`review` as the first argument → review mode, read `modes/review.md`.
Anything else → run mode, read `modes/run.md`.

Either way, first read:

- The feature's spec: the acceptance criteria are the contract, and nothing else is.
- The scope row: its tier, and which boxes `/develop` ticked or marked skipped.
- `AGENTS.md`: how to start the app, run tests, and what the gotchas are.

No spec? Say so. There is no contract to verify against. Offer to check the scope's
`Done when:` line instead, and label the result as the weaker check that it is.

### Step 2: Run the mode

Follow the mode file.

### Step 3: Write the findings

Findings go to `docs/reviews/<date>-<feature>.md` (`_shared/workflow-files.md`; in the chat only if the
project does not save reviews) when there is more than a handful, so they
survive the session and can be worked through. A short clean result stays in the report.

Each finding carries: what is wrong, where (file and line, or the steps that reproduce it),
what it costs if it ships, and which acceptance criterion it relates to if any.

Order by severity, most serious first. Do not pad. **A finding invented to look thorough is
worse than none**, because it spends the reader's trust.

### Step 4: Update the scope

Tick only this pass's box (`Verify it` or `Review it`) and only when the pass actually
succeeded. A pass with unmet criteria does not get ticked; say what is outstanding.

Never tick a build box, never tick the `(spec)` box, never touch another feature.

### Step 5: Report

```
## /verify <run | review> · <feature>

**<N> of <M> criteria met · <U> unverified · <F> findings.**
Met: AC-<list>
Not met: AC-<n> — <what happened instead>                     (omit if none)
Unverified: AC-<n> — <why it could not be checked>            (omit if none)
Findings: <count by severity, or "none">
Checked by: <driving the UI in a browser | API requests only, no browser tool available>
Handed over: <any command the engineer needs to run>          (omit if none)
Next: <`/develop` or `/debug` to fix, else the next step on the scope>
```

The `Unverified` line is never omitted when anything was unverified, however good the rest
of the result looks. That line is the difference between a check and a performance.

`Checked by` is never omitted either. "5 of 5 criteria met" means something different when
the screens were never opened, and the reader is entitled to know which one they are being
told.
