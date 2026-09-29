# Step 24 — Browser sources (HiringCafe, Wellfound) and two Philippine feeds (JobStreet, Kalibrr)

## What this step adds

Two sources that no server can read. HiringCafe sits behind Cloudflare and Wellfound behind
DataDome; both answer a real browser and nothing else. So the fetch moves into your Chrome: a
small extension asks Reel what to fetch, opens the site in a background tab, reads the jobs the
page ships with, and posts them back. Reel maps, normalises, dedupes and scores them like any
feed. In Settings they are two more rows with the same toggle and the same Run button, and the
header refetch reaches them too.

Two more sources came out of the same probe and turned out not to need the browser at all:
JobStreet Philippines and Kalibrr both answer a plain server request with JSON, so they are
ordinary feed adapters. The plan records the decisions under Section 11, Step 24, and the probe
results for nine sites.

## The shape, in one paragraph

The worker still fans out one `ingest-source` job per enabled source and preset. For a browser
source the job does not fetch; it records an `IngestRun` in a new `WAITING` state and returns.
The extension polls every 30 seconds with a bearer token. The poll claims waiting runs (they turn
`RUNNING`) and returns them. The extension reads the pages and calls the complete endpoint, which
runs the same three calls the worker runs for a feed: map to `RawPosting`, `normalizePosting`,
`upsertMany`, then a rescore. A run nobody claims within fifteen minutes is failed with
"No browser connected" the next time anyone polls or opens Settings.

## Files, in reading order

### Schema and types

1. **`apps/api/prisma/schema.prisma`** and **`migrations/20260929120000_v5_browser_sources`** —
   two `Source` values, one `RunStatus` value, one table. `browser_tokens` keys on `user_id`
   (one token per user) and on `token_hash` (the lookup on every poll). The migration adds enum
   values by hand, like v4, because Prisma cannot diff Postgres enums safely.
2. **`apps/api/src/sources/source.types.ts`** — `BROWSER_SOURCES`, `BrowserSource`,
   `isBrowserSource`, and `SourceKind` grows a third value. `BROWSER_SOURCES as readonly
string[]` in the guard is the same trick the other guards use: widen the tuple so `.includes`
   accepts any string.
