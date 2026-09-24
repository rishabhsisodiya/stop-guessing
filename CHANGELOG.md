# Changelog

Versions follow semver as the project reads it:

- **patch** — wording, docs, nothing a skill does differently
- **minor** — a skill behaves differently, or there is a new option
- **major** — a skill is renamed or removed, or a file format changes in a way an older
  version cannot read. Read the notes before updating across one.

Update with `claude plugin marketplace update stop-guessing` then
`claude plugin update stop-guessing@stop-guessing`, and start a new session.

## 0.3.0

**Less always-on context.** Every session used to carry about 920 tokens of skill
descriptions, even when no skill ran. `guard`, `audit`, `scope` and `sync` now run only when
you type them (`disable-model-invocation`), so they cost nothing until then; they are
deliberate setup and bookkeeping steps, and Claude should never start them on its own.
`architect`, `develop`, `verify` and `debug` keep automatic invocation with shorter
descriptions. The cost is now about 250 tokens per session.

## 0.2.0

**You choose where workflow files go, per kind.** The first time a skill writes a scope, a
spec or review findings, it asks where that kind should live: `docs/` (recommended),
`.claude/stop-guessing/`, another folder, or not saved at all. Each kind is asked
separately and remembered per project in `.claude/stop-guessing.json`. Nothing touches git;
whether those files are pushed is your decision.

**`/scope` says what, never how.** It no longer names endpoints, tables, fields or choices
like "extend this endpoint rather than adding a new one", and `Done when:` is one line of
two or three observable outcomes rather than a half written spec. Those details are
`/architect`'s questions now, which is where they were always meant to be answered.

**`/guard` only reports a real gap.** It used to list every migration tool it knows that
your project does not use, which buried the one line that matters. Now it flags a gap only
when your project uses a migration tool it has no rules for.

**`/verify` handles not having a browser.** It works out up front what it can drive. With a
browser tool it checks the screens like a user. Without one it checks the API, including
most of the list contract (pagination, clamped page size, filters, sort stability,
permissions), and lists the screen-only things as unverified individually. The report always
carries a `Checked by` line. When a feature has screens and no browser tool is available, it
asks once per project whether to carry on API only or stop while you set one up.

**`/audit` asks before restoring dependencies**, and records commands as roles rather than a
JavaScript shaped list, so a Go project is not asked for a typecheck command it does not
have and a Django project is not given a build step. `command-discovery.md` covers Node,
Python, Go, Ruby, PHP, Rust, Java and .NET.

**Fixes**

- `/guard` detects stacks in a monorepo, not only at the repository root. Reading only the
  root reported "nothing detected" on a project that plainly used Prisma, which read as
  "nothing to cover".
- Project facts no longer go into `_shared/stack-defaults.md`, which is a machine wide
  preference. The stack a repo actually uses is recorded in that repo's `AGENTS.md`.
- The database gate is a command hook, not a prompt hook, so it costs no model call and
  cannot block commands that have nothing to do with a database.
- The gate fails open. A missing `node` or a bad path allows the command rather than
  blocking every command in the session.
- `--dry` no longer creates a directory. A preview writes nothing.

## 0.1.0

First release. Eight skills: `scope`, `architect`, `guard`, `develop`, `audit`, `verify`,
`debug`, `sync`.

Two ideas run through all of them. A load bearing decision is written down before it is
built, and `/develop` stops rather than inventing one; overriding is allowed, and records an
`Assumed` spec instead of leaving a silent guess in a diff. And every skill states what it
could not do alongside what it did.

`/guard` writes permission rules into `.claude/settings.json` so the harness enforces them:
read only database access, no migrations, no destructive git, no publishing or deploying,
and no editing its own permission files. It ships with a tested database gate and uninstalls
cleanly with `/guard remove`.
