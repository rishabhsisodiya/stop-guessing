How code is written in this collection. Self contained: assume the project has no other
standards document and no custom instructions. Where `AGENTS.md` or the existing code says
something different, **the project wins** and you say so in the report.

## The three rules that matter most

1. **Look for it before you build it.** Before adding a service, a helper, an endpoint or a
   component, search for one that already does the job. Extending what exists beats a second
   way to do the same thing. Two implementations of one idea is the most expensive kind of
   mess, because neither can be changed safely.
2. **Change only what the criteria ask for.** An unrelated improvement in the same diff is
   invisible at review time. Note it in the report instead.
3. **Write it the way the file around it is written.** Match the naming, the error handling,
   the import style, the test style. A correct change in a foreign idiom still costs the
   next reader.

## Structure

- Small functions with one job. If you cannot name it without "and", it is two functions.
- Names say what a thing is or does. No `data`, `info`, `handle`, `process`, `temp`, `util`
  as a whole name. A reader should not need the implementation to know what it holds.
- Dependencies point inward: business logic does not import the framework, the HTTP layer,
  or the ORM's request objects. A rule you cannot test without booting the app is a rule in
  the wrong place.
- No duplicated logic. The second time a rule appears, extract it. The third time it appears
  slightly differently, you have a bug.
- Delete dead code rather than commenting it out. Version control remembers.

## Backend

- **Extend an existing endpoint before adding a new one.** A new endpoint that overlaps an
  old one splits behavior across two places, and one of them will rot.
- **Layering**: the route or controller parses and validates input and nothing else. The
  service holds the rules. Data access sits behind the service. A controller that reads or
  writes the database directly is a bug in the making.
- **Transactions**: any operation that writes more than one row, or writes and then reads to
  decide, runs in one transaction. Say explicitly what rolls back together.
- **Concurrency**: for anything where two requests can race on the same row (state
  transitions, counters, balances, claiming work), take a row lock or use a conditional
  update. Say which, and what the loser sees.
- **Idempotency**: an operation the client may retry (payments, webhooks, job handlers) must
  be safe to run twice. Either a natural key, or an explicit idempotency key.
- **Errors**: fail with a typed, meaningful error that the transport layer turns into a
  status code. Never swallow an error to keep a path green. Never return 200 with an error
  body.
- **Logging**: log at the boundary (request in, external call out, job start and end) with
  enough context to find the record. Never log secrets, tokens, full card numbers, or
  personal data beyond an id.
- **Validation happens before the service runs**, as a schema, not as scattered `if`
  statements. The service may then trust its input.

## Data

- **Reuse a table before inventing one.** If a new table overlaps an existing one, say so
  and stop: that is a data model decision and belongs in a spec.
- Constraints belong in the database, not only in code: not null, unique, foreign keys,
  check constraints. Application level validation is the first line, not the only line.
- Every index exists for a named query. An index with no query is cost with no benefit; a
  frequent query with no index is a timeout waiting for production data.
- Be explicit about delete behavior: cascade, restrict, or soft delete. Soft delete means
  every read path must exclude deleted rows, so say that too.
- Migrations are forward only and reversible in principle. Never rewrite a migration that
  has been applied anywhere but your own machine; add a new one.
- Money is never a float. Store minor units as an integer, or a fixed precision decimal.
- Timestamps are stored in UTC with a timezone aware type, and converted at the edge.

## API

Every endpoint is specified before it is built, with:

- **Method and path**, resource shaped, plural nouns, no verbs in the path.
- **Request**: body schema, path and query parameters, and which are required.
- **Response**: the success shape and the status code. `200` for a read or an update,
  `201` with the created resource, `202` when the work is queued, `204` for nothing to return.
- **Errors**: the real ones, each with its status. `400` failed validation, `401` not
  authenticated, `403` authenticated but not allowed, `404` not found or not visible to
  this actor, `409` conflicts with current state, `422` semantically invalid, `429` rate
  limited. An error body has a stable machine readable code, not only a sentence.
- **Authorisation**: who may call it, checked against the authenticated identity on the
  server, never against an id supplied in the request body.

List endpoints additionally follow the list contract in `ui-guide.md`, whether or not a UI
exists yet.

## Frontend

- Business logic lives outside the component. A component decides what to show, not what
  the rules are.
- Components are reusable by default: no page specific values hardcoded inside a shared
  component, no fetching inside a presentational one.
- **Every screen handles all of these, always**: loading, empty, error with a retry,
  partial or stale data, permission denied, and success. A screen that only handles success
  is half built. See `ui-guide.md`.
- Forms: validate on the client for speed and on the server for truth. Show errors beside
  the field, keep what the user typed, disable submit while in flight, and make the result
  of a submit unambiguous.
- Layouts work from small screens up. Nothing that only works at desktop width.
- Accessibility is part of done: reachable by keyboard, visible focus, labels tied to
  inputs, state changes announced, contrast that passes.

## Security

- Never trust anything from the client, including ids, prices, quantities, roles and
  totals. Re-derive them on the server.
- Authorise on every request, on the server, per resource. Hiding a button is not access
  control.
- Secrets come from the environment, never from source. Never commit a `.env`. When quoting
  a value from one back to the engineer, mask it.
- Escape and parameterise everything that reaches a database or a shell. No string
  concatenation into a query.
- Rate limit anything unauthenticated that costs money or sends messages.

## Performance

- Fix the algorithm before adding a cache. A cache in front of an N+1 query hides it.
- No query inside a loop. Batch, or join.
- Every list is paginated at the database, never in memory.
- Do not add a queue, a cache or an index speculatively. Add it for a measured or clearly
  predictable problem, and say which.
