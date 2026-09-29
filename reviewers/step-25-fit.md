# Step 25 — Fit: geography, level, near you, freshness, and a badge

## What this step adds

On 29 September the inbox for the real account held 258 matches, and the top of the list was
Lockheed Martin in Kentucky, Humana in Louisville, and a string of Toronto and Chicago jobs, all
marked "Remote". They scored 90 because the region rule from Step 21 only knew countries and
continents; a US state or city sailed through. Meanwhile 206 JobStreet and Kalibrr postings in
Metro Manila scored zero as "not remote", even though Manila is where you live. More than half
the matches were senior, staff or lead roles. Nothing told you which matches were new.

This step changes what "fit" means, in five places, and adds one way to find out without opening
the app:

1. **Geography that knows cities.** `regions.ts` becomes a gazetteer: every US state, the big
   cities on every continent, provinces, time-zone shorthands and phrases like "US-based" map
   to one of 26 region labels (`us`, `europe`, `philippines`, ...). Postings store labels, not
   raw terms, and the scorer reads the labels. A second parser, `restrictionSnippets`, pulls
   sentences like "must be located in the United States" out of the description, so a posting
   whose headline says only "Remote" still gets the `us` label when the body limits it.
2. **Near you.** Criteria gain `nearbyKeywords`. A hybrid or on-site posting whose location
   names one of them passes the remote-only gate and scores +20 (`nearby:<term>`) instead of
   the +25 for remote.
3. **Levels.** `detectLevel` reads the title into `intern`, `junior`, `mid`, `senior`, `lead`
   or null. Criteria gain `levels`; when the list is non-empty, a posting whose detected level
   is not on it scores zero (`level:senior`). Titles with no level word pass.
4. **Open and fresh points.** +10 `open:<region>` when the posting explicitly names one of
   your regions or says worldwide / anywhere. +10 `fresh` within three days of posting, +5
   `recent` within ten. The maximum is now 130.
5. **Inbox controls.** A "Posted within" filter (default 14 days), a Best / Newest sort, and a
   dot on rows created since your last visit. Opening the inbox tells the API
   (`POST /matches/seen`).
6. **The badge.** The extension already polls every 30 seconds. The poll now returns how many
   strong matches (80 or more) appeared since you last opened the inbox; the extension shows
   that number on its toolbar icon and raises one Chrome notification per batch. Clicking either
   opens the inbox.

Two smaller changes ride along: ingest runs every three hours instead of six, and HiringCafe
and JobStreet each get three more search presets (`typescript`, `react`, `node.js`).

The plan records the decisions under Section 11, Step 25, and rewrites §6.5.

## Files, in reading order

### The scorer and its inputs

1. **`apps/api/src/matching/regions.ts`** — read the top half as data. `GAZETTEER` is a list of
   `[label, terms]` pairs; `findRegionTerms(text)` walks it and returns the labels whose terms
   appear, in gazetteer order, so the first label is the reason you see in the chip.
   `OPEN_TERMS` and `mentionsOpenRegion` are the opposite signal. `RESTRICTION_PATTERNS` are
   eight regular expressions with one capture group each; `restrictionSnippets` runs them over
   the description and returns the captured places, deduplicated. Short terms (three letters or
   fewer) still match only as uppercase words, the Step 21 rule, so "join us" never counts.
   Terms that collided with ordinary words were removed on purpose: `america` (hit "Latin
   America"), `gmt` (hit "GMT+8" on Philippine postings), `clark` (a person's name as often as
   the Pampanga city), `remote-first` (many US-only companies say it).
2. **`apps/api/src/matching/level.ts`** — five regular expressions in precedence order. The
   basis is the role when the adapter supplied one, else the second segment of the HN-style
   headline. `intern` wins over everything, then `lead` (staff, principal, architect, manager,
   director, head, VP, founding), then `senior` (also `III`, `IV`), then `junior` (also
   `associate`, `entry`, `graduate`), then `mid` (also `II`). A title with none of these
   returns null, and null always passes the level filter.
3. **`apps/api/src/matching/scorer.ts`** — the rules in order. `PostingForScoring` gained
   `regionTerms`, `level` and `postedAt`; `CriteriaForScoring` gained `nearbyKeywords` and
   `levels`; `score` takes `now` so tests are deterministic. `regionVerdict` is the piece to
   read slowly: a keyword that is not an open word (`worldwide`, `anywhere`) and matches either
   a stored label or the headline text allows the posting with `open:<keyword>`; otherwise any
   stored label rejects it with `outside:<label>`; otherwise an open word allows it with
   `open:<word>`; otherwise silence allows it with no bonus. The order matters: "Remote
   (anywhere in the US)" carries the `us` label, so `anywhere` cannot rescue it. Before Step 25
   it could.
4. **`apps/api/src/sources/normalize.ts`** — where `regionTerms` and `level` are computed for
   every posting at ingest. `regionTerms` now reads the headline, the location and the
   restriction snippets joined with `|`.
5. **`apps/api/scripts/backfill-fit.ts`** — the same two calls over every row already in the
   database, in batches of 500 by id. Run once after the migration with `pnpm backfill:fit`.
   On 29 September it touched 4,659 of 5,370 rows, most of them gaining a `level`.

### Criteria, matches, and the seen marker