3. **`apps/api/src/sources/source-meta.ts`** — the two entries. `feedBoards` reuses the We Work
   Remotely mechanism: each board id is a search preset, and the fan-out enqueues one job per
   preset. For HiringCafe the id is the query with dashes (`backend-engineer` → "backend
   engineer"); for Wellfound it is the role slug in the URL.

### The run state machine

4. **`apps/api/src/sources/browser/browser-runs.service.ts`** — lives under `sources` so both
   the worker and the API can use it. Read the five methods in order:
   - `request(source, boardId)` looks for an open run first. `findFirst` with
     `status: { in: ['WAITING', 'RUNNING'] }` is the "at most one open run per board" invariant;
     it returns `{ runId, created: false }` instead of a duplicate.
   - `claim(limit)` reads the oldest `WAITING` runs, then flips each with `updateMany({ where:
{ id, status: 'WAITING' } })`. The `count === 1` check is the lock: if two browsers poll at
     once, only one update matches. `startedAt` is reset on claim so "Took" measures the fetch,
     not the wait. `since` is the previous success for that board; the extension uses it to stop
     paging early.
   - `expireStale()` is two `updateMany` calls with a cutoff, one per open state. It runs on
     every poll and every `GET /sources`, so nobody ever sees a run that has been "waiting" for
     a day.
   - `findClaimed(runId)` is the guard for complete: `404` for a run that is not a browser
     source, `409` for one that is not `RUNNING` (already finished, or expired).
   - `succeed` and `fail` write the same fields the worker writes.
5. **`apps/api/src/ingest/ingest.processor.ts`** — the new `if (isBrowserSource(source))` block
   comes before `registry.get`, because there is no adapter for these sources and `get` would
   throw. The result object has the same shape as a normal run so BullMQ's job return value
   stays uniform.
6. **`apps/api/src/sources/sources.service.ts`** — `list()` calls `expireStale()` first, and
   `enabledTargets()` now branches on `kind !== 'board'` instead of `kind === 'feed'`, which is
   the one-word change that makes the presets fan out.

### Mapping, pure and fixture-tested

7. **`apps/api/src/sources/browser/hiringcafe.mapper.ts`** — `HiringCafeHit` is the projection
   the extension sends, with the site's own snake_case names. Company falls through three
   places (`v5.company_name`, `attributed_org.name`, `enriched_company_data.name`) because the
   live page had six of 78 hits with no `company_name`. The description is composed: the
   requirements summary, a "Tools:" line and a facts line, because the list page has no full
   description and the tool list is exactly what `extractStackKeywords` wants. Expired hits and
   hits without an apply link are skipped.
8. **`apps/api/src/sources/browser/wellfound.mapper.ts`** — Wellfound's `remoteConfig.kind`
   is the truth; `remote: true` on a role page only means "listed on the remote page", so
   `ONSITE + wfhFlexible` becomes `HYBRID`. `compensation` is text like `$100k – $180k • 0.05%`;
   the mapper keeps the part before the bullet and lets `normalizePosting`'s `parseSalary` turn
   it into numbers. `markdownToText` strips headings, emphasis, links and bullets from the
   description so the raw text reads cleanly.
9. **`apps/api/src/sources/browser/browser.mappers.spec.ts`** and the two fixtures — the
   fixtures are modelled field for field on hits read from the live pages on 29 Sep 2026, with
   the company names that appeared (Patsnap, Ohr, Taker, Confident LIMS, Speak).

### The API the extension talks to

10. **`apps/api/src/browser/browser-token.guard.ts`** — a plain `CanActivate`, not a Passport
    strategy. It reads `Authorization: Bearer`, hashes with SHA-256, looks the hash up, and
    sets `request.user` to the same `{ userId, email }` shape the JWT strategy sets, so
    `@CurrentUser()` would work here too. `hashToken` is exported because the service uses the
    same function when it stores a new token.
11. **`apps/api/src/browser/browser.service.ts`** — `createToken` upserts, so generating a
    second token replaces the first and resets `lastSeenAt`. `status()` derives `connected` from
    `lastSeenAt` being within 90 seconds; nothing is stored for it. `complete()` is the worker's
    success path copied: map, normalise, upsert, rescore, then `succeed`; on a thrown error it
    fails the run and rethrows so the extension sees a 500.
12. **`apps/api/src/browser/browser.controller.ts`** — two guards on one controller. The three
    user-facing routes use the cookie; the two extension routes use the bearer guard.
13. **`apps/api/src/main.ts`** and **`test/create-app.ts`** — `useBodyParser('json', { limit:
'8mb' })`. Three pages of forty projected hits is a few hundred kilobytes; Nest's default is
    one hundred.
14. **`apps/api/test/browser.e2e-spec.ts`** — walks the whole life: unlinked → token → poll
    claims a requested run → complete stores three postings → a second complete is `409` → the
    next claim carries `since` → an error completes as `FAILED` → an aged run expires on
    `GET /sources` → revoke cuts the token off.

### The extension

15. **`apps/extension/static/manifest.json`** — Manifest V3. `host_permissions` names the two
    sites and the local API; a deployed API origin is an optional permission the options page
    asks for. No content scripts: the service worker injects a function with
    `chrome.scripting.executeScript` when it needs the page.
16. **`apps/extension/src/background.ts`** — `pollOnce()` is the loop body. It loads settings,
    calls the poll, and runs each job in turn. `runJob` opens one tab, navigates it page by page,
    and closes it in `finally`. The stop conditions are: the site says last page, the page is
    empty, three pages, or (HiringCafe only, since it is date-sorted) the oldest job on the page
    is older than the previous run minus a day. A failure completes the run with an `error`
    string so Settings shows why.
17. **`apps/extension/src/tab.ts`** — `waitForNextData` polls `chrome.tabs.get` once a second.
    That call is what keeps the service worker alive; Chrome kills an idle worker after 30 s but
    every extension API call resets the clock. A page whose title looks like a bot check is left
    alone for eight seconds (Cloudflare usually clears itself), then brought to the front for the
    human, with a longer timeout.
18. **`apps/extension/src/sites/hiringcafe.ts`** and **`wellfound.ts`** — `url()` builds the
    page address and `project()` turns the parsed `__NEXT_DATA__` into the projection the
    server's mapper expects. `pick(source, keys)` copies only the listed keys, so the payload is
    small and nothing like `board_token` leaves the browser. Wellfound's projection walks the
    Apollo cache: every `StartupResult:*` entity lists its jobs as `{ __ref }` pointers, and the
    projection resolves each pointer and attaches the startup's name and size to the job.
19. **`apps/extension/src/options.ts`** and **`static/options.html`** — the only UI. Save
    normalises the address (`localhost:4000` becomes `http://localhost:4000/api/v1`), asks for
    host permission when the origin is not local, stores both values, and triggers a poll. The
    status block re-renders from `chrome.storage.onChanged`.
20. **`apps/extension/src/sites/sites.spec.ts`** and **`settings.spec.ts`** — the pure parts.

### The two feeds that did not need a browser

20a. **`apps/api/src/sources/adapters/jobstreet.adapter.ts`** — the same shape as every Step 22
adapter: a `url()` builder, a pure `mapJobStreet()`, and an `@Injectable` that only fetches.
The board id is the keyword with dashes; `sortmode=ListedDate` and `pageSize=100` give the
hundred newest per keyword. Company falls back to the advertiser's legal name because a
third of listings have no `companyName`. The peso salary label is kept as text.
20b. **`apps/api/src/sources/adapters/kalibrr.adapter.ts`** — one board, the "IT and Software"
function sorted newest. `is_work_from_home` and `is_hybrid` are explicit flags, so `remote`
is never null here. The description is already HTML.
20c. **`apps/api/src/sources/adapters/ph.adapters.spec.ts`** and the two fixtures, cut from the
live responses with only the fields the mappers read.

### Web

21. **`apps/web/src/lib/types.ts`**, **`sources.ts`**, **`queries.ts`** — the two sources, the
    third kind, `WAITING`, `BrowserStatus`, and three hooks. `useBrowserStatus` refetches every
    15 s so the dot turns green without a reload.
22. **`apps/web/src/app/(app)/settings/sources/page.tsx`** — a third group, and the `BrowserLink`
    panel. `TokenReveal` shows the token once with a copy button; closing it drops the token
    from React state, and the server never returns it again.
23. **`settings/ingest/page.tsx`**, **`dashboard/page.tsx`**, **`components/app-shell.tsx`** —
    `WAITING` gets the warning tone and the header chip says "waiting" when every open run is
    waiting on the browser.
24. **`apps/web/src/demo/handlers/browser.ts`**, **`handlers/ingest.ts`**, **`store.ts`**,
    **`seed.ts`** — the demo keeps `browser: { linked, createdAt }`. A demo run for a browser
    source starts `WAITING`, becomes `RUNNING` after a beat, then finishes, unless the demo token
    was revoked, in which case it fails with the real message. `getState()` fills in `browser`
    for a state saved before this step, so an old localStorage snapshot still loads.

## Concepts

**Why the browser is a worker, not a client.** The extension knows nothing about which sources
are enabled or when to run. It asks Reel, does what it is told, and reports. That keeps one
scheduler (the worker's cron), one place for toggles (Settings), and one refetch button. If the
extension made its own decisions there would be two ingest schedules to keep in sync.

**Why the projection uses the sites' own field names.** The mapper is the part worth testing,
and a fixture is only honest if it looks like the real payload. So the extension sends
`v5_processed_job_data` and `highlightedJobListings` as they are, trimmed to the keys the
mapper reads, and the server does every transform. Changing what the score sees is a server
change with a spec, not an extension release.

**`claim` and the `count === 1` check.** `updateMany` with the old status in `where` is an
atomic compare-and-set: Postgres updates the row only if it is still `WAITING`. Two browsers
polling at the same instant both read the same waiting run, but only one update returns a count
of one, and only that one gets the job.

**What `pick` produces.** `pick(hit.v5_processed_job_data, V5_KEYS)` returns a new object with
at most the listed keys, skipping any that are `undefined`. `{ ...picked, remoteConfig, startup }`
then copies those keys into a fresh object and adds two more; the spread does not modify
`picked`.

## Not done

- LinkedIn and Indeed. LinkedIn is blocked by the web filter on Jade's work machine, so it
  could not even be probed; Indeed demands an interactive verification in a real tab.
- The extension is loaded unpacked. Packaging it for the Chrome Web Store is a different task.
- Only `hiringcafe.com`'s challenge is handled by waiting; a DataDome captcha on Wellfound
  would surface the same way but has not been seen.
