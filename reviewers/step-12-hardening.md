# Step 12 — Hardening and Dockerfile

## What this step adds

The difference between "works on my machine" and "can face the internet": structured logs,
security headers, rate limiting, and an image that runs the thing.

## Files, in reading order

1. **`logging/logging.module.ts`** — pino, configured from env.
2. **`main.ts`** — the middleware order.
3. **`app.module.ts`** — the throttler and its global guard.
4. **`auth/auth.controller.ts`** — the tighter per-route limit.
5. **`apps/api/Dockerfile`** — three stages.
6. **`test/hardening.e2e-spec.ts`** — proves two of the four.

## Concepts

**Structured logging.** `console.log` produces text a human reads one line at a time. pino
produces JSON objects a log platform can filter and alert on. The `transport: pino-pretty` branch
is development-only — in production the raw JSON is the point, which you can see in the container
output:

```json
{
  "level": 30,
  "time": 1789573131506,
  "context": "NestApplication",
  "msg": "Nest application successfully started"
}
```

**Redaction is not optional.** `redact: ['req.headers.cookie', 'req.headers.authorization']`
means the session JWT never reaches the log platform. Logs get shipped, stored, and read by
tools you do not control; a cookie in there is a credential in there.

**Middleware order in `main.ts`.**

```ts
app.setGlobalPrefix('api/v1');
app.use(helmet()); // headers on everything, including errors
app.use(cookieParser()); // must run before any guard reads a cookie
app.enableCors({ origin: WEB_ORIGIN, credentials: true });
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
app.enableShutdownHooks();
```

`credentials: true` plus an explicit origin is what allows the browser to send the session
cookie cross-site. A wildcard origin is not allowed with credentials, by spec.

**`enableShutdownHooks`.** Wires SIGTERM to Nest's lifecycle, so `onModuleDestroy` runs —
Prisma disconnects, BullMQ workers close, in-flight jobs finish rather than vanish. Railway sends
SIGTERM on every redeploy, so this runs several times a day in practice.

**A global guard with a per-route override.** `APP_GUARD` applies the throttler to everything at
100 requests/minute. `@Throttle({ default: { limit: 10, ttl: 60_000 } })` on register and login
tightens those two, because that is where credential-stuffing shows up.

## The Dockerfile

Three stages, each with a job:

- **deps** — copies only manifests and the lockfile, then installs. Because the layer cache keys
  on those files, changing source code does not reinstall dependencies.
- **build** — copies source, runs `prisma generate`, then `nest build`. The generate **must**
  happen here: the client is gitignored, so it does not exist until something makes it.
- **runtime** — copies `dist`, `node_modules`, the generated client, and `prisma/` +
  `prisma.config.ts`. Those last two are there so `prisma migrate deploy` can run in the same
  image as a pre-deploy step.

The worker uses the identical image with `node dist/worker.js` as its command. One build, two
services.

## Gotchas

**The e2e app must mirror `main.ts`.** Two tests failed for exactly this reason during the build:
first the cookie tests (the test bootstrap had no `cookieParser`), then the helmet test. The fix
was `test/create-app.ts` — a single helper both this spec and every other e2e spec uses. If
middleware is only configured in `main.ts`, your tests are quietly exercising a different app
than the one you ship.

**Rate limiting is stateful across tests.** The hardening spec fires 11 logins and expects the
11th to be 429. Run it twice inside the same minute and the first request of the second run is
already limited. It passes because each run gets a fresh app, but it is the kind of test that
bites when you start re-running selectively.

**Helmet's defaults are for APIs, mostly.** It sets `x-content-type-options: nosniff`,
`x-frame-options`, HSTS and a strict CSP. The CSP matters little for a JSON API but costs
nothing; the web app is served by Vercel and has its own.

## Verifying it yourself

```bash
docker build -f apps/api/Dockerfile -t reel-api .
docker run -p 4100:4000 --env-file apps/api/.env \
  -e DATABASE_URL=postgresql://reel:reel@host.docker.internal:5432/reel \
  -e REDIS_URL=redis://host.docker.internal:6379 reel-api
curl http://localhost:4100/api/v1/health
```

`host.docker.internal` is how a container reaches services on the host. `--network host` does not
work the same way on Docker Desktop for Windows, which is worth knowing before you lose twenty
minutes to it.
