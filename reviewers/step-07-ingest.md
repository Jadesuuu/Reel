# Step 7 — Ingest job and worker process

## What this step adds

A background job that reads the HN thread and writes postings, plus a **second process** to run
it. Until now everything happened inside an HTTP request. From here, the API only ever puts a
message on a queue and answers immediately.

## Files, in reading order

1. **`ingest/ingest.constants.ts`** — queue name, job name, cron pattern. Constants because both
   the producer (API) and the consumer (worker) must agree on them exactly; a typo in a string
   literal would simply mean the job is never picked up, with no error anywhere.

2. **`ingest/ingest.processor.ts`** — the whole pipeline, one method. Read this one properly:

   ```
   resolve threadId → create IngestRun(RUNNING) → fetch comments → parse each
   → upsertMany → rescoreAllUsers → mark SUCCEEDED with counts
   ```

   and on failure: mark `FAILED`, store the error, **rethrow**. The rethrow is what tells BullMQ
   to retry. Swallowing the error would mark the run failed and then quietly report success to
   the queue.

3. **`postings/postings.service.ts`** (`upsertMany`) — the write path.

4. **`ingest/ingest.service.ts`** — the producer. `enqueue` adds a job; `listRuns` reads history.

5. **`worker.ts` / `worker.module.ts`** — the second process.

## Concepts

**Queue vs Worker vs Job.** A Queue is the producer handle — you `add` to it. A Worker pulls
from it and runs your code. A Job is one unit of work with its data and options. `@Processor`
plus `extends WorkerHost` is Nest's wrapper: your `process(job)` method is the worker body.

**Why a separate process.** Ingesting a thread means ~1,000 HTTP requests to HN and takes
minutes. If that ran inside the API, one ingest would tie up the event loop that is meant to be
answering your browser. Separating them also means you can restart the API without killing a
run in flight.

**`createApplicationContext`.** `worker.ts` calls this instead of `NestFactory.create`. It
builds the dependency-injection graph — services, Prisma, queues — **without** an HTTP server.
A worker has no routes, so there is nothing to listen on.

**Job schedulers and dedupe.** `queue.upsertJobScheduler('ingest-every-6h', { pattern }, ...)`
registers the repeating job. `upsert` means restarting the worker ten times leaves one
scheduler, not ten, because the id is the key.

**Two modules for one feature.** `IngestModule` (imported by `AppModule`) has the controller and
the producer. `IngestWorkerModule` (imported by `WorkerModule`) has the processor. If the
processor were in the module the API loads, **the API would start consuming jobs too** —
defeating the split entirely.

## The array line worth reading twice

```ts
const parsed = items.map((item) => ({ item, parsed: parseComment(item) }));
```

`items` is an array of raw HN comments. `.map` returns a **new array of the same length**, where
each element is an object holding both the original comment and its parsed form. Both halves are
needed downstream: `upsertMany` takes `author` and `time` from `item`, and everything else from
`parsed`. The parentheses around `({ ... })` are required — without them JavaScript reads `{` as
the start of a function body, not an object.

And the counting trick in `upsertMany`:

```ts
const existingIds = new Set(existing.map((row) => row.externalId));
const created = entries.filter((e) => !existingIds.has(String(e.item.id))).length;
```

`.map` pulls one field out of each row into a flat array of strings; `new Set(...)` makes lookup
O(1) instead of scanning the array each time; `.filter` keeps only entries whose id was _not_
already present, and `.length` counts them. One query, not one per comment.

## Gotchas

**BullMQ rejects colons in custom job ids.** The plan specifies
``jobId: `manual:${timestamp}` `` — BullMQ 5.81 throws `Custom Id cannot contain :`. The code
uses dashes and strips the colons out of the ISO timestamp. The plan is wrong here; the code is
right.

**The stubs are deliberate.** `MatchingService.rescoreAllUsers()` does nothing in this step and
is marked `TODO(step-9)`. Wiring the call now means step 9 changes one file instead of three.

**E2E cleanup matters.** `POST /ingest/run` puts a real job in a real Redis. The spec calls
`queue.obliterate({ force: true })` in `afterAll`, or leftovers pile up across runs.

## Verifying it yourself

```bash
docker compose up -d
pnpm --filter api start:worker
```

Then enqueue a job and watch `ingest_runs`. A real run against the live thread took 263 comments
to 263 new postings in about a minute.
