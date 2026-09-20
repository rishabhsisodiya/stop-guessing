# Mode: plan

Building a scope for the first time, or planning the next slice on top of one.

### Step 1: Classify the repo

Scan, skipping `node_modules/`, `.git/`, `dist/`, `build/`:

- **Source files** (`.ts`, `.tsx`, `.js`, `.py`, `.go`, `.rs`, `.java`) or a manifest → **brownfield**.
- **None** → **greenfield**.
- **Workspace markers** (`pnpm-workspace.yaml`, `turbo.json`, a `workspaces` field, multiple
  app or package manifests) → **monorepo**. Ask which workspace this scope is for, then treat
  that workspace as the repo for everything below.

Also note whether a root `AGENTS.md` exists. If this is brownfield and it does not, the report's
next step is `/audit`, not `/architect`, because every later skill reads `AGENTS.md`.

**Greenfield**: plan the foundations (Step 4), then the slices.
**Brownfield**: the foundations already exist. Do not plan them again. Enroll what is already
built as `existing` or `in-progress` with a code pointer, then plan the next slice on top.

### Step 2: Ask, round 1 (always)

One panel, up to 4 questions. Infer and skip anything the idea already stated.

1. **MVP boundary.** "What is the smallest version that still delivers the core value?"
   Options are concrete boundaries for *this* product, not generic ones. This is the most
   important question in the skill. Recommend the narrowest one that is still genuinely useful.
2. **Capabilities in scope.** A multi select of the cross cutting capabilities this product
   plausibly needs, by *type*, never by tool: sign in and accounts, multi tenant organisations,
   payments and billing, email and notifications, file or media upload, search, realtime,
   an admin panel, a public API, background jobs. For each selected one, confirm in this slice
   or deferred. Each becomes a feature, or folds into a feature's `Done when:` line.
3. **The forgotten ones**, only the ones that plausibly apply: public or marketing pages and
   SEO, analytics and error monitoring, accessibility target, other languages, legal and
   privacy (cookie consent, GDPR, age gating). Skip any that are obviously irrelevant for a
   purely internal app.
4. **Hard constraints**, only if unstated: deadline, team size, compliance obligation.

### Step 3: Ask, round 2 (only if needed)

Only if something **load bearing** is still genuinely unclear, meaning you cannot write a
feature's `Done when:` line without it. At most 4 questions. Then stop asking, permanently.

Everything still unknown becomes a line in `## Assumptions`, phrased so it is trivially
correctable: the assumption, then what changes if it is wrong.

### Step 4: Pick the build approach (one panel)

- `vertical`: each feature built end to end through every layer, working.
- `mvp-first`: ship the thinnest usable whole first, then grow it.

Recommend `vertical` for a real production build. Recommend `mvp-first` only when the goal is
validating one core loop fast, or the engineer said "prototype" or "just to test the idea".
One line why, in terms of this product. Never name a tool. The approach shapes *how* work is
sliced, not *with what*.

Record it on the header line. It also sets each feature's Phase: `Foundation`, then
`Slice 1`, `Slice 2`, or `Deferred`.

### Step 5: Foundations first

Every approach obeys this: no feature slice starts before the ground it stands on exists.

**Greenfield**, lead with these as explicit features, in this order, never as buried subtasks:

1. **Stack & architecture** (`needs a decision`) — entry box `/architect`. Cheapest to get
   right first, costliest to redo.
2. **Data model** (`needs a decision`) — entry box `/architect`.
3. **Coding standards & tooling** — entry box `/audit`, never `/develop`. `/audit` captures
   the conventions from the real scaffolded project, then `/develop` installs the tooling.
4. **Design system & UI foundation** (`needs a decision`) — only if the product has a UI.

Then the feature slices.

**Brownfield**: skip all four. They exist. Enroll them as `existing` rows for context.

### Step 6: Decompose into coarse features

From the answers, produce the list: foundations, then slices, then explicitly deferred
nice to haves. Per feature:

- **Small.** One page or one cohesive unit. A listing, a detail page, and a cart are three
  features, not one "storefront". Split anything spanning unrelated screens.
- **Intent**, 1 to 2 lines: what it is and why it matters.
- **`Done when:`**, one compact line of observable outcomes. These are the seeds
  `/architect` grows into full acceptance criteria. Load bearing outcomes only.
- **Tier tag**, only when it differs from the project default set in Step 7.
- **Needs a decision?** Apply the invent test below.

**The invent test.** Would building this require a decision the engineer has not made?

`yes` for: a provider or library choice, a data model, a cross cutting pattern, the design
system, a whole page or screen with no design yet, or non trivial behavior (search, ranking,
filtering, pricing, permissions, anything with business rules).

`no` only for genuinely pure implementation that an existing spec, convention, or design
system already covers.

**Unsure means yes.** An unflagged decision is the expensive miss, and it is the exact failure
this whole collection exists to prevent.

One decision per spec. If a feature carries two distinct decisions, that is two
`needs a decision` items, never one lumped "strategy" spec.

**Analysis is not a feature.** Cataloguing duplication, listing call sites, auditing current
state is decision support. It belongs with the spec, written by `/architect`. Never plan a row
whose output is a document in `docs/scope/`.

### Step 7: Pick the workflow tier (one panel)

Now that the features exist, propose the project default.

- question: "How much checking should a feature get by default after it is built? A risky
  feature can always be bumped up with a tag, and a decision still goes through `/architect`
  either way."
- header: "Workflow"
- options, exactly one recommended:
  - `fast`: "`/develop` builds it and self checks, then it can be done. No separate verify or
    review pass. Best for prototypes, experiments, internal tools, and personal projects."
  - `strict`: "After `/develop`, run `/verify` against the real app, then `/review` on a fresh
    model. Best for anything with real users, money, sign in, or personal data."

Recommend by signal: throwaway, experiment, or personal one off → `fast`. Real users,
payments, auth, personal data, compliance, or a team codebase → `strict`. When genuinely
between the two, recommend `strict` and say it is easy to downgrade.

Record it on the header `**Workflow:**` line.

### Step 8: Write the file

List the scope location again immediately before writing, because a teammate may have changed
it. Then write per `scope-template.md`.

Running again on an existing scope is a living update: edit in place, never a new file.
Append new rows with the next free number, sharpen existing intent and `Done when:` lines,
leave existing statuses alone, and set a now out of scope row to `dropped` rather than
deleting it.

### Step 9: Report

Print the completion report block from `scope-template.md`, filled with this run's specifics.

`/scope` does not run `/architect` or `/develop` for you. It hands you the ordered list to walk
feature by feature.
