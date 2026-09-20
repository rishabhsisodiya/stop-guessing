# Mode: run

Prove the feature works by making it work, in the real application, in front of you.

The failure this mode exists to prevent is subtle: an agent reads the code it just wrote,
recognises the shape of a correct implementation, and reports success. That is not a check.
It is the same source agreeing with itself.

### Step 1: Get the app running

Use the commands in `AGENTS.md`. Install, build, start.

If it will not start, that is the result. Report it and stop. Do not check criteria against
an application that is not running.

If starting it needs something the boundary blocks (a migration, a seed, a reset), hand the
command over and wait:

```
Before I can verify this, the migration needs applying:

    <the exact command>

Tell me when it has run.
```

### Step 2: Take each criterion in turn

For every `AC-n` in the spec, in order:

1. Say what you are about to do, in the user's terms.
2. Do it: drive the UI, call the endpoint, run the job, query the database read only.
3. Say what actually happened.
4. Record `met`, `not met`, or `unverified`, with the reason.

Never batch this. "All criteria met" as a single statement is the shape a false result
takes. One line per criterion, each naming the observation that supports it.

**How to check each kind of criterion:**

| The criterion is about | Check it by |
|---|---|
| A screen or a state | Rendering it and looking. Screenshot if the client supports it. |
| An endpoint | Calling it with a real request and reading the real status and body. |
| A permission rule | Trying it as the actor who should be refused, not only the one who should pass. |
| A state transition | Performing it, then reading the stored state back. |
| A failure case | Causing the failure, not simulating it. |
| A background job | Triggering it and observing the effect, not just that it was queued. |

### Step 3: Check the failure cases properly

The success path is the easy half and usually the only half that gets checked.

- The error case the spec names: cause it for real, and confirm the status code, the message
  and that nothing was half written.
- Authorisation: attempt the action as someone who should be refused. A feature where the
  button is hidden but the endpoint is open passes a lazy check and fails in production.
- The second attempt: repeat the action. Does it 409 as specified, or 500, or silently do
  it twice?
- Empty and boundary data: no records, one record, a very long string, a zero.

### Step 4: Check the required states, when there is a UI

Every screen the feature touches must handle loading, empty, empty after filtering, error
with a retry, permission denied and success. The full list is in `develop/ui-guide.md`.

If the feature includes a list page, check the whole list contract as well: pagination
across a boundary, page size taking effect, search returning and clearing, each filter,
sorting each sortable column both ways, and the URL holding all of it so a reload restores
the view. A list contract that was never exercised with more than one page of data has not
been checked.

### Step 5: Run the existing tests

Run the suite from `AGENTS.md`. A new feature that breaks an existing test is a finding
regardless of how well its own criteria passed.

Record the result honestly, including a suite that was already failing before this change.
Say which failures are pre-existing and which are new.

### Step 6: Be explicit about what you could not check

Things that legitimately cannot be verified locally: anything needing a third party in a
real state, a payment, an email actually arriving, a scheduled job at its real time, load
behavior, another environment.

Each one is recorded as `unverified` with the reason and, where useful, how it could be
checked. Never quietly leave them out of the count.
