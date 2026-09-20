# Mode: replan

A scope exists and `/scope` was run bare. This is the normal rhythm after shipping something,
and it doubles as "where was I, what is safe to pick up".

### Step 1: Where things stand (print this first, before changing anything)

A short readout, five lines or fewer:

- Git branch, and whether it is ahead or behind its remote.
- Feature counts by status: planned, in-progress, done, existing, dropped.
- Each in-progress feature and its **resume point**: the first unticked box.
- Any feature carrying an assumed decision that is still unratified.
- Any spec in `docs/specs/` whose status is not yet reflected in the scope.

### Step 2: Reconciliation belongs to `/sync`

`/sync` owns comparing the repo against the scope and writing the result. This mode reads
the reconciled state and plans forward. One writer, so two skills never tick the same box
from two different readings of the evidence.

Check whether the scope is current: compare when the scope file was last modified against
`git log` for the source tree. If the repo has moved since the scope did, say so:

> The scope has not been reconciled since <what shipped>. Run `/sync` first and it will
> update the boxes and statuses from the actual diff, then I will plan on top of the real
> state rather than a stale one.

If the engineer would rather not, continue on the scope as written and **say in the report
that the plan was made against an unreconciled scope**. Do not tick boxes here to compensate.

The one exception: filling a missing pointer line (`code in <path>`) where the path plainly
exists. That is a fact with obvious evidence and no judgement in it.

### Step 3: Surface drift

Whether or not `/sync` has run, name anything where the plan and the repo disagree. Do not
fix any of it here:

- **Code with no scope row.** Something was built that was never planned. Offer to enroll it,
  which is this mode's job.
- **A spec with no scope row.** A decision exists for a feature that is not on the plan.
- **A scope row marked done with no code.** Suspicious. Flag it.
- **An assumed decision still unratified.** Name the feature and its spec, and suggest
  `/architect` to ratify. This never blocks anything, it stays visible.
- **A `Done when:` line the shipped code does not satisfy.** Flag it, suggest `/verify`.

Each is surfaced to the engineer to decide. Never resolve one on your own.

### Step 4: Enroll what came up during the build

Work discovered while building (a follow up, a deferred edge case, a piece of tech debt) gets a
coarse row, appended with the next free number, same shape as any other feature: intent,
`Done when:`, one box, and the invent test applied. Ask first if it is not obvious.

### Step 5: Queue what is next

Reorder if the reality of the build changed what should come next, and say why in one line.
Then name the next step: the first unticked box of the highest ordered unfinished feature.

### Step 6: Report

Print the completion report block from `scope-template.md` with `replan` as the mode. Lead with
what changed in this pass, not with a restatement of the whole plan.
