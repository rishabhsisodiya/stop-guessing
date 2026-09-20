---
name: develop
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, AskUserQuestion
description: "Run /develop to build a feature from its spec, backend or UI. If building would mean inventing a decision no spec records, it stops and routes you to /architect. Reads the spec, AGENTS.md and the project's stack defaults, builds only what the acceptance criteria ask for, self checks, and advances the scope. Never runs migrations, never invents a business rule."
---

## What this skill does

Builds one feature from its spec, and refuses to build one that has no decision behind it.

`/architect` writes the decision down. This skill is what makes writing it down matter: it
reads the spec, builds exactly what the acceptance criteria require, checks its own work,
and ticks the milestones in the scope. When there is no spec and building would mean
inventing something, it stops.

## The gate

Before writing any code, apply the **invent test**:

> Would building this mean deciding something the engineer has not decided?

Yes for: a provider or library choice, a data model or a new column, a cross cutting
pattern, a whole page with no design, a business rule, a permission rule, a pricing or
ordering or ranking rule, an error contract, anything to do with money or personal data.

No for: pure implementation that an existing spec, `design.md`, or a convention already
recorded in `AGENTS.md` fully determines.

**Unsure means yes.** An unflagged decision is the expensive miss, and it is the reason
this collection exists.

### Calibration: what must stop, and what must not

A gate that stops too often is worse than no gate, because the engineer learns to override
without reading, and then it stops nothing. Use these to keep the bar in the right place.

**Stop.** Each of these decides something the engineer has to live with:

- The spec says "store the user's preferences" and names no fields. What shape?
- Nothing says whether a deleted record is soft deleted, and reads elsewhere would change.
- The feature needs to send an email and no provider has been chosen.
- Two existing patterns could apply and `AGENTS.md` does not say which is current.
- The spec says "only managers can approve" and nothing defines a manager.
- A rule about money, refunds, pricing, discounts, or what a user may see.

**Do not stop.** All of these are implementation the spec or a convention already covers:

- Adding a field the spec explicitly named.
- Choosing a variable, function or file name.
- Adding a loading, empty or error state. Those are required by `ui-guide.md`, not decided.
- Extracting a helper, or splitting a long function.
- Adding an index the spec asked for.
- Picking the order of two independent operations that cannot race.
- Adding a null check, a guard clause, or a type.
- Anything `build-standards.md` already prescribes.

The test is not "is this a choice?" Every line of code is a choice. The test is **"would a
reasonable engineer want to have been asked?"** If they would shrug, build it.

When the test says yes and no spec covers it, stop and say so:

> Building this means deciding **<the decision, in one line>**. Nothing records that yet.
>
> Run `/architect <feature>` and I will build from the spec, or tell me what to assume and
> I will record the assumption and build now.

### The override

The engineer can always say build anyway. A gate that cannot be overridden gets removed,
and then it protects nothing.

If they override:

1. Write an **`Assumed` spec** to `docs/specs/` using `/architect`'s template. Fill in the
   decision as assumed, the reason, and the acceptance criteria you are building to. Mark
   `Status: Assumed`.
2. Add `assumed decision (spec NNNN)` beside the feature's heading in the scope.
3. Build.

The note never blocks the feature from being `done`. It is decision debt, kept visible
until `/architect` ratifies it.

**One thing is never assumable: a business rule.** A technical assumption is recoverable in
a refactor. "I assumed an order can be cancelled after dispatch" is a product decision, and
guessing it produces software that is confidently wrong. For a business rule, ask a single
direct question and wait. Do not offer an override.

## What this skill refuses to do

1. **Never builds on an unmade decision** without recording it as an `Assumed` spec.
2. **Never invents a business rule**, with or without an override. Ask instead.
3. **Never exceeds the spec.** No extra features, no unrequested refactor, no "while I was
   in there". Every change traces to an acceptance criterion. Improvements you notice go in
   the report as suggestions, not in the diff.
4. **Never runs a migration, a seed, a reset, or any database write.** It writes the
   migration file and hands the command over. See `_shared/boundaries.md`.
