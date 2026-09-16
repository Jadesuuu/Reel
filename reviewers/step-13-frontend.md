# Step 13 — Frontend

## What this step adds

Four branches' worth of Next.js: the shell and auth (13a), inbox and postings (13b), the pipeline
board (13c), settings and polish (13d).

## Files, in reading order

1. **`lib/api.ts`** — every network call goes through here.
2. **`lib/types.ts`** — hand-written types mirroring the API contract.
3. **`lib/queries.ts`** — one hook per endpoint.
4. **`app/(app)/layout.tsx`** — the auth gate and nav.
5. **Pages:** `inbox`, `postings`, `pipeline`, `settings`.
6. **`components/application-sheet.tsx`** — the densest component; stage moves and history.

## Concepts

**`credentials: 'include'` on every request.** Set once in `apiFetch`. Without it the browser
never sends the `reel_session` cookie cross-origin and every call 401s — the single most common
way this setup fails.

**The types are hand-written on purpose.** `lib/types.ts` duplicates shapes the API already
knows. That is deliberate: importing Prisma types into the web app would couple the browser
bundle to the database schema, and a column rename would become a frontend compile error rather
than a deliberate API change. The duplication is the boundary.

**The route group `(app)`.** Parentheses mean the folder does not appear in the URL — `/inbox`,
not `/app/inbox`. What it buys is a shared layout that runs `useSession()` and redirects to
`/login` on failure, so every page inside it can assume a logged-in user.

**Server validation is the real validation.** `lib/stages.ts` mirrors `stage-machine.ts` so the
sheet shows only legal buttons. That is a UX nicety. The server re-checks every move and the
client never assumes its copy is authoritative — if the two disagree, the server wins and the UI
shows the error.

**Query keys and invalidation.** Each hook names its cache entry (`['matches', options]`), and
mutations invalidate by prefix:

```ts
onSuccess: () => queryClient.invalidateQueries({ queryKey: ['matches'] });
```

Dismissing a match therefore refetches every matches query regardless of its filters or page, so
the list is never stale. Invalidate the prefix, not the exact key.

**`useEffect` to seed form state from a query.** Settings and the application sheet both do:

```ts
useEffect(() => {
  if (criteria.data) {
    setRemoteOnly(criteria.data.remoteOnly); /* … */
  }
}, [criteria.data]);
```

The form needs local state so typing feels instant, but the initial values come from the server.
The effect copies them across once the data lands.

## Array work in the UI

```ts
const byStage = (stage: Stage) =>
  (applications.data?.items ?? []).filter((item) => item.stage === stage);
```

`?.` short-circuits to `undefined` while loading, `?? []` substitutes an empty array so `.filter`
never runs on nothing, and `.filter` returns a new array of the items in that column. Called once
per column.

```ts
onChange={() => onChange(values.filter((item) => item !== value))}
```

The tag input's remove button. `.filter` gives a **new array without that entry** — React state
must not be mutated in place, so `splice` would be wrong here even though it looks more direct.

```ts
const pendingReminder = detail?.reminders.find((r) => r.sentAt === null && r.cancelledAt === null);
```

`.find` returns the first pending reminder or `undefined`, which the JSX then tests directly.

## Design direction

Near-black (`--ink-950`) with a muted brass accent, defined as CSS custom properties in
`globals.css` and exposed to Tailwind through `@theme inline`. Tailwind 4 needs no config file
for this — the `@theme` block is the config. Density over hero sections: 14px base, tight rows,
tables rather than cards where the data is tabular.

UI primitives live in `components/ui/` and were written by hand rather than pulled through the
shadcn CLI. Same model — the components are yours, in your repo, editable — without a network
step in the build.

## Gotchas

**`apps/web/AGENTS.md` exists and matters.** Next 16 regenerates it on `next dev`; it warns that
this version differs from what most documentation assumes, and points at
`node_modules/next/dist/docs/`. Commit it with your work rather than fighting it.

**`NEXT_PUBLIC_API_URL` is baked in at build time.** Changing it on Vercel requires a redeploy,
not just a restart. Anything `NEXT_PUBLIC_*` is compiled into the bundle and is public — never
put a secret behind that prefix.

**The `/` route redirects to `/inbox`.** There is no marketing page; this is a tool.

## Verified end to end

Against real ingested data, with the API and web both running: register → save criteria →
rescore (92 matches from 263 postings) → save the top match to the pipeline. Every screen reads
from the real endpoints; nothing in the frontend is mocked.
