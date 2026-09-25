---
name: Reel
description: A working notebook for a job search — ink grounds, one brass accent, hairline rules, monospace measurement.
colors:
  canvas: '#09090b'
  surface: '#141418'
  surface-2: '#1c1c21'
  surface-3: '#26262c'
  line: '#34343d'
  line-strong: '#4a4a55'
  fg: '#ece9e4'
  fg-muted: '#c2bcb3'
  fg-faint: '#9c968d'
  accent: '#c9a56e'
  accent-strong: '#e0bf86'
  accent-soft: 'rgba(201, 165, 110, 0.14)'
  accent-fg: '#0c0c0f'
  danger: '#d0756d'
  danger-soft: 'rgba(208, 117, 109, 0.14)'
  success: '#7fb27a'
  success-soft: 'rgba(127, 178, 122, 0.14)'
  info: '#8ab4d8'
  info-soft: 'rgba(138, 180, 216, 0.14)'
  warning: '#e6893f'
  stage-saved: '#c2bcb3'
  stage-applied: '#c9a56e'
  stage-interviewing: '#8ab4d8'
  stage-offer: '#7fb27a'
  stage-rejected: '#d0756d'
  stage-withdrawn: '#9c968d'
typography:
  display:
    fontFamily: 'Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif'
    fontSize: '40px'
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: '-0.03em'
  headline-lg:
    fontFamily: 'Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif'
    fontSize: '32px'
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: '-0.025em'
  headline:
    fontFamily: 'Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif'
    fontSize: '28px'
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: '-0.025em'
  title:
    fontFamily: 'Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif'
    fontSize: '20px'
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: '-0.02em'
  title-sm:
    fontFamily: 'Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif'
    fontSize: '18px'
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: '-0.015em'
  body:
    fontFamily: 'Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif'
    fontSize: '16px'
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 'normal'
  body-sm:
    fontFamily: 'Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif'
    fontSize: '15px'
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 'normal'
  caption:
    fontFamily: 'Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif'
    fontSize: '14px'
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 'normal'
  fine:
    fontFamily: 'Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif'
    fontSize: '13px'
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 'normal'
  measure:
    fontFamily: 'Fragment Mono, ui-monospace, SF Mono, Menlo, Consolas, monospace'
    fontSize: '15px'
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 'normal'
    fontVariation: 'tabular-nums'
  measure-sm:
    fontFamily: 'Fragment Mono, ui-monospace, SF Mono, Menlo, Consolas, monospace'
    fontSize: '13px'
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 'normal'
    fontVariation: 'tabular-nums'
  stamp:
    fontFamily: 'Fragment Mono, ui-monospace, SF Mono, Menlo, Consolas, monospace'
    fontSize: '12px'
    fontWeight: 400
    lineHeight: 1
    letterSpacing: '0.12em'
  wordmark:
    fontFamily: 'Fragment Mono, ui-monospace, SF Mono, Menlo, Consolas, monospace'
    fontSize: '14px'
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: '0.32em'
rounded:
  stamp: '3px'
  sm: '4px'
  md: '6px'
  lg: '10px'
  full: '9999px'
spacing:
  2xs: '2px'
  xs: '4px'
  sm: '8px'
  md: '12px'
  lg: '16px'
  xl: '20px'
  2xl: '24px'
  3xl: '32px'
  4xl: '40px'
