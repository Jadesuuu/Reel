# Step 14 — Deploy

## What this step adds

The files and the recipe for running Reel somewhere other than this laptop: one Docker image
for the API and the worker, two Railway service configs, a Vercel root for the web app, and
`docs/DEPLOY.md` listing every variable and where it comes from. The demo on Vercel is the
deployment that is actually live; the Railway half is documented and configured but optional,
and the plan says so.

The plan describes it in Section 7, Step 14. `docs/DEPLOY.md` is the operator's document; this
one explains the pieces.

## Files, in reading order

1. **`apps/api/Dockerfile`** — four stages on `node:22-alpine`.
   - `deps` copies only the manifests and runs `pnpm install --frozen-lockfile --filter api...`
     so the layer is cached until a dependency changes. The trailing dots mean "api and what it
     depends on", which pulls in `packages/tsconfig`.
   - `build` copies the source, generates the Prisma client and runs `nest build`.
   - `runtime` copies `node_modules`, `dist`, the generated client, the `prisma/` folder
     (migrations and the config, for the pre-deploy command) and nothing else.
     `CMD ["node", "dist/main.js"]` is the API; the worker overrides it with `dist/worker.js`.
     Two processes, one image, is the fixed decision the plan has held since Step 7.
2. **`railway.api.json`** and **`railway.worker.json`** — config as code for the two Railway
   services. The API has a pre-deploy command that applies migrations, a healthcheck on
   `/api/v1/health`, and a restart policy. The worker has the other start command and no
   healthcheck, because it opens no port. Only one of them may run migrations, or two deploys
   race.
3. **`docs/DEPLOY.md`** — the variable table (which service needs which, and where the value
   comes from: Railway references like `${{Postgres.DATABASE_URL}}`, a generated `JWT_SECRET`,
   the Resend key), the Vercel root directory and its single `NEXT_PUBLIC_API_URL`, the Resend
   domain verification, and the smoke test.
4. **`apps/api/src/config/env.schema.ts`** — what makes the table enforceable. Every variable
   in `DEPLOY.md` is validated at boot; a deploy with a missing one fails its healthcheck
   instead of serving errors.
5. **`apps/api/src/main.ts`** — the two settings that differ in production: `COOKIE_SECURE=true`
   so the session cookie is only sent over HTTPS, and `WEB_ORIGIN` set to the Vercel domain so
   CORS admits the web app and nothing else.
6. **`apps/web`** on Vercel — root directory `apps/web`, one environment variable baked in at
   build time. For the demo the variable is `NEXT_PUBLIC_DEMO_MODE=true` instead, which is
   why the resume link needs no API at all (Step 19).

## Concepts

- **Same image, different command.** The worker and the API share every byte except the entry
  file, so a fix ships to both at once and they can never disagree about the schema or the
  queue names.
- **Pre-deploy migrations.** Migrations run before the new API starts serving, from the same
  image, against the same database. If a migration fails the deploy stops and the old
  version keeps running.
- **Cookies across origins.** `sameSite: 'lax'` plus `secure: true` on different hosts works
  for `fetch` with `credentials: 'include'` from an allowed origin. That is the combination
  `setCookie` in the auth controller and `enableCors` in `main.ts` produce.
- **Build-time versus run-time variables.** `NEXT_PUBLIC_*` values are compiled into the web
  bundle; changing one means a rebuild. API variables are read at process start.

## Gotchas

- The runtime stage copies `apps/api/src/generated`, not the source tree. The Prisma client
  is generated at build and must travel with `dist`.
- `.npmrc` must be copied into the `deps` stage or `auto-install-peers` is off inside the
  image and Nest's peers are missing.
- The worker's ingest cadence is in `INGEST_CRON` (every three hours since Step 25); the
  scheduler id in Redis is upserted at boot and a legacy id is removed, so redeploying never
  leaves two schedules running.
