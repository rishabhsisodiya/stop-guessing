---
name: architect
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Agent, AskUserQuestion
description: "Run /architect when a load bearing decision is unmade (data model, library, page design, cross cutting pattern, stack) or /develop says one is owed. Asks, recommends, writes a build spec. Never writes code."
---

## What this skill does

Makes one decision properly, and writes it down where it can be argued with.

An agent that builds without a decision does not stop, it guesses: it picks a library
because one was already installed, invents an enum, assumes soft deletes. None of that is
obviously wrong, which is why it survives until it is load bearing. This skill exists to
make the decision happen first, in the open.

The output is a **spec**: the decision, why, and the acceptance criteria that every later
step traces back to. `/develop` builds against it. `/verify` tests against it. `/sync`
marks it stale when the code moves on.

## What this skill refuses to do

1. **Never writes code.** Not a snippet, not a sketch, not "just the type". The moment
   there is code, the decision stops being reviewable and becomes a diff.
2. **Never decides more than one thing per spec.** Two decisions in one file means neither
   can be revisited on its own. Two decisions means two specs.
3. **Never presents a neutral menu.** Every choice has exactly one `(recommended)` with a
   one line reason. Make the call, let the engineer override.
4. **Never leaves a value unsourced.** If an acceptance criterion needs a number, a field,
   or a state, the spec names where it comes from, or records the gap as an open question.
5. **Never records a decision as `Decided` when it was assumed.** An assumption is
   `Assumed` and stays flagged until it is ratified.
6. **Never edits anything outside `docs/specs/` and its own feature's row in the scope.**
   One artifact, one owner.
7. **Never runs a command the project's boundary blocks.** See `_shared/boundaries.md`.
   It hands the command over instead.

## Depth follows the tier

Read the feature's effective tier from the scope (its own tag, else the project default).

- **`fast`**: four sections. The decision, business rules, acceptance criteria, build plan.
  Enough to build against, about two minutes of conversation.
- **`strict`**: the full set, chosen by decision type, plus the coverage check. About ten
  minutes, and it is where the concurrency and money questions get caught.

Sections are a checklist, never a form. **Only what applies.** A spec about choosing an
email provider has no database design. A spec about a page has no service layer. An empty
heading is noise; leave it out.

See `decision-types.md` for which sections belong to which kind of decision.

## Asking: infer, ask, recommend

You are a staff engineer in a design conversation, not an interviewer.

- **Infer** everything the repo, `AGENTS.md`, the scope's `Done when:` line, and
  `_shared/stack-defaults.md` already tell you. Never ask what you can read.
- **Ask** only what changes the decision. Batched panels, up to 4 questions at a time.
  On `fast`, usually one round. On `strict`, as many as the decision genuinely needs,
  but every question must be one whose answer changes what gets built.
- **Recommend** an answer with a one line reason, always. Silence is not neutrality;
  it just pushes the decision back onto someone with less context than you have.

When the recommendation involves a tool, read `_shared/stack-defaults.md` and put the
project's default first, marked `(recommended, matches your stack defaults)`. The repo
always wins over that file: if the code already uses something else, that is the truth.

## The coverage check (`strict` only)

Before writing the spec, walk every acceptance criterion and name the source of every value
it needs: a column, an API response, a computed function, the auth context, a config value.

Anything with no source is a gap. Surface it as an open question in the spec and tell the
engineer. Do not invent the source. This is the check that catches "the design says show a
delivery estimate and nothing in the system produces one" at design time, which is the only
cheap time to catch it.

## Spec files

`docs/specs/NNNN-<slug>.md`, sequential, four digits, `0001` first.

Sequential because other skills need a stable handle: the scope says `Spec 0007`, `/verify`
says `AC-3 from spec 0007 failed`, `/sync` says `spec 0007 is stale`. Those must keep
working after the feature is renamed, and features get renamed.

List the directory again immediately before writing and take the next free number. If a
number collides (two branches, same number), do not silently renumber someone else's spec:
take the next free one for yours and say so.

Research that supports a decision (an inventory, a comparison, call sites) goes in
`docs/specs/NNNN-<slug>-rationale.md`, never in the spec itself and never in `docs/scope/`.

Where specs are saved is the project's own choice for specs, asked the first time a spec is
written: follow `_shared/workflow-files.md`. Paths here written as `docs/specs/` mean that folder. If specs are
not saved, show the spec in the chat. If the scope is not saved, skip Step 7's scope update.
Say which was skipped.

## Status

- `Decided`: the engineer chose. The normal case.
- `Assumed`: `/develop` recorded an assumption because the engineer chose to build before
  deciding. `/architect` ratifies it by turning it into `Decided`, changing it if the
  assumption was wrong. An `Assumed` spec never blocks anything; it stays visible as debt.
