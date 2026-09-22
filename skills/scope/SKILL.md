---
name: scope
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, AskUserQuestion
description: "Run /scope to turn a product idea into an ordered, living plan saved where the project chooses (docs/ by default), or run it bare to reconcile what shipped and queue what is next. Decides WHAT to build and in what order, and flags which features need a decision before code. Never picks tools, never writes build tasks, specs, or code."
---

## What this skill does

Turns an idea into an ordered, coarse, living plan, and keeps it honest as you ship.

It answers **what to build, in what order, and which parts need a decision first**.
It does not answer *how* to build any one of them. That is `/architect` (the decision)
and `/develop` (the code).

One command, inferred mode. Never a subcommand:

- **plan** (default): no scope yet, or you are planning the next slice.
- **replan**: a scope exists and you ran `/scope` bare. Reports where things stand,
  reconciles what shipped, and queues what is next. This is the normal rhythm, not a rare event.
- **add**: a scope exists and the argument names one feature. Enrolls one row without replanning.

## The core rule: this file stays coarse

A scope that lists build tasks rots within a week, because the tasks change every day and
nobody updates two places. So:

- A feature that is **not yet designed** gets **exactly one checkbox**: its entry command.
- Atomic build steps live in the spec's build plan, written by `/architect`. Never here.
- The scope carries intent, order, status, and one `Done when:` line. Nothing else.

## What this skill refuses to do

These refusals are the skill. Read them as hard rules, not preferences.

1. **Never name a tool.** No library, ORM, provider, host, or framework, not even in passing.
   A feature that implies a tool choice is exactly `needs a decision`. Naming the tool here
   silently makes the decision and skips `/architect`.
2. **Never write build tasks.** One box per undesigned feature. No UI/API/model/test subtasks.
3. **Never delete a row.** A de-scoped feature becomes `dropped`. History stays honest.
4. **Never create a dated or numbered file.** The scope is edited in place, always.
5. **Never write code, specs, `AGENTS.md`, or anything outside the scope folder.**
   One artifact, one owner.
6. **Never touch an `existing` row.** Code that predates this workflow is enrolled for
   context only, and the pipeline leaves it alone.
7. **Never ask more than two rounds of questions.** See below.

## Asking: two rounds, hard cap

You are a senior product engineer, not a form.

- **Infer** everything the idea already states. Do not ask what you were just told.
- **Round 1** (always): the MVP boundary, and which cross cutting capabilities are in scope.
- **Round 2** (only if something load bearing is still genuinely unclear): at most 4 questions.
- **Then stop.** Anything still unknown becomes a written assumption in the scope's
  `## Assumptions` section, phrased so it is easy to correct.

A written assumption the engineer can read and fix beats a fourth round of questions they
will route around by not running this skill at all. Never exceed two rounds.

Every question is a **decision panel**, never a neutral menu: 2 to 4 concrete options real to
this product, with exactly one marked `(recommended)` and a one line why. Use the agent's
picker when it has one (`AskUserQuestion`), otherwise the same options as plain text. The
picker appends its own free text option, so never add your own.

## The two dials

**Build approach** (project default, set once in Step 3):

- `vertical`: each feature built end to end through every layer, working. The default for a
  real product. Recommend this unless there is a clear reason not to.
- `mvp-first`: ship the thinnest usable whole first, then grow it. For validating one core
  loop fast.

**Workflow tier** (project default, set once in Step 5, overridable per feature with a tag):

- `fast`: `/develop` builds and self checks, then the feature can be `done`.
  For prototypes, experiments, internal tools.
- `strict`: after `/develop`, run `/verify`, then `/review`.
  For anything with real users, money, auth, or personal data.

The tier governs only what happens **after** `/develop`. It never turns off the decision gate:
at either tier, a feature that needs a load bearing decision still goes to `/architect` first.

## Status lifecycle

`/scope` only ever writes `planned`, `existing`, `in-progress` (brownfield partial), and `dropped`.

| Status | Meaning | Who sets it |
|---|---|---|
| `planned` | on the plan, not started | `/scope` |
| `in-progress` | being built | `/develop` |
| `done` | you decided it is done | you, any skill records it |
| `existing` | predates this workflow, enrolled for context | `/scope` |
| `dropped` | de-scoped, kept for history | `/scope` replan |

`done` is yours to declare. No skill withholds it until boxes are ticked. A feature built on an
assumed decision (an `Assumed` spec, recorded by `/develop` when you chose to build before
deciding) carries a note until `/architect` ratifies it. The note never blocks `done`; it is
decision debt kept visible.

## Where the file goes

The first time this skill writes in a project, it asks where to save **the scope**:
`docs/` (recommended), `.claude/stop-guessing/`, another folder, or not at all. Specs and
reviews are asked about separately, by the skills that write them. The answer is remembered
per project. Follow `_shared/workflow-files.md`. The scope is `<that folder>/scope/scope.md`; paths below written as
`docs/scope/` mean that folder.

If the answer is not to save, show the plan in the chat, and say that replan and add will
have nothing to build on next time.

Monorepo: one scope per workspace at `docs/scope/<workspace>/scope.md`.

Shared across sessions and teammates: read the file again immediately before writing, make
surgical edits (append rows with the next free number, update changed cells), never rewrite
the whole file, and flag unexpected state rather than clobbering it.

## Execution

### Step 0: Note the safety boundary, do not set it

Check for `.claude/stop-guessing.json`. If it is missing, mention `/guard` once, in one
line, in the closing report rather than up front:

- **Brownfield** (the repo already has code, so the stack is known): recommend `/guard`
  now, before `/architect`. There is real data to protect and the rules can be specific
  immediately.
- **Greenfield** (no stack yet): say that `/guard` comes after `/architect` decides the
  stack, so its rules match what was actually chosen. Running it earlier would write rules
  for tools the project may not use, and mean running it twice.

Nothing in this skill touches a database, a migration, or git history, so planning safely
precedes the boundary being set.

Never write permission rules yourself. That is `/guard`'s job.

### Step 1: Infer the mode

Check whether a scope exists in this project's chosen location (`_shared/workflow-files.md`), then:

- Scope exists, no argument, or you were asked "what's next" → **replan**, read `modes/replan.md`.
- Scope exists, argument names one feature → **add**, read `modes/add.md`.
- No scope yet, or you were given a product sized idea or asked to plan the next slice →
  **plan**, read `modes/plan.md`.

Ambiguous between a new slice and a single feature: pick the most likely reading, and say
which you chose in the report. Truly unclear: one short clarifying question.

Plan mode with no idea given and no scope to extend, stop and ask before anything else:

> What are you building? One or two sentences about what it does and who it is for.

### Step 2: Read exactly one mode file and follow it

Read only the one mode file Step 1 selected. Everything above still applies.
`scope-template.md` is the format reference, read it when you write the file or the report.
