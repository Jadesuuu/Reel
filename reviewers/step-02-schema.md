# Step 2 — Prisma schema and first migration

## What this step adds

The eight tables the product runs on, as one Prisma schema and one hand-committed migration:
`users`, `criteria`, `ingest_runs`, `postings`, `matches`, `applications`, `stage_events` and
`reminders`. Later steps added `source_settings`, `watched_boards` and `browser_tokens`, and
columns to several of these; each of those has its own migration folder and its own reviewer.
This document reads the original shape, which is still the spine.

The plan has the full schema in Section 3.2 and the invariants in Section 3.3.

## Files, in reading order

1. **`apps/api/prisma/schema.prisma`** — start with the `generator` and `datasource` blocks.
   The generator writes the client to `../src/generated/prisma` (gitignored, so every clone
   regenerates it), and the datasource has no `url`: Prisma 7 gets it from the driver adapter
   in `PrismaService` and from `prisma.config.ts` for the CLI.
   Then the models, in dependency order:
   - `User` owns everything. Every child relation is `onDelete: Cascade`, so deleting a user
     is one statement.
   - `Criteria` is one row per user (`userId @unique`) holding the arrays the scorer reads.
     `String[]` is a Postgres array column, and `@default([])` means a row never has null
     arrays to guard against.
   - `Posting` is global, not per user. `@@unique([source, externalId])` is the identity the
     upsert keys on; `fingerprint` (indexed) is the company-plus-role hash used to spot the
     same job posted twice. `rawHtml` and `rawText` keep the original, `headline` is the one
     line the scorer and the UI use.
   - `Match` joins a user to a posting with a score and its reasons.
     `@@unique([userId, postingId])` is what makes rescoring an upsert rather than an insert,
     and the index on `(userId, dismissed, score)` is the inbox query.
   - `Application` may point at a posting (`postingId` nullable, `onDelete: SetNull`, because a
     job you applied to must survive its posting being purged) or stand alone for jobs found
     elsewhere. `stage` and `stageChangedAt` are the fields the reminder logic reads.
   - `StageEvent` is the immutable log of every stage change and note.
   - `Reminder` records what was scheduled, when it is due, and whether it was sent or
     cancelled; `jobId` ties the row to the BullMQ job so the worker can check both.
   - `IngestRun` is one row per fetch, with counts and an error string; the Settings page and
     the header chip read it.
2. **`apps/api/prisma/migrations/20260916151429_init/migration.sql`** — the SQL Prisma
   generated from the schema: eight `CREATE TABLE`s, the enums, the unique indexes and the
   foreign keys with their `ON DELETE` clauses. Read it once next to the schema; this is where
   `@map("user_id")` becomes a snake_case column and `@@unique` becomes a unique index whose
   name (`postings_source_external_id_key`) you will meet in error messages.
3. **`apps/api/prisma.config.ts`** — the Prisma 7 CLI config: where the schema and migrations
   live, the seed command, and the datasource URL from `.env`.
4. **`apps/api/prisma/seed.ts`** — builds its own client with the adapter (it runs outside
   Nest), upserts the local account `jade@example.com` with criteria, and switches every
   source on. `pnpm db:seed` runs it.

## Concepts

- **Relation field versus scalar field.** `userId String` is the column; `user User
@relation(...)` is the navigation. Queries filter on the scalar and `include` the relation.
- **Compound unique names.** Prisma names the `where` key after the fields:
  `userId_postingId: { userId, postingId }`. That is the shape you see in every `upsert`.
- **Cascade versus SetNull.** Child rows that mean nothing without the parent cascade
  (matches, criteria, events). Rows that have their own life keep a null pointer
  (`Application.postingId`).
- **Migrations are append-only.** A schema change means a new folder under `migrations/`,
  never an edit to an old one. `migrate dev` writes it locally; `migrate deploy` applies it in
  CI and production. Three later migrations were written by hand because Prisma cannot diff
  Postgres enums safely; those reviewers say so.

## Gotchas

- `String[]` and `@default([])` need Postgres. That is one of the reasons the fixed decisions
  table says Postgres and nothing else.
- `migrate dev` refusing with "drift" means the database and the migration history disagree,
  usually because a migration was edited after it ran. Never run `migrate reset` on the local
  database without asking; it drops every posting and application.
- The seed account is not Jade's real account. The real one was registered through the web
  app the next day and has its own criteria row.
