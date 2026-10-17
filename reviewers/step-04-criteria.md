# Step 4 — Criteria

## What this step adds

The one row per user that the scorer reads: remote only, role keywords, include keywords,
exclude keywords, a minimum salary. Two routes, `GET /criteria` and `PUT /criteria`. Later
steps added `regionKeywords` (Step 21), and `nearbyKeywords` and `levels` (Step 25) to the
same row and the same two routes; nothing else about the module changed.

The contract is the plan's Section 5.3.

## Files, in reading order

1. **`apps/api/src/criteria/normalize.ts`** — `normalizeKeywords`: trim, lowercase, drop
   empties, dedupe in first-seen order. It is a pure function with its own spec because every
   keyword the scorer will ever compare passes through it. `['  React ', 'react', '']`
   becomes `['react']`.
2. **`apps/api/src/criteria/dto/upsert-criteria.dto.ts`** — each list is `@IsArray()`,
   `@IsString({ each: true })`, at most fifty entries, and a `@Transform` that coerces
   whatever arrived into an array of strings before validation runs. The lists added later
   are optional so an older client that omits them still saves. `levels` is the one list with
   a closed vocabulary (`@IsIn(LEVELS, { each: true })`).
3. **`apps/api/src/criteria/criteria.service.ts`** — `getOrDefault` returns the row or a
   default object with `id: null`, which is how the settings page knows to show "not saved
   yet". `upsert` normalises every list and writes with Prisma `upsert` keyed on `userId`, so
   the first save creates and every later save updates, with one call.
4. **`apps/api/src/criteria/criteria.controller.ts`** — guarded by `JwtAuthGuard`; both
   routes take the caller from `@CurrentUser()`. There is no `:id` in the path because a user
   has exactly one criteria row.
5. **`apps/api/src/matching/matching.service.ts`** (`criteriaFor`) — the consumer. It maps
   the row into `CriteriaForScoring`, or the built-in default (remote only, empty lists) for a
   user who never saved.

## Concepts

- **Upsert.** "Update if it exists, else create", as one database statement keyed on a unique
  column. The alternative, find-then-branch, has a race between the two calls.
- **Normalise on write, not on read.** The scorer compares lowercase to lowercase because the
  service guaranteed it at save time. Doing it at read time would repeat the work on every
  rescore and leave the stored data inconsistent.
- **Defaults as data.** `getOrDefault` returns the same shape whether or not a row exists, so
  the web page has one rendering path.

## Gotchas

- `@Transform` runs before `@IsArray`, so a client that sends a string for a list gets an
  empty list rather than a validation error. That is deliberate: missing means "no keywords".
- The seed and the demo both carry a criteria row; the real account's row is edited through
  the settings page, and was edited directly in the database once during Step 25.
