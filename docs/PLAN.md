# Reel — Build Plan

**Owner:** Jade Bonifacio · **Repo:** `github.com/Jadesuuu/reel` · **Deadline:** 30 Sept 2026
**Status of this document:** source of truth. If code and this plan disagree, either fix the code or
edit this plan in the same PR. Never let them drift silently.

---

## 0. How to use this plan

**Working mode (changed 16 Sep 2026).** The project is built end to end for Jade, who studies it
afterwards from the per-step reviewers under `reviewers/`. Code carries no comments — Jade writes
those himself. Each step is still its own branch, stacked in plan order; Jade pushes and merges them
himself, one at a time. This changes *who types the code*, not *what gets built*: every name, schema
field, endpoint, and rule below still holds, and the "Learn first" lists now describe what each
reviewer should teach rather than what to study before typing.

Each step is one branch → PR → merge. The gate before a branch is done:
`pnpm lint && pnpm format:check && pnpm typecheck && pnpm test` (plus `pnpm test:e2e` where the step
adds e2e). Merge with a merge commit (not squash) so the next stacked branch applies cleanly.

Sections 1–6 are reference and change only through a PR that explains why. Section 7 is the work.

**Definition of done for the whole project:** deployed and reachable, Jade logs in daily and uses
it, the HN thread ingests on schedule, a stalled application produces a real email, CI is green,
README reads as a case study, and `jadebonifacio.dev` links to it.

---

## 1. What Reel is

A personal job-hunt tracker that does the boring part for you.

Every month, Hacker News posts an "Ask HN: Who is hiring?" thread with 1,000+ comments. Reel fetches
that thread on a schedule, parses each top-level comment into a structured **posting** (company,
role, location, remote/onsite, salary, stack keywords, apply link), deduplicates, and **scores** each
posting against your saved **criteria** (remote-only, role keywords, stack keywords, exclusions).
Postings that score above a threshold become **matches** and show up in your inbox.

From a match (or manually, for jobs found elsewhere) you create an **application** and move it
through **stages**: saved → applied → interviewing → offer / rejected / withdrawn. Every stage
change is recorded. When an application sits in `APPLIED` for 10 days with no change, a **reminder**
job emails you to follow up.

### Goals (why this exists)

1. Portfolio proof of backend rigor: auth, relational schema, background jobs with retries and
   idempotency, a tested parser, CI, Docker, deployment.
2. Actually useful to Jade during his job search in Sept–Oct 2026.
3. Learning vehicle: Jade writes every line of backend code himself.

### Non-goals for v1 (do not build these, even if tempted)

- Any job source other than HN "Who is hiring?".
- Browser extension, scraping of arbitrary sites, LinkedIn/Wellfound integrations.
- AI/LLM-based matching or summarization.
- Teams, sharing, multi-user collaboration. (Multiple accounts can exist; they never see each other.)
- Mobile app. Push notifications. Slack/Discord bots.
- Refresh tokens, OAuth, magic links, 2FA.
- Realtime (websockets). Polling from the UI is fine.

---

## 2. Fixed decisions

These are decided. Do not relitigate mid-build. If something here turns out to be genuinely
impossible, change it in a PR that edits this table and explains why.

| Area | Decision | Why |
|---|---|---|
| Runtime | Node 22 LTS | Current LTS, native `fetch`. |
| Package manager | pnpm 9, workspaces | Fast, strict, standard for monorepos. |
| Language | TypeScript, `strict: true` everywhere | Non-negotiable for a portfolio backend. |
| Repo layout | `apps/api`, `apps/web`, `packages/tsconfig` | Two deployables, one shared config package. |
| Backend framework | NestJS 12 (whatever `nest new` installs today; pin the major) | Modules, DI, guards, first-class BullMQ integration. Reads as production code to reviewers. |
| ORM | Prisma 7 (stable 7.x, **not** the 8 RC) with `@prisma/adapter-pg` | Schema-as-code, migrations, type-safe client. v7 requires a driver adapter and `prisma.config.ts` — see Step 1. |
| Database | PostgreSQL 16 | Relational data, arrays, good full-text later if needed. |
| Queue | BullMQ 5 on Redis 7 | Delayed jobs, repeatable jobs, retries, idempotent `jobId`. |
| Worker | Separate process (`apps/api/src/worker.ts`), same codebase | Real-world pattern: API and worker scale independently. |
| Validation | `zod` for env; `class-validator` + `class-transformer` for DTOs | Nest's ValidationPipe uses class-validator natively. |
| Auth | Email + password, `argon2` hashing, JWT (HS256) in httpOnly cookie `reel_session`, 7-day expiry, no refresh tokens | Simple, correct, enough for v1. |
| Passport | `@nestjs/passport` + `passport-jwt`, cookie extractor | Standard Nest auth path; guards are the learning goal. |
| HTTP client | Native `fetch` (Node 22) | No axios. Fewer deps. |
| Concurrency limiting | `p-limit` | Don't hammer HN with 1,200 parallel requests. |
| HTML → text | `he` (decode entities) + a small regex strip | HN comment `text` is HTML. Avoid a full DOM parser. |
| Email | Interface `Mailer` with `ConsoleMailer` (dev/test) and `ResendMailer` (prod) | Swappable via DI; no real emails in tests. |
| Logging | `nestjs-pino` | Structured JSON logs; request IDs. |
| Testing | **Vitest** + `@nestjs/testing` + `supertest` | What `nest new` ships now (not Jest). Unit tests next to files (`*.spec.ts`), e2e in `apps/api/test/`. Where the plan later says "Jest", read "the test runner". |
| Lint/format | **oxlint** + Prettier | What `nest new` ships now (not ESLint). Root-level `.oxlintrc.json`, shared. |
| Module system | **ESM** (`"type": "module"`) | The Nest 12 scaffold is ESM, so relative imports end in `.js` (`'./app.module.js'`). Correct, not a bug. |
| CI | GitHub Actions: lint → typecheck → build → test, with Postgres + Redis service containers | Every PR. |
| Containers | `docker-compose.yml` for local infra; `apps/api/Dockerfile` (multi-stage) for deploy | |
| Frontend | Next.js 16 App Router, Tailwind, shadcn/ui, TanStack Query | Built last. Skills allowed here. |
| API ↔ web | Web calls API directly with `credentials: 'include'`; CORS allows the web origin | No BFF layer in v1. |
| Deploy | API + worker + Postgres + Redis on Railway; web on Vercel | Railway has one-click Postgres/Redis and runs two services from one repo. |
| IDs | `cuid()` strings via Prisma `@default(cuid())` | Non-guessable, sortable enough. |
| Timezone | Store everything UTC. User has a `timezone` field (default `Asia/Manila`) used only for display and reminder scheduling. | |
| API style | REST, JSON, plural nouns, `/api/v1` prefix | |
| Error shape | `{ statusCode, message, error }` (Nest default) | Don't customize in v1. |
| Pagination | `?page=1&pageSize=25` → `{ items, page, pageSize, total }` | Offset pagination is fine at this scale. |

### Naming conventions

- Files: `kebab-case.ts`. Nest style: `postings.controller.ts`, `postings.service.ts`, `postings.module.ts`.
- Classes: `PascalCase`. DTOs end in `Dto`: `CreateApplicationDto`.
- Prisma models: `PascalCase` singular. Tables get mapped to `snake_case` plural via `@@map`.
- Enums: `SCREAMING_SNAKE` values.
- Env vars: `SCREAMING_SNAKE`.
- Queue names: lowercase nouns: `ingest`, `reminders`. Job names: `kebab-case` verbs: `ingest-hn-thread`, `send-stale-reminder`.
- Branch names: `type/short-description` (`feat/auth`, `chore/hardening`). Commit messages: Conventional Commits.

### Ports and URLs

| Thing | Local | Prod |
|---|---|---|
| API | `http://localhost:4000/api/v1` | `https://reel-api.up.railway.app/api/v1` (whatever Railway gives) |
| Web | `http://localhost:3000` | `https://reel.jadebonifacio.dev` (CNAME to Vercel) |
| Postgres | `postgresql://reel:reel@localhost:5432/reel` | Railway-provided |
| Redis | `redis://localhost:6379` | Railway-provided |

---

## 3. Domain model

### 3.1 Entities in plain English

- **User** — one account. Has one Criteria, many Applications, many Matches.
- **Criteria** — what this user wants. One row per user. Used by the scorer.
- **IngestRun** — one execution of the ingestion job. Audit trail: when, how many, did it fail.
- **Posting** — one parsed HN comment. Global, not per-user. Unique on `(source, externalId)`.
- **Match** — "this posting is relevant to this user, with this score and these reasons". Unique on `(userId, postingId)`.
- **Application** — something the user is actively pursuing. Optionally linked to a Posting; may be manual (a Wellfound job, for example). Has a current `stage`.
- **StageEvent** — append-only history of stage changes on an Application.
- **Reminder** — a scheduled follow-up nudge for an Application. Mirrors a delayed BullMQ job.

### 3.2 Prisma schema (complete — copy this exactly in Step 2)