components:
  button-primary:
    backgroundColor: '{colors.accent}'
    textColor: '{colors.accent-fg}'
    typography: '{typography.body}'
    rounded: '{rounded.md}'
    padding: '0 14px'
    height: '40px'
  button-primary-hover:
    backgroundColor: '{colors.accent-strong}'
    textColor: '{colors.accent-fg}'
  button-secondary:
    backgroundColor: '{colors.surface-2}'
    textColor: '{colors.fg}'
    typography: '{typography.body}'
    rounded: '{rounded.md}'
    padding: '0 14px'
    height: '40px'
  button-secondary-hover:
    backgroundColor: '{colors.surface-3}'
    textColor: '{colors.fg}'
  button-ghost:
    backgroundColor: 'transparent'
    textColor: '{colors.fg-muted}'
    typography: '{typography.body}'
    rounded: '{rounded.md}'
    padding: '0 14px'
    height: '40px'
  button-ghost-hover:
    backgroundColor: '{colors.surface-3}'
    textColor: '{colors.fg}'
  button-outline:
    backgroundColor: 'transparent'
    textColor: '{colors.fg}'
    typography: '{typography.body}'
    rounded: '{rounded.md}'
    padding: '0 14px'
    height: '40px'
  button-danger:
    backgroundColor: 'transparent'
    textColor: '{colors.danger}'
    typography: '{typography.body}'
    rounded: '{rounded.md}'
    padding: '0 14px'
    height: '40px'
  button-danger-hover:
    backgroundColor: '{colors.danger-soft}'
    textColor: '{colors.danger}'
  button-lg:
    typography: '{typography.body}'
    rounded: '{rounded.md}'
    padding: '0 16px'
    height: '44px'
  button-sm:
    typography: '{typography.caption}'
    rounded: '{rounded.md}'
    padding: '0 12px'
    height: '32px'
  button-xs:
    typography: '{typography.fine}'
    rounded: '{rounded.sm}'
    padding: '0 8px'
    height: '28px'
  input:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.fg}'
    typography: '{typography.body}'
    rounded: '{rounded.md}'
    padding: '0 12px'
    height: '40px'
  badge-neutral:
    backgroundColor: '{colors.surface-2}'
    textColor: '{colors.fg-muted}'
    typography: '{typography.fine}'
    rounded: '{rounded.sm}'
    padding: '4px 8px'
  badge-accent:
    backgroundColor: '{colors.accent-soft}'
    textColor: '{colors.accent}'
    typography: '{typography.fine}'
    rounded: '{rounded.sm}'
    padding: '4px 8px'
  badge-solid:
    backgroundColor: '{colors.fg}'
    textColor: '{colors.canvas}'
    typography: '{typography.fine}'
    rounded: '{rounded.sm}'
    padding: '4px 8px'
  score-badge-high:
    backgroundColor: '{colors.accent}'
    textColor: '{colors.accent-fg}'
    typography: '{typography.measure}'
    rounded: '{rounded.sm}'
    padding: '0 8px'
    height: '36px'
    width: '48px'
  score-badge-mid:
    backgroundColor: '{colors.accent-soft}'
    textColor: '{colors.accent}'
    typography: '{typography.measure}'
    rounded: '{rounded.sm}'
    padding: '0 8px'
    height: '36px'
    width: '48px'
  score-badge-low:
    backgroundColor: '{colors.surface-2}'
    textColor: '{colors.fg-muted}'
    typography: '{typography.measure}'
    rounded: '{rounded.sm}'
    padding: '0 8px'
    height: '36px'
    width: '48px'
  stage-stamp:
    backgroundColor: 'transparent'
    typography: '{typography.stamp}'
    rounded: '{rounded.stamp}'
    padding: '0 8px'
    height: '24px'
  source-badge:
    backgroundColor: '{colors.surface-2}'
    textColor: '{colors.fg-muted}'
    typography: '{typography.stamp}'
    rounded: '{rounded.sm}'
    padding: '0 8px'
    height: '24px'
  kbd:
    backgroundColor: '{colors.surface-2}'
    textColor: '{colors.fg-faint}'
    typography: '{typography.stamp}'
    rounded: '{rounded.sm}'
    padding: '0 6px'
    height: '24px'
    width: '24px'
  card:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.fg}'
    rounded: '{rounded.md}'
    padding: '16px'
  panel:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.fg}'
    rounded: '{rounded.lg}'
    padding: '20px'
  popover:
    backgroundColor: '{colors.surface-2}'
    textColor: '{colors.fg}'
    rounded: '{rounded.md}'
    padding: '4px'
  nav-item:
    backgroundColor: 'transparent'
    textColor: '{colors.fg-muted}'
    typography: '{typography.body}'
    rounded: '{rounded.md}'
    padding: '0 12px'
    height: '44px'
  nav-item-active:
    backgroundColor: '{colors.surface-3}'
    textColor: '{colors.fg}'
    typography: '{typography.body}'
    rounded: '{rounded.md}'
    padding: '0 12px'
    height: '44px'
---

# Design System: Reel

## Overview

**Creative North Star: "The Field Notebook"**

Reel is a record you keep, not a dashboard you glance at. Every screen is a page of a working
notebook: the pipeline is a wall of index cards each carrying a stage stamp, history is a dated
log, the inbox is a triage desk where one item is in focus and the next is one keystroke away.
The grounds are ink (near-black by default, warm paper in the light theme), the writing is one
workhorse grotesk, and everything that is a measurement — a score, a count, a date, a keyboard
hint, the wordmark — is set in a monospace face so the eye can tell a number from a sentence
before it reads either.

