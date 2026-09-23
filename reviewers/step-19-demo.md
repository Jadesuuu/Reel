# Step 19 — Demo mode

## What this step adds

A build of the web app that needs no API, no database and no worker, so the resume link can
live on Vercel's free plan forever without cold starts or a bill. Set one variable at build time:

```
NEXT_PUBLIC_DEMO_MODE=true
```

and every request the app would have sent to the API is answered in the browser by
`src/demo/`, which implements the same contract (Sections 5 and 11.3 of the plan) over seeded,
synthetic data persisted in `localStorage`. The rest of the app does not know. Not one page,
hook or component changed for the demo except three visible additions: a "Continue as the demo
user" button on the login page, a banner with **Reset** and **Fast-forward 10 days**, and a
"Reminder emails" panel under Settings → Account that shows what the worker would have sent.

## Files, in reading order

1. **`src/lib/api.ts`** — the seam. Four lines at the top of `apiFetch`: if demo mode is on,
   hand the call to `demoFetch` and return. Everything above `apiFetch` is untouched.
2. **`src/demo/index.ts`** — `isDemoMode`, `demoFetch` (adds 90–310 ms of latency so
   skeletons and optimistic updates are exercised, then dispatches), `fastForward`,
   `deliverDueReminders`, `resetDemo`.
3. **`src/demo/router.ts`** — a tiny router: `route('POST', '/applications/:id/stage', handler)`
   registers a pattern; `dispatch` matches method and path, extracts `:params`, parses the
   query string, and calls the handler. Unknown routes throw a 404 `ApiError`, exactly what the
   real API would return.
4. **`src/demo/store.ts`** — the state shape, `getState` (loads from `localStorage` or seeds),
   `mutate` (change then persist), `resetState`, `demoNow` (the clock with its offset).
5. **`src/demo/seed.ts`** — the data: 54 postings across all ten sources plus a reserve pool of
   10 that "Run ingest" releases, criteria, 14 applications with realistic histories, notes,
   contacts and reminders, and two ingest cycles (one with a failed Jobicy run).
6. **`src/demo/handlers/*.ts`** — one file per API module. Read `applications.ts` against
   `apps/api/src/applications/applications.service.ts`: same validation messages, same stage
   machine, same reminder rules.
7. **`src/demo/scoring.ts`** and **`src/demo/stats.ts`** — copies of the API's pure functions.
   Rescore in the demo is real arithmetic over the seeded postings, not stored numbers.
8. **`src/components/demo-banner.tsx`** — Reset and Fast-forward.

## Concepts

**Intercept at the one seam.** Every network call in the app already went through `apiFetch`.
That was a v1 decision made for cookies and error shapes; it paid off here because swapping the
transport is one `if`. The demo never touches TanStack Query, the hooks, or any component.
If the two ever disagree, the contract in the plan is the arbiter and the demo is wrong.

**Same status codes, same messages.** Handlers throw `ApiError` with the codes the Nest
controllers use — 400 for validation with the class-validator wording, 401 when signed out, 404
for unknown ids, 409 for a duplicate board. The UI's error toasts therefore say the same thing
in both builds, and a bug in the demo shows up as a wrong message rather than a silent success.

**Persistence with a version key.** State is one JSON blob under `reel-demo:v1`. Loading checks
`version === 1`; anything else is discarded and reseeded. When the state shape changes, bump
the key and old browsers reseed instead of crashing.

**A clock you can move.** `lib/clock.ts` has always had `now()`; every "days in stage" and
"due in 3 days" reads through it. The demo adds an offset. Fast-forward moves the offset ten
days, then walks pending reminders: a stale check whose application is still in APPLIED sends
(and lands in the outbox), one whose application moved on is cancelled — the same re-check the
worker does in `reminders.processor.ts`.

**Simulated jobs.** "Run ingest" creates RUNNING run rows immediately (so the ingest page shows
the pulse), then a `setTimeout` per source marks the run SUCCEEDED, releases that source's
reserve postings with fresh dates, and rescores. The polling hooks the real app already has pick
up the change with no demo-specific UI.

**Synthetic, and labelled.** Every company, posting and email in the demo is invented, and the
banner says so on every page. Nothing in the demo claims to be a real employer; company boards
in the seed are fictional slugs.

## Array and object work in this step

```ts
const released = draft.reserve.filter(
  (posting) => posting.source === run.source && posting.boardId === run.boardId,
);
draft.reserve = draft.reserve.filter((posting) => !released.includes(posting));
```

Two `filter`s: the first picks the reserve postings that belong to this run, the second keeps
everything else. `includes` on the object references works because both arrays hold the same
objects.

```ts
const pattern = new RegExp(
  `^${template.replace(/:([a-zA-Z]+)/g, (_m, key) => {
    keys.push(key);
    return '([^/]+)';
  })}$`,
);
```

The router turns `/applications/:id/stage` into `^/applications/([^/]+)/stage$` and remembers
that capture group 1 is `id`. `replace` with a function runs once per `:name` and pushes the
name onto `keys` as a side effect.

```ts
return JSON.parse(JSON.stringify(result ?? null)) as T;
```

A deep copy on the way out. The real API returns fresh JSON; returning store objects by reference
would let a component mutate the store. Serialising once mimics the wire.

```ts
const byStage = Object.fromEntries(STAGES.map((stage) => [stage, 0])) as Record<Stage, number>;
```

Same trick as Step 17's `stats.ts`; the demo copy of `summarize` is deliberately the same code.

## Gotchas

- **Import cycle.** `lib/api.ts` imports `demo/index.ts` for the seam; the demo handlers import
  `ApiError` from `lib/api.ts`. ES modules tolerate this because `ApiError` is only used inside
  functions at call time, never at module top level. Do not move `ApiError` usage to top level
  in either file.
- **Only one `next dev` per project.** Next 16 refuses a second dev server for the same
  directory even on another port. To run the demo locally, stop the normal dev server first.
- **`NEXT_PUBLIC_*` is baked at build time.** Toggling the variable needs a rebuild; there is
  no runtime switch by design, so a production build can never accidentally serve demo data.
- **Radix `Select` and Turbopack both cache.** After changing seed data, use Reset in the
  banner; the old state in `localStorage` is what you are looking at otherwise.
