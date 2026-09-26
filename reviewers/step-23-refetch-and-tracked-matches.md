# Step 23 — Refetch from anywhere, and tracked matches in the inbox

## What this step adds

Two small things that come up every day. A refresh button in the header queues a fetch of
every enabled source from any page. And the inbox now tells you when a match is already in your
pipeline: the row carries the application's stage stamp, and its main button opens the
application instead of saving a second copy.

The plan records the decisions under Section 11, Step 23.

## Files, in reading order

1. **`apps/web/src/components/app-shell.tsx`** — `IngestState` is now a small group: the
   status chip (dot plus "2 h ago", links to Settings → Ingest) and a ghost icon button. The
   button calls `useRunIngest().mutate({})`. An empty body means "every enabled source", the
   same request the Settings button sends when its filter is "All sources". `busy` is true
   while the request is in flight or while any run in the latest page is `RUNNING`.
2. **`apps/api/src/matching/matching.service.ts`** — `list()` runs one more query after it
   has the page of matches: every application of this user whose `postingId` is on the page.
   `new Map(applications.map(...))` turns that array into a lookup from posting id to
   `{ id, stage }`. Because the query is ordered oldest first and a `Map` keeps the last value
   written for a key, the newest application wins. Then `items.map((item) => ({ ...item,
application: ... }))` copies each match and adds one field; the spread keeps every existing
   field and the new key sits beside them.
3. **`apps/api/test/matches.e2e-spec.ts`** — the new case reads the strong match, sees
   `application: null`, saves it with `POST /applications`, and reads it again.
4. **`apps/web/src/lib/types.ts`** — `Match.application`.
5. **`apps/web/src/lib/queries.ts`** — `invalidateApplications` also invalidates `['matches']`,
   so saving, moving or deleting an application refreshes the inbox stamps.
6. **`apps/web/src/app/(app)/inbox/page.tsx`** — `MatchRow` shows `StageStamp` when
   `match.application` is set, and swaps "Save to pipeline" for "Open in pipeline".
   `saveMatch` opens the application when there is one, so the `s` key cannot duplicate it.
7. **`apps/web/src/demo/handlers/matches.ts`** and **`store.ts`** — the demo builds the same
   field from its in-browser applications. `StoredMatch` omits `application` because it is
   computed on read, never stored.

## Concepts

**Why one extra query instead of a Prisma `include`.** The match has no direct relation to an
application; they meet through the posting. Including `posting.applications` would nest the
answer inside the posting summary and would have to repeat the `userId` filter there. A second
`findMany` keyed by the page's posting ids is one round trip and keeps the shape flat.

**Why the stamp and not a badge.** A stage already has one look everywhere in Reel: the outlined
stamp in the stage's tone. Reusing it means the inbox and the pipeline say "Saved" the same way.

## Not done

`POST /applications` still accepts a posting that already has an application; the inbox just
stops offering it. The Postings drawer does not show the stage yet.
