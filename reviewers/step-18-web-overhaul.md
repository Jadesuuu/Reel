# Step 18 — Web overhaul

## What this step adds

The v1 frontend was four pages of tables and buttons that proved the API worked. This step
replaces it with the tool Jade actually uses: a dashboard that answers "what is due and what
came in" in one sentence, an inbox you can triage from the keyboard, a postings browser across
ten sources, a drag-and-drop pipeline with a full application record behind every card, and a
settings area for criteria, sources, ingest runs and the account. Dark and light themes, a
command palette, toasts with undo-style actions, designed empty and error states, and motion
that only ever explains a change.

The direction is recorded in `apps/web/.impeccable/surfaces/src-app.md` and the built system in
`apps/web/DESIGN.md`. Product facts live in `apps/web/PRODUCT.md`. Read those three before the
code if you want to know _why_ something looks the way it does; read below for _how_.

## Files, in reading order

1. **`src/app/globals.css`** — every colour is a CSS variable on `:root` (dark) and
   `[data-theme='light']`, then exposed to Tailwind through `@theme inline`. Browser surfaces
   (selection, caret, scrollbars, focus ring) are themed here too. The keyframes at the bottom
   drive dialogs and sheets.
2. **`src/app/layout.tsx`** and **`src/app/providers.tsx`** — fonts via `next/font`, then the
   provider stack: theme, TanStack Query, motion config, tooltips, toaster.
3. **`src/lib/types.ts`** — the hand-written mirror of the API contract (Sections 5 and 11.3 of
   the plan). Still no import from `apps/api`.
4. **`src/lib/queries.ts`** — one hook per endpoint. Read `useDismissMatch` and `useChangeStage`
   for the optimistic-update pattern.
5. **`src/components/ui/*`** — the primitives: `button` (cva variants), `input`, `badge`,
   `dialog`, `sheet`, `dropdown-menu`, `select`, `switch`, `tabs`, `segmented`, `tooltip`,
   `skeleton`, `empty-state`, `pagination`, `states`, `kbd`. Everything else is built from these.
6. **`src/components/app-shell.tsx`** — sidebar, top bar, bottom tab bar, account menu, and the
   command palette mount. `src/app/(app)/layout.tsx` is the auth gate around it.
7. **`src/app/(app)/dashboard/page.tsx`** — the "today" sentence, stage funnel, weekly small
   multiples, coming-up log, source health.
8. **`src/app/(app)/inbox/page.tsx`** — match rows, filters, keyboard navigation, optimistic
   dismiss. `src/components/reasons.tsx` turns `role:full stack` into a chip with its points.
9. **`src/components/pipeline-board.tsx`** — dnd-kit columns and cards; illegal drops are
   refused client-side with the server's own rule, and the server still checks.
10. **`src/components/application-sheet.tsx`** — the densest file: stage mover, editable
    details, timeline with notes, reminders. Three tabs, one query.
11. **`src/app/(app)/settings/*`** — criteria form with the scoring rules beside it, sources with
    the board watchlist, ingest runs, account and shortcuts.

## Concepts

**Tokens, not colours.** No component names a hex value. `bg-surface-2`, `text-muted`,
`border-line`, `text-accent` all resolve through `@theme inline` to a variable that changes with
`data-theme`. That is why the light theme is roughly forty lines and no component knows it
exists. `next-themes` writes `data-theme` on `<html>`; `suppressHydrationWarning` there stops
React complaining that the server did not know the theme.

**Optimistic updates with a snapshot.** In `useDismissMatch`, `onMutate` cancels in-flight
fetches, copies every cached matches page, removes the row locally, and returns the copies. If
the request fails, `onError` writes the copies back. `onSettled` refetches either way. The row
disappears the instant you press `d`; the server is still the truth.

**One seam for the whole API.** Every network call still goes through `apiFetch` in
`lib/api.ts`. Step 19 will put the demo mode behind that one function, and nothing above it will
change. This is the boundary the plan calls "the web app never invents fields".

**Motion as explanation.** `motion/react` is used for list entrances (`listStagger` /
`listItem`), card movement on the board (`layout`), and exits; Radix components animate through
the CSS keyframes in `globals.css`. Durations are 150–260 ms and every entrance uses an ease-out
curve. `MotionConfig reducedMotion="user"` plus the `prefers-reduced-motion` block in CSS turn
all of it into instant swaps when the OS asks.

