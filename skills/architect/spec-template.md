Shapes for writing a spec and the completion report. Rules live in `SKILL.md`,
section choice in `decision-types.md`.

## Format rules

- **State the decision in the first ten lines.** Someone opening this file in six months
  wants the answer, then the reasoning. Not the other way round.
- **Only what applies.** No empty headings, no `n/a`, no `TBD` that is really a gap
  (a real gap goes in `## Open questions`).
- **Acceptance criteria are observable.** Each one is something `/verify` can check by
  driving the real app. `AC-3 returns 409, not 500` is checkable. `AC-3 handles
  concurrency correctly` is not.
- **The build plan is ordered and tagged.** Each step names the AC numbers it satisfies,
  so nothing is built that no criterion asked for, and nothing is asked for that no step builds.
- **Reasoning, not transcript.** Record the decision and why. Do not narrate the conversation.

## The file: `docs/specs/NNNN-<slug>.md`

```markdown
# Spec NNNN: <What is being decided>

**Status:** Decided | Assumed | Superseded by NNNN
**Feature:** <the scope row this serves>
**Tier:** fast | strict
**Decided:** <date>

## The decision

<What was being decided, in one line.>

**Chosen:** <the choice, stated plainly>
**Why:** <one or two lines. The reason, not the alternatives.>
**Considered:** <the other options, one line each, with what they cost.>
**Forecloses:** <what this makes harder or impossible later.>   (omit when nothing significant)

## Business rules

<The rules that govern this thing. Numbered or bulleted, each one a statement someone
could disagree with. Not implementation.>

## <type specific sections, per decision-types.md>

## Acceptance criteria

- AC-1 <observable outcome>
- AC-2 <observable outcome>
- AC-3 <the failure case, stated as precisely as the success case>

## Coverage check                                   (strict only)

Every value the criteria need, and where it comes from:

| Value | Source | Status |
|---|---|---|
| <what> | <column, endpoint, computed, auth context, config> | ✓ exists / ✗ gap |

<If anything is a gap, it also appears under Open questions and in the report.>

## Open questions                                   (omit when there are none)

- <a question this spec deliberately did not answer, and what it blocks.>

## Build plan

1. <step> (AC-1, AC-2)
2. <step> (AC-3)
3. <step> (AC-1..3)

<Atomic steps live here, never in the scope. The scope carries a two to five item
rollup of this list.>
```

## The rollup written back to the scope

`/architect` replaces the feature's single box with this shape. The milestones are a
summary of the build plan above, not a copy of it.

```markdown
### 7. Cancel an order · in-progress
Let a customer stop an order before it ships, without a support ticket.
**Done when:** a customer can cancel before the vendor accepts, and request cancellation after.
- [x] Design it (spec): `/architect cancel an order`
- [ ] Build it: `/develop cancel an order`
   - [ ] Status transitions and the guard (AC-1,2,5)
   - [ ] Cancellation request table and vendor decision (AC-3)
   - [ ] Order page states (AC-1,3,4)
- [ ] Verify it: `/verify cancel an order`
Spec 0007 · code (filled by /develop)
```

`fast` gets no closing boxes. `strict` gets `Verify it` and `Review it`.

## Rationale files

Supporting research goes in `docs/specs/NNNN-<slug>-rationale.md`: the inventory, the
comparison table, the call sites, the benchmark. Never inside the spec, never in
`docs/scope/`. A spec is the decision; the rationale is the working.

## Completion report

```
## /architect · <decision, one line>

**Spec NNNN written · <Decided | Assumed> · <N> acceptance criteria.**
Decided: <the choice, and the reason in a few words>
Open: <gaps the coverage check found, or questions deliberately left>   (omit if none)
Next: /clear, then /develop <feature>
```

_The spec is the durable state. Hand off through the file, not the chat: suggest `/clear`
so the next session reads the spec from disk rather than remembering a conversation._
