# Contributing

Adding or changing a skill here is mostly a question of judgment, not format. The file
shape takes twenty minutes to learn. What makes a skill work is knowing what it should
refuse to do.

## The shape

```
skills/<name>/
  SKILL.md          the router. Loaded in full every time the skill runs.
  <name>-template.md  output shapes, read only when writing
  modes/*.md        one file per branch. The skill reads exactly one.
  *.mjs             scripts, when code is more reliable than instructions
```

`SKILL.md` frontmatter needs `name`, `description` and `allowed-tools`. Only `name` and
`description` are loaded at startup, so the description is the whole trigger: it must say
**when to run this**, and end with what the skill does not do, so it does not fire in
another skill's place.

## The rules this collection follows

**1. A skill is defined by what it refuses.** Anything can generate a document. The value
is in the stop: `/develop` refusing to build on an unmade decision, `/architect` refusing to
write code, `/verify` refusing to call a criterion met that it did not observe. Write the
refusals first. If a new skill has none, it is a prompt, not a skill.

**2. State the limit with the result.** Every skill says what it could not do, in the same
breath as what it did. `/guard` prints the migration tools it did not cover. `/verify`
reports what it could not check. A skipped step is recorded as skipped. This is not
politeness, it is the difference between a check and a performance.

**3. One artifact, one owner.** No skill edits a file another skill owns. If two skills need
to write the same thing, one of them is wrong.

**4. Recommend, never survey.** Every question to the engineer offers two to four real
options with exactly one marked `(recommended)` and a one line why. A neutral menu pushes
the decision onto someone with less context than the skill has.

**5. Evidence, not memory.** Anything a skill asserts about a repo comes from a file, a
diff, or a command it ran. Two examples minimum before something is called a convention.

**6. Keep it lean.** `SKILL.md` loads in full on every run, so every line is a recurring
cost. If a line does not change what the agent does, cut it. Put rare or long content in a
file the skill reads only when it needs it.

**7. Never widen the boundary.** No skill runs a command `_shared/boundaries.md` blocks, and
none works around it: no wrapping it in a script, no package script, no subagent. It hands
the command to the engineer.

## If it enforces something, test it

`guard/db-gate.test.mjs` is 28 assertions and runs in under a second. A safety rule you
cannot verify is not a safety rule.

```bash
node skills/guard/db-gate.test.mjs
```

Anything that blocks, allows, or decides gets a test in the same commit.

## Adding a migration tool to `/guard`

One entry in the `STACKS` table in `skills/guard/apply-profile.mjs`:

```js
mytool: {
  label: "MyTool",
  detect: (files, manifests) => /mytool/.test(manifests),
  commands: ["mytool migrate", "mytool reset"],
  runners: "js",   // "js" expands npx/pnpm/yarn/bunx, "none" leaves the command as written
},
```

Then check it:

```bash
node skills/guard/apply-profile.mjs --layer stack --stacks mytool --dry
```

## Releasing a change

`claude plugin update` decides whether there is anything new by comparing the **version
string**, not the files. Push a change without bumping it and every installed copy reports
"already at the latest version" and keeps running the old skills.

So every release bumps `version` in **both** `.claude-plugin/plugin.json` and
`.claude-plugin/marketplace.json`, to the same value:

- patch (`0.2.0` → `0.2.1`): wording fixes, no change in what a skill does
- minor (`0.2.0` → `0.3.0`): a skill behaves differently, or a new option
- major: a skill is renamed or removed, or a file format changes

Then users update with:

```bash
claude plugin marketplace update stop-guessing
claude plugin update stop-guessing@stop-guessing
```

## Before you open a pull request

- Every new refusal is stated in `SKILL.md`, not buried in a mode file.
- Anything enforcing something has a test, and it passes.
- No skill reads a personal instruction file. Skills are self contained: a stranger with
  no custom setup gets the same behaviour you do.
- The description says when to run the skill and what it does not do.
- Nothing was added to `SKILL.md` that could live in a file read on demand.
- If it can mislead someone about what was checked, it says the limit out loud.
