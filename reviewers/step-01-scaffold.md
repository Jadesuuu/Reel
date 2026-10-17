# Step 1 — Scaffold the monorepo

## What this step adds

An empty but fully wired repository. Two apps that build, a Compose file that brings up
Postgres and Redis, one endpoint that proves both are reachable, and a CI workflow that runs the
same checks a laptop runs. Nothing in this step is product logic; all of it is the floor every
later step stands on.

The plan describes it in Section 7, Step 1. Several of the tools named there were swapped later
(Jest became Vitest, ESLint became oxlint) and the repairs document explains why; what is
described here is the tree as it exists now.

## Files, in reading order

### The workspace

1. **`pnpm-workspace.yaml`** — two globs, `apps/*` and `packages/*`. That is the entire
   definition of the monorepo. `pnpm --filter api <script>` runs a script in one package;
   `pnpm -r <script>` runs it in every package that defines it.
2. **`package.json`** (root) — the scripts you type. `dev` uses `concurrently` to start the
   API, the worker and the web app in one terminal with coloured prefixes. `lint`,
   `format:check`, `typecheck` and `test` are the gate; `db:*` forward to Prisma inside
   `apps/api`. The `pnpm.onlyBuiltDependencies` list is the pnpm 10 allowlist for packages that
   compile native code on install; without it `argon2` and the Prisma engines silently stay
   unbuilt.
3. **`packages/tsconfig/base.json`** — the compiler options every app extends: `strict`,
   `ES2023`, `noUncheckedIndexedAccess` (an index into an array is `T | undefined`, which is why
   you see `?? ''` and `!` after `[0]` throughout the code), `isolatedModules`. Each app adds
   its own `module` setting because Nest and Next want different ones.
4. **`apps/api/tsconfig.json`** — `module: nodenext` is what makes this an ESM project in
   practice. Relative imports must end in `.js` even though the source files are `.ts`;
   TypeScript rewrites nothing, Node resolves the emitted file. Decorators need
   `experimentalDecorators` and `emitDecoratorMetadata`, which is how Nest reads constructor
   parameter types for injection.

### Infrastructure

5. **`docker-compose.yml`** — Postgres 16 and Redis 7, both Alpine images, both with a
   healthcheck. `docker compose up -d --wait` returns only when both report healthy, which is
   what `start.cmd` relies on. The `pgdata` volume is why the database survives a restart.
6. **`.github/workflows/ci.yml`** — the same two databases as GitHub Actions _service
   containers_ (a container the runner starts beside the job, addressed as `localhost`), then
   install, generate the Prisma client, apply migrations, lint, format check, typecheck, build,
   unit tests, e2e tests. The order matters: the client must exist before typecheck, and the
   tables must exist before e2e. `concurrency.cancel-in-progress` stops a superseded push from
   wasting a runner.

### The API skeleton

7. **`apps/api/src/config/env.schema.ts`** — a zod object describing every environment
   variable, with defaults where a default is safe. `validateEnv` runs once at boot and throws
   a readable list of what is missing. Everything else in the app reads configuration through
   `ConfigService<Env, true>` with `getOrThrow`, so a typo in a variable name is a startup
   failure, not an `undefined` three modules later.
8. **`apps/api/src/config/config.module.ts`** — `ConfigModule.forRoot({ isGlobal: true,
validate })`. Global means no other module has to import it to inject `ConfigService`.
9. **`apps/api/src/prisma/prisma.service.ts`** — extends the generated `PrismaClient` and
   passes the `PrismaPg` driver adapter in the constructor. Prisma 7 does not read the database
   URL from the schema file; the adapter carries it. `onModuleInit` connects, `onModuleDestroy`
   disconnects, so a Nest shutdown closes the pool. `PrismaModule` is `@Global()`.
10. **`apps/api/src/redis/redis.module.ts`** — one ioredis client under the injection token
    `REDIS_CLIENT`. `maxRetriesPerRequest: null` is a BullMQ requirement; with the default,
    BullMQ's blocking commands time out. `bull/bull.config.ts` creates a second client the same
    way for the queue itself.
11. **`apps/api/src/health/health.controller.ts`** — `GET /api/v1/health`. It runs `SELECT 1`
    through Prisma and `PING` through Redis, and answers `503` with the same body when either
    fails. Railway's healthcheck and `start.cmd`'s wait both read this.
12. **`apps/api/src/main.ts`** — the bootstrap. Global prefix `api/v1`, the validation pipe
    with `whitelist` (unknown body fields are stripped) and `transform` (query strings become
    numbers where a DTO says so), CORS limited to `WEB_ORIGIN` with credentials, and
    `enableShutdownHooks` so `SIGTERM` reaches the services. Later steps added helmet, the
    cookie parser, the pino logger and the 8 MB body limit.
13. **`apps/api/test/create-app.ts`** and **`test/health.e2e-spec.ts`** — how every e2e test
    boots the real `AppModule` with the same pipes as `main.ts`, then talks to it through
    `supertest` without opening a port.

### The web skeleton

14. **`apps/web`** — `create-next-app` with TypeScript, Tailwind, the app router and `src/`.
    Its shape is described in the Step 13 and Step 18 reviewers; at this step it only had to
    build.

## Concepts

- **Workspace filtering.** `pnpm --filter api...` (with the dots) means "api and everything it
  depends on", which is what the Dockerfile uses to install only what the API needs.
- **Global modules.** Config, Prisma and Redis are marked `@Global()` because every feature
  module needs them and importing them fifteen times would say nothing.
- **Fail at boot, not at first use.** The zod schema, `getOrThrow`, and the health endpoint
  are all the same idea: a misconfigured process should die immediately with a message, not
  serve traffic and fail on the first query.
- **The same checks everywhere.** CI runs exactly the root scripts. If it is green locally it
  is green in CI, with one exception noted in the repairs document (native builds).

## Gotchas

- The generated Prisma client lives in `apps/api/src/generated/prisma` and is gitignored. A
  fresh clone must run `pnpm db:generate` before anything typechecks.
- `.npmrc` sets `auto-install-peers=true`; without it Nest's peer dependencies are missing on a
  clean install.
- The plan's Step 1 named Jest and ESLint. The repo uses Vitest and oxlint; the fixed decisions
  table in the plan records the change and the repairs document records why.