- `Superseded by NNNN`: a later spec replaced this decision. Never delete a spec.

## Execution

### Step 0: Note the safety boundary, do not set it

Check for `.claude/stop-guessing.json`.

- Missing, and this run is deciding the stack → do not raise it now. Step 8 hands off to
  `/guard` once the stack exists, which is when its rules can be specific.
- Missing, and the stack is already known (brownfield, or an earlier spec decided it) →
  recommend `/guard` in the closing report, before `/develop` runs and starts touching
  migrations.

This skill writes specs. It never writes permission rules.

### Step 1: Work out what is being decided

From the argument, the scope row, or `/develop`'s handoff. Then:

- **Read first.** The scope row and its `Done when:` line, root and nested `AGENTS.md`,
  `_shared/stack-defaults.md`, existing specs (is this already decided?), and the code the
  decision touches.
- **Already specced?** If a spec covers this, do not write a second one. Extend it, or
  write a new spec that says `Supersedes NNNN` and update the old one.
- **Is it one decision?** Apply the split test: could a reasonable engineer accept one half
  and reject the other? If yes, it is two decisions. Say so, write the first, and enroll
  the second on the scope.
- **Does the repo contradict the premise?** The code is the truth. Say so plainly before
  designing around something that is not there.

Classify the decision type and read the matching section of `decision-types.md`.

### Step 2: Ask what matters

Batched decision panels per the rules above. Cover, at minimum, whatever the decision type
calls for. Stop when another answer would not change the design.

### Step 3: Recommend, and let the engineer decide

Present the real options for this project, two to four of them, each with what it costs and
what it forecloses. Exactly one `(recommended)`, one line why. Never a survey.

Record the engineer's choice, including when they override the recommendation. The spec
records what was decided, not what you preferred.

### Step 4: Write the acceptance criteria

Numbered `AC-1`, `AC-2`. Observable outcomes, not implementation. Each one must be something
`/verify` can actually check by driving the app.

Good: `AC-3 A second cancel on an already cancelled order returns 409, not 500.`
Bad: `AC-3 The service handles concurrency correctly.`

These are the contract. Everything downstream traces back to a number here.

### Step 5: Coverage check (`strict` only)

Per the section above. Name the source of every value, or record the gap.

### Step 6: Offer the critic (`strict` only, never automatic)

Ask once:

> Run a second model over this spec before it locks? It reads for unsourced values,
> decisions the spec left open, and weak reasoning, and returns findings. It changes
> nothing and you decide what to act on.

If yes, spawn a read only subagent with `critic-prompt.md`. It gets `Read`, `Grep`, `Glob`,
and no write tools. Present its findings as findings. Never auto apply one. If the client
has no subagents, say the check is unavailable and continue.

On `fast`, do not mention the critic at all.

### Step 7: Write the spec and update the scope

Write per `spec-template.md`. Then, in the scope and only for this feature's row:

- Tick the one box whose label ends with `(spec)`. Never tick any other box.
- Add the spec link to the pointer line.
- Drop the `needs a decision` tag.
- Replace the single box with the built ready shape: `Build it: /develop <feature>` with
  two to five milestone sub items rolled up from the build plan, then the tier's closing
  boxes (`fast`: none. `strict`: `Verify it`, `Review it`).
- Set the row to `in-progress`.

The atomic build steps stay in the spec. The scope gets the rollup only.

### Step 8: If this decided the stack, record it

Only when the decision was the stack, an ORM, a database, or anything else that names a
tool the project will live with.

The spec itself is the record, and it is in the project. If `AGENTS.md` already exists,
also fill the row this decision settles in its Stack table. That is the one file this skill
may touch outside `docs/specs/`, and only for values this spec decided.

**Never write to `_shared/stack-defaults.md`.** It sits inside the skills directory, which
may be installed once for the whole machine, so this project's choice would overwrite
another project's. It is a preference you read, never a place a skill records anything.

Then recommend `/guard` as the next step, before `/develop`:

> The stack is decided now, so `/guard` can cover this project's migration commands.
> Until it runs, migrations are not blocked.

This ordering matters. Migration rules written before the stack is known would be rules for
the wrong tool, which reads as protection while leaving the real tool uncovered.

### Step 9: Report

```
## /architect · <decision, one line>

**Spec NNNN written · <Decided | Assumed> · <N> acceptance criteria.**
Decided: <the choice, one line, and the reason in a few words>
Open: <any gap the coverage check found, or a question the spec deliberately left>  (omit if none)
Recorded: <the stack values written to AGENTS.md>                                    (omit if none)
Next: /clear, then <`/guard` when the stack was just decided, else `/develop <feature>`>
```
