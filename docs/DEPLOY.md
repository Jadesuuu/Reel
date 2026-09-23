# Deploying Reel

Two Railway services run the same image; Vercel serves the web app.

| Piece    | Platform       | Entry                 | Notes                        |
| -------- | -------------- | --------------------- | ---------------------------- |
| api      | Railway        | `node dist/main.js`   | healthcheck `/api/v1/health` |
| worker   | Railway        | `node dist/worker.js` | no port, no healthcheck      |
| postgres | Railway plugin | —                     | provides `DATABASE_URL`      |
| redis    | Railway plugin | —                     | provides `REDIS_URL`         |
| web      | Vercel         | Next.js               | root directory `apps/web`    |

`railway.api.json` and `railway.worker.json` at the repo root hold the service config;
point each Railway service at the matching file (Settings → Config as code).

## 1. Railway

Create a project named `reel`, add the **Postgres** and **Redis** plugins, then two services
from this repo.

**api** — root `/`, Dockerfile `apps/api/Dockerfile`, start `node dist/main.js`,
pre-deploy `pnpm --filter api exec prisma migrate deploy`, healthcheck `/api/v1/health`.

**worker** — same Dockerfile, start `node dist/worker.js`, no healthcheck and no exposed port.
It runs both the six-hourly ingest scheduler and the delayed reminder queue.

Both services need every variable below. The pre-deploy command is what applies migrations;
the worker must not also run it, or two deploys race each other.

## 2. Variables

| Variable           | api | worker | Where it comes from                                                                  |
| ------------------ | --- | ------ | ------------------------------------------------------------------------------------ |
| `NODE_ENV`         | ✓   | ✓      | literal `production`                                                                 |
| `PORT`             | ✓   |        | Railway injects it; the app reads it                                                 |
| `DATABASE_URL`     | ✓   | ✓      | reference `${{Postgres.DATABASE_URL}}`                                               |
| `REDIS_URL`        | ✓   | ✓      | reference `${{Redis.REDIS_URL}}`                                                     |
| `JWT_SECRET`       | ✓   | ✓      | generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `COOKIE_SECURE`    | ✓   |        | literal `true` in production                                                         |
| `WEB_ORIGIN`       | ✓   |        | the Vercel domain, e.g. `https://reel.jadebonifacio.dev`                             |
| `HN_ALGOLIA_BASE`  |     | ✓      | omit unless the default changes                                                      |
| `HN_FIREBASE_BASE` |     | ✓      | omit unless the default changes                                                      |
| `STALE_AFTER_DAYS` | ✓   | ✓      | literal `10`                                                                         |
| `STALE_DELAY_MS`   |     |        | dev only — overrides the days above; never set in prod                               |
| `MAILER`           |     | ✓      | literal `resend`                                                                     |
| `RESEND_API_KEY`   |     | ✓      | Resend dashboard; required when `MAILER=resend`                                      |
| `MAIL_FROM`        |     | ✓      | `Reel <reel@jadebonifacio.dev>`                                                      |

`JWT_SECRET` must be at least 32 characters or the app refuses to boot — that check lives in
`apps/api/src/config/env.schema.ts`, and every variable above is validated there at startup.

## 3. Vercel

Import the repo, set **root directory** to `apps/web`, and add one variable:

```
NEXT_PUBLIC_API_URL=https://<railway-api-domain>/api/v1
```

It is baked in at build time, so changing it needs a redeploy. Add the custom domain
`reel.jadebonifacio.dev` (CNAME at Porkbun), then set `WEB_ORIGIN` on the api service to match.

## 4. Cookies across origins

The session cookie is `httpOnly`, `sameSite: 'lax'`, `secure` in production, set by the API on
its own domain. The browser sends it to the API because every request uses
`credentials: 'include'` and the API allows exactly `WEB_ORIGIN` with `credentials: true`.

If login appears to succeed but `/auth/me` then 401s, check in this order: `WEB_ORIGIN` exactly
matches the site's origin including scheme, `COOKIE_SECURE=true`, and the site is served over
HTTPS. A trailing slash in `WEB_ORIGIN` breaks the CORS match.

## 5. Resend

Verify `jadebonifacio.dev` in Resend and add the DNS records it gives you at Porkbun. Until the
domain verifies, leave `MAILER=console` — reminders then log instead of sending, and nothing
else changes.

## 6. Demo build (free, no backend)

The web app can run entirely in the browser against seeded, synthetic data. Build it with one
extra variable and nothing else running:

```
NEXT_PUBLIC_DEMO_MODE=true
```

On Vercel that is a second project (or a second environment) importing the same repo with root
directory `apps/web` and only that variable set — `NEXT_PUBLIC_API_URL` is ignored in demo
mode. The build is fully static, so the free plan hosts it with no cold starts and no database.
The demo banner offers **Reset** (restore the seed) and **Fast-forward 10 days** (advance the
clock so pending reminders fire; the emails they would have sent appear under Settings → Account).
State lives in `localStorage` under `reel-demo:v1`.

Locally: `NEXT_PUBLIC_DEMO_MODE=true pnpm --filter web dev`, then sign in with
"Continue as the demo user".

## 7. Smoke test

1. Register with a real address, save criteria in Settings.
2. Run ingest from Settings; the worker log should show `Ingested thread …`.
3. Rescore from the Inbox, save a match, move it to APPLIED.
4. Confirm the reminder row exists with a due date ten days out.
5. Check the worker log six hours later for the scheduled ingest.

To watch a real reminder email once: set `STALE_DELAY_MS=60000` on the worker, redeploy it, move
an application to APPLIED, wait a minute, then remove the variable and redeploy.
