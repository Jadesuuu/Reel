# Step 5 — HN client

## What this step adds

The first source. A small injectable class that finds the current month's "Ask HN: Who is
hiring?" thread and downloads its top-level comments. It does network I/O and nothing else:
no parsing, no database. That split is why the parser in Step 6 can be tested with fixtures
and why every later source could copy the same shape (one class, one network call, one pure
mapper).

The plan describes the endpoints in Section 6.1 and 6.2.

## Files, in reading order

1. **`apps/api/src/hn/hn.types.ts`** — the two JSON shapes Reel reads. `HnItem` is Firebase's
   item record (`text` is HTML, `kids` are child ids, `deleted` and `dead` are flags on
   removed comments). `HnSearchHit` is Algolia's search result, of which only `objectID`,
   `title` and `created_at` are used.
2. **`apps/api/src/hn/hn.client.ts`** — three methods.
   - `findLatestWhoIsHiringThread` asks Algolia for the five newest stories by the
     `whoishiring` account and keeps the first whose title starts with "Ask HN: Who is
     hiring?". The same account also posts "Who wants to be hired?" and "Freelancer?" threads,
     which is why the title check exists. No match throws `HnThreadNotFoundError`, a plain
     error class the ingest processor turns into a failed run.
   - `fetchItem` reads one item from Firebase and returns `null` on any failure, logging a
     warning. A single missing comment must not fail a thousand-comment run.
   - `fetchTopLevelComments` reads the story, then every id in `kids` through `p-limit` with
     a concurrency of ten, and drops nulls, deleted, dead and text-less items. It logs how
     many it skipped.
     Every request uses `AbortSignal.timeout(10_000)` so a hung connection cannot stall the
     worker.
3. **`apps/api/src/hn/hn.module.ts`** — provides and exports the client so the ingest worker
   module can inject it.
4. **`apps/api/src/hn/hn.client.spec.ts`** — `fetch` is replaced with a mock per test. The
   four cases: picks the hiring thread and skips the other `whoishiring` threads; throws when
   none matches; drops deleted, dead and text-less comments; one rejecting item does not
   reject the whole fetch.
5. **`apps/api/src/sources/adapters/hn.adapter.ts`** (Step 16) — where this client now sits.
   The adapter wraps the client and `parseComment` into the same `SourceAdapter` interface
   every other source implements, so the ingest processor never calls `HnClient` directly.

## Concepts

- **Fail the job versus skip the item.** Not finding the thread fails the run: there is
  nothing to do. One comment failing to download skips that comment: the other 999 are still
  worth having. The two behaviours are different methods on purpose.
- **Bounded concurrency.** A thousand parallel requests would be rejected or throttled;
  sequential requests would take minutes. `p-limit(10)` runs ten at a time. This is the same
  pattern the board adapters use.
- **Base URLs from config.** `HN_ALGOLIA_BASE` and `HN_FIREBASE_BASE` have defaults in the env
  schema; tests never override them because they mock `fetch` instead.

## Gotchas

- Firebase returns the JSON literal `null` for an item that does not exist, with status 200.
  `fetchItem` handles both that and a thrown error the same way.
- The thread is found fresh on every run rather than remembered, so the first run of a new
  month switches threads without any state.
