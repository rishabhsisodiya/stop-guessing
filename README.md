# stop-guessing

A set of [Agent Skills](https://agentskills.io) that stop a coding agent from inventing the
decisions you never made, and from telling you a job is done when it is not.

Your agent will happily build a feature that needs a decision nobody took. It picks an ORM
because one was already installed. It invents a status enum. It assumes soft deletes. None
of it is obviously wrong, which is why it survives until it is load bearing, and you find
out three features later.

These skills make the decision happen first, write it down, and then refuse to build past
it. State lives in files, not in a chat session, so work survives `/clear`, a new session,
a new machine, and a teammate.

```
idea → /scope → /architect → /guard → /develop → /verify → /sync
```

Run only what a change needs, in any order.

## The skills

| Skill | What it does |
|---|---|
| `scope` | Turns an idea into an ordered, living plan of what to build, and keeps it current. |
| `architect` | Makes one load bearing decision properly and writes it as a spec with acceptance criteria. |
| `guard` | Decides what the agent may run on its own, and writes it where the harness enforces it. |
| `develop` | Builds a feature from its spec. Stops if building would mean inventing a decision. |
| `audit` | Writes the `AGENTS.md` context files every other skill reads. |
| `verify` | Proves the feature works against its criteria, and reviews the code on a fresh model. |
| `debug` | Reproduces a failure, finds the cause by evidence, fixes only that, leaves a regression test. |
| `sync` | Reconciles the scope, `AGENTS.md` and spec statuses against what the repo now shows. |

Run `/debug` whenever something breaks. It is not part of the line above; it is what you
reach for when the line stops working.

## The two ideas

**1. A decision gets written down before it gets built.**

`/architect` writes a spec. `/develop` reads it, and if there is no decision behind what it
is being asked to build, it stops:

> Building this means deciding **whether a cancelled order can be restored**. Nothing
> records that yet. Run `/architect`, or tell me what to assume and I will record it.

You can always override. But then the assumption becomes a file with your name on it
instead of a silent guess in a diff. Building is always allowed; guessing invisibly is not.

One thing is never assumable, with or without an override: **a business rule**. A technical
assumption is recoverable in a refactor. "I assumed an order can be cancelled after
dispatch" is a product decision, and guessing it produces software that is confidently wrong.

**2. A result comes with its limits attached.**

Every skill states what it could not do, in the same breath as what it did.
`/verify` reports what it could not check, not only what passed. `/guard` says when a
migration tool your project uses has no rules. `/architect` records what a decision forecloses. A
skipped step is recorded as skipped, never as done.

A result with its limits attached is worth more than a clean result that was not true.

## `/guard`: the agent cannot run what you did not allow

Most skills write markdown. This one writes permission rules into `.claude/settings.json`,
where the harness enforces them and no prompt can talk its way past.

Two questions, one run, and by default the agent can no longer:

- write to your database (a hook reads each command; reads pass, writes are handed to you)
- run a migration, seed or reset
- `git push`, `reset`, `rebase`, or anything that rewrites history
- `sudo`, `rm -rf`, `npm publish`, `curl | bash`, or deploy to production
- edit its own permission files

When it needs one of those, it stops and hands you the exact command instead of asking to
run it itself.

It runs **after** `/architect` decides the stack, so its migration rules match the tool you
actually chose rather than one it guessed at. Covers Prisma, Drizzle, TypeORM, Knex,
Sequelize, MikroORM, Django, Alembic, Rails, Laravel, goose, Flyway, Liquibase and EF Core.
If your project uses a migration tool that is not on that list, it says so plainly: that
tool's commands are not blocked.

Remove it any time with `/guard remove`.

## Install

> **Not yet verified.** This repository is new and the install command below has not been
> confirmed end to end. Until it is, clone the repo and copy `skills/` into your agent's
> skills directory (`.claude/skills/` for Claude Code), then restart.

```bash
npx skills@latest add <your-username>/stop-guessing -a claude-code
```

Works with any Agent Skills client. `AGENTS.md` is the tool agnostic context file; a thin
`CLAUDE.md` points at it.

### As a plugin, which avoids name clashes

Several of these names are generic, and other workflow collections use the same ones.
`scope`, `audit`, `architect`, `develop`, `sync` and `debug` all appear elsewhere. Skills
installed loose share one flat namespace, so two collections with an `audit` will shadow
each other, and nothing tells you which one ran.

Installing as a plugin namespaces them, so both can coexist. From a terminal:

```bash
claude plugin marketplace add <your-username>/stop-guessing
claude plugin install stop-guessing@stop-guessing
```

Or, inside the interactive CLI, the same thing as `/plugin marketplace add …` and
`/plugin install …`. The `/plugin` command is not available in the IDE extensions, so from
VS Code use the terminal commands above, then start a new session.

The skills are then `stop-guessing:audit`, `stop-guessing:scope` and so on. `/audit` still
works on its own while nothing else claims that name.

Install loose (below) if you are only running this collection and prefer the shorter names.

### Once for the machine, or once per project?

Either works, and the skills behave the same.

| | `~/.claude/skills/` | `<repo>/.claude/skills/` |
|---|---|---|
| Available in | every project | that repo only |
| Committed | no | yes, so your team gets them |
| Updating | one place | per repo |

**Installing once for the machine is usually right.** These are general workflow skills, and
everything they produce is already per project: `AGENTS.md`, `docs/scope/`, `docs/specs/`,
and the permission rules `/guard` writes to that repo's `.claude/settings.json`.

Install per project when your team should get the same workflow from a clone, or when you
want different versions of the skills in different repos.

One consequence either way: `skills/_shared/stack-defaults.md` lives beside the skills, so a
machine wide install means a machine wide preference file. It holds only what you prefer;
what a given repo actually uses is recorded in that repo's `AGENTS.md`, and no skill writes
project facts into the preference file.

## Where to start

**Existing codebase:** `/audit` first, so every skill understands your project. Then
`/guard`, since the stack is already known and there is real data to protect. Then `/scope`
the next slice.

**New project:** `/scope` the idea, `/architect` the stack, scaffold it, `/audit` the real
project, `/guard`, then build feature by feature.

**One change:** run only what it needs. A small change can be `/develop` on its own.

## Two dials, not ten

**Build approach**, set once: `vertical` (each feature end to end) or `mvp-first` (thinnest
usable whole, then grow).

**Workflow tier**, set once and overridable per feature:

| | After `/develop` |
|---|---|
| `fast` | nothing. It self checks and you are done. Prototypes, experiments, internal tools. |
| `strict` | `/verify` against the real app, tests, then `/review` on a fresh model. Real users, money, sign in, personal data. |

The tier governs only what happens after the build. **It never turns off the decision gate:**
at either tier, a load bearing decision still goes through `/architect` first.

## What gets written, and where

| Artifact | Path | Owner |
|---|---|---|
| Scope | `docs/scope/` | `scope` |
| Specs | `docs/specs/` | `architect` |
| Context files | `AGENTS.md` (+ a thin `CLAUDE.md`) | `audit`, kept current by `sync` |
| Review findings | `docs/reviews/` | `verify` |
| Permission rules | `.claude/settings.json` | `guard` |
| Code and tests | your source tree | `develop` |

One artifact, one owner. No skill edits another skill's file.

If `docs/` is a published docs site, these move to `.workflow/` so they do not ship with it.

## Make it yours

Everything here is meant to be edited. The file format takes twenty minutes; the judgment
is the product.

- `skills/_shared/stack-defaults.md` — your stack. Skills put it first in recommendations.
  **Edit this first.**
- `skills/_shared/boundaries.md` — what an agent may never run, and how it hands work over.
- `skills/develop/build-standards.md` — how code gets written. Replace with your own.
- `skills/develop/ui-guide.md` — required screen states, and the list page contract
  (pagination, search, filter, sorting, and the backend work each implies).
- `skills/develop/SKILL.md` — the gate, and the calibration examples that keep it from
  stopping too often. **The most important file in the collection.**

## What this does not protect against

Stated plainly, because a safety tool you trust too much is worse than one you understand:

- **Chained commands.** Permission rules match command prefixes, so `cd app && git push`
  can slip past. The database gate reads the whole command and does not have this weakness.
  The git and migration rules are a strong net, not a wall.
- **Migration tools not in the list.** If your project uses one, `/guard` says its commands
  are not blocked. Read that line when it appears.
- **Windows is untested.** macOS and Linux only, for now.
- **The gate is judgment, not proof.** It catches the large majority of unmade decisions.
  No prompt catches all of them.
- **Tests are written, not guaranteed.** `/develop` writes them at `strict` tier and runs
  them. It does not promise coverage.

## Licence

MIT. See [LICENSE](LICENSE).