Brass is the only accent and it is spent carefully: the current selection, the primary action,
the focus ring, the caret, the text selection, the stamps and the wordmark. Everything else
separates by space and by a hairline rule; boxes appear only when a group of things needs a
name (a panel, a card). Colour beyond brass is semantic and reused: the six stage tones are the
same four semantic tones plus two greys, so a stamp, a funnel bar and a status dot all agree.

Density is a property of the layout, not of the type. The page keeps its notebook structure
and its hairline separation, but the type is set at a size that reads at arm's length (16px
body, 12px stamps as the floor) and the controls are sized to be hit (40px by default). The
build refuses the category's arrangement of metric tiles over a grid of identical cards. It
also refuses decorative motion: transitions are short (150–260ms), ease out, and vanish entirely
under `prefers-reduced-motion`.

**Key Characteristics:**

- Ink grounds in four steps (canvas, surface, surface-2, surface-3) with two hairline tones; dark is the default and the light theme swaps the same tokens.
- One brass accent, one purpose at a time: selection, primary action, focus, stamps, wordmark.
- Hairline rules and dividers before borders; borders before shadows; shadows only for lift (hover, popover, dialog, drag).
- Two faces with strict jobs: Schibsted Grotesk for words, Fragment Mono for measurements and stamps.
- Stage stamps are outlined, letterspaced monospace caps in the stage's tone; never solid-filled.
- Density of a tool used in flow, set at a size that reads: 16px body, 40px controls, 16px card padding, 20px panel padding, nothing below 12px.

## Colors

A near-monochrome ink ground with a muted brass accent and four semantic tones, each paired with a 14%-alpha tint; the light theme (`[data-theme='light']`) keeps every role and darkens the tones for contrast on paper. Secondary text is lighter than it was, not smaller: `fg-muted` and `fg-faint` both clear WCAG AA on every ground in both themes. The frontmatter carries the dark values, which are the default; light values are recorded in `.impeccable/design.json`.

### Primary

- **Brass** (`accent`): the single accent. Primary button fill, the active nav item's icon, links inside the dashboard "today" sentence, the wordmark, the caret, text selection, the focus ring, the scrollbar thumb at 40%, the current-week label in the activity strip, the funnel bar of a stage with something due. `accent-strong` is the hover fill for the primary button; `accent-soft` is the 14% tint behind selected chips, the legal drop target and the account avatar disc; `accent-fg` is the ink used for text on a brass fill.

### Neutral

- **Canvas** (`canvas`): the page ground behind everything; also the sticky header at 85% with backdrop blur.
- **Surface** (`surface`): the sidebar, panels, cards, inputs, the header's search trigger, sheets and dialogs. One step above canvas.
- **Surface 2** (`surface-2`): secondary button fill, badges, kbd, popovers (menus, selects, tooltips), the focused inbox row, the postings table header, nav hover.
- **Surface 3** (`surface-3`): the active nav item, the selected settings tab, highlighted menu and palette rows, the chart hover cursor, the tab count pill, ghost-button hover.
- **Line** (`line`): every hairline rule, divider and default border. `line-strong` is the hover border on cards, inputs and secondary buttons, the pipeline column header rule, the switch track edge, and the dashed border of empty states at 70%.
- **Ink** (`fg`): headings, primary text, the company name on a row or card. `fg-muted` is body copy on cards and ledes, roles and headlines, labels, nav at rest, badge text, list metadata and relative dates. `fg-faint` is reserved for genuinely tertiary text: timestamps, hints, kbd, placeholders, inactive bottom-tab labels, the account footer line.

### Semantic

- **Danger** (`danger`, `danger-soft`): the danger button, error banners (40% border on the soft tint), destructive menu items, the illegal drop target, failed source runs, the REJECTED stage.
- **Success** (`success`, `success-soft`): healthy source runs, the OFFER stage, salary badges in the inbox.
- **Info** (`info`, `info-soft`): running source runs, next-step dates on cards, the INTERVIEWING stage, the second radial in `surface-noise`.
- **Warning** (`warning`): a burnt orange, deliberately far from the brass hue so a nag never reads as a highlight; a stale application's day-count (APPLIED for 7+ days) and the "Unsaved changes" note. A `warning-soft` tint is declared but nothing uses it; warning is never a fill.

