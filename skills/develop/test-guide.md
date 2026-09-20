Read this when writing tests for what you just built. `strict` tier expects tests; `fast`
does not, and on `fast` you do not write them unless asked.

Self contained: assume the project has no testing guide. Where `AGENTS.md` records a real
convention (where tests live, what they are named, what runner), **that wins** and you follow
it exactly, because a test in a foreign style is a test nobody maintains.

## What to test, and what not to

Tests exist so that the next change cannot quietly break this one. That purpose decides
everything below.

**Test these:**

- **Every acceptance criterion that can be tested without a browser.** The criteria are the
  contract. A criterion with no test is a promise nothing keeps.
- **The rules, in isolation.** The pure functions that decide things: can this transition
  happen, is this allowed, what does this total come to. These are the cheapest and most
  valuable tests in any codebase.
- **The failure cases the spec names.** The 409, the 403, the rejected input. These break
  far more often than the success path and are tested far less.
- **Anything that was a bug.** A regression test is the only kind whose value is certain,
  because that failure has already happened once.
- **Boundaries.** Empty, one, many. Zero, negative, the maximum. The first page and the last.

**Do not test:**

- The framework. It already has tests.
- Getters, constructors, or a function that only forwards its arguments.
- Implementation detail: that a private method was called, in what order, how many times.
  Those tests fail on every refactor and catch nothing. Test the observable result.
- Coverage for its own sake. A suite written to reach a percentage is a suite nobody trusts.

## How to write one that is worth keeping

- **The name says what breaks.** `rejects a cancellation after dispatch` is a name.
  `test cancel 2` is not. When it fails at 2am, the name is the first and often only thing
  read.
- **Arrange, act, assert, visibly separate.** One behavior per test. A test asserting six
  unrelated things tells you almost nothing when it fails.
- **Assert the outcome, not the mechanism.** That the order is cancelled and the stock came
  back, not that `updateOne` was called with a particular object.
- **No shared mutable state between tests.** Each one sets up what it needs. Tests that
  pass only in a particular order are worse than no tests.
- **Deterministic.** Freeze time, seed randomness, never depend on a real network call or
  on today's date. A flaky test trains the team to ignore red, which costs more than the
  test ever saved.
- **Mock at the edge only**: the third party, the clock, the queue. Mocking your own service
  to test your own controller tests the mock.

## Layers, in the order they pay off

1. **Unit** on the rules. Fast, no database, no framework. Most of the suite.
2. **Integration** on the seam: the service with a real database, the endpoint with a real
   request. Fewer, slower, and where the real bugs hide. Every endpoint the feature added
   deserves at least the success case and the main failure case.
3. **End to end** on the one path that matters most. Expensive and brittle; a handful, not
   a suite. `/verify` covers much of what people reach for here by driving the real app.

## Databases in tests

The project's existing approach wins. If there is none, say which you used and why.

Whatever the approach: **a test never runs a migration or a reset command itself** when the
project's boundary blocks those. Set up through the application's own code paths, or hand
the command over per `_shared/boundaries.md`.

## Reporting

Run the suite and report the real result. A test written but not run is not a test.

If a test you wrote fails because the code is wrong, that is a finding, not a reason to
change the test. Say so, and fix the code or report it. **Never weaken an assertion to make
a suite green.** That converts a real signal into a false one, permanently.
