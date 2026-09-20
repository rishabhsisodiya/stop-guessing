Which sections a spec carries, by what is being decided. Rules live in `SKILL.md`.

Read only the type that matches. Sections are a checklist to reach, never a form to fill:
**leave out anything that does not apply.** An empty heading is noise.

Every type carries these four, at both depths:

- `## The decision` — what is being decided, the choice, and why in one or two lines
- `## Business rules` (or `## The pattern` / `## Options and costs`, per type below)
- `## Acceptance criteria` — numbered, observable, checkable by driving the app
- `## Build plan` — ordered steps, each tagged with the AC numbers it satisfies

`strict` adds the type specific sections below, plus `## Coverage check`.

---

## Data model

The costliest thing to redo. Worth the full depth even on a `fast` project.

- `## Database design` — tables, columns and types, keys, uniqueness, nullability,
  cascade behavior, indexes and the query each one serves. Say why a constraint exists,
  not just that it does.
- `## Service layer` — which service owns each transition, what is a pure function and
  therefore testable without a database, where the transaction boundary sits
- `## Edge cases` — concurrency (two writers, same row), partial failure, ordering,
  what happens to in flight work when state changes underneath it
- `## Validation` — per field, where it runs (before the service, never inside the controller)
- `## Security` — who may read and write each row, checked against the auth context and
  never against anything in the request body
- `## Performance` — expected volume, the indexes that matter, what is deliberately not
  cached and why

Ask about: the entities and their real relationships, what is unique, what cascades,
what is soft deleted and what is truly deleted, which fields are derived rather than
stored, what the first migration cannot get wrong.

---

## Provider or library choice

Email, payments, storage, auth, search, queues, a framework, an ORM.

- `## Options and costs` — two to four real candidates, each with what it costs in money,
  in lock in, and in what it forecloses. Read `_shared/stack-defaults.md` and put the
  project's default first when it is a genuine candidate.
- `## Integration surface` — exactly what the project touches: which calls, which webhooks,
  which config, and the seam that keeps the rest of the code unaware of the choice
- `## Failure modes` — what happens when it is down, slow, rate limiting, or returns a
  duplicate. Retries, idempotency, and what the user sees.
- `## Security` — where credentials live, what the provider can see, what leaves the system
- `## Cost at scale` — the bill at ten times current volume, and what would force a move

No database design section. No service layer section unless the seam is the decision.

---

## A page or a screen

- `## Layout and states` — the regions of the page, and every state it can be in:
  loading, empty, error, partial, success, and permission denied. All of them, named.
- `## Data needs` — every value the page shows, and where it comes from. This is the
  coverage check inline; it is the most valuable part of a page spec.
- `## Interaction rules` — what each control does, what is optimistic, what blocks,
  what is confirmed, what is undoable
- `## Accessibility` — focus order, keyboard paths, what a screen reader announces on
  state change, the contrast target
- `## Responsive behavior` — what changes at small width, what is dropped and what moves

No database design. No service layer. If the page needs data that does not exist, that is a
separate data model decision, not a paragraph here.

**If the page lists records**, the spec must decide the list contract rather than leaving it
to the build: page size and pagination style (offset or cursor), which fields are searchable,
which columns filter, which columns sort and what the default order is, and the indexes those
imply. `/develop` will build all of it either way, using its documented defaults, so a spec
that stays silent is choosing the defaults without saying so. Decide it here instead. The
contract itself is in `develop/ui-guide.md`.

---

## Cross cutting pattern

Error handling, auth, logging, validation strategy, module structure, testing approach.

- `## The pattern` — stated once, concretely, as a rule someone can follow without asking
- `## Where it applies` — and, just as important, where it deliberately does not
- `## Migration path` — what happens to code that predates it. All at once, on touch, or
  never. "On touch" is usually right; say so explicitly rather than leaving it implied.
- `## Edge cases` — where the pattern is genuinely awkward, and what to do there instead
- `## Consequences` — what this makes easy, what it makes harder

A pattern spec's acceptance criteria are about the pattern being followed, so they are
usually checked by review rather than by driving the app. Say which.

---

## Stack and architecture

The first spec on a greenfield project. Decides what everything else is built on.

- `## Options and costs` — real candidates for this product, not a survey of the ecosystem.
  Read `_shared/stack-defaults.md` first.
- `## Constraints` — team size and what they already know, deadline, budget, hosting
  reality, compliance obligations. These usually decide it.
- `## Consequences` — what this makes cheap and what it makes expensive
- `## What this forecloses` — the doors that close. Say them out loud; this is the section
  people skip and later wish they had not.

Acceptance criteria for a stack spec are about the scaffold: it boots, it builds, it has
the shape the pattern calls for. `/develop` scaffolds from this spec.

---

## Anything else

Use the four common sections, add whatever the decision genuinely needs, and leave out the
rest. The list above is what recurs, not a closed set. A decision about a background job
schedule, a rate limiting policy, or a pricing rule gets the sections it deserves and no
ceremony beyond them.
