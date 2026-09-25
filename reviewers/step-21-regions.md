# Step 21 — Where you can work

## What this step adds

Reel could tell that a posting was remote but not where the remote worker had to live, so
"Remote (US only)" and "Remote (worldwide)" scored the same. This step adds one criteria list,
"Where you can work", and one scoring rule: a posting that names a region, and none of yours,
scores zero with the reason `outside:<term>`. The Postings page gets an "Open to me" toggle
that applies the same idea as a database filter. The inbox needs no toggle; it is the scored
view, so the rule already shapes it.

The plan records the decisions under Section 11, Step 21.

## Files, in reading order

1. **`apps/api/src/matching/regions.ts`** — the vocabulary and the matcher. `REGION_TERMS` is
   the list of countries, continents, trade regions and time-zone abbreviations Reel treats as
   "this posting is limited to somewhere". `mentionsRegion(text, term)` decides whether a term
   appears in a piece of text, and `findRegionTerms(text)` returns every vocabulary term that
   does. `regionBasis(headline, location)` is the text both callers search.
2. **`apps/api/src/matching/scorer.ts`** — rule 2b, between the exclude check and the points.
   Read it next to `docs/PLAN.md` §6.5; the code and the plan list the steps in the same order.
3. **`apps/api/src/sources/normalize.ts`** — `regionTerms` is computed here for every posting,
   from the same basis the scorer uses, and stored by `postings.service.ts` so SQL can filter.
4. **`apps/api/src/postings/postings.service.ts`** — `openToRegions(userId)` builds the Prisma
   `where` for `?open=true`: rows with no region terms, or rows whose headline or location
   contains one of the caller's regions.
5. **`apps/api/src/criteria/*`** — `regionKeywords` on the DTO, the defaults, and the upsert.
6. **`apps/api/prisma/migrations/20260926120000_v3_regions`** — two array columns, both
   defaulting to empty.
7. **`apps/web/src/app/(app)/settings/criteria/page.tsx`** — the new tag input and the extra
   line in "How the score adds up".
8. **`apps/web/src/app/(app)/postings/page.tsx`** — the "Open to me / Everywhere" segmented
   control, on by default.
9. **`apps/web/src/components/reasons.tsx`** — `outside:us` becomes the chip `outside · us`
   with the rule in its tooltip.
10. **`apps/web/src/demo/regions.ts`**, **`scoring.ts`**, **`handlers/postings.ts`**,
    **`handlers/criteria.ts`**, **`seed.ts`** — the demo copies, kept in step by hand like the
    rest of the demo.

## Concepts

**Silence is not a restriction.** The rule only fires when the posting names a region. A
Hacker News line that says just "Remote" stays in play. The alternative, an allow-list that
requires your region to be named, would throw away most of the good postings, because most of
them never say "worldwide" either.

**Short terms match only as capitals.** `us`, `uk`, `eu`, `est` are two or three letters, and
lowercase "us" is an English word that appears in "join us" and "contact us". So a term of three
letters or fewer matches only as an uppercase word (`US`, `U.S.` is its own entry), while longer
terms match case-insensitively. Your own keywords get the same treatment, which is why typing
`us` in "Where you can work" still matches "Remote (US)".

**Why the headline is searched, not only the location.** The HN parser deliberately drops any
segment containing "remote" from `location`, so "Remote (US)" never reaches that field. The
headline is the whole first line of the comment, so it still carries the restriction. Searching
`headline + location` catches both the HN case and the feeds, whose composed headline already
includes the location.

**A stored column for SQL, the text for the score.** The scorer reads the posting text at score
time and needs nothing new in the database. The postings page pages through thousands of rows
in SQL, so it needs something indexable: `region_terms` is that column, filled at ingest. The
two agree because both are derived from the same function on the same basis. Postings ingested
before this step have an empty column until their next upsert, which for the HN thread is the
next run and for feeds is whenever the item reappears; the inbox is unaffected.

**Why the reason chip carries the term.** The product rule is that every score is traceable. A
zero with the reason `outside:eu` tells you which word did it, so if a posting says "EU or
APAC" and you are in APAC, you add `apac` to your regions and it comes back on rescore.

## Gotchas

- `regionKeywords` is optional on `PUT /criteria` so the older e2e bodies still validate; the
  service treats a missing list as empty.
- The `open` query parameter arrives as the string `"true"`; the DTO transforms it to a boolean
  the same way `dismissed` is handled on matches.
- Prisma's `contains` is substring, not word-bounded. For short keywords the filter searches
  the uppercase form (`US`), which is close enough for a list filter; the scorer, which
  decides what reaches the inbox, uses the word-bounded matcher.
- The demo store key is unchanged; older saved demo states are reset on load when a posting
  lacks `regionTerms` so the filter never reads an undefined array.
