# Stack defaults

**Your preference, not any project's facts.** No skill ever writes to this file.

This file sits inside the skills directory. If the skills are installed once for the whole
machine (`~/.claude/skills/`), so is this file, and it is shared by every project you work
on. That is why it holds only what you prefer, and never what a particular repo uses:

| | Lives in | Written by | Says |
|---|---|---|---|
| This file | the skills directory, possibly machine wide | **you** | what to recommend when nothing else decides |
| `AGENTS.md` | the project | `/audit`, `/sync` | what this repo actually uses |
| `.claude/settings.json` | the project | `/guard` | what the agent may run here |

A skill recording a project's stack here would overwrite the last project's, and the next
`/guard` would write migration rules for the wrong tool while reporting that it had covered
them. Project facts go in `AGENTS.md`.

**Edit this file first.** It retargets every skill in this collection to your stack.

Skills never hardcode a tool. They read this file and put your defaults first in any
recommendation, marked `(recommended, matches your stack defaults)`. Leave it as it is and
the collection stays fully tool agnostic, which is a reasonable choice: skills will simply
recommend from the project itself rather than from a preference.

| Layer | Default | Notes |
|---|---|---|
| Runtime | (unset) | |
| Package manager | (unset) | |
| Backend framework | (unset) | |
| Frontend framework | (unset) | |
| Database | (unset) | |
| Data access | (unset) | ORM, query builder, or raw |
| Migrations | (unset) | The tool `/guard` writes rules for |
| Auth | (unset) | |
| Hosting | (unset) | |
| Test runner | (unset) | |

## How skills use this

- `/scope` **never** reads it. The scope stays tool agnostic on purpose, so it does not rot.
- `/architect` reads it when presenting options: your default goes first, marked recommended,
  with the reason "matches your stack defaults". You can always pick something else, and the
  spec records what you chose, not what was recommended.
- `/audit` fills these rows in from what the repo actually uses.
- `/guard` reads the migrations row to know which rules to write.
- `/develop` reads it only to break a tie the repo leaves open.

**The repo always wins.** If the code already uses something else, that is the truth, and
`/sync` will tell you this file is stale.

## Filling it in

Either fill the table by hand, or run `/audit` on an existing project and it will fill in
what it finds. On a new project, `/architect` writes the rows it decides as it decides them.

An example of a filled table, for reference only. Replace it with yours, or delete it:

```markdown
| Layer | Default | Notes |
|---|---|---|
| Runtime | Node.js (LTS) | |
| Package manager | pnpm | |
| Backend framework | NestJS | Modules, providers, DTO validation |
| Frontend framework | Next.js (App Router) | Server components by default |
| Database | PostgreSQL | |
| Data access | Prisma | |
| Migrations | Prisma Migrate | |
| Test runner | Vitest | |
```

## Conventions

Project wide conventions decided once, recorded here so specs do not repeat them.
`/audit` and `/sync` add to this as they find them.

- (none yet)
