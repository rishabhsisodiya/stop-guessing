# Mode: run

Prove the feature works by making it work, in the real application, in front of you.

The failure this mode exists to prevent is subtle: an agent reads the code it just wrote,
recognises the shape of a correct implementation, and reports success. That is not a check.
It is the same source agreeing with itself.

### Step 0: Work out what you can actually drive

Say this at the start, because it decides what "verified" can mean in this run.

- **A browser tool is available** (Playwright, Chrome DevTools, or any tool that can open a
  page, click, type and read what rendered) → drive the UI like a user. Full checks.
- **No browser tool, but the feature has an HTTP API** → check at the API level with real
  requests. Anything that only exists on screen (a rendered state, a disabled control, focus
  order, what a user sees) is `unverified`, with "no browser tool available" as the reason.
- **Neither** → say plainly that this feature cannot be verified here, and what would make it
  possible. Do not substitute reading the code, which is not a check.

Never quietly downgrade. If the UI was not driven, the report says so, every time.

**When a browser tool is available, just use it.** There is nothing to ask.

**When there is none and the feature has screens**, this is worth asking once per project,
because setting one up is a real option the engineer may want to take before you start.
Read `.claude/stop-guessing.json`:

- `"uiChecks"` is set → follow it, do not ask again.
- Not set → ask once, then record the answer:

  - question: "This feature has screens, and I have no browser tool, so I can check the API
    but not what renders. How do you want to handle that?"
  - header: "UI checks"
  - options:
    - `Check the API, I will click through myself (recommended)`: "Faster. Everything that
      is really API behaviour still gets checked, and anything that only exists on screen is
      reported as unverified so you know what to look at."
    - `Set up a browser tool first`: "Stop here. You run
      `claude mcp add playwright -- npx @playwright/mcp@latest`, restart the session, and
      run `/verify` again. Then the screens get driven like a real user."

  Record `"uiChecks": "api-only"` or `"browser"`. Change only that key; `/guard` owns the
  rest of the file.

If they choose to set one up, stop and wait. Do not half check the feature in the meantime.

A feature with no UI at all never triggers this question.

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

**With a browser tool.** Every screen the feature touches must handle loading, empty, empty
after filtering, error with a retry, permission denied and success. The full list is in
`develop/ui-guide.md`. Render each one and look.

For a list page, check the whole list contract: pagination across a boundary, page size
taking effect, search returning and clearing, each filter, sorting each sortable column both
ways, and the URL holding all of it so a reload restores the view. A list contract never
exercised with more than one page of data has not been checked.

**Without a browser tool**, a good deal of this is still checkable, because most of it is the
API's behavior, not the screen's:

- Pagination: request page 2, and a page past the end.
- Page size: ask for more than the server maximum and confirm it is clamped.
- Search and each filter: real requests, including one that matches nothing.
- Sorting: each sortable column both ways, and confirm rows do not shuffle between pages
  when the sort value repeats.
- Permissions: the same request as an actor who should be refused.

What genuinely needs the screen is `unverified`: loading skeletons, empty state wording,
error and retry, focus and keyboard, responsive behavior, and the URL holding the view.
List them individually rather than as "UI not checked", so the engineer knows exactly what
nobody has looked at.

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
