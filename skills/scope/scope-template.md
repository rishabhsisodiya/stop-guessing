Format reference for writing `docs/scope/scope.md` and the completion report.
The rules live in `SKILL.md`. This file is shapes only.

## Format rules

- **Two parts**: a slim **At a glance** table for scanning, then feature sections grouped by phase.
  Build order is section order. There is no separate ordered list to keep in sync.
- **Each fact appears once.** Intent, `Done when:`, and boxes live in the section.
  The table is only an index. Status appears in the table and beside the heading, nowhere else.
- **Only what is set.** No `n/a`, no `inherit`, no empty fields. A pointer line appears only
  once a spec or code exists.
- **Clean headings**: `### <N>. <Name>` plus the status word, plus a short tag only when it
  carries real information (`needs a decision`, a tier override like `· strict`).
- **One box per undesigned feature.** `/architect` fills in the fuller shape at spec capture.

## The file

```markdown
# Scope: <Product name>

<One or two plain sentences: what it is and who it serves.>

**Build approach:** <vertical | mvp-first> (<one line principle>)
**Workflow:** <fast | strict> (<what runs after /develop>)

_These are recommendations, not requirements. Skip anything that does not fit. If you already
know how to build a feature, go straight to `/develop`. You decide when a feature is done._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Stack & architecture | Foundation | planned |
| 2 | Data model | Foundation | planned |
| 3 | Coding standards & tooling | Foundation | planned |
| 4 | Design system & UI foundation | Foundation | planned |
| 5 | <first real slice> | Slice 1 | planned |

## Foundations

### 1. Stack & architecture · needs a decision
Choose the stack and scaffold a runnable project so every later slice builds on real structure.
**Done when:** the stack is recorded in a spec and an empty scaffold boots and builds locally.
- [ ] Decide the stack (spec): `/architect stack & architecture`

### 2. Data model · needs a decision
The core entities every feature builds on.
**Done when:** the entities and relationships support the planned slices without a breaking migration.
- [ ] Design it (spec): `/architect data model`

### 3. Coding standards & tooling
Capture conventions, then install lint, format, and pre-commit from the real scaffolded project.
**Done when:** root `AGENTS.md` reflects the real stack, and lint and format run clean.
- [ ] Capture conventions: `/audit`

## Slice 1: <name>

### 5. <Feature> · needs a decision
<One or two lines: what it is and why it matters.>
**Done when:** <observable outcomes, load bearing only>
- [ ] Design it (spec): `/architect <feature>`

## Deferred
Out of scope for this pass, kept so the plan stays honest.
- **<Feature>**: <one line> · needs a decision

## Assumptions

Written because they were not confirmed. Correct any line and re-run `/scope`.

- <Assumption>. (If wrong: <what changes>.)

## Legend

- **Next step** = the first unticked box. Always a command or a tracked milestone.
- **needs a decision** = run `/architect` first. Otherwise go straight to `/develop`
  (or `/audit` for standards & tooling). The tag drops once the spec is captured.
- **The decision box** is the one box whose label ends with `(spec)`. Skills find it by that
  suffix, never by exact wording. `/architect` only ever ticks that box.
- **Atomic build tasks live in the spec, not here.** This file carries milestone rollups only.
- **Status**: `planned` → `in-progress` → `done`, plus `existing` (predates this workflow)
  and `dropped` (de-scoped, kept for history).
- **Tier tag** beside a heading (e.g. `· strict`) overrides the project default for that one
  feature. No tag means it inherits.
- **Workflow** (header): `fast` = `/develop` and you are done. `strict` = then `/verify`,
  then `/review`. Either way, a load bearing decision still goes through `/architect` first.
- **Pointer line** (`spec <n> · code in <path>`): the spec link is added by `/architect`,
  the code path by `/develop`.
```

## The designed shape

This is what a feature looks like after `/architect` captures its spec. `/scope` never writes
this shape, it only needs to recognise it when reconciling.

```markdown
### 2. Data model · in-progress
Core entities every feature builds on.
**Done when:** the entities support the planned slices without a breaking migration.
- [x] Design it (spec): `/architect data model`
- [ ] Build it: `/develop data model`
   - [ ] Schema and constraints (AC-1..6)
   - [ ] Access rules and policies (AC-7..9)
   - [ ] Apply the migration, confirm live (AC-1..9)
- [ ] Verify it: `/verify data model`
Spec 0002 · code (filled by /develop)
```

The 2 to 5 sub items under "Build it" are a **rollup** of the spec's build plan. Every column,
constraint, and policy lives in the spec. The closing boxes depend on the tier: `fast` gets
none, `strict` gets `Verify it` and `Review it`.

## Brownfield enrollment

Already built features are enrolled for context, above the planned ones, with a code pointer.

```markdown
### A. Auth · existing
Pre-workflow auth: sign in, sessions, reset. code in `src/auth/`

### B. Product catalog · in-progress
Partial. Finish the remaining pieces via `/develop`. code in `src/catalog/`
```

`existing` is not `done`. It predates the workflow, so `/develop` and `/sync` leave it alone.

## Completion report

Lead with what the pass produced and the first step. Everything else is in the file.

```
## /scope <plan | replan | add> · <product, one line>

**<N> features planned (<M> already on the scope, <K> deferred). Approach <vertical|mvp-first>, workflow <fast|strict>.**
Next: /clear, then <the first unticked box, usually `/architect <first feature>`, or `/audit` if a brownfield repo has no root AGENTS.md>
Assumed: <the one or two assumptions worth reading before you continue>   (omit if none)
Heads up: <a real risk, or a foundation that needs a decision>            (omit if none)
Written to <the scope file path>.   (or: Not saved, this project keeps no scope file.)
```

_The scope, the specs, and `AGENTS.md` are the durable state. The workflow hands off through
files, not chat. Suggest `/clear` between units so a fresh session reads from disk again._
