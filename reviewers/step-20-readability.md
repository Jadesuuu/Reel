# Step 20 — Readability pass

## What this step adds

Nothing new to do, everything easier to read. Step 18 built the app on a 14px base and leaned on
10.5–12px grey text for anything secondary. Used for real, it was too small. This step keeps the
ink-and-brass world and the notebook structure from Step 18 and replaces the scale underneath
it: a 16px base, a named type ramp instead of ad-hoc pixel sizes, controls one step taller,
more room inside cards and rows, and secondary text that is lighter in colour rather than
smaller in size.

The plan records the decisions under Section 11, Step 20. `apps/web/DESIGN.md` and
`apps/web/.impeccable/design.json` carry the resulting tokens.

## Files, in reading order

1. **`apps/web/src/app/globals.css`** — the whole ramp lives in the `@theme inline` block as
   `--text-*` custom properties: `stamp`, `fine`, `caption`, `body-sm`, `body`, `title-sm`,
   `title`, `headline`, `display`, `measure`, `measure-sm`. Each has a paired `--line-height`
   and, where it matters, `--letter-spacing`. `body` sets `font-size: 16px`. The `.stamp`
   utility is now 12px with 0.12em tracking. `--fg-muted` and `--fg-faint` moved up in both
   themes. The sonner block at the bottom sizes toasts, which the library otherwise fixes at
   13px.
2. **`apps/web/src/components/ui/button.tsx`**, **`input.tsx`**, **`select.tsx`**,
   **`segmented.tsx`**, **`tabs.tsx`**, **`switch.tsx`** — the control heights: `xs` 28,
   `sm` 32, `md` 40, `lg` 44; inputs 40; tab triggers 44; the switch is 44 × 24.
3. **`apps/web/src/components/ui/badge.tsx`**, **`kbd.tsx`**, **`stage-stamp.tsx`**,
   **`source-badge.tsx`** — the small mono pieces. Badges are 13px mono with 8 × 4 padding;
   the score badge is 36px tall at 15px mono; stamps are 24px tall.
4. **`apps/web/src/components/app-shell.tsx`** — sidebar 256px, nav rows 44px at 16px, header
   64px, page column 1360px, bottom tab labels 13px.
5. **`apps/web/src/components/ui/states.tsx`** — `PageHeader` at 28px, `SectionTitle` at 16px,
   `Panel` padding 20px.
6. The pages and the card, sheet and dialog components — every arbitrary size utility was
   replaced by a ramp token, then each surface was tuned by hand: inbox rows, the application
   card, the pipeline columns (288 / 320 wide), the postings table, the settings sub-nav, the
   dashboard sentence (32px at `lg`).

## Concepts

**A named ramp instead of pixel utilities.** Tailwind 4 turns any `--text-<name>` custom
property in `@theme` into a `text-<name>` utility, and reads the sibling
`--text-<name>--line-height` and `--text-<name>--letter-spacing` properties with it. So
`text-body-sm` is one class that sets size, leading and tracking together, and the whole app
has exactly eleven sizes. Before this step there were nine arbitrary values like `text-[13px]`
scattered through forty files; changing the scale meant touching every one. Now it means
editing one block.

**Density is layout, not type size.** The plan's "density over hero sections" was being read
as "make everything small". A tool used in flow wants many things on screen, but each of them
has to be legible at a glance. The fix is to keep the notebook layout (hairline rows, stamps,
one focused item) and let the type breathe: 16px body, 15px for the second line of a row, 14px
for metadata, 13px only for mono measurements and timestamps.

**Lighter, not smaller.** The old secondary colours (`#b3ada4` muted, `#85807a` faint) were
fine for 14px on black but marginal at 11px. Both moved up (`#c2bcb3`, `#9c968d`) and, more
importantly, most metadata moved from `faint` to `muted`. `faint` now means "you rarely need
this": a timestamp, a keyboard hint, a hint under a tab. If you find yourself reading something
in `faint` every time, it should be `muted`.

