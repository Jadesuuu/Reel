# Step 26 — Eligibility: working hours, hiring signals, the unverified tier, and a daily queue

## What this step adds

On 17 October the real account had 11 applications in `applied`, none with any reply, not even
a rejection. Silence on remote listings usually means a filter screened the application out
before a person read it. The search is aimed at employers abroad, US or otherwise, who pay more
than Philippine rates and can hire someone living in Manila. Three things in the scorer worked
against that:

- "4 hours of overlap with EST" was read by a restriction pattern as "the US", so the posting
  scored zero exactly like a US-only job, although partial overlap is the workable case.
- Nothing rewarded a posting that says how it pays people abroad: Deel, Remote.com, an employer
  of record, a B2B contract, "we hire globally".
- A posting that says nothing about location stood level with one that says "worldwide".

This step changes five things:

1. **Working hours are a flag, not a place.** Time-zone words left the region gazetteer for a
   separate `ZONES` table. Postings store `zoneTerms` (whose working hours they name) and
   `zoneOverlap` (whether they ask only for overlap). The chip is `overlap · us` or
   `hours · us`, worth no points. You decide whether you will work nights.
2. **Hiring signals.** `hireSignals` lists how the description says it pays people abroad, from
   a fixed vocabulary with seven labels. One signal is worth +10, the same slot as `open:`, and
   lifts the posting out of the unverified tier.
3. **The unverified tier.** With regions set, a posting that is neither open to one of them nor
   carrying a signal loses 10 and gets the `unverified` chip. Check it before applying.
4. **Authorization phrases from the whole body.** "US citizen", "US persons", "W-2", "green
   card", "security clearance", "TS/SCI" and "ITAR" label the posting `us` wherever they appear,
   not only inside a "must be located in" sentence. A negation just before ("no clearance
   required") cancels them.
5. **A daily queue.** The inbox's first control is now All / Top 15 / Dismissed. Top 15 asks for
   the fifteen best matches you have not saved yet (`untracked=true`), first page only. Save or
   dismiss one and the sixteenth moves up.

One fix rides along. `rescoreUser` used to run a delete per posting that fell below the
threshold. With 14,114 postings in the 45-day window that was 14,000 round trips, and three e2e
tests timed out before this step touched anything. It is now one `deleteMany`.

The plan records the decisions under Section 11, Step 26, and amends §6.5 rules 2b, 6b and 8c.

## Files, in reading order

### Detection

1. **`apps/api/src/matching/regions.ts`** — four tables, top to bottom:
   - `GAZETTEER` is unchanged except that its time-zone words moved out. The US entry's
     `US_ZONES` list is now `US_RESIDENCY`: only words about where you must be (`us-based`,
     `us citizen`, `w-2`) stay.
   - `ZONES` has the same `[label, terms]` shape. `et` is in, but `pt` (part-time),
     `eastern` and `pacific` ("Asia Pacific") are deliberately out.
   - `HIRE_SIGNALS` holds regular expressions, not plain terms, because case matters: `Deel`
     is the company, while "deel" is Dutch for "part". `EOR` must be uppercase, and `B2B` only
     counts when followed by "contract", "agreement" or "basis". `NOT_LOCAL` is a negative
     lookahead that stops "we hire anywhere in the US" from counting as global.
   - `AUTHORIZATION_PATTERNS` are the US-only phrases.

   Below the tables:
   - `affirmed(text, pattern)` walks every match of a pattern and accepts the first one whose
     preceding 30 characters contain no negation word.
   - `withoutZones` strips zone phrases before region matching. Without it, "Remote (US time
     zones)" would still produce `us`, because the bare word `US` is a region term.
   - `ZONE_PATTERNS` are the time-zone sentence pattern that used to sit in
     `RESTRICTION_PATTERNS`, plus "X business hours", "overlap with …" and "9am-5pm EST".
   - `eligibilityOf(headline, location, rawText)` returns all four columns at once.
     `regionTerms` is the union of gazetteer labels and authorization labels, re-ordered to
     gazetteer order. Building a `Set` and then filtering `REGION_LABELS` by it removes
     duplicates and keeps that order in one pass.

2. **`apps/api/src/sources/normalize.ts`** — `...eligibilityOf(headline, raw.location, rawText)`
   spreads the four returned fields straight into the normalised posting. The spread puts each
   key of the returned object (`regionTerms`, `zoneTerms`, `zoneOverlap`, `hireSignals`) at the
   top level of the object being built, as if each were written out by hand.
3. **`apps/api/scripts/backfill-fit.ts`** — the same call over every stored row. `sameList`
   compares arrays element by element so unchanged rows are not rewritten. On 17 October it
   changed 511 of 16,011 rows.

### Scoring

