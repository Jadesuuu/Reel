# Reel

A personal job-hunt tracker that ingests the monthly Hacker News "Who is hiring?" thread,
scores each posting against your criteria, and moves the ones you pursue through a pipeline
with follow-up reminders.

## Run locally

```bash
docker compose up -d
pnpm install
cp apps/api/.env.example apps/api/.env
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

API: http://localhost:4000/api/v1/health · Web: http://localhost:3000

`pnpm dev` runs three processes: the API, the queue worker, and the web app. The worker is a
separate entrypoint (`apps/api/src/worker.ts`) and handles both the six-hourly HN ingest and
delayed follow-up reminders.

## Checks

```bash
pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm test:e2e
```

`test:e2e` needs Postgres and Redis running, and the schema migrated.

## Container

```bash
docker build -f apps/api/Dockerfile -t reel-api .
docker run -p 4000:4000 --env-file apps/api/.env reel-api
```

The same image runs the worker with `node dist/worker.js` as its command.

**Healthcheck path:** `GET /api/v1/health` — returns `200 {"status":"ok","db":true,"redis":true}`
when Postgres and Redis both answer, and `503` otherwise. Point the platform healthcheck here.

Run `pnpm --filter api exec prisma migrate deploy` as a pre-deploy step; the image ships
`prisma/` and `prisma.config.ts` for exactly that.
