# Step 15 — Case study README

## What this step adds

The front door. `README.md` is written for a stranger with two minutes: what Reel is, why it
exists, what it does with a screenshot per claim, how it is built, which decisions were made
and what they cost, how it is tested, how to run it, and what would come next. The plan lists
the section order in Section 7, Step 15, and the README follows it.

This reviewer is short because the README explains itself. What it adds is how the README is
kept true, and what changed in it after later steps.

## Files, in reading order

1. **`README.md`** — read it top to bottom once as the stranger would.
   - The pitch names the count of sources and the stack. Both changed in Steps 16, 22 and 24;
     the number is edited by hand each time a source lands.
   - "What it does" is three claims (one inbox, a pipeline you can trust, reminders that do
     not nag twice), each followed by a screenshot from `docs/screenshots/`. The screenshots
     show the demo's synthetic data, never the real account.
   - The Mermaid diagram is Section 4.1 of the plan redrawn, with the extension added in
     Step 24.
   - "Decisions and trade-offs" is the part a reviewer reads: separate worker, fan-out
     ingest, idempotent reminders, pure parsers with fixtures, cookie JWT, offset pagination,
     no refresh tokens.
2. **`docs/screenshots/`** — the images the README embeds. They were taken against the demo
   production build on port 3001; the screenshot tooling note in the memory explains why the
   dev server cannot be captured the same way.
3. **`docs/DEPLOY.md`** — linked from "Deploy"; the README does not repeat it.
4. **`reviewers/README.md`** — the second front door, for reading the code rather than the
   product. The two are kept consistent by hand.

## Concepts

- **Claims with evidence.** Every sentence about behaviour in the README points at a
  screenshot, a file, or a number from the test suite. A README that says "robust" without
  showing the reminder job id check is marketing; this one names the file.
- **The demo is the proof.** A hosted demo that needs no backend never goes stale and never
  costs money, which is why Step 19 exists and why the README's live link points at it.

## Gotchas

- Counts drift. Sources, tests and steps all grew after this README was first written; when a
  step changes a number, the README and this index change in the same commit.
- The ingest cadence in the README's architecture paragraph moved from six hours to three in
  Step 25.
