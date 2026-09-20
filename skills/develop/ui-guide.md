Read this when the feature has a UI. Self contained: assume no other design instructions
exist. Where the project has a `design.md` or an existing component library, that wins, and
you say so in the report.

## Every screen handles every state

A screen that only handles success is half built. Build all of these, every time:

| State | What it must do |
|---|---|
| Loading | A skeleton matching the real layout, not a spinner in the middle of a blank page. No layout shift when data arrives. |
| Empty | Say what would be here, and give the action that creates the first one. Never a bare "No data". |
| Empty after filtering | Different from empty. Say which filters are hiding things, and offer to clear them. |
| Error | What failed, in plain words, and a retry. Never a raw error object or a stack trace. |
| Partial or stale | When some data loaded and some failed, show what you have and mark what is missing. |
| Permission denied | Say the access is missing. Do not show a blank page or a 404 for something that exists. |
| Success | The actual content. |

Also: keep what the user typed when something fails, disable a submit while it is in
flight, and make the outcome of an action unambiguous.

## The list page contract

**Any page that shows a list of records must have all of the following.** This is not a
nice to have and it is not deferred to "later": a list without these is unusable the moment
real data arrives, and retrofitting them means changing the endpoint, the query, the
indexes and the component at once.

If the feature's spec does not cover these, that is a gap. Say so, and build the contract
anyway using the defaults below, recording what you chose in the report.

### 1. Pagination

- Server side, always. Never fetch everything and slice it in the browser.
- Offset or cursor: cursor for feeds, infinite scroll, and anything over roughly fifty
  thousand rows, because deep offsets get slower the further you go. Offset for ordinary
  admin tables where users jump to a page number.
- The response carries what the UI needs to render controls: the page or cursor, the page
  size, and either a total count or an explicit "has more". If a total count is too
  expensive on a large table, say so and return `hasMore` instead of a fake number.
- The UI shows current position, next and previous, and disables them at the ends.
- Page state lives in the URL, so a filtered page can be shared, reloaded, and gone back to.

### 2. Page size

- A selectable limit with a sensible default (commonly 25) and a small set of choices.
- **Clamp it on the server.** An unbounded `limit` from the client is a denial of service.
  Reject or cap anything above the maximum rather than honouring it.
- Remember the user's choice for that table.

### 3. Search

- One search box, searching the fields a user would actually type, named in the placeholder
  so it is not a guessing game.
- Server side, debounced, cancelling the previous request.
- Case insensitive, and trimmed.
- Must be indexed. A `LIKE '%term%'` over a growing table is a future outage; use the
  database's text search, a prefix index, or a trigram index, and say which you used.
- Searching resets to the first page.

### 4. Filters

- Filter by the fields that carry meaning for this record: status, owner, type, date range,
  and any foreign key a user thinks in terms of.
- Multiple filters combine with AND. Multiple values within one filter combine with OR.
- Active filters are visible as removable chips, with a clear all.
- Filters live in the URL alongside pagination.
- Every filterable column is indexed, or the filter is explicitly documented as slow.

### 5. Sorting on column headers

- Clickable headers on every column where an order is meaningful. Not on ones where it is
  not, and those headers must not look clickable.
- Three states: ascending, descending, and back to the default. The current state is
  visible, not implied.
- Server side, and **always with a stable tiebreaker** (the primary key), or rows shuffle
  between pages when the sort value repeats.
- **Whitelist sortable columns on the server.** Never interpolate a client supplied column
  name into a query.
- Sorting resets to the first page and lives in the URL.

### 6. The backend work this implies

A list page is never only frontend work. Building it means, in the same change:

- The endpoint accepts `page` or `cursor`, `limit`, `search`, the filter parameters, `sort`
  and `order`, each validated, each with a default, `limit` clamped.
- One query does the filtering, sorting and pagination in the database. No fetch then
  filter in application code.
- A count query only when a total is actually shown, and kept cheap.
- Indexes for the default sort, each filterable column, and the search. Name each index and
  the query it serves.
- Authorisation applied inside the query, so a user cannot page or filter their way into
  rows they may not see. Filtering after fetching leaks through the total count.
- The response shape is documented with the endpoint, per the API section of
  `build-standards.md`.

### Defaults when the spec is silent

Say in the report that you used these, so they can be corrected:

- Page size 25, choices of 10, 25, 50, 100, server maximum 100.
- Offset pagination with a total count, unless the table is large or feed shaped.
- Default sort: most recently created first.
- Search across the record's name or title and its human readable identifier.
- Filters for status and date range when the record has them.

## Tables versus cards

A table for scanning and comparing many records, which is most admin and management
screens. Cards when each record needs an image or a lot of context. On small screens a
table becomes a list of stacked rows, keeping the two or three fields that matter, never a
horizontally scrolling table.

## Destructive actions

Confirm anything that destroys or is hard to undo, naming what will happen to what. Prefer
undo over confirm where undo is possible. Never make the destructive option the easiest
thing to hit by accident.