### Stage tones

- `stage-saved` = `fg-muted`; `stage-applied` = `accent`; `stage-interviewing` = `info`; `stage-offer` = `success`; `stage-rejected` = `danger`; `stage-withdrawn` = `fg-faint`. Used by stamps (text at 100%, border at 50–60% alpha), status dots and the pipeline column headers.

### Named Rules

**The One Brass Rule.** Brass marks exactly one thing per view as current or primary: the active nav item's icon, the focused row's action, the primary button. It never fills a card, a panel or a chart background. If two things are brass, one of them is wrong.

**The Stage Tone Rule.** Stage colours are aliases of the semantic ramp, not new hues. A new status colour must map to one of the six existing tones.

**The Soft-Tint Rule.** Tints are the tone at 14% alpha (12% in light) and are always paired with a border of the same tone at 40–60% alpha. A tint is never used alone as a fill without its border, and a border tone never appears without its meaning (accent = selected or legal, danger = error or illegal).

**The Lighter-Not-Smaller Rule.** Secondary text steps down in tone (`fg` → `fg-muted` → `fg-faint`), not in size. Metadata that must be read (a date, a role, a location) is `fg-muted` at `caption` or above; `fg-faint` is for text the eye may skip.

## Typography

**Display / Body Font:** Schibsted Grotesk (with ui-sans-serif, system-ui, sans-serif)
**Label / Mono Font:** Fragment Mono, weight 400 only (with ui-monospace, SF Mono, Menlo, Consolas, monospace)

**Character:** A narrow-capped grotesk with good numerals does all the talking at 13–40px in three weights (400, 500, 600); the mono face never speaks in sentences. It stamps, counts and dates. Every size in the app is one of eleven named tokens (`text-stamp` through `text-display`, plus `text-measure` and `text-measure-sm`); there are no ad-hoc pixel sizes. `font-feature-settings: 'kern', 'liga', 'ss01'` is on globally; `.tabular` (tabular-nums) is applied wherever numbers align in columns.

### Hierarchy

- **Display** (600, 40px, 1.1, -0.03em): the auth panel's product sentence at `xl`. The only place it appears.
- **Headline-lg** (600, 32px, 1.2, -0.025em): the dashboard "today" sentence at `lg` (a real `h1` with brass links inline, max 36ch) and the auth panel sentence below `xl`.
- **Headline** (600, 28px, 1.2, -0.025em): page titles (`PageHeader`), the "today" sentence on phones, the auth form heading.
- **Title** (600, 20px, 1.3, -0.02em): sheet and dialog headers (application, posting, add-application); the components tighten it to -0.025em. **Title-sm** (600, 18px, 1.35, -0.015em): empty-state titles.
- **Body** (400, 16px, 1.5): the base, set on `body`. Company names on cards and rows are 16px 500; `SectionTitle` inside a panel is 16px 600 with tight tracking and a 14px faint aside. Sidebar nav, settings tabs, tab triggers, ledes, inbox detail text and the palette input are all body. Ledes max 60ch; long prose max 72ch with relaxed leading.
- **Body-sm** (400, 15px, 1.5): roles and headlines under a name, menu and select items, palette rows, dialog descriptions, the header search trigger, pagination, empty-state hints.
- **Caption** (400, 14px, 1.45): labels (14px 500 muted), card metadata, relative dates, tooltips, column hints, error text, the settings sub-nav hint, the account footer.
- **Fine** (400, 13px, 1.4): `xs` buttons, chart tooltips, funnel axis labels, the "due in" line under a date, bottom tab labels (500), menu shortcuts.
- **Measure** (mono 400, 15px, tabular): scores, funnel counts. **Measure-sm** (mono 13px, tabular): column counts, day-counts, the funnel summary line, stack keyword pills, pagination "1 / 8", dates in the "Coming up" log.
- **Stamp** (mono 400, 12px, 0.12em, uppercase, line-height 1): the `.stamp` utility and the `text-stamp` token. Stage stamps, pipeline column headers, menu and command-palette group labels, source badges, kbd, the postings table header, the header ingest state. The `md` stage stamp on a sheet header keeps the stamp's tracking at 13px.
- **Wordmark** (mono 400, 14px, 0.32em, uppercase, brass): "REEL" in the sidebar, mobile header and auth panel.