4. **`apps/api/src/matching/scorer.ts`** — three changes:
   - `regionVerdict` also accepts a keyword found in `zoneTerms`, so "PHT hours" reads as
     `open:philippines` for you. Zone labels never cause `outside`.
   - Rule 6b gives +10 once for `open:` and/or a hiring signal (both chips show, the points do
     not stack) and −10 `unverified` when there is neither and you have regions set. A signal
     cannot rescue a posting that names a region outside your list. That is the same rule as
     "anywhere" since Step 25.
   - Rule 8c adds the hours chip after the points, from the first zone label not in your
     regions. `Math.max(0, total)` stops a non-remote, unverified posting from going negative.
5. **`apps/api/src/matching/matching.service.ts`** — `kept` collects the ids that stayed above
   the threshold, and one `deleteMany({ postingId: { notIn: kept } })` removes the rest. Postings
   older than the window were already deleted just above, so "not kept" means exactly "scored
   below 40 this time". `list` gains `untracked`, which becomes
   `posting: { applications: { none: { userId } } }`: keep matches whose posting has no
   application of yours.

### Contract and schema

6. **`apps/api/prisma/migrations/20261017120000_v7_eligibility`** — three columns on
   `postings`, all with defaults, so existing rows are valid before the backfill runs.
7. **`apps/api/src/matching/dto/list-matches.query.ts`** — `untracked` follows the same
   `Transform` pattern as `dismissed`, because query strings arrive as `'true'`, not `true`.

### Web and demo

8. **`apps/web/src/components/reasons.tsx`** — four chips: `hires abroad · <signal>`,
   `unverified`, `overlap · <zone>`, `hours · <zone>`. `HIRE_DETAIL` turns a label into words
   for the tooltip.
9. **`apps/web/src/app/(app)/inbox/page.tsx`** — `queue` state. In queue mode the request is
   page 1, `sort=best`, `pageSize=15`, `untracked=true`. The conditional spread
   `...(queue ? { pageSize: QUEUE_SIZE, untracked: true } : {})` adds those two keys only when
   `queue` is true; spreading `{}` adds nothing. The sort control and the pagination hide in
   queue mode, and the prefetch is switched off.
10. **`apps/web/src/app/(app)/settings/criteria/page.tsx`** — the rules panel gains the −10 row
    and the hours row, and the footnote says time zones are working hours, not places.
11. **`apps/web/src/demo/`** — `regions.ts` is a fresh verbatim copy, `scoring.ts` mirrors the
    three rule changes, and `seed.ts` calls `eligibilityOf` with each seed's generated
    description. Tidewater Analytics' blurb now mentions Deel and US Eastern overlap, so the
    demo shows both new chips. `store.ts` reseeds a cached state whose postings lack
    `hireSignals`. `handlers/matches.ts` supports `untracked`.

## Concepts

- **Where versus when.** "Must live in the US" closes the door. "Must work US hours" is a cost
  you might accept. Keeping them in separate columns means the scorer can reject one and only
  flag the other. Before this step one regular expression fed both into the same label.
- **Precision over recall for signals.** A missed signal costs +10 and leaves the posting
  `unverified`, so you check it yourself. A false signal tells you a US-only job can hire you.
  That asymmetry is why plain `contractor`, plain `B2B`, `1099`, "work from anywhere" and
  "global team" are left out: each appears regularly in postings that cannot hire abroad.
- **Why authorization words are safe in the whole body.** Region words in a description are
  noisy ("our customers in Germany"), which is why Step 25 only reads them inside restriction
  sentences. "W-2" and "US citizen" only ever describe who can be hired, so they can be read
  anywhere.
- **A view, not a cap.** Top 15 is a request shape, not a rule in the scorer. Nothing is
  hidden from All, and on a slow week the sixteenth best still exists.

## Gotchas

- Short zone terms follow the uppercase-only rule, so "ET" counts and "et al." does not.
- `affirmed` only looks 30 characters back and stops at a full stop. "We are not able to
  sponsor visas. W-2 only." still reads as US-only, which is correct. "Clearance is not
  required" (negation after the phrase) is not caught; none appeared in the real data.
- The e2e test for `untracked` compares two `total`s with `pageSize=1` instead of walking every
  page. The e2e user is scored against every real posting in the shared dev database, and
  walking hundreds of pages hit the API's limit of 100 requests a minute, which then broke the
  next test too.
- `hireSignals` and `zoneTerms` are only as fresh as the last backfill or upsert. Run
  `pnpm --filter api backfill:fit` and rescore after changing any table or pattern in
  `regions.ts`.
- Camunda's postings appear three times in the queue with identical text. That is a duplicate
  problem in the board source, not in this step. The fingerprint does not collapse them because
  their external ids differ.
