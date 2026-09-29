# Step 6 — Parser

## What this step adds

A pure function, `parseComment`, that turns one HN comment into a structured posting:
company, role, location, remote type, salary, stack keywords, apply link, headline and a
fingerprint. No class, no injection, no I/O. It is the most tested file in the API because it
is the one place where messy human text becomes columns, and every helper it is built from is
exported and tested on its own. Later steps reused those helpers for every other source
(`htmlToText`, `parseSalary`, `extractStackKeywords`, `fingerprintFor` all appear in
`normalize.ts`).

The rules are the plan's Section 6.3.

## Files, in reading order

1. **`apps/api/src/hn/hn.parser.ts`**, top to bottom:
   - `STACK_KEYWORDS` and `STACK_ALIASES` — the vocabulary the scorer's include keywords are
     matched against, and the spellings folded together (`nodejs` → `node`, `k8s` →
     `kubernetes`). A keyword not in this list is never found, which is why "add it to the
     list" is the answer when a stack the criteria name never scores.
   - `htmlToText` — HN serves comments as HTML with `<p>` between paragraphs and entities like
     `&#x27;`. This turns paragraphs into blank lines, `<br>` into newlines, strips the rest,
     and decodes entities once with `he`.
   - `extractHeadline` — the first non-empty line, capped at 300 characters. HN posters follow
     a convention: `Company | Role | Location | Remote | Salary`. Everything else in the
     parser leans on that line.
   - `splitSegments` — the headline split on `|`, trimmed, empties dropped.
   - `detectRemote` — `hybrid` wins over `remote`, then `on-site` / `in-office`, else
     `UNKNOWN`. The order matters because "Remote or hybrid" is hybrid.
   - `parseSalary` — one regular expression for `$120k–$160k`, `$120k`, `€80k` and friends.
     Only `$` amounts become numbers (the plan's rule); other currencies keep the text and get
     null numbers. Figures under 30 are treated as hourly or monthly and ignored.
   - `extractStackKeywords` — each vocabulary word as a word-bounded, case-insensitive match
     over the whole text, with lookarounds instead of `\b` because `c#` and `.net` are not
     word characters. Aliases are folded, duplicates removed.
   - `extractApplyUrl` — hrefs from the HTML, entity-decoded, first external link preferred,
     `mailto:` as a fallback, HN's own links ignored.
   - `fingerprintFor` — SHA-1 of lowercased, punctuation-stripped `company|role`, or of the
     comment id when there is no company. Two postings with the same fingerprint are the same
     job as far as Reel is concerned.
   - `parseComment` — composes the above. Company is the first segment when it is short
     enough and there is more than one segment; role is the first remaining segment that
     looks like a title (`ROLE_REGEX`), else the next segment; location is the first
     remaining segment that is not the role, not a remote word and not a salary.
2. **`apps/api/src/hn/hn.parser.spec.ts`** — one `describe` per helper, then `parseComment`
   on three fixture comments captured from a live thread. Read the fixtures next to the
   expectations; they are the specification in practice.
3. **`apps/api/src/sources/normalize.ts`** (Step 16) — where the helpers went next. For every
   non-HN source the headline is composed in the HN convention so the scorer and the UI treat
   all twenty sources alike.

## Concepts

- **Pure means testable.** The parser takes an object and returns an object. The tests need no
  database, no network and no Nest; they run in milliseconds and a failure names the exact
  line of text that broke a rule.
- **Word boundaries.** `go` must not match `golang` or `django`; `node` must not match
  `nodejs` (which has its own alias). The regular expressions use `(?<![a-z0-9])` and
  `(?![a-z0-9])` around the escaped keyword. The same idea reappears in the scorer, the
  region matcher and the level detector.
- **Fixtures over hand-written examples.** A fixture cut from a real comment carries the
  quirks a made-up one would not: entity-encoded apostrophes, `<p>` without closing tags,
  a salary written as `$150K-$180K` with a capital K.

## Gotchas

- `he.decode` must run exactly once. The Greenhouse adapter learned this later: its API
  double-escapes, so it decodes before handing HTML to `htmlToText`.
- Headlines that do not follow the pipe convention parse into `company: null`, and the
  fingerprint falls back to the comment id so the posting still has a stable identity.
- `ROLE_REGEX` is a list of title words (`engineer`, `developer`, `swe`, `full stack`,
  `backend`, ...). A "Head of Product" comment gets the second segment as its role anyway,
  which is what the level detector in Step 25 reads.
