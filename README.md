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
pnpm dev
```

API: http://localhost:4000/api/v1/health · Web: http://localhost:3000