### Named Rules

**The Measurement Rule.** If it is a number, a date, a count, a keyboard key, a source name or the wordmark, it is set in Fragment Mono with tabular numerals. If it is a sentence, it is never in mono. Tooltip point values (`+30`) are mono inside a sans sentence for this reason.

**The Stamp Rule.** Any small uppercase label uses `.stamp` exactly: 12px mono, 0.12em tracking, line-height 1. There is no second small-caps style, and 12px is the floor: nothing in the app is set smaller. A sentence is never a stamp; a hint like "Sent, waiting to hear back" is a caption.

**The Three Weights Rule.** 400, 500, 600. Nothing bolder, nothing lighter; 500 marks a name (company, current page, a label), 600 marks a heading.

## Layout

The shell is a 256px sidebar (`w-64`, surface, right hairline) beside a column with a sticky 64px header (`h-16`, canvas at 85% with 12px backdrop blur, bottom hairline) and a main area. The sidebar's wordmark row is 64px with 24px side padding; nav items sit in a 16px gutter as 44px rows with 12px horizontal padding, a 12px gap to a 20px icon, and 4px between rows. The header carries the command-palette trigger as a 40px surface field (`max-w-lg`, hairline, 15px muted text, `Ctrl` `K` kbd keys), the ingest state as a stamp link at `lg`, and on the right a ghost theme toggle and an account menu whose trigger is a 24px brass-tint avatar disc plus the email in 15px.

Content is centred in a 1360px max-width column with gutters of 16px (phone), 32px (`md`) and 40px (`lg`); the main area has 32px top padding and 112px bottom padding on phones to clear the tab bar (48px from `md`). Breakpoints are Tailwind's: 640 (`sm`), 768 (`md`), 1024 (`lg`), 1280 (`xl`). Below `md` the sidebar is gone and the five tabs become a fixed bottom bar (surface at 95%, blur, safe-area padding, 22px icons over 13px 500 labels, brass when active). Sheets are bottom-anchored at 92dvh with rounded top corners below `sm`, and a right-anchored full-height panel (`max-w-lg` or `max-w-2xl`) from `sm` up; dialogs are `calc(100vw - 2rem)` wide up to `max-w-sm` / `max-w-lg` / `max-w-2xl`.

Pages open with a `PageHeader` (headline plus a 16px muted lede, actions aligned to the baseline on the right, 32px below). The dashboard opens with the "today" block (sentence, then three `md` buttons 20px below) and 40px under it a `minmax(0,1.25fr) minmax(0,1fr)` two-column grid at `lg` with 16px gaps, stacking on phones; the left column carries the funnel, the activity strip and the source health list, the right column the "Coming up" log capped at six rows; panels stack at 16px. The funnel is a `9.5rem 1fr 3rem` grid of 12px-tall rows: stamp, hairline bar, mono count. The settings page uses a `210px 1fr` grid at `lg` with a 32px gap; sub-nav items are body text with a caption hint beneath, wrapping into a two-row strip below `lg`. The pipeline is a horizontal, snap-mandatory row of 288px columns (320px at `sm`) with 16px gaps that bleeds to the gutters; from `lg` the open columns share the page column equally with a 256px floor so four stages fit at 1440; cards stack at 10px; closed stages collapse into 48px vertical-stamp rails at the right edge. The inbox is a single bordered list (`rounded-lg`, surface) of hairline-divided rows in an `auto 1fr auto` grid with 16px padding all round; the focused row is surface-2 and expands a detail block (hairline at 70%, indented 80px at `sm`, prose max 72ch). The postings table has a stamp header row on surface-2 (16px × 10px) and 16px × 14px rows.

Spacing is a 4px grid. The rhythm actually used: 2px inside the segmented tray, 4px between kbd keys and under a title, 6px between chips and above a label's field, 8px between controls and between rows in a stack, 10px between pipeline cards and above card metadata, 12px inside buttons and around nav icons, 16px card padding, list-row padding and grid gaps, 20px panel padding and sheet / dialog vertical padding, 24px sheet / dialog horizontal padding, 32px under the page header and between settings columns, 40px under the "today" block and above the account footer.

## Elevation & Depth

