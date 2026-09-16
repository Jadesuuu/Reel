# Repairs to steps 1–6

Steps 1–6 arrived complete but had never been run. Typecheck failed, the worker crashed on
boot, and there was no migration. Five fixes, each its own commit on `feat/ingest-job`.

## 1. pnpm 10 blocks native build scripts

`chore: allow native build scripts under pnpm 10`

pnpm 10 refuses to run `postinstall`/`install` scripts unless you allow them by name. On a
clean install that left `argon2` unbuilt (no native binary, so password hashing throws) and
Prisma without its engines.

Root `package.json` now carries:

```json
"pnpm": { "onlyBuiltDependencies": ["@prisma/engines", "argon2", "esbuild", "msgpackr-extract", "prisma"] }
```

This matters for CI too — a fresh runner hits exactly the same wall.

## 2. ioredis under ESM

`fix(api): import ioredis by name for ESM interop`

The repo is ESM (`"type": "module"`), which the plan's Fixed decisions table records. Under
`moduleResolution: nodenext`, importing a CommonJS package with a **default** import gives you
the module namespace object, not the class:

```ts
import IORedis from 'ioredis'; // namespace, not constructable
new IORedis(url); // TS2351: This expression is not constructable
```

The fix is the named import, in all three files that used it:

```ts
import { Redis } from 'ioredis';
new Redis(url, { maxRetriesPerRequest: null });
```

`maxRetriesPerRequest: null` is required by BullMQ — its blocking commands must not time out.

## 3. `he` had the same problem, but only at runtime

`fix(hn): default-import he for ESM runtime`

`import { decode } from 'he'` typechecked and passed every test, then killed the worker:

```
SyntaxError: The requested module 'he' does not provide an export named 'decode'
```

Vitest transforms modules through Vite, which papers over CJS/ESM differences. Real Node does
not. **A green test suite is not proof that the thing boots** — that is the lesson from this
one. Fixed with `import he from 'he'` and `he.decode(...)`.

## 4. Guards need their module's providers

`fix(auth): provide AuthModuleOptions to guards outside AuthModule`

`CriteriaController` used `@UseGuards(JwtAuthGuard)`. Nest constructs that guard **in the module
where it is used**, so it needs that guard's dependencies resolvable from `CriteriaModule`:

```
Nest can't resolve dependencies of the JwtAuthGuard (?).
Please make sure that the argument AuthModuleOptions at index [0] is available
in the CriteriaModule module.
```

Two things were wrong. Bare `PassportModule` is `@Module({})` — an empty module that provides
nothing; only `PassportModule.register(...)` supplies `AuthModuleOptions`. And `AuthModule`
never exported it. So:

```ts
imports: [PassportModule.register({ defaultStrategy: 'jwt' }), ...],
exports: [PassportModule],
```

and every module whose controllers use the guard imports `AuthModule`. This is the
imports/exports rule in its purest form: **exporting and importing are two halves of one
handshake, and missing either gives you that `(?)`.**

## 5. No migration existed

`feat(db): add initial migration for the Step 2 schema`

`schema.prisma` was committed but `prisma/migrations/` was not, so `prisma migrate deploy` — the
command CI and the production pre-deploy both run — had nothing to apply. Generated with
`prisma migrate dev --name init` against the local database and committed.

The schema file describes the shape you want; the migration is the versioned SQL that gets a
database there. You need both in git.

## 6. Line endings

`chore: normalize line endings to LF`

`core.autocrlf=true` on Windows checked the tree out with CRLF, and Prettier defaults to LF, so
`pnpm format:check` failed on all 55 files. A `.gitattributes` with `* text=auto eol=lf` fixes
it for every machine; `docs/PLAN.md` went into `.prettierignore` so reformatting prose never
buries a real plan change in the diff.
