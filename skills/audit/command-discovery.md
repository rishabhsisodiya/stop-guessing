How to find and check a project's commands, whatever it is built with. Read this in Step 3.

## Record roles, not a fixed list

Do not go looking for "the install command" and "the typecheck command". Those are
JavaScript habits. Work out which of these **roles** this project actually has, and record
the command for each one it has:

| Role | The question it answers |
|---|---|
| Restore dependencies | how a fresh clone gets what it needs |
| Run locally | how to start it |
| Build | how to produce the artefact, if there is one |
| Static checks | types, vet, analysers |
| Format and lint | style enforcement |
| Test, everything | how to run the suite |
| Test, one file | the inner loop command, the most used line in the file |
| Migrations | recorded, never run by an agent |

**A role the project does not have is a fact worth writing down**, not a blank. "No build
step, it runs from source" saves the next agent from inventing one. "No typecheck" says
something real about the project. Write the row and say `none`.

## Where the commands come from, in order of trust

1. **The CI workflow.** Those commands demonstrably run on a clean machine, or the build
   would be red. Best source, and the one people forget.
2. The task runner the ecosystem uses: `package.json` scripts, `Makefile`, `justfile`,
   `pyproject.toml`, `composer.json`, `Rakefile`, `build.gradle`, `*.csproj`.
3. A README or CONTRIBUTING file. Often stale. A claim to verify, never evidence.

## What each ecosystem usually looks like

Signals first, then the commands. Confirm against the repo rather than assuming, and prefer
whatever the task runner or CI already uses.

**Node / TypeScript** — `package.json`; the lockfile names the package manager
(`package-lock.json` npm, `pnpm-lock.yaml` pnpm, `yarn.lock` yarn, `bun.lockb` bun).
Restore `npm ci`. Build `npm run build`. Static `tsc --noEmit`. Test `npm test`.
One file: `npx vitest run <path>` or `npx jest <path>`.

**Python** — `pyproject.toml`, `requirements.txt`, `Pipfile`.
Restore `uv sync`, `poetry install`, or `pip install -r requirements.txt`.
Usually **no build**. Static `mypy .` or `pyright` when configured, often neither.
Lint `ruff check .` or `flake8`. Test `pytest`. One file: `pytest path::test_name`.
Django adds `python manage.py runserver`, `check`, and migrations that are handed over.

**Go** — `go.mod`. Restore `go mod download`, often not needed separately.
Build `go build ./...`. Static `go vet ./...`. Test `go test ./...`.
One file: `go test ./pkg -run TestName`. No typecheck role; the compiler is it.

**Ruby** — `Gemfile`. Restore `bundle install`. Usually no build.
Lint `rubocop`. Test `bundle exec rspec` or `rails test`.
One file: `bundle exec rspec path:LINE`.

**PHP** — `composer.json`. Restore `composer install`. Usually no build.
Static `phpstan analyse` or `psalm`. Test `./vendor/bin/phpunit`.
Laravel adds `php artisan serve` and migrations that are handed over.

**Rust** — `Cargo.toml`. Build `cargo build`. Static `cargo clippy`. Test `cargo test`.
One file: `cargo test module::name`. No separate restore step.

**Java / Kotlin** — `pom.xml` or `build.gradle`. Build `mvn -q package` or `./gradlew build`.
Test `mvn test` or `./gradlew test`. One file: `mvn -Dtest=ClassName test`.

**.NET** — `*.csproj`, `*.sln`. Restore `dotnet restore`. Build `dotnet build`.
Test `dotnet test`. One file: `dotnet test --filter Name`.

**Monorepo** — the root may only delegate. Record the root command and the per workspace one,
and give each workspace that genuinely differs its own nested `AGENTS.md`.

## What to run, and what to ask about first

Running a command is how a command gets verified, so run what is safe and ask about the rest.

**Run freely.** Read only or cheap, and they change nothing that matters: static checks,
lint, format in check mode, the test suite, a help or version flag, `go vet`, `tsc --noEmit`.

**Ask before running.** Restoring dependencies is not read only: it writes a dependency
directory, can take minutes, needs the network, and with the wrong command can rewrite a
lockfile, which is a change to the repo nobody asked for. So:

> Verifying the commands means restoring dependencies first, with `<cmd>`. That downloads
> packages and can take a few minutes. Shall I, or would you rather I record the command as
> unverified and carry on with the checks that do not need it?

If they say no, record it `unverified` with the reason and move on. Everything downstream
still works; the file just carries an honest gap instead of a false claim.

Prefer the non mutating form where the ecosystem has one: `npm ci` over `npm install`,
`poetry install --sync`, `go mod download`. Never run anything that updates a dependency
version, and never run the project's migrations, per `_shared/boundaries.md`.

**Never run at all.** Migrations, seeds, resets, deploys, anything writing to a database.
Record the command and say it is handed to the engineer.

## Marking the result

Every row says what actually happened:

- `yes` — you ran it and it succeeded.
- `fails` — you ran it and it failed. Record what it said. **A failing command is a finding,
  not something to omit**, and it usually explains other things you noticed.
- `unverified` — you did not run it, with the reason in one line: needs dependencies, needs a
  database, needs credentials, too slow, the engineer declined.
- `none` — the project genuinely has no such role.

A command recorded as verified that was never run is the most damaging line this file can
contain, because every later skill inherits it and nothing reveals the error for a while.
