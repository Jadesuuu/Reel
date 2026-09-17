# Step 8 — Postings API

## What this step adds

Read-only endpoints over the postings the worker wrote: a filtered, paginated list and a detail
view. Small step, but it establishes the pagination pattern every later list endpoint reuses.

## Files, in reading order

1. **`common/pagination.ts`** — `toSkipTake(page, pageSize)` and `paginate(items, ...)`. Twelve
   lines, used by postings, matches, applications and ingest runs.
2. **`common/dto/pagination.query.ts`** — the shared query DTO with defaults.
3. **`postings/dto/list-postings.query.ts`** — extends it with `q`, `remote`, `threadId`.
4. **`postings/postings.service.ts`** — `LIST_SELECT`, `DETAIL_SELECT`, `list`, `findOne`.
5. **`postings/postings.controller.ts`** — two routes.

## Concepts

**Why a DTO for query strings.** Everything in a URL is a string: `?page=2` gives you `'2'`.
`@Type(() => Number)` tells `class-transformer` to convert before `class-validator` checks
`@IsInt()`. Without the `@Type`, `@IsInt()` fails on every request. That pairing is the whole
reason `transform: true` is set on the global `ValidationPipe`.

**`select` is a security boundary, not an optimisation.** `rawHtml` holds unsanitised HTML from
strangers on the internet. `LIST_SELECT` and `DETAIL_SELECT` name every column to return, so it
cannot leak by accident. Using Prisma's default (all columns) would ship it to the browser.
`DETAIL_SELECT` adds `rawText` — the stripped, decoded text, safe to render.

**`Promise.all` for the page and the count.** Two independent queries; running them concurrently
halves the latency:

```ts
const [items, total] = await Promise.all([findMany, count]);
```

The destructuring on the left pulls the two resolved values out of the array in order. Both
queries take **the same `where`**, or your total would describe a different set than your items.

**Conditional spread.** This is the trick worth internalising:

```ts
const where = {
  ...(remote ? { remote } : {}),
  ...(threadId ? { threadId } : {}),
  ...(q ? { OR: [...] } : {}),
};
```

Each line means: if the filter was provided, spread that key into the object; otherwise spread an
empty object, which adds nothing. It builds a `where` containing only the filters actually
supplied. The alternative is a pile of `if` statements mutating an object, and this reads better
once it stops looking strange.

**`mode: 'insensitive'`** turns Prisma's `contains` into Postgres `ILIKE`. Searching `northwind`
finds `Northwind Labs`.

## Gotchas

**`PostingsModule` now has a controller and imports `AuthModule`.** The worker imports this
module too (for `upsertMany`), so the worker's DI graph technically contains a controller. It is
harmless — an application context maps no routes — but it is why the worker needs `JWT_SECRET`
set even though it never checks a token.

**Ordering is `postedAt desc`, not `createdAt`.** `createdAt` is when _we_ saw it; `postedAt`
comes from the HN comment timestamp. Re-ingesting must not reshuffle the list.