6. **`apps/api/prisma/migrations/20260929180000_v6_fit`** — `postings.level`,
   `criteria.nearby_keywords`, `criteria.levels`, `users.matches_seen_at`, and an index on
   `matches(user_id, created_at)` for the fresh count.
7. **`apps/api/src/criteria/dto/upsert-criteria.dto.ts`** — `levels` is validated with
   `@IsIn(LEVELS, { each: true })` after lowercasing, so the API refuses `Senior` typos rather
   than storing a level the scorer will never match.
8. **`apps/api/src/matching/matching.service.ts`** — `criteriaFor` is the one place that maps
   a `Criteria` row into `CriteriaForScoring`. `rescoreUser` now also deletes matches whose
   posting fell out of the 45-day window, so a match cannot outlive the rule that made it.
   `list` takes `days` and `sort`. `markSeen` and `freshForUser` are the two halves of the
   badge: one stamps `matchesSeenAt`, the other counts strong matches created after it (or in
   the last 24 hours when the stamp is null) and returns the top three for the notification.
9. **`apps/api/src/browser/browser.service.ts`** — `poll` runs `claim` and `freshForUser` in
   parallel and returns both. The guard already put the user on the request; the controller
   now passes `userId` through.

### Web

10. **`apps/web/src/components/reasons.tsx`** — five new chips: `near you`, `open`, `fresh`,
    `recent`, `level`. Every number in the inbox still traces to one of these.
11. **`apps/web/src/app/(app)/settings/criteria/page.tsx`** — "Near you" tag input, the level
    toggles (a row of pressed buttons rather than checkboxes, so the state reads at a glance),
    and the rules panel rewritten with the new maximum.
12. **`apps/web/src/app/(app)/inbox/page.tsx`** — `days` and `sort` in the query, the
    "Posted within" select, the Best / Newest segmented control, and `readPreviousVisit`, which
    swaps the visit stamp in `localStorage` for the previous one so the dot means "since the
    last time this page opened". The same mount effect calls `useMarkMatchesSeen`, which is
    what clears the extension badge on its next poll.
13. **`apps/web/src/demo/{regions,level,scoring}.ts`** — verbatim copies of the API modules
    (regions and level are byte-for-byte; scoring is the same function in the demo's types).
    `seed.ts` gives the demo criteria `nearbyKeywords` and an empty `levels`, and every seeded
    posting a `level`. `store.ts` rejects a cached state without `criteria.levels`, which is how
    a returning demo visitor gets reseeded instead of crashing.

### Extension

14. **`apps/extension/src/background.ts`** — `showFresh` sets the badge text and title, then
    decides whether to notify: it remembers `{ since, count }` of the last notification and
    only fires again when `since` moved (you opened the inbox and new ones arrived) or the
    count grew. Clicking the icon or the notification opens `<webUrl>/inbox`, or the options
    page when no token is saved yet.
15. **`apps/extension/src/settings.ts`** and **`static/options.html`** — a third setting, the
    web address, defaulting to `http://localhost:3000`. `static/icon.png` is new; Chrome
    notifications need an icon, and the badge is drawn on it.

## Concepts

- **Labels versus terms.** Step 21 stored whatever words it found ("kentucky" would have been
  stored as-is if it had been in the list). Storing the label (`us`) instead makes the SQL
  filter (`GET /postings?open=true`, now `hasSome` on your keywords) and the chip both read
  the same way, and lets you write `us` in "Where you can work" to accept every US city.
- **Silence is not a restriction; an open word is not a permission.** A posting that names
  nowhere is allowed and gets no bonus. A posting that says "anywhere" gets the bonus only
  when it also names no region, because "anywhere in the US" is the commonest phrasing of a
  US-only job.
- **Precomputed inputs.** The scorer reads `regionTerms` and `level` from the row rather than
  the description, so a rescore of 5,000 postings stays a few hundred milliseconds instead of
  running eight regular expressions over 25 MB of text every time an ingest finishes. The
  price is the backfill script, and the rule that anything that changes the parsers must run
  it again.
- **Freshness inside the score.** Putting time into the score, rather than only into the
  sort, means the default view surfaces "good and new" above "great and three weeks old",
  and a weak match fades below the threshold on its own. The chip says why.
- **The badge as a push channel.** The mailer is still `console` on this machine, so email
  digests would go nowhere. The extension is already a 30-second heartbeat carrying a bearer
  token; adding a count to the poll response cost one query and no new infrastructure.

## Gotchas

- `restrictionSnippets` patterns use the `g` flag, so each one is reset with `lastIndex = 0`
  before scanning; without that, the second posting through the same pattern starts mid-text.
- The scorer spec sets `postedAt` thirty days back by default so the point sums from earlier
  steps still hold; the fresh and recent rules have their own test.
- Locally the e2e suite shares the dev database, so the e2e user is scored against every real
  posting. The new e2e test walks every page of the list rather than assuming the seeded
  posting sits in the first hundred.
- Matches for postings older than 45 days used to survive forever because the rescore never
  looked at them. Two such rows were still there for the real account after this step; the
  next ingest's rescore removes them.
- Non-ASCII characters inside Bash heredocs are mangled on this machine, and long heredocs
  sometimes close early. Patches were written as `.cjs` files in the scratchpad and run with
  `node` instead.
- Jade's real criteria were updated in the database for this step: include keywords widened to
  the stack in this repo, "near you" set to Metro Manila and its cities, levels set to
  junior and mid. Change the levels in Settings → Criteria if senior roles should show.