Depth is tonal first, shadow second. The four ink steps (canvas → surface → surface-2 → surface-3) carry most of the layering: a panel is surface on canvas; a popover is surface-2 on surface; the active item is surface-3. Hairlines do the separating. Shadows exist in three sizes and mark lift, not membership: a card and the primary button carry `shadow-sm` at rest; hover lifts a card to `shadow-md`; popovers, menus, selects and tooltips sit at `shadow-md`; dialogs, sheets, the command palette and the dragged card overlay sit at `shadow-lg`. Shadows are pure black at high alpha in the dark theme and a warm brown (`rgba(40, 30, 10, …)`) at low alpha in light, so they read as the same lift on both grounds.

Overlays are canvas at 60–70% with a 1.5–2px backdrop blur. The only gradient in the system is `.surface-noise`: two large radial washes of `accent-soft` and `info-soft` behind the auth panel copy.

### Shadow Vocabulary

- **Rest** (`--shadow-sm`: `0 1px 2px rgba(0,0,0,0.5)`): cards at rest, the primary button, the "on" segment, the switch thumb.
- **Lift** (`--shadow-md`: `0 8px 24px -8px rgba(0,0,0,0.65), 0 2px 6px rgba(0,0,0,0.35)`): hovered cards, menus, selects, tooltips, chart tooltips.
- **Float** (`--shadow-lg`: `0 24px 48px -16px rgba(0,0,0,0.75), 0 4px 12px rgba(0,0,0,0.4)`): dialogs, sheets, the command palette, the drag overlay (which also rotates 1.5° and takes a 60% brass border).

### Named Rules

**The Hairline-First Rule.** Separate with a `line` rule or `divide-y` before drawing a border; draw a border before casting a shadow. A list of rows is never a stack of cards.

**The Lift-Only Rule.** `shadow-md` and `shadow-lg` appear only on something that is above the page (hover, popover, dialog, drag). Nothing at rest exceeds `shadow-sm`.

## Shapes

Corners are small and stepped: 3px on stamps and funnel bar tops, 4px on badges, kbd, chips, stack keyword pills, select and menu items, segmented items and `xs` buttons, 6px on buttons, inputs, cards, nav items, popovers and pipeline columns, 10px on panels, dialogs, sheets, the command palette, bordered lists and empty states, and full round on the switch, status dots and the avatar disc. Radius grows with the size of the thing, but nothing exceeds 10px and nothing is pill-shaped except toggles and dots.

Borders are 1px hairlines in `line` at rest and `line-strong` on hover. Dashed hairlines mean "not yet": empty states, the empty column drop zone, and the `via` badge on a manually added application. Toned borders at 40–60% alpha appear only together with their tint (see The Soft-Tint Rule). The current item is marked by tone, not by a bar: the active nav item sits on surface-3 with its icon turned brass, the focused inbox row sits on surface-2, the "on" segment lifts to surface.

## Components

### Buttons

- **Shape:** softly squared (6px); 4px at `xs`. Heights 28 (`xs`, 13px text), 32 (`sm`, 14px), 40 (`md`, 16px, the default), 44 (`lg`, 16px); icon buttons are 32 (`icon-sm`) or 36 (`icon`) square. Weight 500, 8px gap (6px at `xs`), 16px icons; `md` and `lg` are the page-level actions, `sm` is the row-level action.
- **Primary:** brass fill, ink text, `shadow-sm`; hover to `accent-strong`; active drops the shadow. One per view.
- **Secondary (default):** surface-2 fill with a `line` border; hover raises the border to `line-strong` and the fill to surface-3.
- **Ghost:** transparent, muted text; hover to ink on surface-3. Used for icon buttons, tertiary actions and pagination.
- **Outline:** `line` border, no fill; hover to `line-strong` on surface-2.
- **Danger:** danger text on a `line` border; hover to a 60% danger border on `danger-soft`.
- **Link:** brass text, underline on hover, no height or padding.
- **States:** all buttons scale to 98% on press, transition background, border, colour, transform and shadow over 150ms ease-out, sit at 50% opacity when disabled, and show a 16px spinner when loading. Focus is the global 2px brass outline at 2px offset.

### Chips

- **Badge:** mono 13px, 4px corners, 4px × 8px padding, 1px border, 6px internal gap. Tones: neutral (surface-2, muted text, `line` border), outline (transparent), accent / success / danger / info (soft tint, 40% tone border, tone text), solid (ink fill, canvas text). An active filter chip stretches to 32px tall with 14px text.
- **Reason chips:** every reason is a neutral badge, including `role:`, so the score badge is the only brass in an inbox row; overflow is an outline badge reading `+n`. Each carries a tooltip with the mono point value and a one-sentence rule.
- **Score badge:** mono 15px 500, tabular, 36px tall, min 48px wide, 4px corners. 80 and above is a solid brass fill with ink text; 60–79 is brass text on the brass tint with a 50% brass border; below 60 is muted on surface-2.

