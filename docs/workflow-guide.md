# Workflow guide

What the skills are for, how the files fit together, and one feature followed from an idea
to shipped. Read the [README](../README.md) first for the short version.

## The problem this solves

An agent asked to build something it has not been told enough about does not stop. It fills
the gap. It picks the ORM that is already installed, invents a status enum, assumes soft
deletes, decides an order cannot be cancelled after dispatch. Each guess is plausible, which
is exactly why nobody catches it, and why it is still there three features later when
something depends on it.

The second problem is quieter: an agent reads the code it just wrote, recognises the shape
of a correct implementation, and reports success. That is not a check. It is the same source
agreeing with itself.

So the collection does two things. It makes decisions happen before code and writes them
down, and it makes every skill say what it could not do.

## The files are the state

Nothing important lives in the chat. The chat ends, gets cleared, or belongs to a teammate
who is not here.

| File | Holds | Written by | Read by |
|---|---|---|---|
| `docs/scope/scope.md` | what to build, in order, and what is done | `scope` | everything |
| `docs/specs/NNNN-*.md` | one decision, with acceptance criteria | `architect` | `develop`, `verify`, `sync` |
| `AGENTS.md` | what is true about this repo | `audit` | everything |
| `.claude/settings.json` | what the agent may run | `guard` | the harness |
| `_shared/stack-defaults.md` | the stack, once decided | `architect`, `audit` | `architect`, `guard`, `develop` |
| `docs/reviews/*.md` | findings from a check | `verify` | you |

One owner each. `/develop` never edits a spec. `/architect` never ticks a build box.
`/sync` never rewrites a paragraph a person wrote. This is what makes it safe to run a skill
without reading its diff every time.

## Scope, spec, code: three altitudes

The most common way a workflow like this rots is putting build tasks in the plan. They
change daily, nobody updates two places, and within a week the plan is fiction.

- **The scope** says *what* and *in what order*. A feature that has no spec yet gets exactly
  one checkbox: its entry command. Coarse on purpose.
- **The spec** says *how*, once, with numbered acceptance criteria. The atomic build steps
  live here and only here.
- **The code** is the code.

The scope carries a two to five item rollup of the spec's build plan. Never the whole thing.

## The acceptance criteria thread

This is the spine. Everything traces back to a number.

```
/scope       writes "Done when: a customer can cancel before the vendor accepts"
   ↓
/architect   grows that into AC-1 … AC-5, each observable
   ↓
/develop     every build step names the criteria it satisfies.
             A step satisfying none is scope creep and gets dropped.
   ↓
/verify      checks each criterion by driving the real app, one at a time,
             and reports the ones it could not check
   ↓
/sync        marks the spec stale if the code has moved away from it
```

A criterion has to be observable, or the thread breaks at `/verify`.
`AC-3 a second cancel returns 409, not 500` can be checked. `AC-3 handles concurrency
correctly` cannot, and is not a criterion.

## The gate, and why it can be overridden

`/develop` applies one test before writing code: *would building this mean deciding
something the engineer has not decided?* If yes and no spec covers it, it stops.

It can always be overridden. A gate that cannot be is a gate that gets deleted, and then it
protects nothing. But the override is not free:

```
you: build it anyway, assume cancelled orders cannot be restored
  →  an `Assumed` spec is written to docs/specs/
  →  the scope row is flagged "assumed decision (spec 0007)"
  →  the feature builds, and can be marked done
  →  the flag stays until /architect ratifies it
```

The asymmetry is the whole design: **building is always allowed, guessing invisibly is not.**

The one thing no override covers is a business rule. A technical assumption is recoverable
in a refactor. A wrong product rule ships as software that is confidently incorrect, so
`/develop` asks a single direct question and waits.

### Keeping the gate calibrated

A gate that stops too often is worse than none, because you learn to override without
reading. `develop/SKILL.md` carries calibration examples for exactly this reason. The test
is not "is this a choice?" — every line of code is a choice. It is **"would a reasonable
engineer want to have been asked?"**

## Where `/guard` sits, and why it is not first

`/guard` writes permission rules the harness enforces. It is the one skill that cannot be
talked past, because it is not a prompt.

It runs **after the stack is known**, not at the start:

```
new project:       /scope → /architect (decides the stack) → /guard
existing project:  /audit (finds the stack)                → /guard
```