**Keyboard-first where it pays.** The inbox is the page used most, so `j`/`k`, `s`, `d`, `a`
and Enter work without a click (`lib/keyboard.ts`). Chords like `g i` jump between pages.
`⌘K`/`Ctrl K` opens the palette. Shortcuts are listed under Settings → Account so they are
discoverable, and every one has a visible button equivalent.

**Drag-and-drop that mirrors the state machine.** `pipeline-board.tsx` reads `ALLOWED` from
`lib/stages.ts` to tint legal and illegal drop targets while a card is in the air, and refuses
an illegal drop with a toast that names the allowed stages. The server would refuse it too; the
client copy is for feedback speed, not authority.

**Radix `Select` cannot hold an empty string.** "All sources" wanted `''` as its value; Radix
throws on that. `ui/select.tsx` maps `''` to a sentinel on the way in and back on the way out,
so callers keep using `''` for "no filter".

**`asChild` and loading do not mix.** A `Slot` needs exactly one child. The first version of
`Button` rendered a spinner next to the children even when `asChild` was set, which crashed
every page that had a link styled as a button. `Button` now branches: `asChild` renders the
`Slot` with children only, and the spinner belongs to the real `<button>` path.

## Array and object work in this step

```ts
items: data.items.filter((match) => match.id !== id),
total: Math.max(0, data.total - 1),
```

Optimistic dismiss: `filter` returns a new array without the dismissed match; the spread around
it (`{ ...data, items, total }`) makes a new page object so React sees a change.

```ts
const snapshots = queryClient.getQueriesData<Paginated<Match>>({ queryKey: ['matches'] });
for (const [key, data] of snapshots) { … }
```

`getQueriesData` returns an array of `[queryKey, data]` pairs — one per cached page and filter
combination. Destructuring `[key, data]` in the loop names the two halves.

```ts
const byStage = (stage: Stage) => items.filter((item) => item.stage === stage);
```

The board calls this once per column. Seven applications, six columns, forty-two comparisons; not
worth memoising.

```ts
const max = Math.max(1, ...ACTIVE_STAGES.map((stage) => stats.byStage[stage]));
```

`map` turns the four stage names into four counts; the spread hands them to `Math.max` as
separate arguments; the leading `1` stops an empty pipeline dividing by zero.

```ts
const shown = reasons.slice(0, limit);
const rest = reasons.length - shown.length;
```

`slice` copies the first `limit` reasons; the remainder becomes a `+N` chip whose tooltip lists
the rest.

```ts
...(form.url.trim() ? { url: form.url.trim() } : {}),
```

The add dialog only sends fields the user filled. Spreading `{}` adds nothing; spreading
`{ url }` adds one key. The API's `whitelist: true` would drop unknown keys anyway, but empty
strings would fail `@IsUrl`, so they are never sent.

## Gotchas

- **Two ways to translate.** Tailwind 4 centres a dialog with the `translate` property; the first
  dialog keyframes also set `transform: translate(-50%, -50%)`. The two compose, so every dialog
  sat a full width off-centre. Keyframes now animate opacity and `scale` only; centring belongs
  to the utility class alone.
- **HN entity-encodes `href`.** `https:&#x2F;&#x2F;…` looked fine in the database and produced
  `Apply on &` in the UI. The v1 parser never decoded attribute values; it does now, a fixture
  covers it, and a data migration repaired the stored rows. The UI helper `hostOf` also refuses
  anything that does not look like a hostname and falls back to "Open apply link".

- **`next/font/google` fetches at build time.** The production build needs network access the
  first time; the fonts are then self-hosted. Offline builds fail at that step with a clear error.
- **Search-param state on the pipeline.** `?open=<id>` and `?new=1` live in the URL so the
  command palette and toasts can deep-link into a sheet, and a refresh keeps it open.
  `useSearchParams` requires a `Suspense` boundary, hence `PipelineInner`.
- **Full-page screenshots put the fixed bottom tab bar mid-page.** Not a bug; a capture artefact.
- **Recharts and zero-height bars.** `minPointSize` above zero draws a stub for empty weeks that
  reads as a dashed line. It is `0` now and the chart gets a real baseline rule instead.
- **`Array#toReversed` / `toSorted`.** The lint config prefers the non-mutating versions; both
  exist in Node 22 and evergreen browsers, and the TypeScript target already includes them.
- **Tab order inside `Tabs`.** Radix focuses the active trigger; content panels need
  `outline-none` or they show a focus ring the moment a tab is picked.
