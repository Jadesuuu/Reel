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

## Second commit: Postings and the duplicate guard

8. **`apps/api/src/applications/tracked.ts`** — `trackedByPosting(prisma, userId, postingIds)`
   is the lookup from item 2, moved out so matches and postings share it. It returns an empty
   `Map` without querying when there are no ids.
9. **`apps/api/src/postings/postings.service.ts`** — `list()` adds `application` to each row the
   same way matches do; `findOne(id, userId)` now needs the caller, so the controller passes
   `@CurrentUser()` to it.
10. **`apps/api/src/applications/applications.service.ts`** — before creating from a posting,
    `findFirst` looks for the caller's existing application and throws `ConflictException`
    (HTTP 409) if there is one.
11. **`apps/api/test/applications.e2e-spec.ts`** — the old "copies location, salary and source"
    case saved the same posting a second time, which is now refused, so its assertions moved
    into the first create case. The new cases check the 409, that another user can still save
    it (then clean up), and that list and detail carry the application.
12. **`apps/web/src/components/use-save-posting.ts`** — gains `open(applicationId)`, used by the
    inbox, the table and the sheet, and turns a 409 into a neutral "already in your pipeline"
    toast.
13. **`apps/web/src/app/(app)/postings/page.tsx`** and **`components/posting-sheet.tsx`** — the
    stamp and "Open in pipeline". The sheet reads `application` from its detail query and keeps
    Save disabled until that query answers, so it never offers Save for a tracked posting.
14. **`apps/web/src/lib/types.ts`** — `Tracked<T>` is `T & { application: ... }`, a generic
    that adds the field to any type. `Tracked<Posting>` is what the postings endpoints return;
    the demo store keeps plain `Posting` because the field is computed on read.
15. **`apps/web/src/demo/tracked.ts`**, **`router.ts`** (`conflict`), and the postings,
    matches and applications handlers — the same behaviour in the demo.

## Not done

The duplicate guard is a check before the insert, not a database constraint. Two saves fired
at the same instant by the same user could both succeed.
