---
name: guard
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion
description: "Run /guard to decide what this agent may run on its own: database writes, migrations, and destructive git. Runs twice in a project's life, once at the start for the rules every project needs, and again once the stack is known to cover that stack's migration tools. Writes the rules into .claude/settings.json so the harness enforces them."
---

## What this skill does

Sets the safety boundary for a project and writes it where the harness enforces it.

An agent that can run `prisma migrate reset` or `git reset --hard` will eventually run one
at the wrong moment. A skill instruction does not prevent that, because a skill is a prompt
and a prompt can be forgotten in a long session. `.claude/settings.json` is not a prompt.

## Two layers, because the stack is not known on day one

A greenfield project has no stack until `/architect` decides one. Writing Prisma rules onto
a project that turns out to be Django is not protection, it is decoration: it leaves the
real tool uncovered while looking like it was covered. That is worse than nothing, because
it replaces caution with confidence.

So the rules land in two passes:

**baseline** — runs first, on any project, no stack knowledge needed.
Commands that are wrong everywhere: `sudo`, `rm -rf`, `git push`, history rewriting,
`npm publish`, `curl | bash`, production deploys, Docker volume wipes, staging a `.env`,
and a lock on the agent editing its own permission files. Plus the read only database gate,
which is stack independent by design: it only acts when it actually sees a database client
in a command, so it can never create false confidence.

**stack** — runs once the stack is known.
The migration and schema commands for *that* stack, and nothing else.

### When to run it: once, after the stack is known

The recommended flow is **one run, both layers together**, once something knows what the
project is built with:

```
greenfield:  /scope  →  /architect "stack & architecture"  →  /guard
brownfield:  /audit finds the stack in the repo            →  /guard
```

One conversation, one set of rules, every rule specific to this project. Running earlier
means a second conversation later and a pile of rules for tools the project does not use.

Run the baseline on its own only when protection is wanted before the stack exists, for
example a brownfield repo with real data that is about to be explored. Then the stack layer
follows once the stack is confirmed. Two runs, deliberately.

Nothing is built during `/scope` and `/architect`, so waiting costs little: those skills
write markdown and make decisions, they do not touch a database or a migration.

The stack comes from the project, in this order: the Stack table in `AGENTS.md`, the stack
spec in `docs/specs/`, then `--detect` reading the repo. `_shared/stack-defaults.md` is a
machine wide preference and is **not** evidence about this project, so it is never used to
decide which rules to write.

## The one rule that does not change

Whatever profile is chosen, **a skill never runs a blocked command another way**: no
wrapping it in a script, no package script, no piping through another tool, no asking a
subagent. It stops and hands the command to the engineer. See `_shared/boundaries.md`.

## Honesty requirement

The stack rules are written for the migration tools this project actually uses, taken from
`AGENTS.md`, the stack spec, and detection. Report those as covered.

**Flag a gap only when there is one:** a migration tool this project uses that the generator
has no rules for (a tool not in its `STACKS` table). Say plainly that its commands are not
blocked. A user who believes migrations are blocked when their tool is not handled is worse
off than one who knows the limit.

Do **not** list tools the project does not use. They are not a gap, and listing them buries
the one line that matters.

Say the other limit too, once: deny rules match command prefixes, so a chained command such
as `cd app && git push` can slip past. The database gate reads the whole command and does
not have this weakness. The git and migration rules are a strong net, not a wall.

## Execution

### Step 0: What is already set, and is the stack known?

Read `.claude/stop-guessing.json`, then `AGENTS.md`, then the repo.

- Config missing, **stack known** → the normal case. Ask Steps 1 and 2, confirm the stack
  in Step 4, then apply both layers in one pass with `--layer all`. One run, done.
- Config missing, **stack not known** → say so and recommend waiting:
  > The stack is not decided yet. Running `/guard` now would write rules for tools this
  > project may not use, and you would run it again later anyway. Run `/architect` first,
  > then `/guard` once, and every rule will be specific to what you actually chose.
  >
  > If you want the universal rules now anyway (no `sudo`, no `rm -rf`, no `git push`,
  > no publishing, read only database), say so and I will apply the baseline on its own.
  Only apply the baseline if they ask for it.
- Config present, `stackLayer` false, stack now known → go straight to Step 4.
- Config present and complete → print the current state in one line and ask whether to
  change it, re-detect, or remove everything. Stop if they say no.

