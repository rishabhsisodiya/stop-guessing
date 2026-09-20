# Boundaries: what a skill runs, and what it hands to you

Every skill in this collection obeys this file. It is the standing answer to
"who is allowed to touch my database, my migrations, and my git history".

The rule: **the agent reads freely and writes code freely. It never runs a command
that can change data, schema, or git history.** Those it hands to you.

## Database

Allowed, no permission needed:

- `SELECT`, `SHOW`, `DESCRIBE`, `EXPLAIN`, psql backslash inspection (`\d`, `\dt`, `\d+ table`)
- Reading migration files, schema files, and generated types from disk

Never run, hand to the engineer instead:

- Anything that writes: `INSERT`, `UPDATE`, `DELETE`, `DROP`, `TRUNCATE`, `ALTER`,
  `CREATE`, `RENAME`, `GRANT`, `REVOKE`, `COPY ... FROM`, `LOAD DATA`
- Executing a `.sql` file
- Any mongo write, any redis flush

## Migrations and ORM commands

Never run any command that applies, resets, or generates a migration:

- `prisma migrate dev`, `prisma migrate reset`, `prisma migrate deploy`, `prisma db push`,
  `prisma db execute`, `prisma db seed`, `prisma db pull`
- `drizzle-kit push`, `typeorm migration:run`, `knex migrate:latest`, and their equivalents
- Any package script named `migrate`, `db:*`, or `seed`

`prisma generate`, `prisma validate`, and `prisma format` are safe and may be run.

## Git

Allowed, no permission needed:

- `git status`, `git log`, `git diff`, `git show`, `git blame`, `git branch` (listing),
  `git remote -v`, `git stash list`

Never run:

- `git push` in any form
- `git reset`, `git checkout <path>`, `git restore`, `git clean`, `git stash` (saving or popping)
- `git rebase`, `git merge`, `git cherry-pick`, `git revert`, `git commit --amend`
- Anything that rewrites history or deletes a branch or tag
- `gh pr merge`, `gh repo delete`, `gh release create`

Committing: only when the engineer asks for it, on a branch, never on the default branch.

## The hand over protocol

When a skill needs one of these run, it does not ask for permission to run it.
It stops, prints the exact command in a copy paste block, says in one line what the
command will do and what it will change, and waits.

```
I need this run before I can continue. It creates a migration and applies it to your
local database:

    npx prisma migrate dev --name add_orders_table

Tell me when it has run, or paste the output.
```

Then it continues from the engineer's answer. It never runs the command itself,
and it never works around the boundary (no wrapping it in a script, no piping it
through another tool, no asking a subagent to run it).

## Say what you did not cover

Every skill here follows one honesty rule: **when a check has a limit, state the limit in
the same breath as the result.** Silence about a gap reads as coverage, and a person who
believes they are protected takes risks a person who knows the limit would not.

In practice:

- `/guard` prints which migration tools it did **not** cover, every time it applies the
  stack layer, and says once that prefix rules can be slipped by a chained command
  (`cd app && git push`). The database gate reads the whole command and does not have that
  weakness; the git and migration rules are a strong net, not a wall.
- `/architect` records what a decision **forecloses**, and names any value its acceptance
  criteria need that nothing in the system produces.
- `/verify` reports what it could not check, not only what passed.
- `/scope` writes its assumptions into the scope file, phrased so they are easy to correct,
  rather than quietly assuming them.
- A skipped step is recorded as skipped. Never as done.

A result with its limits attached is worth more than a clean result that was not true.

## Why this is enforced twice

A skill is a prompt, and a prompt can be forgotten in a long session. So this file is
the intent, and the harness deny rules are the enforcement. If a skill ever tries one
of these anyway, the harness refuses it and the skill falls back to handing it over.
Belt and braces, on purpose.
