# Mode: review

A senior code review of the change, on a model that did not write it.

### Step 1: Get a fresh reviewer

The model that wrote the code is the worst possible reviewer of it: it already believes the
approach. Spawn a subagent with `review-prompt.md`, on a **different model** from the one
that built the feature, with `Read`, `Grep`, `Glob`, `Bash` and no write tools.

If the client cannot spawn subagents, or cannot use a different model, **say the independent
review is unavailable** and offer the weaker alternative plainly: a self review, labelled as
such, which catches mechanical problems but not the ones that come from having chosen the
approach. Do not present it as an independent review.

### Step 2: Give the reviewer the right material

- The diff, uncommitted or against the base branch.
- The spec, because a review without the contract can only judge style.
- `AGENTS.md`, so it reviews against this project's conventions rather than generic ones.
- `develop/build-standards.md`, so "this is how we do it here" has a source.

### Step 3: What a review is for, in order of value

1. **Correctness.** Does it do what the spec says? Wrong logic, off by one, inverted
   condition, a case the code does not handle.
2. **Concurrency and consistency.** Two requests racing the same row. A multi write
   operation with no transaction. A read that decides something, then a write that assumes
   it is still true. A retry that runs the work twice.
3. **Security.** Authorisation checked on the server per resource. Input re-derived rather
   than trusted. Nothing interpolated into a query. No secret in source or in a log.
4. **Data.** Missing constraints and indexes. A query inside a loop. An unbounded list. A
   migration that is not safe to run on a table with data in it.
5. **The contract.** Error responses as specified. Status codes right. Response shape
   matching what the spec promised.
6. **Reuse.** Something here already existed elsewhere in the codebase and now exists twice.
7. **Scope.** Code in this diff that no acceptance criterion asked for.
8. **Maintainability.** Only where it genuinely costs the next reader. Not style.

### Step 4: What a review is not for

- Naming, formatting, import order, anything a linter owns.
- Rewriting the approach because the reviewer would have chosen differently. Only raise the
  approach if the spec's own reasoning does not hold, and say which part.
- Restating what the code does back to the author.
- Padding. Eight real findings beats twenty with twelve fillers, and a review that invents
  findings to look thorough spends the trust that makes the next one worth reading.

### Step 5: Severity, honestly assigned

- **blocking**: wrong behavior, a security hole, data loss, a broken contract. Do not merge.
- **should fix**: a real problem that is not urgent. Merge if you choose, fix it soon.
- **consider**: a genuine improvement the author may reasonably decline.

Assign these from consequence, not from confidence. A finding you are unsure about is still
blocking if it would be severe when true; say that you are unsure, and say how to confirm it.

### Step 6: Bring the findings back

The subagent returns findings. You present them. You do not fix them, and you do not decide
which ones matter.

Write them to `docs/reviews/<date>-<feature>.md` when there are more than a handful.

For each: what is wrong, file and line, why it matters, and the related acceptance criterion
where there is one. Most serious first.

If the change is genuinely sound, say so in one line and report no findings. That is a real
result and it is allowed.
