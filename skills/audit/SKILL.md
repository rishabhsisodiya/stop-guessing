---
name: audit
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, AskUserQuestion
description: "Run /audit to write the AGENTS.md context files every other skill reads: the real stack, the commands that actually work, the folder layout, the conventions the code actually follows. Run it first on an existing codebase, or after the stack is scaffolded on a new one. Records only what it can see evidence for, and never overwrites anything a human wrote."
---

## What this skill does

Writes down what is true about this project, so every other skill stops guessing.

`/develop` reads `AGENTS.md` to know the test command. `/architect` reads it to know the
patterns in use. `/verify` reads it to know how to start the app. Without it, each of them
re-derives your project from scratch every session, and gets it slightly wrong each time.

The output is `AGENTS.md` at the repo root, plus nested ones where a subdirectory genuinely
differs, plus a thin `CLAUDE.md` that points at it so Claude Code picks it up too.

## Facts, not standards

This is the line that keeps `AGENTS.md` useful:

- **A standard** is how code should be written, is true of every project, and already ships
  in `develop/build-standards.md`. Do not copy any of it here.
- **A fact** is what is true of *this* repo, and can only be discovered by reading it.

`AGENTS.md` holds facts. "No query inside a loop" is a standard and does not belong here.
"Tests are `pnpm test:unit`, and services live in `src/modules/<name>/`" is a fact and does.

If you cannot point at the evidence, it is not a fact.

## What this skill refuses to do

1. **Never records a convention without evidence.** Two or more real examples, or it does
   not go in. One occurrence is a sighting, not a convention.
2. **Never writes an aspiration.** If the repo has three tests and no CI, `AGENTS.md` says
   that, not "we practise TDD". A context file that describes a better project than the one
   on disk makes every skill downstream wrong.
3. **Never guesses a command.** Run it, or mark it `unverified` and say so.
4. **Never overwrites human written content.** It adds what is missing and updates only the
   lines it owns. Curated prose is left exactly as found.
5. **Never writes code, specs, or scope rows.**
6. **Never runs anything the boundary blocks.** Build and test commands are fine; migrations,
   seeds and database writes are handed over. See `_shared/boundaries.md`.
7. **Never invents structure that is not there.** A messy repo gets described as it is.
   Recommendations go in the report, not into the file as if they were already true.

## Modes, inferred

- **brownfield**: existing code, no `AGENTS.md` or an out of date one. The main case.
  Read `modes/brownfield.md`.
- **greenfield**: the stack was just decided and scaffolded. Read `modes/greenfield.md`.
- **area**: an argument names a directory (`/audit src/auth`). Write or update a nested
  `AGENTS.md` for that directory only, covering what differs from the root. Do not restate
  anything the root already says. Everything else in this file still applies.
- **gapfill**: `AGENTS.md` exists and is broadly right. Fill only what is missing or stale,
  touch nothing else. This is what a re-run does.

## Nested files

One `AGENTS.md` per place that genuinely differs: a workspace in a monorepo, a service with
its own commands, a frontend beside a backend. A nested file covers **only the differences**
and never repeats the root. If a directory has nothing different to say, it gets no file.

## The `CLAUDE.md` pointer

`AGENTS.md` is the real file, and is tool agnostic so any agent can read it. Claude Code
reads `CLAUDE.md`, so write a thin pointer beside the root file:

```markdown
See [AGENTS.md](./AGENTS.md) for this project's stack, commands, structure and conventions.
```

If a `CLAUDE.md` already exists with real content, **leave it alone** and add the pointer
line at the top only if it is not already there. Never move someone's instructions into
`AGENTS.md` without asking.

## Handing the stack onward

`/audit` is usually the first thing that knows what a brownfield project is built with. When
the audit is done:

- Fill the rows it discovered in `_shared/stack-defaults.md`, values only, nothing invented.
- Recommend `/guard` in the report, since the stack is now known and its rules can be
  specific to it. On a brownfield repo with real data, recommend it before `/develop`.

## Execution

### Step 1: Classify and read the mode file

Existing source files and no useful `AGENTS.md` → brownfield. A fresh scaffold from a stack
spec → greenfield. An argument naming a directory → area. A good `AGENTS.md` that is missing
pieces → gapfill. Read exactly one mode file, or handle area and gapfill inline.

### Step 2: Gather evidence

Never from memory, always from the repo:

- **Stack**: manifests and lockfiles (`package.json`, `requirements.txt`, `pyproject.toml`,
  `Gemfile`, `go.mod`, `composer.json`, `pom.xml`, `*.csproj`), plus the lockfile's name,
  which tells you the package manager. Record real versions, not ranges.
- **Commands**: the scripts section, the Makefile, the CI workflow. CI is the most reliable
  source, because those commands demonstrably run.
- **Structure**: the directory tree to two or three levels, skipping dependencies and build
  output. What lives where, in one line each.
- **Conventions**: read several real files in each layer. Naming, file organisation, error
  handling, validation approach, test style, import style. Two examples minimum.
- **Entry points**: how the app starts, what ports, what it needs to run.
- **Configuration**: which environment variables are required. Names only, never values.
- **Gotchas**: the things that cost a newcomer an afternoon. A build step that must run
  first, a service that must be up, a generated file that must not be edited, a test that
  needs a database.

### Step 3: Verify the commands

Run the install, build, typecheck, lint and test commands and record which actually work.
This is the single most valuable thing in the file, because a wrong test command makes every
later skill wrong in a way nobody notices for a while.

Anything you cannot run (needs a database, needs credentials, takes too long) is recorded
with `unverified` beside it and a note saying why. Never quietly present it as verified.

### Step 4: Ask only what the repo cannot tell you

At most one panel, up to four questions, and only for things genuinely not discoverable:
which of two competing patterns is the intended one going forward, whether a directory is
deprecated, whether an odd looking thing is deliberate. Never ask what you can read.

### Step 5: Write

Per `agents-template.md`. Adding to an existing file:

- Read it again immediately before writing.
- Add missing sections. Update only lines this skill owns (a version, a command, a path).
- Leave every line of human prose untouched.
- When something you own has changed, replace that line, and list the change in the report
  rather than silently.
- When the repo contradicts something a human wrote, **do not edit it**. Flag it in the
  report and let them decide.

### Step 6: Report

```
## /audit · <repo or area>

**AGENTS.md <written | updated> · <N> commands verified, <M> unverified.**
Stack: <one line>
Commands: <the ones that matter, marked where unverified>
Nested: <any nested AGENTS.md written>                          (omit if none)
Conflicts: <where the repo contradicts existing written guidance>  (omit if none)
Noticed: <real problems worth fixing, as suggestions only>          (omit if none)
Next: <`/guard` when the stack is now known, else `/scope` or `/architect`>
```

The `Noticed` line is for genuine problems found while reading: a dead directory, two
competing patterns, a test suite that does not run. Suggestions only. This skill does not
fix them and does not write them into `AGENTS.md` as if they were resolved.
