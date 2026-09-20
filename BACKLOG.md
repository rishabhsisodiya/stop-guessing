# Backlog

Things that must be true before this repo is published. Ordered by risk.

## Blockers for publishing

- [ ] **Verify the install command.** `npx skills add <user>/stop-guessing` is unverified.
      Confirm what the CLI expects (`skills/<name>/SKILL.md` at root, any manifest) before
      publishing an install line that does not work. The README currently says it is
      unverified and gives the manual copy route instead; either confirm it or keep saying so.
- [ ] **Windows.** Hook command paths, `git` invocation, and path separators are untested.
      The `|| true` in the gate hook is POSIX shell; confirm behaviour on PowerShell.
      The README says macOS and Linux only until this is done.
- [ ] **`build-standards.md` leans NestJS shaped.** The controller / service / data access
      layering is good advice but reads as foreign in Django or Rails. Either neutralise the
      wording or split the stack specific parts out.
- [ ] **Database clients beyond the obvious.** The gate knows psql, mysql, mariadb, mongosh,
      mongo, sqlite3, redis-cli, pgcli, mycli. Missing: `bq`, `snowsql`, `clickhouse-client`,
      `cockroach sql`, `duckdb`, `pscale`, `supabase db`, `turso`, `wrangler d1`.
- [ ] **`/audit` runs install without asking.** On a large repo that is minutes and a lot of
      network. It should confirm before running install, and may run the cheap commands
      (typecheck, lint, test) freely.
- [ ] **`/verify` run mode assumes browser tooling.** Many setups cannot drive a UI. It needs
      an explicit fallback: check at the API level, and say the UI states were unverified.

## Done

- [x] **Stack detection in `guard`.** Rules land in two layers: `baseline` (stack
      independent) and `stack` (only the migration tools the project actually uses). Thirteen
      tools across seven languages. `--detect` reads the repo, the engineer confirms, and the
      generator prints what it did not cover.
- [x] **Uninstall.** `apply-profile.mjs --remove` takes back out every rule the generator
      knows how to add, removes the gate, and leaves other people's rules alone.
- [x] **Fail open when node is missing.** The gate hook runs as
      `node <path> 2>/dev/null || true`, so a missing node, a bad path or a throwing script
      exits 0 and allows, rather than blocking every command in the session with no way for
      the agent to fix it. The generator refuses to install the hook if node cannot run or
      the script is missing, and prints a warning saying the gate is not active.
- [x] **Tests have a home.** `/develop` Step 5b writes and runs tests at `strict` tier,
      following `develop/test-guide.md`. Skipping is allowed and is recorded as skipped.
- [x] **Gate calibration.** `develop/SKILL.md` carries six things that must stop and eight
      that must not, plus the real test: would a reasonable engineer want to have been asked?
- [x] **`sync` and `scope replan` overlap.** `sync` owns reconciliation. `replan` reads the
      reconciled state and plans forward, and says so when the scope is stale.
- [x] **LICENSE, README, CONTRIBUTING, workflow guide.** Written, copyright name confirmed.
- [x] **`stack-defaults.md` ships neutral.** Every row is `(unset)`, with a filled table
      shown below as an example to replace or delete. `/audit` fills it from the real repo,
      `/architect` fills rows as it decides them.
- [x] **`debug` skill.** Reproduce, localize, one hypothesis at a time, minimal fix at the
      cause, verify against the original reproduction, regression test. Refuses to fix what
      it has not reproduced, to refactor, to change a test to make it pass, or to fix a
      second bug silently.

## Honesty requirements for the README

- [x] Chained commands can slip past a prefix rule. Stated in "What this does not protect
      against".
- [x] `/guard` edits the user's settings file, with backup and uninstall. Stated.
- [x] A "what this does not protect against" section exists. Keep resisting the urge to
      oversell.

## Lessons already paid for

- **Do not use a `prompt` hook to filter which commands to inspect.** The per-hook `if`
  filter did not scope it, and `matcher` only matches the tool name, never the command
  string. The result was a model call on every Bash command that blocked ordinary file
  writes. Use a `command` hook that checks in code and exits early. See `guard/db-gate.mjs`.
- **A hook must fail open.** A hook that errors blocks the tool it guards. Since the agent
  may not edit permission files, a fail closed hook is unrecoverable from inside the session.
- **Put project rules in project settings.** Rules in `~/.claude/settings.json` apply to
  every repo on the machine, including ones with nothing to protect. Only a small universal
  core belongs there.
- **Anything that enforces something needs a test.** `guard/db-gate.test.mjs` is 28 cases in
  under a second. A safety rule you cannot verify is not a safety rule.

## Deferred features

- [ ] `migration-guard.mjs`: allow editing a migration while it is local only (untracked, or
      committed but unpushed), block once it exists on the remote. Logic settled, not built.
- [ ] `.env` handling: readable, since the agent often needs it to tell you a command, but
      values masked when quoted back. `git add .env*` is already denied.
- [ ] Tier B question in `/guard`: package installs, killing processes, cloud CLI writes,
      outbound HTTP writes.
- [ ] `--scope user --profile core` to strip project level rules out of global settings.
- [ ] A hook to stop commits landing on the default branch. Cannot be expressed as a
      permission rule.