### Stage stamp

An outline, never a fill: 24px tall with 8px side padding (28px and 10px at `md`, where the text grows to 13px), 3px corners, 1px border in the stage tone at 50–60% alpha, `.stamp` text in the stage tone. `StageDot` is the 8px round companion for logs, lists and the palette. Pipeline column headers set the stage name in `.stamp` and the stage tone without the border; a collapsed column turns it vertical.

### Source badge

24px, 4px corners, surface-2 fill, `line` border, `.stamp` text (12px mono, 0.12em, uppercase) in muted, 8px side padding; when it links out it gains a 12px external-link glyph, a `line-strong` hover border, ink text on hover and a tooltip carrying the source attribution.

### Cards / Containers

- **Application card:** surface, 6px corners, `line` border, 16px padding, `shadow-sm`; hover to `line-strong` and `shadow-md`. Company 16px 500, role 15px muted, location and salary 14px muted with 16px icons, then a hairline and a 14px footer row of mono day-count (faint; warning tone when stale), brass bell date, info calendar date. Dragging leaves the original at 30% and the overlay rotated 1.5° with a 60% brass border and `shadow-lg`.
- **Panel:** surface, 10px corners, `line` border, 20px padding; opens with a `SectionTitle` 16px below. Lists inside a panel use `divide-y divide-line`, never nested cards; rows are 12px tall in padding and hover to surface-2 with a 6px corner.
- **Pipeline column:** unboxed at rest: 6px corners, no fill, a `line-strong` hairline under a 12px-tall header carrying the stamp, mono count and a 14px muted hint at `xl`; cards stack below at 10px. A legal drop fills it `accent-soft` with a 60% brass ring; an illegal one fills `danger-soft` with a danger ring; columns that cannot receive the dragged card dim to 60%. The empty column is a dashed `line` box with 14px muted text.
- **Empty state:** dashed `line-strong` at 70%, 10px corners, centred, 24px × 56px padding (16px × 32px compact); a 40px icon tile (surface-2, `line` border, faint 20px glyph), 18px 600 title, 15px muted hint with relaxed leading, then actions 16px below.
- **Error state:** 40% danger border on `danger-soft`, 6px corners, 16px × 12px padding, 16px text, a 20px danger triangle and an outline `sm` "Try again".

### Inputs / Fields

- **Style:** surface fill, `line` border, 6px corners, 40px tall, 12px horizontal padding, 16px ink text, faint placeholder, no shadow. Textareas are 112px minimum with 10px vertical padding and relaxed leading. Selects share the trigger style with a 16px faint chevron; the `sm` size is 36px with 15px text.
- **Hover / Focus:** hover to `line-strong`; focus to a brass border plus a 2px ring of brass at 25%. Invalid fields take a danger border and a danger ring.
- **Label:** 14px 500 muted, 6px above the control, with an optional faint hint right-aligned on the same baseline; errors are 14px danger with `role="alert"` 4px below.
- **Switch:** 44 × 24 pill, surface-3 track with a `line-strong` edge, 16px ink thumb with `shadow-sm`; checked is a brass track with an ink thumb translated 24px.
- **Segmented:** a surface-2 tray (6px corners, 2px padding, `line` border) of 32px items with 12px side padding and 14px text (36px, 16px padding and 16px text at `md`); the "on" item is surface with `shadow-sm` and ink text; counts are mono 13px faint.
- **Tabs:** a hairline underline row; triggers are 44px, 16px muted, with a 2px brass bottom border and ink text when active; counts sit in a surface-3 mono 13px pill.

### Navigation