If `.claude/settings.json` already has a `deny` list that this skill did not write, say so
and ask before touching it. Never silently overwrite someone else's rules.

### Step 1: Ask the profile (one panel)

- question: "What should this agent be allowed to run on its own? You can change this any
  time by running `/guard` again."
- header: "Safety"
- options:
  - `strict (recommended)`: "Read only on the database. It never runs a migration, a reset
    or a seed, and never runs a git command that can lose or publish your work. When it
    needs one of those, it hands you the exact command to run yourself."
  - `balanced`: "Read only on the database, destructive git still blocked, but migration and
    seed commands ask you each time instead of being refused. Best for local development
    where you run migrations constantly."
  - `open`: "No extra restrictions. You rely on the normal permission prompts. Best for a
    throwaway project or a sandbox with nothing to lose."

Recommend `strict` unless the engineer has already said this is throwaway.

### Step 2: Ask about commits (one panel)

Skip entirely when the profile is `open`.

- question: "Should the agent be able to commit on your behalf?"
- header: "Commits"
- options:
  - `No, I commit myself (recommended)`: "It writes code and stages nothing. You review the
    diff and commit. Pushing is blocked in every profile except open."
  - `Yes, on a branch`: "It may run `git add` and `git commit`, never on the default branch,
    never `git push`."

### Step 3: Apply

Normal case, stack known, both layers in one pass (confirm the stack list in Step 4 first,
then run this once):

```
node <this skill's dir>/apply-profile.mjs --layer all --stacks <confirmed,list> --profile <profile> --commits <deny|allow> --scope project
```

Baseline on its own, only when the engineer asked for it before the stack exists:

```
node <this skill's dir>/apply-profile.mjs --layer baseline --profile <profile> --commits <deny|allow> --scope project
```

`--scope project` writes `.claude/settings.json`, which is committed and applies to the
whole team. Use `--scope user` only when the engineer explicitly asks for a machine wide
default, and then only for this baseline layer, never the stack layer: stack rules belong
to a project, not to a machine.

Add `--dry` first if the engineer wants to see it before it is written.

Then write `.claude/stop-guessing.json`:

```json
{ "profile": "strict", "commits": "deny", "baselineAt": "<date>", "stacks": [], "stackLayer": false }
```

Say what happens next: the stack rules come later, once the stack is known, and until then
migrations are not covered.

### Step 4: The stack layer

Reached when the stack is known: `AGENTS.md` records it, a stack spec decided it, or the
engineer says so.

Run detection as a starting point, never as the answer:

```
node <this skill's dir>/apply-profile.mjs --detect
```

Then reconcile what it found with `AGENTS.md` and the stack spec, and **confirm the list
with the engineer in one panel** before writing anything. Detection reads files;
the engineer knows the project. Where they disagree, the engineer wins.

```
node <this skill's dir>/apply-profile.mjs --layer stack --stacks <confirmed,list> --profile <profile> --scope project
```

Update `.claude/stop-guessing.json` with the stacks and `"stackLayer": true`.

If the project uses a migration tool the generator does not know, say so plainly: those
commands are not covered, and adding it means one entry in the `STACKS` table in
`apply-profile.mjs`. Offer to add it.

### Step 5: Removing it

`/guard remove`, or the engineer asking to undo it:

```
node <this skill's dir>/apply-profile.mjs --remove --scope project
```

It takes back out every rule this skill knows how to add, and removes the database gate.
Rules somebody else wrote are left alone. Confirm before running it, then delete
`.claude/stop-guessing.json`.

### Step 6: Report

```
Safety: <profile> · commits: <you | agent on a branch> · layer: <baseline | baseline + stack>
Blocked: <one line of what this covers>
Not covered: <a migration tool this project uses that has no rules, or "stack rules not applied yet">   (omit when there is no gap)
Rules in .claude/settings.json (<N>). Commit it to share with your team.
Change it with /guard, remove it with /guard remove.
```

Then, once: when a skill needs a blocked command, it prints the exact command for you to
run rather than asking permission to run it itself.

## If a rule gets in the way

Say this plainly rather than working around it. The engineer can remove a single rule from
`.claude/settings.json`, re-run `/guard` with a different profile, or run
`apply-profile.mjs --remove`. Note that the agent cannot edit its own permission files, by
design, so unblocking is always the engineer's action.

## Restart note

Settings are picked up on reload. If a rule does not seem to apply yet, tell the engineer to
open `/hooks` once or restart. Never test enforcement by running a destructive command.
