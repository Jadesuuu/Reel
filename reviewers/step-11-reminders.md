# Step 11 — Reminders and mailer

## What this step adds

The feature the whole project exists for: ten days after you mark something APPLIED, an email
arrives. Move the application on and it cancels itself.

## Files, in reading order

1. **`mailer/mailer.interface.ts`** — a token and an interface, nine lines.
2. **`mailer/console.mailer.ts`** and **`resend.mailer.ts`** — two implementations.
3. **`mailer/mailer.module.ts`** — picks one from env.
4. **`reminders/reminders.constants.ts`** — the queue name and `staleJobId()`.
5. **`reminders/reminders.service.ts`** — schedule and cancel.
6. **`reminders/reminders.processor.ts`** — the re-check and the send.

## Concepts

**Injecting by token.** `Mailer` is a TypeScript interface, and interfaces do not exist at
runtime, so Nest cannot use one as an injection key. Hence:

```ts
export const MAILER = Symbol('MAILER');
```

The module provides that symbol with a `useFactory` that reads `MAILER` from env and returns
either implementation. Consumers write `@Inject(MAILER) private readonly mailer: Mailer` and
never learn which one they got. That is why the processor's tests pass a fake with a single
`send` method and nothing else changes.

**Deterministic job ids.** `staleJobId(applicationId)` returns `stale-<id>`. Scheduling twice for
the same application therefore **replaces** rather than duplicating. The dedupe is free and
requires no bookkeeping — the id itself is the lock.

**Idempotency lives in the processor, not the queue.** This is the important idea in the step.
Deleting a queued job can fail (BullMQ refuses to remove an _active_ job), so cancellation is
best-effort. Correctness comes from the processor re-reading the database before it sends:

```
application missing?                    → skip
application.stage !== 'APPLIED'         → skip
stageChangedAt !== payload timestamp    → skip
```

That third check is the subtle one. Consider: APPLIED on the 1st (job scheduled), INTERVIEWING on
the 3rd, back to APPLIED on the 5th. Two jobs now exist — except they share an id, so only one
does, and its payload carries whichever timestamp was current when it was written. Comparing the
stored `stageChangedAt` against the payload proves the job still describes reality. Without it
you email someone about a stage they left and re-entered.

**The Reminder row mirrors the job.** The queue holds the timer; the table holds what the UI can
read (`dueAt`, `sentAt`, `cancelledAt`). `cancel` updates `where: { jobId, sentAt: null }` — an
already-sent reminder must never be marked cancelled after the fact.

**`STALE_DELAY_MS`.** An optional override in milliseconds, so you can watch the whole path in
three seconds instead of ten days. Never set it in production; `docs/DEPLOY.md` says so too.

## Gotchas

**`RemindersModule` vs `RemindersWorkerModule`,** exactly as with ingest. The API schedules and
cancels; only the worker holds the processor. Both register the same queue name.

**`MailerModule` is `@Global()` and imported only by `WorkerModule`.** The API never sends mail,
so it never needs `RESEND_API_KEY`.

**The zod `RESEND_API_KEY` rule.** `validateEnv` throws when `MAILER=resend` without a key. A
missing key would otherwise surface as a failed send ten days after the fact.

## Verifying it yourself

Create an application in APPLIED, insert a `Reminder` row, and enqueue a `send-stale-reminder`
job with `delay: 3000` and the matching `stageChangedAt`. With the worker running:

```
LOG [ConsoleMailer] To: you@example.com
Subject: Follow up: Northwind Labs — Full Stack Engineer
LOG [RemindersProcessor] Stale reminder sent for cmu49io1q…
```

That path — queue, delay, re-check, send, mark sent — is the one that took the longest to get
right and the one worth understanding in full.