```prisma
// apps/api/prisma/schema.prisma

generator client {
  provider = "prisma-client"          // Prisma 7 generator (not prisma-client-js)
  output   = "../src/generated/prisma" // required in v7; gitignored; regenerate with pnpm db:generate
}

datasource db {
  provider = "postgresql"
  // No url here in Prisma 7 — it lives in apps/api/prisma.config.ts
}

// ─────────────────────────── Enums ───────────────────────────

enum Source {
  HN
}

enum RunStatus {
  RUNNING
  SUCCEEDED
  FAILED
}

enum RemoteType {
  REMOTE
  HYBRID
  ONSITE
  UNKNOWN
}

enum Stage {
  SAVED
  APPLIED
  INTERVIEWING
  OFFER
  REJECTED
  WITHDRAWN
}

enum ReminderKind {
  STALE_APPLICATION
}

// ─────────────────────────── Models ──────────────────────────

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String   @map("password_hash")
  timezone     String   @default("Asia/Manila")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  criteria     Criteria?
  applications Application[]
  matches      Match[]

  @@map("users")
}

model Criteria {
  id              String   @id @default(cuid())
  userId          String   @unique @map("user_id")
  remoteOnly      Boolean  @default(true) @map("remote_only")
  roleKeywords    String[] @default([]) @map("role_keywords")     // e.g. ["full stack", "fullstack", "full-stack", "software engineer"]
  includeKeywords String[] @default([]) @map("include_keywords")  // e.g. ["typescript", "node", "react", "nestjs", "postgres"]
  excludeKeywords String[] @default([]) @map("exclude_keywords")  // e.g. ["senior staff", "principal", "php", "wordpress"]
  minSalaryUsd    Int?     @map("min_salary_usd")
  updatedAt       DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("criteria")
}

model IngestRun {
  id               String    @id @default(cuid())
  source           Source
  externalThreadId String    @map("external_thread_id")   // HN story id, e.g. "41425910"
  status           RunStatus @default(RUNNING)
  startedAt        DateTime  @default(now()) @map("started_at")
  finishedAt       DateTime? @map("finished_at")
  commentsSeen     Int       @default(0) @map("comments_seen")
  postingsCreated  Int       @default(0) @map("postings_created")
  postingsUpdated  Int       @default(0) @map("postings_updated")
  error            String?

  @@index([startedAt])
  @@map("ingest_runs")
}

model Posting {
  id            String     @id @default(cuid())
  source        Source
  externalId    String     @map("external_id")      // HN comment id as string
  threadId      String     @map("thread_id")        // HN story id as string
  author        String
  postedAt      DateTime   @map("posted_at")

  // Parsed fields (nullable: parsing is best-effort)
  company       String?
  role          String?
  location      String?
  remote        RemoteType @default(UNKNOWN)
  salaryText    String?    @map("salary_text")
  salaryMinUsd  Int?       @map("salary_min_usd")
  salaryMaxUsd  Int?       @map("salary_max_usd")
  stackKeywords String[]   @default([]) @map("stack_keywords")
  applyUrl      String?    @map("apply_url")

  // Raw, always kept
  rawHtml       String     @map("raw_html")
  rawText       String     @map("raw_text")
  headline      String                           // first line of rawText, trimmed, max 300 chars

  // sha1(normalize(company) + "|" + normalize(role)) — same company+role reposted next month → same fingerprint
  fingerprint   String

  createdAt     DateTime   @default(now()) @map("created_at")
  updatedAt     DateTime   @updatedAt @map("updated_at")

  matches      Match[]
  applications Application[]

  @@unique([source, externalId])
  @@index([fingerprint])
  @@index([postedAt])
  @@index([threadId])
  @@map("postings")
}

model Match {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  postingId String   @map("posting_id")
  score     Int
  reasons   String[] @default([])   // e.g. ["remote", "role:full stack", "stack:typescript", "stack:react", "salary"]
  dismissed Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  posting Posting @relation(fields: [postingId], references: [id], onDelete: Cascade)

  @@unique([userId, postingId])
  @@index([userId, dismissed, score])
  @@map("matches")
}

model Application {
  id           String    @id @default(cuid())
  userId       String    @map("user_id")
  postingId    String?   @map("posting_id")   // null for manual entries
  company      String
  role         String
  url          String?
  stage        Stage     @default(SAVED)
  notes        String?
  stageChangedAt DateTime @default(now()) @map("stage_changed_at")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  user      User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  posting   Posting?     @relation(fields: [postingId], references: [id], onDelete: SetNull)
  events    StageEvent[]
  reminders Reminder[]

  @@index([userId, stage])
  @@map("applications")
}

model StageEvent {
  id            String   @id @default(cuid())
  applicationId String   @map("application_id")
  fromStage     Stage?   @map("from_stage")   // null on creation
  toStage       Stage    @map("to_stage")
  note          String?
  createdAt     DateTime @default(now()) @map("created_at")

  application Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  @@index([applicationId, createdAt])
  @@map("stage_events")
}

model Reminder {
  id            String       @id @default(cuid())
  applicationId String       @map("application_id")
  kind          ReminderKind
  dueAt         DateTime     @map("due_at")
  sentAt        DateTime?    @map("sent_at")
  cancelledAt   DateTime?    @map("cancelled_at")
  jobId         String       @unique @map("job_id")   // BullMQ jobId, e.g. "stale:<applicationId>"
  createdAt     DateTime     @default(now()) @map("created_at")

  application Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  @@index([applicationId])
  @@map("reminders")
}
```

### 3.3 Invariants (the rules the code must enforce)

1. A user has at most one Criteria row. Creating criteria is an upsert.
2. `Posting (source, externalId)` is unique. Ingestion **upserts** on it; never inserts blindly.
3. `Match (userId, postingId)` is unique. Rescoring **upserts** score and reasons; never duplicates.
4. Every Application has at least one StageEvent (the creation event, `fromStage = null`).
5. Changing `Application.stage` always: writes a StageEvent, updates `stageChangedAt`, cancels any pending Reminder, and schedules a new Reminder if the new stage is `APPLIED`.
6. A Reminder's `jobId` is deterministic: `stale:<applicationId>`. Cancelling = remove BullMQ job by that id + set `cancelledAt`.
7. `Reminder` is only ever sent if, at send time, the Application is **still** in `APPLIED` and `stageChangedAt` is unchanged since scheduling. The worker re-reads the DB; it never trusts the job payload alone.
8. Users only ever read/write their own Criteria, Matches, Applications. Every query in those services filters by `userId` from the JWT. Postings are global and read-only via the API.

---

## 4. Architecture

### 4.1 Processes

```
┌──────────────┐   HTTPS/JSON    ┌──────────────────┐
│  apps/web    │ ──────────────► │  apps/api (API)  │ ──► Postgres
│  Next.js     │  cookie auth    │  NestJS, port 4000│ ──► Redis (enqueue only)
└──────────────┘                 └──────────────────┘
                                          │ BullMQ queues: ingest, reminders
                                          ▼
                                 ┌──────────────────┐
                                 │ apps/api (worker)│ ──► Postgres
                                 │ src/worker.ts    │ ──► Redis (consume)
                                 │                  │ ──► HN API (fetch)
                                 │                  │ ──► Resend (email)
                                 └──────────────────┘
```

Same codebase, two entrypoints:

- `src/main.ts` → `NestFactory.create(AppModule)` → HTTP server. Registers queues (so it can enqueue) but registers **no processors**.
- `src/worker.ts` → `NestFactory.createApplicationContext(WorkerModule)` → no HTTP. Registers the processors. `WorkerModule` imports `PrismaModule`, `IngestModule`, `RemindersModule`, `MailerModule`.

Why: if the worker crashes mid-parse, the API stays up. If HN is slow, API latency is unaffected. This is the pattern reviewers expect.

### 4.2 Nest module map (`apps/api/src/`)

```
src/
├── main.ts                     # HTTP entrypoint
├── worker.ts                   # Worker entrypoint
├── app.module.ts               # imports everything below (API side)
├── worker.module.ts            # imports only what the worker needs
├── config/
│   ├── env.schema.ts           # zod schema for process.env
│   └── config.module.ts        # ConfigModule.forRoot({ validate })
├── prisma/
│   ├── prisma.module.ts        # @Global()
│   └── prisma.service.ts
├── health/
│   ├── health.controller.ts    # GET /health
│   └── health.module.ts
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts      # register, login, logout, me
│   ├── auth.service.ts         # hash, verify, sign
│   ├── jwt.strategy.ts         # passport-jwt with cookie extractor
│   ├── jwt-auth.guard.ts
│   ├── current-user.decorator.ts
│   └── dto/register.dto.ts, login.dto.ts
├── users/
│   ├── users.module.ts
│   └── users.service.ts        # findByEmail, create
├── criteria/
│   ├── criteria.module.ts
│   ├── criteria.controller.ts  # GET, PUT
│   ├── criteria.service.ts     # getOrDefault, upsert
│   └── dto/upsert-criteria.dto.ts
├── hn/
│   ├── hn.module.ts
│   ├── hn.client.ts            # findLatestWhoIsHiringThread, fetchItem, fetchTopLevelComments
│   ├── hn.types.ts             # HnItem, HnSearchHit
│   ├── hn.parser.ts            # PURE functions: parseComment(item) → ParsedPosting
│   ├── hn.parser.spec.ts       # fixture-driven tests
│   └── __fixtures__/           # 15–20 real comment JSON files
├── ingest/
│   ├── ingest.module.ts
│   ├── ingest.controller.ts    # POST /ingest/run, GET /ingest/runs
│   ├── ingest.service.ts       # enqueue, listRuns
│   ├── ingest.processor.ts     # @Processor('ingest') — the actual job
│   └── ingest.constants.ts     # INGEST_QUEUE = 'ingest', jobs, cron
├── postings/
│   ├── postings.module.ts
│   ├── postings.controller.ts  # GET /postings, GET /postings/:id
│   ├── postings.service.ts     # list (filters, pagination), findOne, upsertFromParsed
│   └── dto/list-postings.query.ts
├── matching/
│   ├── matching.module.ts
│   ├── matching.controller.ts  # GET /matches, POST /matches/:id/dismiss, POST /matches/rescore
│   ├── matching.service.ts     # rescoreUser, list, dismiss
│   ├── scorer.ts               # PURE: score(posting, criteria) → { score, reasons }
│   └── scorer.spec.ts
├── applications/
│   ├── applications.module.ts
│   ├── applications.controller.ts
│   ├── applications.service.ts # create, list, findOne, update, changeStage
│   └── dto/create-application.dto.ts, update-application.dto.ts, change-stage.dto.ts
├── reminders/
│   ├── reminders.module.ts
│   ├── reminders.service.ts    # schedule(applicationId), cancel(applicationId)
│   ├── reminders.processor.ts  # @Processor('reminders')
│   └── reminders.constants.ts
└── mailer/
    ├── mailer.module.ts        # provides MAILER token → Console or Resend based on env
    ├── mailer.interface.ts     # interface Mailer { send(msg): Promise<void> }
    ├── console.mailer.ts
    └── resend.mailer.ts
```

