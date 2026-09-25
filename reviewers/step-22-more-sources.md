# Step 22 — More sources

## What this step adds

Six more sources, all verified live on 26 Sep 2026 under the same rule as the first ten:
public JSON or RSS, no key, no browser, no scraping. Four are feeds (Working Nomads,
Landing.jobs, The Muse, Jobspresso) and two are board providers for the watchlist (Workable,
SmartRecruiters). We Work Remotely, which was already there, now reads four category feeds
instead of one. The plan's Step 22 table lists every endpoint and what was rejected and why.

## Files, in reading order

1. **`apps/api/src/sources/source.types.ts`** and **`source-meta.ts`** — the two lists every
   other file keys off. `SOURCES` gained six values, `BOARD_PROVIDERS` two, and `SourceMeta`
   gained an optional `feedBoards` list, used only by We Work Remotely.
2. **`apps/api/src/sources/sources.service.ts`** — `enabledTargets()` now emits one ingest
   target per feed board when a feed lists them, so We Work Remotely becomes four jobs per cycle
   with distinct job ids.
3. **`apps/api/src/sources/http.ts`** — two new helpers. `postJson` exists because Workable's
   job list is a POST. `mapLimit` runs a worker over a list with bounded concurrency; both
   board adapters use it to fetch posting details five at a time.
4. **`apps/api/src/sources/adapters/workingnomads.adapter.ts`**, **`landingjobs.adapter.ts`**,
   **`themuse.adapter.ts`**, **`jobspresso.adapter.ts`** — the feeds. Each exports a pure
   `mapX(payload)` and a small `fetch()`. Read Landing.jobs for the salary handling and Jobspresso
   for the namespaced RSS fields.
5. **`apps/api/src/sources/adapters/workable.adapter.ts`**, **`smartrecruiters.adapter.ts`** —
   the boards. Both list first, then fetch details for at most 60 postings, then map with the
   details passed in as a lookup so the mapper stays pure and testable.
6. **`apps/api/src/sources/__fixtures__/`** — one trimmed real response per adapter, saved the
   day the endpoint was verified. The spec deep-reads them.
7. **`apps/api/prisma/migrations/20260926150000_v4_more_sources`** — six `ADD VALUE` lines.
8. **`apps/web/src/lib/sources.ts`**, **`types.ts`**, **`demo/seed.ts`** — labels, short
   badges, board hints and URL patterns for the settings page, and the demo's label switch.

## Concepts

**Verify before you write.** Every candidate was probed with `curl` first: status, size, content
type, and for boards a real company slug. Anything that could not be confirmed with real data
(Recruitee, BambooHR, Breezy, Rippling) was left out rather than written on faith. Remotive's
category parameter turned out to be ignored by the API, which only a live probe would show.

**A list endpoint is not enough for boards.** Workable and SmartRecruiters return titles and
locations in the list and the description only per posting. Without the description there are
no stack keywords, and without stack keywords the scorer cannot award include points. So both
adapters fetch details, but bounded: five in flight, sixty per run. A company with three
thousand postings still finishes.

**Pure mappers, injected details.** `mapWorkable(list, details, slug, company)` takes the
detail lookup as an argument instead of fetching inside. That is why the spec can run against
fixtures with no network, and why the adapter can be read in two halves: what it asks for and
what it does with the answer.

**Feed boards.** A feed used to be one URL per source. We Work Remotely has one RSS per
category, so `feedBoards` lets the fan-out treat a feed like a provider with fixed boards. The
adapter builds the URL from the board id and tags each item with it, so the ingest run history
shows which category produced what.

**Silence about categories is not a match.** Working Nomads and Jobspresso publish every
category from marketing to legal. The adapters keep only technical categories, because a
marketing posting that mentions "remote" and a salary would otherwise clear the match threshold
on those points alone.

## Gotchas

- Workable's job list is a POST with an empty filter body; a GET on the same path is a 404.
- SmartRecruiters answers 200 with `totalFound: 0` for a company that does not exist; there is
  no 404 to catch, so `describeBoard` treats an empty first page as unknown.
- SmartRecruiters ids are case-insensitive, so the lowercase slug normalisation in
  `addBoard` is safe.
- The Muse's `contents` field is full HTML and can be large; it is stored as `rawHtml` like any
  other posting.
- Jobspresso's `dc:creator` carries the company and location separated by `<br>`; the adapter
  prefers the `job_listing:company` field and falls back to the creator line.
