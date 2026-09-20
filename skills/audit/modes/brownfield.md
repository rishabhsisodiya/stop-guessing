# Mode: brownfield

An existing codebase with no `AGENTS.md`, or one that no longer matches the repo. The main
case, and usually the first skill anyone runs on a real project.

You are reading someone else's code to describe it accurately, not to judge it. Problems
you find go in the report, never into the file as if they were already resolved.

### Step 1: Size it up before reading everything

- The directory tree, two or three levels, skipping `node_modules`, `.git`, `dist`, `build`,
  `vendor`, `target`, `__pycache__`, `.next`, `.venv`.
- Manifests and lockfiles. The lockfile name tells you the package manager, which the
  manifest often does not.
- Whether this is one project or several: workspace markers (`pnpm-workspace.yaml`,
  `turbo.json`, `lerna.json`, a `workspaces` field, multiple manifests in subdirectories).
  If several, each workspace gets its own nested `AGENTS.md` covering only its differences.
- Rough age and activity: the first and last commit dates, and which directories have been
  touched in the last few months. A directory nobody has touched in two years is a candidate
  gotcha, not a convention to copy.

### Step 2: The commands, from the most reliable source

In order of trustworthiness:

1. **The CI workflow.** Those commands demonstrably run, on a clean machine, or the build
   would be red. This is the best source and most people forget it exists.
2. The scripts section of the manifest, or the Makefile.
3. A README, which is often stale. Treat it as a claim to verify, never as evidence.

Then run them: install, build, typecheck, lint, test. Record what actually works.

What you cannot run (needs a database, needs credentials, takes too long) is recorded as
`unverified` with the reason. Never present it as verified. A wrong test command is the most
expensive error this file can contain, because every later skill inherits it silently.

### Step 3: Conventions, with evidence

Read several real files per layer, recently changed ones by preference. Look for:

- How a unit of work is organised: one folder per feature, or layers across the tree
- Naming: files, classes, functions, database tables and columns
- Where validation happens, and in what form
- How errors are raised and turned into responses
- How data access is done, and whether anything bypasses it
- Test style: where tests live, what they are named, what they actually assert
- Import style: aliases, relative paths, barrel files

**Two examples minimum.** One occurrence is a sighting, not a convention.

**When you find two competing patterns**, that is itself the most useful fact in the file.
Do not pick a winner on your own. Record both with their locations, and ask in Step 4 which
one new code should follow. If the engineer does not answer, record both and say it is
unresolved.

### Step 4: The things that cost an afternoon

Hunt for these specifically. They are what a new person, human or agent, gets wrong:

- Generated directories that must not be hand edited, and the command that regenerates them
- A build or codegen step that must run before anything else works
- A service that must be running for tests to pass
- Environment variables without which the app fails in a confusing way (names only)
- A directory that looks current but is dead
- A file everyone edits that is actually generated, or vice versa
- Anything where the obvious action is the wrong one

### Step 5: Ask, at most one panel

Only what the repo genuinely cannot answer. Typically:

- Which of two competing patterns is the intended one going forward
- Whether a suspicious directory is deprecated
- Whether an odd looking arrangement is deliberate

Never ask what you can read. If the engineer does not know either, record the uncertainty
rather than resolving it.

### Step 6: Write, then hand the stack onward

Write the root file per `agents-template.md`, plus a nested file for each workspace that
genuinely differs, plus the `CLAUDE.md` pointer.

Then fill the rows you discovered in `_shared/stack-defaults.md`, values only.

A brownfield repo has real data and real migrations, so recommend `/guard` in the report
**before** `/develop` runs. The stack is now known, so its rules can be specific to it.

### Step 7: Report

Use the report block in `SKILL.md`. Put the honest findings in `Noticed`: the dead
directory, the two competing patterns, the test suite that does not run, the missing CI.
Suggestions only. This skill describes; it does not fix.
