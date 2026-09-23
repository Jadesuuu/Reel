# Step 16 — Sources

## What this step adds

v1 read one thing: the monthly Hacker News thread. This step turns "the HN ingest" into "an
ingest", with ten sources behind one interface: HN, Remotive, Remote OK, Arbeitnow, Himalayas,
Jobicy and We Work Remotely as feeds you switch on or off, plus company boards hosted on
Greenhouse, Lever and Ashby that you add by slug. Every posting still lands in the same
`postings` table with the same shape, so the scorer, the inbox and the pipeline did not have to
learn anything new.

Three ideas carry the step:

1. **An adapter per source, one shape out.** Each adapter knows one API and produces
   `RawPosting[]`. Nothing else in the codebase knows what Remotive's JSON looks like.
2. **A pure normalizer.** `normalizePosting(raw)` turns that shape into exactly what
   `Posting` stores — headline, remote flag, salary numbers, stack keywords, fingerprint. It is
   the Step 6 parser's helpers, reused, and it has no I/O.
3. **Fan-out.** One repeatable `ingest-all` job wakes up every six hours and enqueues one
   `ingest-source` job per enabled source and per watched board. Each of those is its own
   `IngestRun` row, its own retry budget, its own failure.

## Files, in reading order

1. **`sources/source.types.ts`** — the vocabulary. `SOURCES` is the list of ten; `RawPosting` is
   what an adapter produces; `NormalizedPosting` is what the database stores; `SourceAdapter` is
   the one method every adapter must have. Read this before anything else.
2. **`sources/source-meta.ts`** — label, kind (`feed` or `board`), homepage and attribution per
   source. Pure data. The UI's source badges come from here via `GET /sources`.
3. **`sources/normalize.ts`** — the pure core. `normalizePosting` first, then the helpers below it
   (`toDate`, `cleanTags`, `text`, `positive`) which every adapter uses to be defensive about
   missing or malformed fields.
4. **`sources/adapters/remotive.adapter.ts`** — the simplest adapter. Read `mapRemotive` (pure,
   tested) then the class (I/O only). Every other feed adapter has the same two halves.
5. **`sources/adapters/weworkremotely.adapter.ts`** and **`sources/rss.ts`** — the RSS case:
   regex item extraction, entity decoding, "Company: Role" title split.
6. **`sources/adapters/greenhouse.adapter.ts`** — a board adapter: `fetch(slug)` needs a slug,
   and `describeBoard(slug)` is what `POST /sources/boards` uses to check the slug is real.
7. **`sources/adapters/hn.adapter.ts`** — the v1 parser wrapped as an adapter. Notice it fills
   `headline` from `parseComment` so the normalizer keeps HN's real first line instead of
   composing one.
8. **`sources/source-registry.ts`** — the lookup: `Source → adapter`. Nest injects all ten
   adapters into the constructor; `get(source)` returns one.
9. **`sources/sources.service.ts`** — `list` (joins settings, counts, last runs), `setEnabled`,
   boards CRUD, and `enabledTargets()` which decides what the fan-out enqueues.
10. **`ingest/ingest.processor.ts`** — `process` switches on `job.name`; `fanOut` and
    `ingestSource` are the two halves. Compare with the v1 version in git history: the shape is
    the same, the HN specifics are gone.
11. **`postings/postings.service.ts`** — `upsertMany(source, boardId, items)` now takes
    normalized items; `stats()` is two `groupBy` calls.
12. **`prisma/migrations/20260923130000_v2_sources/migration.sql`** — hand-written. Read the
    comments in it.

## Concepts

**The adapter pattern.** Ten sources, ten shapes, one consumer. Without an interface the
processor would be a ten-way `if` on the source and every new source would touch it. With
`SourceAdapter`, adding a source is a new file plus one line in `ADAPTERS` and one entry in
`SOURCE_META`. The processor never changes.

**Pure mapping functions next to impure classes.** Every adapter exports `mapX(payload)` — a
pure function from JSON to `RawPosting[]` — and a class whose `fetch` does exactly one network
call then delegates to `mapX`. Tests call `mapX` on a fixture file. Nothing in `adapters.spec.ts`
touches the network, and every field name in those fixtures was copied from a live response on
23 Sep 2026.

**Composed headlines.** The v1 scorer scans the headline for role keywords because that is where
HN commenters put the role. Other sources give structured fields, so the normalizer composes an
HN-style headline: `Company | Role | Location | Remote | $120k–$160k`. One rule for scoring, one
line for the inbox to show, regardless of source.

