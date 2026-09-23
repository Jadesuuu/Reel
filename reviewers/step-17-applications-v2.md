# Step 17 — Application tracking v2

## What this step adds

v1 could track an application: company, role, link, notes, a stage and its history. That is a
list, not a tracker. This step makes the pipeline stand on its own, with or without a posting
behind it:

- **Richer fields** — `location`, `salaryText`, `via` (where you found it: "LinkedIn",
  "Referral", or the source label when it came from a posting), `appliedAt`, `nextStepAt`
  (the interview or reply you are waiting on), `contactName`, `contactEmail`.
- **Notes as timeline events** — `POST /applications/:id/notes` appends a `StageEvent` with
  `kind: NOTE`. One table, one ordered timeline, no join.
- **Custom follow-up reminders** — `POST /applications/:id/reminders { dueAt }` schedules a
  `FOLLOW_UP` email at a date you choose; scheduling again replaces it; `DELETE` cancels it. The
  ten-day stale reminder from Step 11 is unchanged and still automatic.
- **Stats** — `GET /applications/stats` gives the dashboard its numbers: counts by stage,
  applications this week, response rate, median days to a first response, what is coming up in
  the next two weeks, and an eight-week activity series.

## Files, in reading order

1. **`prisma/migrations/20260923140000_v2_applications/migration.sql`** — the new columns, the
   `EventKind` enum, the `FOLLOW_UP` value, and two backfills: `applied_at` from each
   application's first move to APPLIED, `via` for anything created from an HN posting.
2. **`applications/stats.ts`** — pure. Read `summarize` top to bottom; it is the whole dashboard
   in one function with no database in it.
3. **`applications/stats.spec.ts`** — five applications, fourteen events, three reminders, and
   the numbers computed by hand. If you change `summarize`, change these expectations on paper
   first.
4. **`applications/applications.service.ts`** — `create` (copies from the posting), `addNote`,
   `scheduleFollowUp`, `cancelReminder`, `stats`, and the `appliedAt` line in `changeStage`.
5. **`reminders/reminders.service.ts`** — `scheduleFollowUp` and the `cancel` that now clears both
   kinds. Compare `schedule` (stale) with `scheduleFollowUp` (custom): same upsert-by-jobId shape,
   different delay source.
6. **`reminders/reminders.processor.ts`** — `process` branches on `job.name`; `sendFollowUp`
   re-reads the `Reminder` row before sending.
7. **`applications/dto/update-application.dto.ts`** — every new field is nullable so the UI can
   clear it; note the `@ValidateIf` pattern.

## Concepts

**Notes reuse `StageEvent`.** A note is "something happened at this time on this application" —
exactly what a stage change is, minus the stage change. Adding `kind` to the existing table means
the detail view's timeline is still one query ordered by `createdAt`, and the invariant is easy
to state: a NOTE row has `fromStage === toStage` and never touches `Application.stage`.

**Re-check before sending, again.** The stale reminder re-reads the application and compares
`stageChangedAt`. The follow-up re-reads its own `Reminder` row and sends only if `cancelledAt`
and `sentAt` are both null. Same principle as Section 4.3 of the plan: the queue payload is a
hint, the database is the truth. A cancelled follow-up whose job removal failed (BullMQ can refuse
to remove an active job) is still never emailed.

**One pending follow-up per application.** `jobId = followup-<applicationId>`. `scheduleFollowUp`
removes any existing job, upserts the row on that `jobId`, then adds the new job. The e2e test
schedules twice and asserts the second response has the same `id` and the new `dueAt`.

**Median and ISO weeks in code, not SQL.** `stats.ts` pulls three small selects and does the
arithmetic in TypeScript. At this scale (tens of applications) that is simpler to test than
`date_trunc('week', …)` and `percentile_cont`, and the pure function can be reused by the demo
mode later without a database.

**`appliedAt` is set once.** `changeStage` writes it only when moving to APPLIED and it is still
null, so moving out and back in keeps the original date. PATCH can override it if you applied
before you started tracking.

**Nullable PATCH fields.** `@IsOptional()` treats `null` as "skip validation" but Nest's
`whitelist: true` still passes it through, so `null` reached Prisma and cleared the field by
accident in v1's `url`. The new DTO says what it means:
`@ValidateIf((_, v) => v !== null && v !== undefined)` validates a value when present and lets
`null` through on purpose. The service then maps `null` and `''` to `null` explicitly.

## Array and object work in this step

```ts
const byStage = Object.fromEntries(STAGES.map((stage) => [stage, 0])) as Record<Stage, number>;
```

`STAGES.map(...)` gives `[['SAVED', 0], ['APPLIED', 0], …]`; `Object.fromEntries` turns those
pairs into `{ SAVED: 0, APPLIED: 0, … }`. The loop after it does `byStage[application.stage] += 1`.

```ts
const active = ACTIVE_STAGES.reduce((sum, stage) => sum + byStage[stage], 0);
```

`reduce` walks the four active stages and adds each one's count to a running total that starts
at `0`. The result is a single number.

```ts
const responded = Array.from(firstAppliedAt.keys()).filter((id) => firstResponseAt.has(id));
const responseRate = everApplied === 0 ? null : responded.length / everApplied;
```

`firstAppliedAt` is a `Map` of application id → timestamp of the first APPLIED event. `keys()`
gives an iterator, `Array.from` makes it an array, `filter` keeps the ids that also appear in the
response map. The rate is that count over the applied count, or `null` when nothing was applied so
the UI can show "—" instead of `NaN`.

```ts
const sorted = values.toSorted((a, b) => a - b);
```

`toSorted` returns a **new** sorted array and leaves `values` alone; `sort` would have mutated
the caller's array in place. The comparator `(a, b) => a - b` sorts numbers ascending —
without it, JavaScript sorts numbers as strings and `[10, 9]` stays `[10, 9]`.

```ts
const weekly = Array.from({ length: WEEKS }, (_, index) => ({ weekStart: …, applied: 0, … }));
```

`Array.from` with a length and a mapper builds eight bucket objects, one per week, oldest first.
Each event then lands in `weekly[Math.floor((at - firstWeek) / WEEK_MS)]`.

```ts
...(dto.location === undefined ? {} : { location: toTextOrNull(dto.location) }),
```

A spread of a conditional object: when the client did not send `location`, spread `{}` (adds
nothing); when it did, add a `location` key whose value is the trimmed text or `null`. This is
how PATCH leaves untouched fields untouched.

## Gotchas

- **`prisma migrate dev` is interactive** and refuses to run here without a TTY even for a
  harmless migration, so the workflow is: `migrate diff --to-schema` to see Prisma's SQL, write the
  file, `migrate deploy`, then `migrate diff` again to confirm "No difference detected".
- **`cancel` now cancels two job ids**, so the old unit tests that asserted `updateMany` was called
  once had to change to twice. That is the test doing its job — a behaviour change showed up as a
  red test before it showed up in production.
- **`nextStepAt` on a closed application** (REJECTED, WITHDRAWN) is ignored by `upcoming`; there is
  nothing to do next. The field is kept so reopening the record later keeps its history.
- **`appliedThisWeek` counts events, not applications.** An application moved out of APPLIED and
  back in twice in one week counts twice. That is intended: it measures activity.
