# Where workflow files go

The workflow writes three kinds of file. Where each one lives is the engineer's choice, made
separately for each kind, once per project, and remembered.

| Kind | Written by | Asked by |
|---|---|---|
| **scope** | `/scope` | `/scope`, the first time it writes |
| **specs** | `/architect` (and `/develop` for an `Assumed` spec) | whichever of them writes a spec first |
| **reviews** | `/verify` | `/verify`, the first time it writes findings |

## The setting

Stored per project in `.claude/stop-guessing.json`, one entry per kind:

```json
{ "workflowFiles": { "scope": "docs", "specs": ".claude/stop-guessing", "reviews": "none" } }
```

Each entry is one of:

| Value | Scope goes in | Specs go in | Reviews go in |
|---|---|---|---|
| `"docs"` | `docs/scope/` | `docs/specs/` | `docs/reviews/` |
| `".claude/stop-guessing"` | `.claude/stop-guessing/scope/` | `.claude/stop-guessing/specs/` | `.claude/stop-guessing/reviews/` |
| another folder, e.g. `"planning"` | `planning/scope/` | `planning/specs/` | `planning/reviews/` |
| `"none"` | not saved | not saved | not saved |

Paths written as `docs/scope/`, `docs/specs/` or `docs/reviews/` anywhere in these skills mean
the folder chosen for that kind in this project.

Only `workflowFiles` belongs to this rule. Never change any other key in that file; `/guard`
owns the rest. Create the file if it does not exist, and add only the entry being decided.

## Before writing a file of a kind for the first time

1. That kind's entry is set → use it.
2. Not set, but files of that kind already exist in one of the locations above → use that,
   record it, and do not ask. Never ask what you can read.
3. Not set, nothing exists yet → ask, for that kind only:

- question: "Where should this project's <scope | specs | review notes> be saved?"
- header: "Save <kind>"
- options:
  - `docs/ folder (recommended)`: "docs/<kind>/. Ordinary project files, easy to find,
    next to the code they describe."
  - `.claude/stop-guessing/ folder`: "Kept with your Claude Code files, separate from the
    project's own docs."
  - `Don't save them`: "Shown in the chat only. Nothing is written, so nothing carries over
    to the next session."

The picker adds its own free text answer, which is how someone names a different folder.

If `docs/` is a published documentation site (`docusaurus.config.*`, `.vitepress/`,
`mkdocs.yml`, Astro Starlight, Nextra), say that the first option would publish these files
on the site, and recommend `.claude/stop-guessing/` instead.

## Git is not this rule's business

Choosing a folder only decides where files are written. Nothing here edits `.gitignore`,
`.git/info/exclude`, or runs any git command. Whether those files are pushed is the
engineer's decision.

## When a kind is not saved

Everything still works for that kind; it just does not persist. Say what was skipped, in one
line, and carry on with the kinds that are saved.

- **scope not saved**: `/scope` shows the plan in the chat, and replan and add have no file
  to build on. `/architect`, `/develop` and `/verify` skip ticking scope boxes. `/sync` skips
  reconciling the scope.
- **specs not saved**: `/architect` shows the spec in the chat. `/develop` builds from the
  spec in the current conversation if there is one, and records an override in its report
  instead of as an `Assumed` spec file. `/sync` skips reconciling specs.
- **reviews not saved**: `/verify` reports findings in the chat only.

## Changing it later

When the engineer asks, update that kind's entry. Do not move existing files unless they ask;
say where the old ones are so nothing is lost silently.