**Fan-out with a coordinator job.** `ingest-all` does no fetching. It reads which sources are
enabled, builds one job per target and calls `queue.addBulk`. Why not loop over sources inside
one job? Because then a Greenhouse board timing out would fail (and retry) the whole cycle
including the nine sources that worked. Separate jobs mean separate retries, separate run rows
and a per-source failure that the settings page can show.

**Hand-written rename migration.** Prisma's generator saw `threadId → boardId` as "drop one
column, add another", which would have emptied 264 real rows. The migration instead says
`ALTER TABLE … RENAME COLUMN`, renames the index to the name Prisma expects, and backfills
`url` for existing HN rows. After applying it, `prisma migrate diff` against the schema reports
no difference — that is the check that the hand-written SQL and the schema agree.

**`ALTER TYPE … ADD VALUE`.** Adding enum values in Postgres is one statement per value and
cannot run inside the same transaction that uses the new value. Prisma emits them at the top of
the migration for that reason.

**Global settings, not per-user.** `SourceSetting` and `WatchedBoard` have no `userId`. Postings
are global already (invariant 8 in the plan), so a per-user toggle would still ingest for
everyone. The plan records this in Section 11.1.

## Array work in this step

```ts
this.adapters = new Map(all.map((adapter) => [adapter.source, adapter]));
```

`all.map(...)` produces an array of two-element arrays: `[['HN', hnAdapter], ['REMOTIVE', …]]`.
`new Map(pairs)` turns those pairs into a lookup table keyed by the first element. Afterwards
`this.adapters.get('REMOTIVE')` is the adapter instance.

```ts
const countBySource = new Map(counts.map((row) => [row.source, row._count._all]));
```

Same trick over a `groupBy` result. `counts` looks like
`[{ source: 'HN', _count: { _all: 264 } }, …]`; the map produces `[['HN', 264], …]`.

```ts
const targets = SOURCES.filter((source) => enabled.get(source) ?? true);
```

Not literally in the code — the service uses a `for` loop because it also expands boards — but
this is the shape: `filter` keeps the sources whose flag is on, and `?? true` treats "no row yet"
as enabled.

```ts
.map((value) => value.trim().toLowerCase())
.filter((value) => value.length > 0);
return Array.from(new Set(tags));
```

`cleanTags`: `map` transforms every tag, `filter` drops the blanks, `new Set` removes duplicates,
`Array.from` turns the set back into an array. Same pattern as `normalizeKeywords` in Step 4.

```ts
await this.queue.addBulk(targets.map((target) => ({ name, data: target, opts })));
```

`map` turns each `{ source, boardId? }` into the object BullMQ wants for one job; `addBulk`
takes the whole array and enqueues them in one round-trip.

## Gotchas

- **BullMQ rejects `:` in custom job ids.** v1's plan wrote `stale:<id>`; the code already used
  `stale-<id>`. Every id here uses `-`: `manual-all-202609231400`, `cycle-GREENHOUSE-stripe-…`.
- **Greenhouse double-escapes `content`.** The HTML arrives as `&lt;h2&gt;…`. `htmlToText`
  decodes entities *after* stripping tags, so it would have stripped nothing. The adapter runs
  `he.decode` once first; the test asserts `rawText` starts with `Who we are`, not `<h2>`.
- **We Work Remotely escapes `<description>` rather than using CDATA.** `rss.ts` handles both:
  CDATA is unwrapped as-is, anything else is entity-decoded once. The result is HTML either way,
  which `htmlToText` then flattens.
- **Remote OK's first array element is a legal notice**, not a job. `mapRemoteOk` skips any entry
  with a `legal` key. Remote OK asks for a link back — `url` on every posting points at their page
  and the UI shows the source.
- **Remotive dates have no timezone** (`2026-09-18T16:43:22`). `toDate` appends `Z` to ISO-like
  strings without a zone so they are read as UTC, not the server's local time.
- **Jobicy's salary fields are `salaryMin`/`salaryMax`**, not `annualSalaryMin` as older docs
  say. The fixture is the proof; the plan table was corrected from it.
- **`prisma migrate dev` refused to run non-interactively** because of the data-loss warning on
  the rename. The workaround was to write the migration SQL by hand, apply it with
  `migrate deploy`, and confirm with `migrate diff` that nothing drifted.
- **`lastRun` per source in one query**: `findMany({ distinct: ['source'], orderBy: { startedAt:
  'desc' } })` — Prisma applies `DISTINCT ON` after ordering, so the newest run per source wins.
