# Mode: greenfield

The stack was decided in a spec and the project has been scaffolded. This runs **after**
the scaffold exists, never before, so it describes a real project rather than an intention.

If there is no scaffold yet, stop and say so: `/architect` decides the stack, `/develop`
scaffolds it, then this runs. Writing `AGENTS.md` from a spec alone produces a file full of
things that are not true yet, and every skill downstream would believe it.

### Step 1: Read the stack spec, then check the reality

Read the stack spec in `docs/specs/`. It says what was chosen and why.

Then read the scaffold and compare. Scaffolds rarely match the plan exactly: a generator
picks a different structure, a version resolves higher, a tool arrives that nobody chose.

**Where they differ, the repo wins.** Record what is on disk, and list the differences in
the report so the engineer can decide whether the spec or the scaffold should change.

### Step 2: Commands, from the generator's own scripts

A fresh scaffold usually comes with working scripts. Run them: install, build, typecheck,
lint, test. A scaffold's test command often passes with zero tests, which is fine to
record, but say so, because "tests pass" means something different here.

Note which commands the scaffold did **not** provide. A missing typecheck or lint command
is a real gap and belongs in the report, where it usually becomes the tooling feature on
the scope.

### Step 3: Conventions are thin, and that is correct

A new project has no conventions yet, only whatever the generator produced. Do not invent
any. Record:

- The structure the scaffold created, one line per directory
- Anything the stack spec decided about organisation
- Nothing else

`AGENTS.md` will grow as the project does. `/sync` adds each convention once it is real and
visible in the code. A greenfield file that confidently describes patterns nobody has
written yet is worse than a short one.

### Step 4: Write it short

Per `agents-template.md`, leaving out sections that have nothing true in them yet. A
greenfield `AGENTS.md` is often half the length of a brownfield one. That is correct, not
incomplete.

Record the real stack in the Stack table of `AGENTS.md`, correcting anything the stack spec
got slightly wrong. Never write it into `_shared/stack-defaults.md`, which is a machine wide
preference and is read only to skills.

### Step 5: Hand it onward

The stack now exists on disk, so recommend `/guard` in the report if it has not run yet:
its rules can now be specific to the migration tool this project actually has.

Then the next step is the first unticked box on the scope, usually the tooling feature
(lint, format, pre-commit) or the first real slice.

### Step 6: Report

Use the report block in `SKILL.md`, and include two things specific to greenfield:

- **Differences between the stack spec and the scaffold**, if any. The engineer decides
  which one is wrong.
- **Commands the scaffold did not provide**, which usually become tooling work on the scope.
