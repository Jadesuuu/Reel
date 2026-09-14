# Reel

A personal job-hunt tracker that does the boring part for you. Every month Hacker News posts an
"Ask HN: Who is hiring?" thread with 1,000+ comments. Reel fetches that thread on a schedule, parses
each top-level comment into a structured posting (company, role, location, remote/onsite, salary,
stack keywords, apply link), deduplicates, and scores each posting against your saved criteria.
Postings above the threshold become matches. From a match you create an application and move it
through stages — and when one sits in `APPLIED` too long, a background job emails you to follow up.

## Stack

NestJS 12 · Next.js 16 · PostgreSQL 16 · Redis 7 · Prisma 7 · BullMQ 5 · TypeScript · pnpm workspaces

## Run locally

Requires Node 22, pnpm 9, and Docker.

```bash
docker compose up -d          # Postgres on 5432, Redis on 6379
pnpm install
cp .env.example .env
pnpm db:generate              # generates the Prisma client (not committed)
pnpm dev                      # api on :4000, web on :3000
```

Check it came up:

```bash
curl http://localhost:4000/api/v1/health
# {"status":"ok","db":true,"redis":true}
```

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Runs api and web together |
| `pnpm build` | Builds every workspace package |
| `pnpm lint` | ESLint across the repo |
| `pnpm typecheck` | `tsc --noEmit` in every package |
| `pnpm test` | Unit and e2e tests |
| `pnpm db:migrate` | Applies a new Prisma migration |
| `pnpm db:studio` | Opens Prisma Studio |