- **Sidebar:** 256px surface with a right hairline; wordmark row 64px; items are 44px, 16px, 6px corners, 20px lucide icon, 12px gap; at rest muted with faint icons, hover surface-2 with ink text, active surface-3 with ink text and a brass icon.
- **Header:** 64px, canvas at 85% with blur; the command-palette trigger as a 40px surface field with `Ctrl` `K` kbd keys from `md`; the ingest state as a `.stamp` link with a 8px status dot at `lg`; on the right a ghost theme toggle and an account menu whose trigger is a 24px brass-tint avatar disc plus the email in 15px.
- **Bottom tab bar (below `md`):** fixed, surface at 95% with blur, five equal columns, 22px icon over a 13px 500 label, brass when active, faint otherwise.
- **Settings sub-nav:** 210px column at `lg`; items are body text with 16px × 10px padding and 6px corners, a 14px muted hint beneath at `lg`, surface-3 with ink text when current, surface-2 on hover.
- **Menus and popovers:** surface-2, `line` border, 6px corners, 4px padding, `shadow-md`; items are 15px with 4px corners and 10px × 8px padding, surface-3 when highlighted, brass check marks; group labels use `.stamp` in faint; shortcuts are mono 13px faint; separators are 1px `line`.

### Command palette

A dialog (`max-w-xl`, 10px corners, `shadow-lg`) with a hairline search row (20px brass sparkle icon, 56px transparent 16px input, an `Esc` kbd), a list padded 6px with `.stamp` group headings in faint, 15px rows with 10px gaps and 12px × 8px padding that highlight to surface-3, and kbd hints on the right.

### Kbd

24px tall, min 24px wide, 4px corners, surface-2 fill, `line` border, 6px side padding, `.stamp` text (12px mono) in faint. Always shown beside a label or in a key sequence, never as decoration.

### Motion

Every transition is `ease-out-quint` (`cubic-bezier(0.23, 1, 0.32, 1)`) unless it moves position, which uses `ease-in-out-quart` (`cubic-bezier(0.77, 0, 0.175, 1)`). State changes are 150ms; list rows enter with a 5px rise over 220ms staggered 30ms and leave 24px to the right over 180ms; popovers pop in over 160ms; dialogs scale from 97% over 220ms; sheets slide 24px (32px from the bottom) over 260ms; the inbox detail block opens over 220ms; funnel bars grow over 500ms staggered 50ms. Exits are always shorter than entries (120–180ms). Skeletons shimmer between surface-2 and surface-3 over 1.6s linear. `prefers-reduced-motion` collapses every animation and transition to 0.01ms and stops the shimmer.

## Do's and Don'ts

### Do:

- **Do** set every number, date, count, shortcut and source name in Fragment Mono with `.tabular`; keep Schibsted Grotesk for words.
- **Do** mark the current item by tone: surface-3 with a brass icon in the sidebar, surface-2 for the focused inbox row, surface for the "on" segment.
- **Do** separate rows with `divide-y divide-line` inside one `Panel` or one bordered list; reserve cards for things that move (pipeline applications).
- **Do** keep stamps as outlines in the stage tone (border at 50–60%, text at 100%) with `.stamp` type and 3px corners.
- **Do** use a dashed `line` border to mean "nothing here yet" or "entered by hand", and a toned border only together with its 14% tint.
- **Do** stay at 400 / 500 / 600 and the named ramp (40, 32, 28, 20, 18, 16, 15, 14, 13, 12); 40px controls and 16px card / 20px panel padding.
- **Do** step secondary text down in tone, not in size: `fg-muted` for metadata that must be read, `fg-faint` only for timestamps, hints, kbd and placeholders.
- **Do** end every animation under 300ms with `ease-out-quint`, and let `prefers-reduced-motion` remove it.

### Don't:

- **Don't** put brass on more than one element per view as a fill; brass text is for the current link, the wordmark and the stamp, never for body copy.
- **Don't** introduce a hue outside brass, danger, success, info and warning; a new status must alias one of the six stage tones.
- **Don't** fill a stamp, chip or column with a solid tone. Solid brass belongs to the primary button and the 80+ score badge only; solid ink belongs to the `solid` badge.
- **Don't** cast `shadow-md` or `shadow-lg` on anything at rest; lift is for hover, popovers, dialogs and drag.
- **Don't** arrange the page as metric tiles over a card grid, and don't use gradients outside `.surface-noise` on the auth panel.
- **Don't** set prose in the mono face or use it above 15px except the 14px wordmark; don't add a second small-caps style beside `.stamp`, and don't set a sentence as a stamp.
- **Don't** write an arbitrary `text-[Npx]` size or go below 12px; every size is one of the named tokens.
- **Don't** exceed 10px corners or make anything pill-shaped except the switch, status dots and the avatar disc.