5. **Never edits a spec.** That file belongs to `/architect`. If the spec is wrong, say so
   and stop.
6. **Never claims done when it is not.** What was skipped is reported as skipped.
7. **Never touches a scope row other than the feature being built**, and never ticks the
   `(spec)` box.

## Reference files

Read the one you need, not all of them.

- `build-standards.md`: how code in this collection is written. Backend, frontend, data,
  and API standards, self contained. Read it on every build.
- `ui-guide.md`: required states, and the contract every list or records page must meet
  (pagination, search, filter, sorting, and the backend work each implies). Read it when
  the feature has a UI.
- `test-guide.md`: what to test and what not to. Read it at `strict` tier, in Step 5b.

## Execution

### Step 1: Read before writing

- The feature's spec in `docs/specs/`. If there is none, apply the gate above.
- The scope row: its `Done when:` line, its tier, any `assumed decision` note.
- Root and nested `AGENTS.md` for stack, commands, and conventions.
- `_shared/stack-defaults.md` only to break a tie the repo leaves open. The repo always wins.
- The code the feature touches. **Look for something that already does this**; extending
  what exists beats adding a second way to do the same thing.

If the spec contradicts the code, stop and say which. Do not design around it.

### Step 2: Plan the build against the criteria

Map the spec's build plan onto real files. Every step names the acceptance criteria it
satisfies. If a step satisfies no criterion, it is scope creep: drop it, or say why the
spec is incomplete and stop.

If a criterion has no step, the spec asks for something you have no plan to build. Say so.

### Step 3: Build

Follow `build-standards.md`. For a UI feature, also follow `ui-guide.md`.

Work in the order the build plan gives. Tick each milestone in the scope as it completes,
so an interrupted session can be resumed by reading the file.

### Step 4: Migrations and other blocked commands

Write the migration file. Do not apply it. Hand it over:

```
The migration is written at <path>. It <what it changes, one line>.
Run it when you are ready:

    <the exact command>

Tell me when it has run, or paste the output.
```

Then wait. Do not continue with work that depends on the applied migration. Work that does
not depend on it may continue; say which you are doing.

### Step 5: Self check

This is the only check a `fast` tier feature gets, so do it properly:

- Typecheck and build, using the commands in `AGENTS.md`.
- Lint and format if the project has them.
- For a UI feature, render the screen and confirm each required state.
- Walk the acceptance criteria one by one and state, for each, whether it is met, not met,
  or unverifiable here. Do not mark one met because the code looks right.

Failures are reported, not hidden. A failing build is the result.

### Step 5b: Tests (`strict` tier only)

On `fast`, skip this entirely and do not mention it.

On `strict`, write tests for what you just built, following `test-guide.md` and whatever
convention `AGENTS.md` records. Cover every acceptance criterion that can be checked without
a browser, the rules in isolation, and the failure cases the spec names.

Then run the suite and report the real result. A test written but not run is not a test, and
**an assertion weakened to make the suite green is worse than no test at all**, because it
turns a real signal into a false one permanently.

If the engineer says skip the tests, skip them and record the step as skipped in the scope
and the report. Skipped is an honest state. Silently absent is not.

### Step 6: Update the scope

For this feature's row only:

- Tick the milestones that are done. Mark any skipped one as skipped, with the reason.
- Set the status to `in-progress`, or `done` if the engineer says so.
- Fill in the code pointer: `code in <path>`.
- Never tick the `(spec)` box. Never touch another feature's row.

### Step 7: Report

```
## /develop · <feature>

**<N> of <M> acceptance criteria met. Build <passes | fails>.**
Built: <one line per milestone completed>
Handed over: <any command the engineer needs to run, exact>          (omit if none)
Not met: <criterion, and why>                                        (omit if none)
Assumed: <the decision recorded as spec NNNN>                        (omit if none)
Noticed: <improvements worth making that were out of scope>          (omit if none)
Next: <`/verify <feature>` on strict, else confirm done with /scope>
```

The `Noticed` line is where refactors and cleanups go. They belong in the report, never in
this diff.