**Stamps are for names, not sentences.** The `stamp` token carries 0.12em letterspacing and is
meant for mono uppercase labels: stage names, source names, kbd, group headings. When the remap
turned a few 10.5px sentences (column hints, "due tomorrow") into `text-stamp` they picked up
the tracking too. Those became `caption` or `fine`. Rule of thumb: if it has a verb, it is not
a stamp.

**One mapping, applied once.** The size remap was a single-pass substitution with every old
token in one alternation, so `h-5 → h-6` and `h-6 → h-7` could not chain into `h-5 → h-7`. The
hand-tuning afterwards is where the design decisions are; the mapping only moved the floor.

## What the finish review changed

The first build was reviewed against the direction contract in
`apps/web/.impeccable/surfaces/src-app.md` and came back with a fix list. The ones that landed:

- The dashboard "Coming up" log stops at six rows and links to the rest, so "Sources" is back in
  the first viewport at 1440.
- Pipeline columns share the page column equally from `lg` (with a 256px floor) instead of
  scrolling off the right edge at four stages.
- The settings sub-nav wraps below `lg`; it used to clip "Account" at 390.
- The light theme brass darkened from `#8a6a36` to `#75582a` so brass text on the brass tint
  clears 4.5:1.
- Inbox reason chips sit on their own row, full width on phones.
- The funnel footer and the "54 postings" aside are sans sentences with mono numerals; the
  mono face is for measurements, not prose.
- Postings shows three stack tags and a `+N` chip so rows stay one line tall.

Left open on purpose: the inbox's "Save to pipeline" button is disabled for a posting that is
already in the pipeline and says nothing about why. Turning it into an "In pipeline" link is a
behaviour change, not a readability one.

## The colour pass

A second look at the palette after the type change found that the colours were fine and the
dosing was not. Three changes, all in `globals.css` tokens plus two chip call sites:

- **The ink ramp is wider.** The four dark grounds used to be two to four units apart
  (`#08080a` to `#18181d`) with hairlines at `#22222a`, which is invisible on a dim laptop. Now
  canvas `#09090b`, surface `#141418`, surface-2 `#1c1c21`, surface-3 `#26262c`, hairline
  `#34343d`, strong hairline `#4a4a55`. Panels separate from the page without a shadow. The light
  theme was widened the same way (canvas `#ece8df`, surface `#fbfaf6`).
- **Warning left the brass hue.** It was `#d9a86c`, six units from the accent, so an overdue
  day-count on a card read as a highlight. It is burnt orange now (`#e6893f` dark, `#b4521a`
  light) and only two places use it: the stale day-count and "Unsaved changes".
- **One brass per inbox row.** The score badge keeps it. The `role:` reason chip and the salary
  chip were accent and success tints; both are neutral now, and their meaning is in the tooltip
  they already had. `reasons.tsx` no longer branches on the reason prefix.

WCAG ratios barely move for near-black steps (the formula compresses at the dark end), so the
numbers in `docs/PLAN.md` Step 20 are the values, not ratios; judge the ramp by eye in
`docs/screenshots/dashboard-desktop.png`.

## Gotchas

- `size-3.5` and `size-3` both became `size-4`. Two icon sizes that used to differ by 2px now
  match; lucide at 16px inside 14–16px text is the intended pairing.
- The score badge got wider, so the inbox detail row's left inset moved from 3.75rem to 5rem
  to stay aligned with the headline.
- The funnel's stamp column on the dashboard grew from 7.5rem to 9.5rem because
  `INTERVIEWING` at 12px mono with tracking is about 120px wide.
- Sonner sets `font-size: 13px` on each toast from its own stylesheet, so the toast text is
  sized in `globals.css` with attribute selectors rather than through `toastOptions`.
- `text-stamp` on the pipeline column hint and the "due tomorrow" label letterspaced a
  sentence. Both are `caption`/`fine` now; grep for `text-stamp` without `font-mono` or
  `uppercase` nearby if it ever creeps back.
