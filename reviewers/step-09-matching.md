# Step 9 — Scoring and matches

## What this step adds

The product's actual opinion: a function that looks at a posting and your criteria and returns a
number plus the reasons for it. Everything else in this repo is plumbing around this file.

## Files, in reading order

1. **`matching/scorer.ts`** — the pure function. Read it top to bottom; it is the spec made
   executable.
2. **`matching/scorer.spec.ts`** — one test per rule. This is the real documentation of the
   scoring behaviour.
3. **`matching/matching.service.ts`** — applies the scorer to the database.
4. **`matching/matching.controller.ts`** — three routes.

## Concepts

**Why the scorer takes its own types.** `PostingForScoring` and `CriteriaForScoring` are declared
in `scorer.ts` and are not Prisma types. That means the scorer can be tested with object
literals — no database, no mocks, no Nest — and the 12 tests run in milliseconds. It also means
changing a Prisma column does not silently change scoring behaviour; the compiler makes you look.

**Early returns are disqualifications, not scores of zero.** `not-remote`, `excluded:<kw>` and
`below-min-salary` each `return` immediately. They are not "worth 0 points"; they mean _stop
considering this posting_. Structuring them as returns rather than accumulated penalties keeps
that distinction visible.

**The threshold lives with the scorer.** `MATCH_THRESHOLD = 40` is exported from `scorer.ts`
rather than hidden in the service, so the rule "what counts as a match" sits next to "how points
are awarded".

**Rescoring deletes as well as writes.** If a posting drops below threshold — usually because you
edited your criteria — `rescoreUser` calls `deleteMany` for that pair. Without that branch, old
matches would linger forever and the inbox would only ever grow.

**`upsert` keyed on the compound unique.** The schema has `@@unique([userId, postingId])`, which
Prisma exposes as `where: { userId_postingId: { userId, postingId } }`. That name is generated
from the field names — you do not choose it, you look it up.

## Array operations in here

```ts
const roleHit = criteria.roleKeywords.find((keyword) => containsKeyword(posting.headline, keyword));
```

`.find` returns **the first matching element, or `undefined`** — not an array, not a boolean.
That is exactly what rule 5 wants: award 30 points once, and name the keyword that earned it.
`.filter` would give every match and let you double-count.

```ts
for (const keyword of criteria.includeKeywords) {
  if (stackTotal >= STACK_CAP) break;
  if (matchesAnywhere(...)) { stackTotal += STACK_POINTS; reasons.push(`stack:${keyword}`); }
}
```

A plain loop, deliberately, because it needs to stop early at the cap. `.filter().length * 10`
would compute the same number but lose the per-keyword reasons and the early exit.

```ts
return stackKeywords.some((entry) => entry.toLowerCase() === keyword.toLowerCase());
```

`.some` returns `true` as soon as one element matches — a boolean, not the element.

## Gotchas

**Word boundaries, not `includes`.** `containsKeyword` builds
`(^|[^a-z0-9])keyword([^a-z0-9]|$)` rather than using `String.includes`, so "go" does not match
"Django" and "java" does not match "javascript". `escapeRegExp` is there because keywords like
`next.js` and `c#` contain regex metacharacters.

**The salary check runs before the salary award.** Rule 7 in the plan does two things in one
step: disqualify if the ceiling is below your floor, otherwise add 10 for having a parsed salary.
Order matters — the disqualification has to win.

**E2E now runs serially.** `vitest.config.e2e.ts` sets `fileParallelism: false`. The matches spec
rescores every posting in the database; another spec deleting its fixtures at the same moment
produced `ForeignKeyConstraintViolation` on the match upsert. One database, one spec at a time.

**Tests must not assume an empty database.** The first version asserted on the contents of
`GET /matches`, which broke the moment a real ingest had put 263 postings in the dev database.
The spec now asserts on the three postings it created, looked up by their own ids.

## Sanity check against real data

After a live ingest, seed criteria (`full stack`, `typescript`, `node`, `react`, `postgres`)
produced 92 matches from 263 postings, top score 110:

```
110 | Interview Resources | remote,role:full stack,stack:typescript,stack:node,stack:react,stack:postgres,salary,apply-url
100 | Odin               | remote,role:engineer,stack:typescript,stack:node,stack:react,stack:postgres,apply-url
```

If that distribution ever looks wrong, the plan is explicit: fix the **fixtures and tests**, not
the threshold.