### 4.3 Queues and jobs

| Queue | Job name | Producer | Payload | jobId | Options |
|---|---|---|---|---|---|
| `ingest` | `ingest-hn-thread` | Repeatable schedule registered by worker on boot: cron `0 */6 * * *` (every 6h). Also `POST /ingest/run` (manual). | `{ threadId?: string }` (omit → find latest) | Repeatable: BullMQ manages. Manual: `manual:<ISO timestamp minute>` | `attempts: 3`, `backoff: { type: 'exponential', delay: 30_000 }`, `removeOnComplete: 50`, `removeOnFail: 100` |
| `reminders` | `send-stale-reminder` | `RemindersService.schedule()` on stage → `APPLIED` | `{ applicationId, stageChangedAt: ISO }` | `stale:<applicationId>` | `delay: 10 days in ms` (env `STALE_AFTER_DAYS`, default 10; set to minutes in dev), `attempts: 3`, `backoff` same |

**Idempotency rules**

- Ingest: a job that crashes and retries re-upserts the same comments. Upsert on `(source, externalId)` makes this safe. `IngestRun` row is created at job start; on retry a *new* run row is created (the old one is marked `FAILED` in the `catch`).
- Reminder: `jobId` is fixed per application. Adding a job with an existing `jobId` is a no-op in BullMQ, so scheduling twice cannot double-send. Cancel = `queue.remove(jobId)`. Processor re-reads Application and checks `stage === 'APPLIED' && stageChangedAt.toISOString() === payload.stageChangedAt` before sending. If false → log and return (success, not failure).

### 4.4 Request lifecycle (for the mental model)

`HTTP request → nestjs-pino logger middleware → CORS → cookie-parser → Controller route → JwtAuthGuard (reads reel_session cookie, verifies, attaches req.user = { userId, email }) → ValidationPipe (DTO) → Controller method → Service (business logic, Prisma) → JSON response`

---

## 5. API contract