Writing Prisma rules onto a project that turns out to be Django is not protection. It is
decoration: it leaves the real tool uncovered while looking like it was covered, which is
worse than nothing, because it replaces caution with confidence.

`/architect` records the decided stack in `_shared/stack-defaults.md`, and `/guard` reads
that. Decision, recorded, then enforced. Same path as everything else here.

## One feature, start to finish

A marketplace, mid build. The next thing is letting customers cancel an order.

**`/scope`** already has the row, from planning:

```markdown
### 7. Cancel an order · needs a decision
Let a customer stop an order before it ships, without a support ticket.
**Done when:** a customer can cancel before the vendor accepts, and request cancellation after.
- [ ] Design it (spec): `/architect cancel an order`
```

One box, because nothing has been decided yet.

**`/architect cancel an order`** asks the questions that change the design: who may cancel,
until when, what happens to money, what happens when the vendor accepts at the same moment.
It recommends an answer to each. It writes `docs/specs/0007-cancel-an-order.md` with five
acceptance criteria, including the two that matter most:

```
AC-5 A second cancel on an already cancelled order returns 409, not 500.
AC-4 After dispatch, no cancel control renders and the endpoint refuses it.
```

At `strict` it offers a second model to read the spec before it locks. That critic finds
the thing the conversation missed: the spec says "no automatic refunds in v1" but never
says what happens to an authorised payment. That is a decision, not an omission, and it is
cheap to make now and expensive to discover in a fortnight.

Then it fills in the scope row: the spec box ticked, the spec linked, three build
milestones, and a verify box because this project is `strict`.

**`/develop cancel an order`** reads the spec and builds. It maps each step to criteria. It
writes the migration and **hands the command over rather than running it**, because that is
what the boundary says. At `strict` it writes tests for the rules and the failure cases, and
runs them. It self checks, then reports four of five criteria met and says which one it
could not check and why.

**`/verify cancel an order`** starts the real app and takes the criteria one at a time. It
tries to cancel as a user who does not own the order, because a feature where the button is
hidden but the endpoint is open passes a lazy check and fails in production. It cancels
twice to see whether AC-5 is real. It reports what it could not check: the payment
authorisation, which needs a provider in a real state.

**`/verify review`** puts the diff in front of a model that did not write it, along with the
spec, so the review can judge against the contract rather than against taste.

**`/sync`** at merge: ticks what is genuinely done, notices the test command in `AGENTS.md`
changed, rewrites that one line and names the change, and reports that spec 0003 now
contradicts the code.

## Running out of context

Because the state is in files, handoffs are free. Every skill ends by suggesting `/clear`.
A fresh session reads the scope and the spec from disk and knows everything that matters. A
long conversation is not memory, it is cost.

## When things break

`/debug` is the one skill that is not part of the line. Reach for it whenever something is
failing, throwing, or behaving wrong.

It exists because debugging goes wrong in two predictable ways. The first is fixing the
symptom: the error stops appearing, the cause is still there, and it returns somewhere less
convenient. The second is the fix that grows: while in the file, three other things get
tidied, and now the change cannot be reviewed or reverted.

So it is a loop with a hard edge around it:

```
reproduce → localize → hypothesise → test the hypothesis → fix → verify → regression test
```

Reproduce is never skipped. A fix for a bug nobody has seen fail is a guess wearing a commit
message, and if it cannot be reproduced the skill stops and says what it needs instead of
changing code to see what happens.

A hypothesis has to be stated in a form that can be wrong, before it is tested. One change
at a time: changing three things and watching the error disappear tells you nothing about
which one mattered, and leaves two unnecessary changes in the diff.

Then the fix goes at the cause, not where it surfaced, and the original reproduction is run
again. "Should be fixed" is not a result.

It also knows when a bug is not a bug. If the code is doing what the spec told it and the
spec is wrong, that goes back to `/architect`, because patching the code to contradict its
own spec leaves the two disagreeing and nothing recording which one is right.

## What this does not do

- It does not stop you shipping something bad. It stops you shipping something nobody
  decided.
- It does not guarantee coverage. `/develop` writes tests at `strict`; it does not promise
  they are enough.
- It does not make the permission rules airtight. Chained commands can slip past a prefix
  rule. The database gate reads the whole command; the git and migration rules are a strong
  net, not a wall.
- It does not replace review by a person. It gets the diff into a state worth reviewing.
