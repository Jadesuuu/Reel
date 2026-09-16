# Reviewers

One document per build step, written to be read _after_ the code exists. The code carries no
comments by design — these are where the explanation lives.

Read them in order. Each one follows the same shape:

- **What this step adds** — in plain terms
- **Files, in reading order** — the path through the code that makes sense, which is rarely
  alphabetical
- **Concepts** — the things worth being able to explain in your own words
- **Gotchas** — what actually broke while building it, and why

| Step | Document                                           | Branch              |
| ---- | -------------------------------------------------- | ------------------- |
| —    | [Repairs to steps 1–6](step-00-repairs.md)         | `feat/ingest-job`   |
| 7    | [Ingest job and worker](step-07-ingest.md)         | `feat/ingest-job`   |
| 8    | [Postings API](step-08-postings.md)                | `feat/postings-api` |
| 9    | [Scoring and matches](step-09-matching.md)         | `feat/matching`     |
| 10   | [Applications and stages](step-10-applications.md) | `feat/applications` |
| 11   | [Reminders and mailer](step-11-reminders.md)       | `feat/reminders`    |
| 12   | [Hardening and Dockerfile](step-12-hardening.md)   | `chore/hardening`   |
| 13   | [Frontend](step-13-frontend.md)                    | `feat/web-*`        |

Steps 1–6 were built in an earlier pass and have no reviewer yet. The repairs document covers
what was wrong with them; the code itself is small enough to read directly, starting at
`apps/api/src/main.ts`.

## The fastest way in

If you only read three files, read these:

1. `apps/api/src/ingest/ingest.processor.ts` — the whole ingest pipeline in one method
2. `apps/api/src/matching/scorer.ts` — a pure function, no framework, all the product logic
3. `apps/api/src/applications/applications.service.ts` — the state machine and transactions

Everything else is wiring around those three.