Base path: `/api/v1`. All bodies JSON. All authenticated routes require the `reel_session` cookie; 401 otherwise. Validation errors → 400 with Nest's default shape. Not found → 404. Another user's resource → 404 (not 403; don't leak existence).

### 5.1 Health (no auth)

| Method | Path | Response |
|---|---|---|
| GET | `/health` | `200 { status: 'ok', db: true, redis: true }` or `503` with the failing flag `false` |

### 5.2 Auth

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/auth/register` | `{ email: string (email), password: string (min 10) }` | `201 { id, email }` + sets cookie. `409` if email taken. |
| POST | `/auth/login` | `{ email, password }` | `200 { id, email }` + sets cookie. `401` on bad credentials (same message for unknown email and wrong password). |
| POST | `/auth/logout` | — | `204`, clears cookie. |
| GET | `/auth/me` | — | `200 { id, email, timezone, createdAt }` |

Cookie: `reel_session`, `httpOnly: true`, `sameSite: 'lax'`, `secure: NODE_ENV === 'production'`, `maxAge: 7d`, `path: '/'`. In prod, `domain` is unset (cookie scoped to API host) — the web app talks to the API host directly, so this works.

JWT payload: `{ sub: userId, email }`. Signed with `JWT_SECRET`. `expiresIn: '7d'`.

### 5.3 Criteria

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/criteria` | — | `200 Criteria` (if none exists, return defaults with `id: null` — do not create) |
| PUT | `/criteria` | `{ remoteOnly: boolean, roleKeywords: string[], includeKeywords: string[], excludeKeywords: string[], minSalaryUsd?: number }` | `200 Criteria` (upsert). All keywords lowercased and trimmed on save; empty strings removed; max 50 per array. |

### 5.4 Ingest

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/ingest/run` | `{ threadId?: string }` | `202 { jobId }`. Enqueues. Does not wait. |
| GET | `/ingest/runs` | `?page&pageSize` | `200 { items: IngestRun[], page, pageSize, total }` newest first |

### 5.5 Postings (global, read-only)

| Method | Path | Query | Response |
|---|---|---|---|
| GET | `/postings` | `q?: string` (ILIKE on headline, company, role), `remote?: RemoteType`, `threadId?: string`, `page`, `pageSize` (max 100) | `200 { items, page, pageSize, total }` ordered by `postedAt desc`. Items exclude `rawHtml`. |
| GET | `/postings/:id` | — | `200 Posting` (includes rawText, excludes rawHtml) |

### 5.6 Matches

| Method | Path | Body/Query | Response |
|---|---|---|---|
| GET | `/matches` | `?dismissed=false` (default false), `page`, `pageSize` | `200 { items: (Match & { posting: PostingSummary })[], ... }` ordered by `score desc, posting.postedAt desc` |
| POST | `/matches/:id/dismiss` | — | `200 Match` with `dismissed: true` |
| POST | `/matches/rescore` | — | `202 { rescored: number }` — synchronous in v1 (runs `MatchingService.rescoreUser(userId)` over postings from the last 45 days). Fine at this scale. |

### 5.7 Applications

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/applications` | `{ postingId?: string, company?: string, role?: string, url?: string, notes?: string }` — if `postingId` given, company/role/url default from the posting; otherwise `company` and `role` are required | `201 Application` (with `events: [creation event]`) |
| GET | `/applications` | `?stage?: Stage`, `page`, `pageSize` | `200 { items, ... }` ordered by `updatedAt desc` |
| GET | `/applications/:id` | — | `200 Application & { events: StageEvent[], posting?: PostingSummary, reminders: Reminder[] }` |
| PATCH | `/applications/:id` | `{ company?, role?, url?, notes? }` | `200 Application` |
| POST | `/applications/:id/stage` | `{ to: Stage, note?: string }` | `200 Application`. Same stage as current → `400`. |
| DELETE | `/applications/:id` | — | `204`. Cancels reminder. |

**Allowed stage transitions** (enforce in service; anything else → 400):

```
SAVED        → APPLIED, WITHDRAWN
APPLIED      → INTERVIEWING, REJECTED, WITHDRAWN
INTERVIEWING → OFFER, REJECTED, WITHDRAWN
OFFER        → REJECTED, WITHDRAWN            (declined offer = WITHDRAWN)
REJECTED     → (none)
WITHDRAWN    → (none)
```

---

## 6. HN ingestion and scoring — exact rules

### 6.1 Finding the thread

Use the Algolia HN Search API (no key needed):

```
GET https://hn.algolia.com/api/v1/search_by_date?tags=story,author_whoishiring&query=%22Who%20is%20hiring%22&hitsPerPage=5
```

Response `hits[]` each has `objectID` (story id as string), `title`, `created_at`. Pick the first hit whose `title` matches `/^Ask HN: Who is hiring\?/i`. (The `whoishiring` account also posts "Who wants to be hired?" and "Freelancer?" threads — filter them out.)

### 6.2 Fetching the comments

Firebase HN API (no key):

```
GET https://hacker-news.firebaseio.com/v0/item/{id}.json
```

Story item has `kids: number[]` — these are **top-level** comment ids. Only top-level comments are job posts; replies are discussion. Fetch each kid with `p-limit(10)`. Skip items where `deleted === true` or `dead === true` or `text` is missing. Comment item shape:

```ts
type HnItem = {
  id: number; by?: string; time: number /* unix seconds */; text?: string /* HTML */;
  kids?: number[]; parent?: number; deleted?: boolean; dead?: boolean; type: 'comment' | 'story';
};
```

Set `Accept: application/json`, timeout each fetch at 10s via `AbortSignal.timeout(10_000)`. On a single item fetch failure, log and skip — one bad comment must not fail the run.

### 6.3 Parsing a comment → `ParsedPosting` (pure function, fully tested)

```ts
type ParsedPosting = {
  company: string | null; role: string | null; location: string | null;
  remote: 'REMOTE' | 'HYBRID' | 'ONSITE' | 'UNKNOWN';
  salaryText: string | null; salaryMinUsd: number | null; salaryMaxUsd: number | null;
  stackKeywords: string[]; applyUrl: string | null;
  rawText: string; headline: string; fingerprint: string;
};
```

Steps, in order:

1. **HTML → text.** Replace `<p>` with `\n\n`, `<br>` with `\n`, strip all other tags, then `he.decode()`. Collapse 3+ newlines to 2. Trim. → `rawText`.
2. **Headline** = first non-empty line of `rawText`, max 300 chars.
3. **Pipe split.** HN convention is `Company | Role | Location | REMOTE | $salary | ...`. `segments = headline.split('|').map(s => s.trim()).filter(Boolean)`.
   - `company` = `segments[0]` if it exists and is ≤ 80 chars, else `null`.
   - `role` = first segment (index ≥ 1) matching `/engineer|developer|swe|full[- ]?stack|frontend|front[- ]end|backend|back[- ]end|devops|sre|data|ml|founding/i`, else `segments[1] ?? null`.
   - `location` = first segment (index ≥ 1) that is not the role and does not match the remote or salary regexes, else `null`.
4. **Remote.** Search the whole `headline` (not just segments), case-insensitive:
   - `/\bhybrid\b/` → `HYBRID`
   - else `/\bremote\b/` → `REMOTE` (note: "Remote (US only)" still counts as REMOTE; the scorer handles geography via exclude keywords)
   - else `/\bon[- ]?site\b|\bin[- ]?office\b/` → `ONSITE`
   - else `UNKNOWN`
5. **Salary.** Regex over `headline`: `/\$\s?(\d{2,3})\s?k?(?:\s?[-–—to]+\s?\$?\s?(\d{2,3})\s?k)?/i`. If matched: `salaryText` = the matched substring; `salaryMinUsd` = group1 × 1000; `salaryMaxUsd` = group2 × 1000 if present else `null`. Ignore matches where group1 < 30 (that's not an annual salary). Also accept `€`/`£` for `salaryText` but leave the USD numbers `null` for non-`$` currencies.
6. **Stack keywords.** Lowercase `rawText`, then for each entry in `STACK_KEYWORDS` (a fixed list in `hn.parser.ts`, ~60 entries: `typescript, javascript, node, nodejs, react, next.js, nextjs, vue, angular, svelte, nestjs, express, python, django, fastapi, flask, go, golang, rust, java, kotlin, spring, c#, .net, ruby, rails, php, laravel, elixir, postgres, postgresql, mysql, mongodb, dynamodb, redis, kafka, rabbitmq, graphql, grpc, aws, gcp, azure, kubernetes, k8s, docker, terraform, react native, flutter, swift, ios, android, ml, machine learning, llm, pytorch, tensorflow`) test with a word-boundary regex (escape `.`, `#`, `+`). Result: deduped array in list order. Normalize aliases: `nodejs → node`, `golang → go`, `nextjs → next.js`, `k8s → kubernetes`, `postgresql → postgres`.
7. **Apply URL.** First `href` in the original HTML that is not an `mailto:` and not a `news.ycombinator.com` link. Else first `mailto:` as `mailto:...`. Else `null`.
8. **Fingerprint.** `sha1(normalize(company) + '|' + normalize(role))` where `normalize` = lowercase, strip non-alphanumerics. If company is null, use `sha1('hn:' + externalId)` so it's still unique.

**Fixtures:** save 15–20 real comment JSON items into `hn/__fixtures__/` (mix: canonical pipe format, no pipes, hybrid, salary ranges, € salary, no salary, mailto only, deleted, dead, giant multi-paragraph). Each fixture gets a `.expected.json` next to it. The spec iterates fixtures and deep-equals. When the parser is wrong on a real comment later, add the comment as a fixture first, then fix.

### 6.4 Upsert

For each `ParsedPosting`: `prisma.posting.upsert({ where: { source_externalId: { source: 'HN', externalId } }, create: {...}, update: {...parsed fields only, not createdAt} })`. Count created vs updated by checking existence first with a single `findMany` of existing `externalId`s for the thread (one query, not N).

### 6.5 Scoring (pure function, fully tested)

```ts
function score(posting: PostingForScoring, criteria: CriteriaForScoring): { score: number; reasons: string[] }
```

1. If `criteria.remoteOnly && posting.remote !== 'REMOTE'` → return `{ score: 0, reasons: ['not-remote'] }`. Stop.
2. If any `excludeKeywords` entry appears (word-boundary, case-insensitive) in `headline` or `stackKeywords` → return `{ score: 0, reasons: ['excluded:<kw>'] }`. Stop.
3. Start `score = 0`, `reasons = []`.
4. `+25` and `reasons.push('remote')` if `posting.remote === 'REMOTE'`.
5. `+30` and `reasons.push('role:<kw>')` for the **first** `roleKeywords` entry found in `headline` (only once).
6. `+10` per `includeKeywords` entry found in `stackKeywords` or `headline`, **cap +40**, push `stack:<kw>` each.
7. `+10` and `reasons.push('salary')` if `salaryMinUsd !== null`. If `criteria.minSalaryUsd` is set and `salaryMaxUsd !== null && salaryMaxUsd < criteria.minSalaryUsd` → return `{ score: 0, reasons: ['below-min-salary'] }`.
8. `+5` and `reasons.push('apply-url')` if `applyUrl !== null`.
9. Max possible: 110. **Match threshold: `score >= 40`.** Below threshold → no Match row is written (and an existing one is deleted on rescore).

Rescore scope: `MatchingService.rescoreUser(userId)` = all postings with `postedAt >= now - 45 days`. Runs after every ingest (for every user) and on `POST /matches/rescore`.

---

## 7. Build steps

Each step = one branch = one PR = one merge. Do them in order; later steps assume earlier ones.
"Learn first" is the list of things to understand *before* typing. Ask the AI to explain any item
you can't explain back in your own words. "Done when" is the checklist for opening the PR.

### Schedule (17 days, evenings on weekdays, longer on weekends)

| Date | Step |
|---|---|
| Sun 13 Sep | 1 Scaffold |
| Mon 14 | 2 Schema |
| Tue 15 – Wed 16 | 3 Auth |
| Thu 17 | 4 Criteria |
| Fri 18 | 5 HN client |
| Sat 19 | 6 Parser |
| Sun 20 | 7 Ingest job + worker |
| Mon 21 | 8 Postings API |
| Tue 22 | 9 Scoring + matches |
| Wed 23 | 10 Applications + stages |
| Thu 24 | 11 Reminders + mailer |
| Fri 25 | 12 Hardening + Dockerfile |
| Sat 26 – Sun 27 | 13a–13d Frontend |
| Mon 28 | 14 Deploy |
| Tue 29 | 15 Case study + portfolio |
| Wed 30 | Buffer. If you're here with nothing left, add a second HN source (Who wants to be hired? is NOT it — that's candidates). Otherwise, rest. |

If you fall a day behind, cut from Step 13 (frontend polish), never from Steps 7, 11, 12, 14.

---

### Step 1 — Scaffold the monorepo

**Branch:** `chore/scaffold-monorepo`
**Commit:** `chore: scaffold pnpm monorepo with NestJS api, Next.js web, Postgres/Redis compose, and CI`

**Goal:** empty but fully wired repo. Both apps build. Compose brings up infra. `/health` pings DB and Redis. CI is green on a real test.

**Learn first:** what a pnpm workspace is and how `workspace:*` works; what `tsconfig` `extends` does; what a Nest module/controller/provider is (just the definitions); what a Docker Compose healthcheck is; how a GitHub Actions service container differs from `docker compose`.

**Files to create:**

```
pnpm-workspace.yaml              packages: ['apps/*', 'packages/*']
package.json                     root scripts (below)
.npmrc                           auto-install-peers=true
.nvmrc / .node-version           22
.gitignore                       node_modules, dist, .next, .env, coverage
eslint.config.mjs                flat config: typescript-eslint recommended, prettier plugin last
.prettierrc                      { singleQuote: true, semi: true, printWidth: 100, trailingComma: 'all' }
docker-compose.yml
.github/workflows/ci.yml
README.md                        title + 1 paragraph + Run locally
packages/tsconfig/package.json   name: @reel/tsconfig
packages/tsconfig/base.json      strict, ES2022, moduleResolution node16/bundler as each app needs
apps/api/                        nest new (or by hand) — see below
apps/web/                        create-next-app --ts --tailwind --app --src-dir --eslint=false
```

**Root scripts:**

```json
"dev":        "concurrently -n api,web -c blue,magenta \"pnpm --filter api start:dev\" \"pnpm --filter web dev\"",
"build":      "pnpm -r build",
"lint":       "eslint .",
"typecheck":  "pnpm -r typecheck",
"test":       "pnpm -r test",
"db:generate":"pnpm --filter api prisma generate",
"db:migrate": "pnpm --filter api prisma migrate dev",
"db:studio":  "pnpm --filter api prisma studio"
```

**apps/api specifics:**

- `nest new api --package-manager pnpm --skip-git` inside `apps/`, then delete the sample `app.controller`/`app.service` and their specs.
- Install: `@nestjs/config zod @nestjs/bullmq bullmq ioredis @prisma/client @prisma/adapter-pg dotenv`. Dev: `prisma tsx @types/supertest supertest`. Pin Prisma to the latest **7.x** (`pnpm add @prisma/client@7 @prisma/adapter-pg@7 && pnpm add -D prisma@7`). Do **not** take the 8 RC.
- **Prisma 7 setup (this is different from every tutorial written for v5/v6):**
  - `apps/api/prisma.config.ts`:
    ```ts
    import 'dotenv/config';
    import { defineConfig, env } from 'prisma/config';
    export default defineConfig({
      schema: 'prisma/schema.prisma',
      migrations: { path: 'prisma/migrations', seed: 'tsx prisma/seed.ts' },
      datasource: { url: env('DATABASE_URL') },
    });
    ```
  - The `datasource` block in `schema.prisma` has **no `url`**. The generator is `provider = "prisma-client"` with `output = "../src/generated/prisma"` (Section 3.2). Add `apps/api/src/generated/` to `.gitignore`.
  - Import the client from the generated path: `import { PrismaClient } from '../generated/prisma/client';` — never from `@prisma/client`.
  - `PrismaService` must pass a driver adapter:
    ```ts
    const adapter = new PrismaPg({ connectionString: config.getOrThrow('DATABASE_URL') });
    super({ adapter });   // inside the constructor, after injecting ConfigService
    ```
  - `pnpm db:generate` must run before `typecheck` and `build`, locally and in CI, because the generated client is not committed.
- `config/env.schema.ts`: zod object with `NODE_ENV` (enum dev/test/prod, default `development`), `PORT` (coerce number, default 4000), `DATABASE_URL` (url), `REDIS_URL` (url). Export `type Env = z.infer<typeof envSchema>` and a `validateEnv(config: Record<string, unknown>)` that calls `envSchema.parse` and throws with a readable message.
- `config/config.module.ts`: `ConfigModule.forRoot({ isGlobal: true, validate: validateEnv })`.
- `prisma/prisma.service.ts`: `extends PrismaClient implements OnModuleInit, OnModuleDestroy`. `prisma/prisma.module.ts`: `@Global()`, provides + exports `PrismaService`.
- `prisma/schema.prisma`: generator + datasource **only** (models come in Step 2). Run `pnpm db:generate` once so the empty client exists and typecheck passes.
- BullMQ root: `BullModule.forRootAsync({ inject: [ConfigService], useFactory: (c) => ({ connection: { url: c.get('REDIS_URL') } }) })`. Note: BullMQ's `connection` accepts ioredis options; passing `{ url }` doesn't work directly — parse with `new URL()` and pass `{ host, port, password, username }` or create an `IORedis` instance. **Ask the AI to show both; use the `new IORedis(url, { maxRetriesPerRequest: null })` one.**
- `health/health.controller.ts`: `GET /health`. Inject `PrismaService` and the ioredis connection (inject via `@InjectQueue` is overkill; instead create a small `RedisModule` that provides an `IORedis` instance under token `REDIS_CLIENT` and reuse it for BullMQ). Return `{ status, db, redis }`; run `prisma.$queryRaw\`SELECT 1\`` and `redis.ping()`; if either throws, set flag false and respond 503.
- `main.ts`: `app.setGlobalPrefix('api/v1')`, `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))`, listen on `PORT`.
- `test/health.e2e-spec.ts`: boot `AppModule` with `Test.createTestingModule`, `supertest` `GET /api/v1/health` → 200, `db === true`, `redis === true`.
- `package.json` scripts: `start:dev` (nest start --watch), `build`, `typecheck` (`tsc --noEmit -p tsconfig.json`), `test` (`jest`), `test:e2e` (`jest --config test/jest-e2e.json`). Make root `test` run both unit and e2e for api.

**docker-compose.yml:**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment: { POSTGRES_USER: reel, POSTGRES_PASSWORD: reel, POSTGRES_DB: reel }
    ports: ['5432:5432']
    volumes: ['pgdata:/var/lib/postgresql/data']
    healthcheck: { test: ['CMD-SHELL', 'pg_isready -U reel'], interval: 5s, timeout: 3s, retries: 10 }
  redis:
    image: redis:7-alpine
    ports: ['6379:6379']
    healthcheck: { test: ['CMD', 'redis-cli', 'ping'], interval: 5s, timeout: 3s, retries: 10 }
volumes:
  pgdata:
```

**ci.yml essentials:** `on: [push, pull_request]`; `services: postgres` (same env, `options: --health-cmd pg_isready ...`) and `redis`; steps: checkout → `pnpm/action-setup@v4` → `actions/setup-node@v4` with `node-version-file: .nvmrc` and `cache: pnpm` → `pnpm install --frozen-lockfile` → `pnpm db:generate` → `pnpm lint` → `pnpm typecheck` → `pnpm build` → `pnpm test` with env `DATABASE_URL=postgresql://reel:reel@localhost:5432/reel` and `REDIS_URL=redis://localhost:6379`.

**Pitfalls:**
- Prisma client must be generated before typecheck (`db:generate` in CI before `typecheck`). If you see "Cannot find module '../generated/prisma/client'", you skipped this.
- Prisma CLI commands run from `apps/api` so `prisma.config.ts` is found. `pnpm --filter api prisma ...` does that.
- Prisma 7 does not read `.env` on its own — the `import 'dotenv/config'` in `prisma.config.ts` is what loads it for the CLI. Nest's `ConfigModule` loads it for the app.
- Next.js `typecheck` script: `tsc --noEmit`; Next's own build also typechecks.
- `concurrently` goes in root devDependencies.
- The e2e test needs a running Postgres and Redis. Locally: `docker compose up -d` first.

**Done when:** `docker compose up -d && pnpm install && pnpm db:generate && pnpm dev` works; `curl localhost:4000/api/v1/health` → `{"status":"ok","db":true,"redis":true}`; `localhost:3000` says "Reel"; `pnpm lint && pnpm typecheck && pnpm build && pnpm test` pass locally; CI green on the PR.

---

### Step 2 — Prisma schema and first migration

**Branch:** `feat/schema`
**Commit:** `feat(db): add Prisma schema for users, criteria, postings, matches, applications, and reminders`

**Learn first:** Prisma relation fields vs scalar FK fields (`userId` vs `user`); `@@unique` compound keys and the generated `where` name (`source_externalId`); `onDelete: Cascade` vs `SetNull`; what a migration file is and why you commit it; `@map` / `@@map`.

**Do:**
1. Paste the schema from Section 3.2 into `apps/api/prisma/schema.prisma`.
2. `pnpm db:migrate --name init` (inside `apps/api`: `pnpm prisma migrate dev --name init`). Commit the generated `prisma/migrations/` folder.
3. Open the generated SQL and read it. Ask the AI to walk through any line you don't understand. This is the point of the step.
4. Add `prisma/seed.ts` (it must build its own client: `new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })`, with `import 'dotenv/config'` at the top) that creates one user (`jade@example.com` / `password12345`) with criteria `{ remoteOnly: true, roleKeywords: ['full stack','fullstack','full-stack','software engineer'], includeKeywords: ['typescript','node','react','nestjs','next.js','postgres','aws'], excludeKeywords: ['php','wordpress','principal','staff'] }`. The seed command is already declared in `prisma.config.ts` (`migrations.seed`); run it with `pnpm prisma db seed`. Hash the password with argon2 (install `argon2` now).
5. Add to CI after `db:generate`: `pnpm --filter api prisma migrate deploy`. The e2e test DB now has tables.

**Pitfalls:**
- `String[]` needs Postgres; fine. `@default([])` on arrays is supported.
- If `migrate dev` complains about drift, you edited the schema after migrating — make a new migration, don't edit old ones.
- Don't add models beyond Section 3.2 "because we'll need them". You won't.

**Done when:** migration committed; `pnpm prisma db seed` creates the user; `pnpm prisma studio` shows all 8 tables; CI green.

---

### Step 3 — Auth

**Branch:** `feat/auth`
**Commit:** `feat(auth): register, login, logout, and me with argon2 and JWT cookie`

**Learn first:** what a hash is vs encryption and why argon2 over bcrypt; what a JWT contains and why the server can trust it without a DB lookup; httpOnly cookie vs localStorage and why the cookie wins for XSS; how a Nest **guard** runs before the handler; how Passport strategies plug into Nest; what a custom **parameter decorator** is (`@CurrentUser()`); `class-validator` decorators on DTOs and what `whitelist: true` does.

**Install:** `@nestjs/passport passport passport-jwt @nestjs/jwt cookie-parser argon2 class-validator class-transformer`. Dev: `@types/passport-jwt @types/cookie-parser`.

**Env additions** (add to zod schema and `.env.example`): `JWT_SECRET` (min 32 chars), `COOKIE_SECURE` (boolean coerced, default false), `WEB_ORIGIN` (url, default `http://localhost:3000`).

**Files:**

- `users/users.service.ts`: `findByEmail(email)`, `findById(id)`, `create({ email, passwordHash })`.
- `auth/dto/register.dto.ts`: `@IsEmail() email`, `@IsString() @MinLength(10) @MaxLength(128) password`. `login.dto.ts`: same without min length.
- `auth/auth.service.ts`:
  - `register(dto)`: lowercase email; if exists → `ConflictException`; `argon2.hash(password)`; create; return `{ id, email }`.
  - `validateUser(email, password)`: find; if none → return null; `argon2.verify(hash, password)` → user or null. **Same null for both failures.**
  - `signToken(user)`: `jwtService.sign({ sub: user.id, email: user.email })`.
- `auth/jwt.strategy.ts`: `PassportStrategy(Strategy)`, `jwtFromRequest: (req) => req.cookies?.reel_session ?? null`, `secretOrKey: JWT_SECRET`. `validate(payload)` returns `{ userId: payload.sub, email: payload.email }` — this becomes `req.user`.
- `auth/jwt-auth.guard.ts`: `extends AuthGuard('jwt')`.
- `auth/current-user.decorator.ts`: `createParamDecorator((_, ctx) => ctx.switchToHttp().getRequest().user)`.
- `auth/auth.controller.ts`: routes from Section 5.2. Set cookie with `res.cookie('reel_session', token, { httpOnly: true, sameSite: 'lax', secure: COOKIE_SECURE, maxAge: 7 * 24 * 3600 * 1000, path: '/' })`. Use `@Res({ passthrough: true })` so Nest still serializes the return value.
- `main.ts`: `app.use(cookieParser())`; `app.enableCors({ origin: WEB_ORIGIN, credentials: true })`.
- `auth/auth.module.ts`: `JwtModule.registerAsync` with secret + `signOptions: { expiresIn: '7d' }`; `PassportModule`; provide `JwtStrategy`; import `UsersModule`.

**Tests:**
- Unit `auth.service.spec.ts`: mock `UsersService` and `JwtService`; register hashes (hash !== password, `argon2.verify` true); duplicate → Conflict; validateUser wrong password → null; unknown email → null.
- E2E `auth.e2e-spec.ts`: register → 201 + `set-cookie` contains `reel_session` and `HttpOnly`; `me` without cookie → 401; `me` with cookie (use `supertest.agent`) → 200 with the email; login wrong password → 401; logout → 204 and subsequent `me` → 401. Use a unique email per run (`test-${Date.now()}@example.com`) or truncate the users table in `beforeAll`.

**Pitfalls:**
- `@Res()` without `passthrough: true` disables Nest's response handling — you must then `res.json()` yourself. Use passthrough.
- Passport `validate` returning `undefined`/`null` → 401 automatically. Good.
- `ConfigService.get<string>('JWT_SECRET')` can be `undefined` in TS's eyes; use `getOrThrow`.

**Done when:** all Section 5.2 routes behave exactly as specified; tests above pass; CI green.

---

### Step 4 — Criteria

**Branch:** `feat/criteria`
**Commit:** `feat(criteria): get and upsert per-user matching criteria`

**Learn first:** Prisma `upsert`; array DTO validation (`@IsArray() @IsString({ each: true }) @ArrayMaxSize(50)`); `@Transform` from class-transformer to lowercase/trim.

**Files:** `criteria/*` per module map. `CriteriaService.getOrDefault(userId)` returns the row or the default object with `id: null, userId`. `upsert(userId, dto)` normalizes arrays (lowercase, trim, drop empties, dedupe — write this as a small `normalizeKeywords(list: string[]): string[]` helper in `criteria/normalize.ts` and unit test it; this is your `.map/.filter` practice) then `prisma.criteria.upsert({ where: { userId }, create, update })`.

**Tests:** unit for `normalizeKeywords` (5 cases incl. `['  React ', 'react', '']` → `['react']`); e2e: GET before PUT returns defaults with `id: null`; PUT then GET returns saved values lowercased.

**Done when:** Section 5.3 exact; tests pass; CI green.

---

### Step 5 — HN client

**Branch:** `feat/hn-client`
**Commit:** `feat(hn): client for locating the latest Who is hiring thread and fetching its top-level comments`

**Learn first:** `fetch` + `AbortSignal.timeout`; why you limit concurrency (`p-limit`); the difference between "fail the whole job" and "skip one item"; how to mock `fetch` in Jest (`global.fetch = jest.fn()` or `jest.spyOn(globalThis, 'fetch')`).

**Install:** `p-limit`.

**Files:**
- `hn/hn.types.ts`: `HnItem`, `HnSearchHit`, `HnSearchResponse`.
- `hn/hn.client.ts` (`@Injectable()`):
  - `findLatestWhoIsHiringThread(): Promise<{ id: string; title: string; createdAt: Date }>` — Section 6.1. Throw `NotFoundException`-ish error (`HnThreadNotFoundError`, a plain class) if no hit matches.
  - `fetchItem(id: number | string): Promise<HnItem | null>` — `null` on 404 or JSON `null`.
  - `fetchTopLevelComments(storyId: string, { concurrency = 10 } = {}): Promise<HnItem[]>` — fetch story, map `kids` via `p-limit`, drop `null`/`deleted`/`dead`/no-`text`, return array. Log skipped count via Nest `Logger`.
- Base URLs come from constants; allow override via constructor for tests? Simpler: read `HN_ALGOLIA_BASE` and `HN_FIREBASE_BASE` from env with defaults. Add to zod schema.

**Tests** `hn.client.spec.ts`: mock fetch. Cases: picks the "Who is hiring" hit and skips "Who wants to be hired"; `fetchTopLevelComments` drops deleted/dead; one kid fetch rejecting doesn't reject the whole call (that kid is skipped).

**Manual check:** add a temporary script `apps/api/scripts/hn-peek.ts` (run with `tsx`) that prints the latest thread id and the first 3 comments' `text`. Keep it; it's useful for fixtures.

**Done when:** tests pass; `hn-peek` prints real data; CI green.

---

### Step 6 — Parser

**Branch:** `feat/hn-parser`
**Commit:** `feat(hn): pure comment parser with fixture-driven tests`

**Learn first:** pure functions and why the parser has no `@Injectable` and no I/O; regex word boundaries `\b`, escaping special characters, `i` flag; `String.split/map/filter/find`; `Array.from(new Set(x))` for dedupe; `crypto.createHash('sha1')`.

**Install:** `he`, dev `@types/he`.

**Files:**
- `hn/hn.parser.ts`: `export function parseComment(item: HnItem): ParsedPosting` implementing Section 6.3 exactly. Split into small exported helpers so each is testable: `htmlToText`, `extractHeadline`, `splitSegments`, `detectRemote`, `parseSalary`, `extractStackKeywords`, `extractApplyUrl`, `fingerprintFor`.
- `hn/__fixtures__/NNN-description.json` + `NNN-description.expected.json`. Collect with `hn-peek` (extend it to dump N comments to files). Hand-write the expected files — yes, by hand. That's the test.
- `hn/hn.parser.spec.ts`: one `describe` per helper with 3–6 direct cases; one `describe('fixtures')` that reads the directory, and for each pair asserts `parseComment(item)` deep-equals expected.

**Pitfalls:**
- HN `text` uses `<p>` between paragraphs but the first paragraph has no `<p>`. Handle both.
- Salary "$150k-$200k" and "$150K - 200K" and "150k–200k USD" all exist. Your regex won't catch everything — that's fine; the fixture set defines what "correct" means. Don't chase 100%.
- Keep `STACK_KEYWORDS` as a `const` array with a comment; the alias map separate.

**Done when:** ≥15 fixtures, all green; helpers each have direct tests; CI green.

---

### Step 7 — Ingest job and worker process

**Branch:** `feat/ingest-job`
**Commit:** `feat(ingest): BullMQ ingest queue, processor, worker entrypoint, run history, and manual trigger`

**Learn first:** BullMQ Queue vs Worker vs Job; `@nestjs/bullmq` `@Processor` + `WorkerHost` + `process(job)`; repeatable jobs and why registering the same repeat twice is safe (dedupe by key); `attempts` + exponential `backoff`; why the worker is its own process; `NestFactory.createApplicationContext`.

**Files:**
- `ingest/ingest.constants.ts`: `INGEST_QUEUE = 'ingest'`, `INGEST_JOB = 'ingest-hn-thread'`, `INGEST_CRON = '0 */6 * * *'`.
- `ingest/ingest.module.ts`: `BullModule.registerQueue({ name: INGEST_QUEUE })`, imports `HnModule`, `PostingsModule` (create a minimal `PostingsService.upsertMany(threadId, items: ParsedWithMeta[])` now; the controller comes in Step 8), `MatchingModule` (stub `rescoreAllUsers()` that does nothing until Step 9 — leave a `TODO(step-9)`).
- `ingest/ingest.service.ts`: `enqueue(threadId?)` → `queue.add(INGEST_JOB, { threadId }, { jobId: \`manual:${new Date().toISOString().slice(0,16)}\`, attempts: 3, backoff: {...}, removeOnComplete: 50, removeOnFail: 100 })`; `listRuns(page, pageSize)`.
- `ingest/ingest.processor.ts`: `@Processor(INGEST_QUEUE) extends WorkerHost`. `process(job)`:
  1. Resolve `threadId` (payload or `hnClient.findLatestWhoIsHiringThread()`).
  2. `run = prisma.ingestRun.create({ source: 'HN', externalThreadId: threadId })`.
  3. `items = await hnClient.fetchTopLevelComments(threadId)`.
  4. `parsed = items.map(i => ({ item: i, parsed: parseComment(i) }))`.
  5. `{ created, updated } = await postingsService.upsertMany(threadId, parsed)`.
  6. `await matchingService.rescoreAllUsers()`.
  7. Update run: `SUCCEEDED`, counts, `finishedAt`.
  8. `catch (err)`: update run `FAILED` with `error: String(err)`, then **rethrow** so BullMQ retries.
- `ingest/ingest.controller.ts`: `POST /ingest/run` (auth) → 202 `{ jobId }`; `GET /ingest/runs` (auth).
- `worker.module.ts`: imports `AppConfigModule`, `PrismaModule`, `RedisModule`, `BullModule.forRootAsync(...)` (same factory — extract to `bull.config.ts`), `IngestModule`, later `RemindersModule`, `MailerModule`. **The processor class must be provided only here** — put `IngestProcessor` in `IngestModule.providers` guarded by a flag? Simpler: create `ingest/ingest.worker.module.ts` that provides the processor and imports `IngestModule`; `WorkerModule` imports that. `AppModule` imports plain `IngestModule` (no processor).
- `worker.ts`: `createApplicationContext(WorkerModule)`, then on boot: `queue.upsertJobScheduler('ingest-every-6h', { pattern: INGEST_CRON }, { name: INGEST_JOB, data: {} })` (BullMQ ≥5.16 API; if unavailable, `queue.add(INGEST_JOB, {}, { repeat: { pattern: INGEST_CRON }, jobId: 'ingest-repeat' })`). Handle `SIGTERM`/`SIGINT` → `app.close()`.
- `package.json`: `"start:worker": "nest start --entryFile worker"`, `"start:worker:dev": "nest start --watch --entryFile worker"`. Root `dev` adds a third `concurrently` entry.

**Tests:**
- Unit `ingest.processor.spec.ts`: mock `HnClient`, `PostingsService`, `MatchingService`, `PrismaService`. Happy path → run SUCCEEDED with counts. `fetchTopLevelComments` throws → run FAILED, error stored, `process` rejects.
- E2E: `POST /api/v1/ingest/run` → 202 with a `jobId`; `GET /ingest/runs` → 200 shape.

**Manual check:** run API + worker, `POST /ingest/run`, watch worker logs, then `GET /ingest/runs` shows SUCCEEDED with ~1,000 `commentsSeen`. Look at the `postings` table in Prisma Studio. Fix parser bugs by adding fixtures (Step 6 process).

**Done when:** manual run ingests the real current thread; retries work (kill Redis mid-run, restart, watch it retry); CI green.

---

### Step 8 — Postings API

**Branch:** `feat/postings-api`
**Commit:** `feat(postings): list with search, filters, and pagination; detail endpoint`

**Learn first:** Prisma `where` with `OR` + `contains` + `mode: 'insensitive'`; `skip/take`; `select` to exclude `rawHtml`; `Promise.all([findMany, count])`; a shared `PaginationQueryDto` with `@Type(() => Number)`.

**Files:** `common/dto/pagination.query.ts` (`page` default 1 min 1; `pageSize` default 25 min 1 max 100), `common/pagination.ts` (`paginate<T>(items, page, pageSize, total)` helper + `toSkipTake`). `postings/dto/list-postings.query.ts extends PaginationQueryDto` with `q?`, `remote?` (`@IsEnum(RemoteType)`), `threadId?`. Service and controller per Section 5.5.

**Tests:** e2e seeds 3 postings directly via Prisma in `beforeAll` (two REMOTE, one ONSITE; distinct companies), then: no filter → 3, `remote=REMOTE` → 2, `q=<company>` → 1 case-insensitive, `pageSize=1&page=2` → 1 item and `total: 3`, detail of unknown id → 404, list items have no `rawHtml` key.

**Done when:** Section 5.5 exact; CI green.

---

### Step 9 — Scoring and matches

**Branch:** `feat/matching`
**Commit:** `feat(matching): pure scorer, per-user rescoring, match inbox, dismiss`

**Learn first:** why the scorer is a pure function with its own input types (`PostingForScoring`, `CriteriaForScoring`) instead of Prisma types; `Array.prototype.some/find`; `Math.min` for caps; Prisma `upsert` in a loop vs `createMany` (use upsert; simplicity over speed here); Prisma `$transaction` for delete-then-upsert consistency.

**Files:**
- `matching/scorer.ts`: `score(posting, criteria)` per Section 6.5, plus `export const MATCH_THRESHOLD = 40`.
- `matching/scorer.spec.ts`: one test per rule in 6.5, plus 3 "realistic" postings with expected totals you compute by hand.
- `matching/matching.service.ts`:
  - `rescoreUser(userId)`: load criteria (or defaults), postings since 45 days; for each compute score; `>= threshold` → upsert Match; else `deleteMany({ userId, postingId })`. Return count of matches written.
  - `rescoreAllUsers()`: `users.findMany({ select: { id } })` then sequential `rescoreUser`. Replace the Step 7 stub.
  - `list(userId, dismissed, page, pageSize)` including `posting` summary select.
  - `dismiss(userId, matchId)`: `updateMany({ where: { id, userId }, data: { dismissed: true } })`; count 0 → 404.
- Controller per Section 5.6.

**Tests:** scorer unit tests; e2e: seed user+criteria+postings, `POST /matches/rescore` → count; `GET /matches` ordered by score desc; dismiss → excluded from default list, included with `?dismissed=true`.

**Done when:** after a real ingest, `GET /matches` shows sensible results for the seed criteria. Look at the top 10 and bottom 10 and adjust **fixtures/tests**, not thresholds, if something is obviously wrong. CI green.

---

### Step 10 — Applications and stage transitions

**Branch:** `feat/applications`
**Commit:** `feat(applications): CRUD, stage transitions with history, and validation of allowed moves`

**Learn first:** modelling a state machine as a `Record<Stage, Stage[]>`; Prisma nested `create` (`events: { create: {...} }`); `$transaction` for stage change (update app + create event atomically); `include` for detail view.

**Files:**
- `applications/stage-machine.ts`: `ALLOWED: Record<Stage, Stage[]>` from Section 5.7; `canTransition(from, to): boolean`. Unit test every row.
- Service: `create` (resolve defaults from posting if `postingId`; verify posting exists → 404), `list`, `findOne` (with `events`, `posting`, `reminders`), `update`, `changeStage(userId, id, to, note)`:
  1. load app scoped by `userId` → 404.
  2. `to === app.stage` → 400 "already in stage".
  3. `!canTransition` → 400 with the allowed list in the message.
  4. `$transaction`: update `stage`, `stageChangedAt: new Date()`; create `StageEvent`.
  5. After transaction: `remindersService.cancel(app.id)`; if `to === 'APPLIED'` → `remindersService.schedule(app.id, stageChangedAt)`. **Stub `RemindersService` now with these two no-op methods + `TODO(step-11)`.**
  - `remove` → cancel reminder, delete (cascade handles events).
- DTOs with `@IsEnum(Stage)`, `@ValidateIf` for the "company/role required when no postingId" rule (or do it in the service and throw `BadRequestException` — service is simpler; do that).

**Tests:** stage-machine unit; e2e: create from posting → 201 with 1 event `fromStage: null, toStage: SAVED`; manual create without company → 400; `SAVED→INTERVIEWING` → 400; `SAVED→APPLIED→INTERVIEWING→OFFER` → 200 each, detail has 4 events; another user's app → 404; delete → 204 then 404.

**Done when:** Section 5.7 exact; CI green.

---

### Step 11 — Reminders and mailer

**Branch:** `feat/reminders`
**Commit:** `feat(reminders): delayed stale-application reminders with idempotent jobs and pluggable mailer`

**Learn first:** BullMQ delayed jobs; deterministic `jobId` and what happens when you `add` a duplicate; `queue.remove(jobId)` / `Job.remove()`; DI by **token** (`{ provide: MAILER, useClass: ... }` chosen with `useFactory` on env); why the processor re-reads the DB (Section 4.3 idempotency).

**Install:** `resend`.

**Env:** `STALE_AFTER_DAYS` (number, default 10), `MAILER` (enum `console|resend`, default `console`), `RESEND_API_KEY` (optional, required if MAILER=resend — do this with a zod `.superRefine`), `MAIL_FROM` (default `Reel <reel@jadebonifacio.dev>`).

**Files:**
- `mailer/mailer.interface.ts`: `export const MAILER = Symbol('MAILER'); export interface Mailer { send(msg: { to: string; subject: string; text: string; html?: string }): Promise<void> }`.
- `mailer/console.mailer.ts`: logs the message with Nest `Logger`.
- `mailer/resend.mailer.ts`: `new Resend(key).emails.send({ from, to, subject, text, html })`.
- `mailer/mailer.module.ts`: provider with `useFactory: (config) => config.get('MAILER') === 'resend' ? new ResendMailer(...) : new ConsoleMailer()`, export `MAILER`.
- `reminders/reminders.service.ts`:
  - `schedule(applicationId, stageChangedAt: Date)`: `delay = STALE_AFTER_DAYS * 86_400_000`; `jobId = \`stale:${applicationId}\``; `queue.add('send-stale-reminder', { applicationId, stageChangedAt: stageChangedAt.toISOString() }, { jobId, delay, attempts: 3, backoff })`; upsert `Reminder` row (`where: { jobId }`) with `dueAt`, clearing `cancelledAt`/`sentAt`.
  - `cancel(applicationId)`: `job = await queue.getJob(jobId); if (job) await job.remove()` (wrap in try/catch — removing an active job throws; log and continue); `reminder.updateMany({ where: { jobId, sentAt: null }, data: { cancelledAt: new Date() } })`.
- `reminders/reminders.processor.ts`: load application + user; if missing → return. If `stage !== 'APPLIED'` or `stageChangedAt.toISOString() !== payload.stageChangedAt` → log "stale reminder skipped", return. Else `mailer.send({ to: user.email, subject: \`Follow up: ${company} — ${role}\`, text: ... })`, then `reminder.update({ where: { jobId }, data: { sentAt: new Date() } })`.
- Replace Step 10 stubs. `RemindersModule` registers the queue; `reminders.worker.module.ts` provides the processor; `WorkerModule` imports it and `MailerModule`.

**Tests:**
- Unit `reminders.service.spec.ts` with a mocked `Queue`: schedule adds with correct `jobId` and `delay`; cancel removes and marks cancelled; cancel when no job doesn't throw.
- Unit `reminders.processor.spec.ts`: sends when APPLIED and timestamps match; skips when stage changed; skips when `stageChangedAt` differs.
- E2E: set `STALE_AFTER_DAYS` to a fraction? It's an int. Instead assert side effects: move to APPLIED → `GET /applications/:id` shows one reminder with `dueAt ≈ now + 10d` and `cancelledAt: null`; move to INTERVIEWING → that reminder has `cancelledAt` set.

**Manual check:** temporarily set `STALE_AFTER_DAYS=0` and add a dev-only `STALE_DELAY_MS` override (optional env, if set wins) so you can watch a real email arrive in the console mailer within seconds. Then set `MAILER=resend` with a real key and receive one real email at your own address. Screenshot it for the README.

**Done when:** the real email arrived; unit tests pass; CI green.

---

### Step 12 — Hardening and Dockerfile

**Branch:** `chore/hardening`
**Commit:** `chore(api): structured logging, security headers, rate limiting, graceful shutdown, and production Dockerfile`

**Learn first:** what `helmet` sets and why; rate limiting on auth routes (credential stuffing); `enableShutdownHooks` and what SIGTERM means on Railway; multi-stage Docker builds and why `prisma generate` must run in the image; `.dockerignore`.

**Install:** `nestjs-pino pino-http pino-pretty helmet @nestjs/throttler`.

**Do:**
- `LoggerModule.forRoot({ pinoHttp: { transport: NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined, redact: ['req.headers.cookie', 'req.headers.authorization'] } })`; `app.useLogger(app.get(Logger))`. Replace `console.log`s.
- `app.use(helmet())`.
- `ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }])`, global `ThrottlerGuard`; `@Throttle({ default: { limit: 10, ttl: 60_000 } })` on `register` and `login`.
- `app.enableShutdownHooks()`; worker already handles signals — make sure `Worker.close()` is awaited (Nest's `WorkerHost` handles it on `onModuleDestroy`).
- `apps/api/Dockerfile` (multi-stage): `node:22-alpine` base → install pnpm via corepack → copy lockfile + workspace manifests → `pnpm install --frozen-lockfile --filter api...` → copy source → `pnpm --filter api prisma generate && pnpm --filter api build` → runtime stage copies `dist`, `node_modules`, `prisma/`, `prisma.config.ts` (needed by `migrate deploy`); make sure the generated client under `src/generated` is compiled into `dist` (it is, since it's under `src`); `CMD ["node", "dist/main.js"]`. The worker uses the **same image** with command `node dist/worker.js`. Migrations run via a Railway "pre-deploy" command: `pnpm --filter api prisma migrate deploy` (or as the first line of a `docker-entrypoint.sh` for the API service only).
- `.dockerignore`: `node_modules, dist, .next, .git, .env*`.
- Add a `GET /api/v1/health` note to README for Railway healthcheck path.

**Tests:** e2e: 11 rapid `POST /auth/login` → the 11th is 429. Response headers include `x-content-type-options: nosniff`.

**Manual check:** `docker build -f apps/api/Dockerfile -t reel-api .` from the repo root; `docker run --env-file apps/api/.env --network host reel-api` → `/health` OK.

**Done when:** image builds and runs locally against Compose infra; CI green.

---

### Step 13 — Frontend (skills allowed)

You may use Claude Code skills here to generate components. The **contract** is Section 5; the frontend never invents fields. Use TanStack Query for data, `fetch` with `credentials: 'include'`, `NEXT_PUBLIC_API_URL` for the base. shadcn/ui for primitives. Keep the "ink and brass" direction from the portfolio so the two feel related — dark by default, near-black background, muted brass accent — but this is a tool, so favor density over hero sections.

#### 13a — Shell, auth, API client
**Branch:** `feat/web-auth` · **Commit:** `feat(web): app shell, login/register, session-aware layout, and typed API client`
- `src/lib/api.ts`: `apiFetch<T>(path, init)` that prepends base URL, sets `credentials: 'include'`, JSON headers, throws a typed `ApiError { status, message }` on non-2xx.
- `src/lib/types.ts`: hand-written TS types mirroring Section 3 (not the Prisma types — the web app must not import from api).
- Routes: `/login`, `/register`, `/(app)/…` group with a layout that calls `GET /auth/me` and redirects to `/login` on 401. Top nav: Inbox · Postings · Pipeline · Settings · Logout.
- **Done when:** register → land on inbox; refresh keeps you logged in; logout returns to login.

#### 13b — Inbox (matches) and postings browser
**Branch:** `feat/web-inbox` · **Commit:** `feat(web): match inbox with dismiss and save-to-pipeline, postings browser with search and filters`
- Inbox: list of matches, score badge, reasons as small chips, posting headline, expand to see `rawText`, buttons: **Dismiss**, **Save** (creates Application with `postingId`), **Apply link** (opens `applyUrl`). "Rescore" button calls `POST /matches/rescore`.
- Postings: table with search box (`q`), remote filter, pagination. Row click → drawer with details + Save.
- **Done when:** you can go from a fresh ingest to a saved application without touching the API by hand.

#### 13c — Pipeline board
**Branch:** `feat/web-pipeline` · **Commit:** `feat(web): pipeline board with stage columns, stage changes, notes, and history`
- Columns per Stage (hide REJECTED/WITHDRAWN behind a toggle). Card: company, role, days in stage (from `stageChangedAt`), reminder due badge if a pending reminder exists.
- Card click → detail sheet: editable notes/url (PATCH), stage select limited to allowed next stages (mirror `stage-machine.ts` client-side for UX; the server still validates), timeline of `events`.
- Manual "Add application" dialog (company, role, url, notes).
- Drag-and-drop between columns is **optional**; a select is required. If DnD costs more than an hour, drop it.
- **Done when:** the full BizScout scenario is reproducible: save → applied → wait → reminder → mark rejected/withdrawn.

#### 13d — Settings and polish
**Branch:** `feat/web-settings` · **Commit:** `feat(web): criteria settings, ingest run history, empty states, and responsive polish`
- Settings: criteria form (tag inputs for the three keyword arrays, remote-only toggle, min salary), save → PUT; "Run ingest now" → POST + run history table with status/counts.
- Empty states for inbox/pipeline; loading skeletons; mobile layout works at 390px.
- **Done when:** you'd let a stranger click around without apologizing.

---

### Step 14 — Deploy

**Branch:** `chore/deploy`
**Commit:** `chore: Railway config for api and worker, Vercel config for web, production env docs`

**Learn first:** what Railway services, variables references (`${{Postgres.DATABASE_URL}}`), and pre-deploy commands are; Vercel monorepo root directory; CORS + cookies across origins (`sameSite: 'lax'` + `secure: true` + different hosts works for top-level navigations and `fetch` with credentials from an allowed origin — verify in browser devtools).

**Do:**
1. Railway project `reel`: add Postgres and Redis plugins. Service `api`: root `/`, Dockerfile path `apps/api/Dockerfile`, start command default (`node dist/main.js`), pre-deploy `pnpm --filter api prisma migrate deploy`, healthcheck `/api/v1/health`. Service `worker`: same Dockerfile, start command `node dist/worker.js`, no healthcheck/port. Variables: `DATABASE_URL`, `REDIS_URL` from references; `JWT_SECRET` (generate 64 hex), `NODE_ENV=production`, `COOKIE_SECURE=true`, `WEB_ORIGIN=https://reel.jadebonifacio.dev`, `MAILER=resend`, `RESEND_API_KEY`, `MAIL_FROM`, `STALE_AFTER_DAYS=10`.
2. `railway.json` per service if you want config-as-code (optional; document either way in `docs/DEPLOY.md`).
3. Vercel: import repo, root directory `apps/web`, env `NEXT_PUBLIC_API_URL=https://<api-domain>/api/v1`. Add custom domain `reel.jadebonifacio.dev` (CNAME at Porkbun).
4. Resend: verify `jadebonifacio.dev` domain (DNS records at Porkbun) so `MAIL_FROM` works.
5. Smoke test in prod: register with your real email, set criteria, run ingest, see matches, save one, move to APPLIED. Temporarily set `STALE_AFTER_DAYS` low? No — instead keep 10 and trust the Step 11 test. Or add one application, set the env to 0 with `STALE_DELAY_MS=60000`, redeploy worker, receive the email, revert. Do this once; it's your screenshot.
6. Write `docs/DEPLOY.md` with every variable and where it comes from.

**Done when:** `https://reel.jadebonifacio.dev` works end-to-end with your account; worker logs show the 6-hourly ingest firing; `docs/DEPLOY.md` is complete.

---

### Step 15 — Case study README and portfolio entry

**Branch:** `docs/case-study`
**Commit:** `docs: case-study README with architecture, decisions, and demo`

**README structure (in this order):**
1. One-line pitch + live link + 30-second GIF (record with the Chrome built-in recorder or `Kap`; convert with `ffmpeg` to ≤ 8 MB).
2. "Why": three sentences about the job-search problem and the BizScout follow-up story (no names).
3. "What it does": inbox → pipeline → reminder, with one screenshot each.
4. Architecture diagram (Mermaid, Section 4.1 redrawn) + the API/worker split explained in one paragraph.
5. "Decisions and trade-offs": 5–7 bullets each with *what* and *why*: separate worker process, idempotent reminders via deterministic jobId + DB re-check, upsert-based ingestion, pure parser with fixture tests, cookie JWT over localStorage, offset pagination, no refresh tokens (and what you'd add at scale).
6. "Testing": counts (unit/e2e), what the fixture strategy is, CI badge.
7. "Run locally" and "Deploy" (link to `docs/DEPLOY.md`).
8. "What I'd do next": second source, full-text search, per-user ingest filters, refresh tokens.

**Portfolio:** add a Reel case study to `jadebonifacio.dev` (same repo flow: branch, PR, merge). Reuse the README sections 2, 4, 5; link to repo and live app.

**Done when:** a stranger can understand what you built and why in two minutes from the README alone.

---

## 8. Testing strategy (reference)

| Layer | Tool | What |
|---|---|---|
| Pure logic | Jest unit, no Nest | `hn.parser`, `scorer`, `stage-machine`, `normalizeKeywords`, `pagination` |
| Services | Jest unit + `@nestjs/testing` with mocked Prisma/Queue | `auth.service`, `ingest.processor`, `reminders.service`, `reminders.processor` |
| HTTP | Jest e2e + supertest against real Postgres/Redis | one file per module: `health`, `auth`, `criteria`, `postings`, `matching`, `applications`, `ingest`, `throttle` |
| Frontend | none required in v1 | manual QA against the checklist in 13a–13d |

E2E DB hygiene: `test/setup.ts` truncates all tables (`TRUNCATE ... CASCADE`) in `beforeAll` of each e2e file. Never run e2e against a non-local `DATABASE_URL` (guard: throw if the URL host isn't `localhost`/`postgres`).

Mocking Prisma: don't use a full mock library. Create `test/prisma.mock.ts` returning `{ user: { findUnique: jest.fn(), ... } }` for the models the test needs, provided as `{ provide: PrismaService, useValue: mock }`.

---

## 9. Environment variables (complete list)

| Var | Required | Default | Used by |
|---|---|---|---|
| `NODE_ENV` | no | `development` | both |
| `PORT` | no | `4000` | api |
| `DATABASE_URL` | yes | — | both |
| `REDIS_URL` | yes | — | both |
| `JWT_SECRET` | yes | — | api |
| `COOKIE_SECURE` | no | `false` | api |
| `WEB_ORIGIN` | no | `http://localhost:3000` | api |
| `HN_ALGOLIA_BASE` | no | `https://hn.algolia.com/api/v1` | worker |
| `HN_FIREBASE_BASE` | no | `https://hacker-news.firebaseio.com/v0` | worker |
| `STALE_AFTER_DAYS` | no | `10` | api |
| `STALE_DELAY_MS` | no | — (overrides days if set) | api |
| `MAILER` | no | `console` | worker |
| `RESEND_API_KEY` | if MAILER=resend | — | worker |
| `MAIL_FROM` | no | `Reel <reel@jadebonifacio.dev>` | worker |
| `NEXT_PUBLIC_API_URL` | yes (web) | `http://localhost:4000/api/v1` | web |

---

## 10. Concept glossary (ask the AI to expand any of these on demand)

- **Module / Provider / Controller (Nest)** — module groups; provider is anything injectable (services, clients); controller maps routes to methods.
- **Dependency injection** — you declare what a class needs in its constructor; Nest builds and passes it. Tokens can be classes or symbols (`MAILER`).
- **Guard** — runs before the handler, returns true/false → 403/401. `JwtAuthGuard`.
- **Pipe** — transforms/validates input. `ValidationPipe` with DTOs.
- **DTO** — class describing a request body/query, decorated for validation.
- **Upsert** — update if exists, else insert, in one statement keyed on a unique constraint.
- **Idempotent** — running it twice has the same effect as once. Ingest and reminders must be.
- **Repeatable job / delayed job (BullMQ)** — cron-like schedule vs run-once-after-N-ms.
- **jobId dedupe** — BullMQ ignores `add` when a job with that id already exists (unless completed and removed).
- **Pure function** — output depends only on input; no I/O, no DB, no clock. Parser and scorer.
- **Fixture** — a saved real input + expected output used as a test.
- **Migration** — versioned SQL that moves the DB schema forward; committed to git.
- **Cascade** — deleting a parent deletes children (`onDelete: Cascade`).
- **Multi-stage Docker build** — build in a fat image, copy artifacts into a slim runtime image.
- **Service container (GitHub Actions)** — a sidecar DB/Redis for CI, reachable at `localhost`.
- **Offset pagination** — `skip/take`; simple, fine under ~100k rows.
- **CORS + credentials** — browser sends cookies cross-origin only if the server allows that exact origin and `credentials: true`.

---

*Change this plan in a PR when reality disagrees with it; don't let it rot.*
