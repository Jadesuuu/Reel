---
name: Reel
description: A working notebook for a job search — ink grounds, one brass accent, hairline rules, monospace measurement.
colors:
  canvas: '#08080a'
  surface: '#0c0c0f'
  surface-2: '#121216'
  surface-3: '#18181d'
  line: '#22222a'
  line-strong: '#33333d'
  fg: '#ece9e4'
  fg-muted: '#b3ada4'
  fg-faint: '#85807a'
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
  warning: '#d9a86c'
  stage-saved: '#b3ada4'
  stage-applied: '#c9a56e'
  stage-interviewing: '#8ab4d8'
  stage-offer: '#7fb27a'
  stage-rejected: '#d0756d'
  stage-withdrawn: '#85807a'
typography:
  display:
    fontFamily: 'Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif'
    fontSize: '34px'
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: '-0.025em'
  headline:
    fontFamily: 'Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif'
    fontSize: '22px'
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: '-0.025em'
  title:
    fontFamily: 'Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif'
    fontSize: '17px'
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: '-0.025em'
  title-sm:
    fontFamily: 'Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif'
    fontSize: '15px'
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: '-0.025em'
  section:
    fontFamily: 'Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif'
    fontSize: '13px'
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: '-0.025em'
  body:
    fontFamily: 'Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif'
    fontSize: '14px'
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 'normal'
  body-sm:
    fontFamily: 'Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif'
    fontSize: '13px'
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 'normal'
  caption:
    fontFamily: 'Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif'
    fontSize: '12px'
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 'normal'
  fine:
    fontFamily: 'Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif'
    fontSize: '11px'
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 'normal'
  measure:
    fontFamily: 'Fragment Mono, ui-monospace, SF Mono, Menlo, Consolas, monospace'
    fontSize: '13px'
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 'normal'
    fontVariation: 'tabular-nums'
  measure-sm:
    fontFamily: 'Fragment Mono, ui-monospace, SF Mono, Menlo, Consolas, monospace'
    fontSize: '11px'
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 'normal'
    fontVariation: 'tabular-nums'
  stamp:
    fontFamily: 'Fragment Mono, ui-monospace, SF Mono, Menlo, Consolas, monospace'
    fontSize: '10.5px'
    fontWeight: 400
    lineHeight: 1
    letterSpacing: '0.14em'
  wordmark:
    fontFamily: 'Fragment Mono, ui-monospace, SF Mono, Menlo, Consolas, monospace'
    fontSize: '12px'
    fontWeight: 400
    lineHeight: 1
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
  xl: '24px'
  2xl: '32px'
components:
  button-primary:
    backgroundColor: '{colors.accent}'
    textColor: '{colors.accent-fg}'
    typography: '{typography.body}'
    rounded: '{rounded.md}'
    padding: '0 14px'
    height: '36px'
  button-primary-hover:
    backgroundColor: '{colors.accent-strong}'
    textColor: '{colors.accent-fg}'
  button-secondary:
    backgroundColor: '{colors.surface-2}'
    textColor: '{colors.fg}'
    typography: '{typography.body}'
    rounded: '{rounded.md}'
    padding: '0 14px'
    height: '36px'
  button-secondary-hover:
    backgroundColor: '{colors.surface-3}'
    textColor: '{colors.fg}'
  button-ghost:
    backgroundColor: 'transparent'
    textColor: '{colors.fg-muted}'
    typography: '{typography.body}'
    rounded: '{rounded.md}'
    padding: '0 14px'
    height: '36px'
  button-ghost-hover:
    backgroundColor: '{colors.surface-3}'
    textColor: '{colors.fg}'
  button-outline:
    backgroundColor: 'transparent'
    textColor: '{colors.fg}'
    typography: '{typography.body}'
    rounded: '{rounded.md}'
    padding: '0 14px'
    height: '36px'
  button-danger:
    backgroundColor: 'transparent'
    textColor: '{colors.danger}'
    typography: '{typography.body}'
    rounded: '{rounded.md}'
    padding: '0 14px'
    height: '36px'
  button-danger-hover:
    backgroundColor: '{colors.danger-soft}'
    textColor: '{colors.danger}'
  button-sm:
    typography: '{typography.caption}'
    rounded: '{rounded.md}'
    padding: '0 10px'
    height: '28px'
  button-xs:
    typography: '{typography.fine}'
    rounded: '{rounded.sm}'
    padding: '0 8px'
    height: '24px'
  input:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.fg}'
    typography: '{typography.body}'
    rounded: '{rounded.md}'
    padding: '0 10px'
    height: '36px'
  badge-neutral:
    backgroundColor: '{colors.surface-2}'
    textColor: '{colors.fg-muted}'
    typography: '{typography.measure-sm}'
    rounded: '{rounded.sm}'
    padding: '2px 6px'
  badge-accent:
    backgroundColor: '{colors.accent-soft}'
    textColor: '{colors.accent}'
    typography: '{typography.measure-sm}'
    rounded: '{rounded.sm}'
    padding: '2px 6px'
  badge-solid:
    backgroundColor: '{colors.fg}'
    textColor: '{colors.canvas}'
    typography: '{typography.measure-sm}'
    rounded: '{rounded.sm}'
    padding: '2px 6px'
  score-badge-high:
    backgroundColor: '{colors.accent}'
    textColor: '{colors.accent-fg}'
    typography: '{typography.measure}'
    rounded: '{rounded.sm}'
    padding: '0 6px'
    height: '28px'
    width: '40px'
  score-badge-mid:
    backgroundColor: '{colors.accent-soft}'
    textColor: '{colors.accent}'
    typography: '{typography.measure}'
    rounded: '{rounded.sm}'
    padding: '0 6px'
    height: '28px'
    width: '40px'
  score-badge-low:
    backgroundColor: '{colors.surface-2}'
    textColor: '{colors.fg-muted}'
    typography: '{typography.measure}'
    rounded: '{rounded.sm}'
    padding: '0 6px'
    height: '28px'
    width: '40px'
  stage-stamp:
    backgroundColor: 'transparent'
    typography: '{typography.stamp}'
    rounded: '{rounded.stamp}'
    padding: '0 6px'
    height: '20px'
  source-badge:
    backgroundColor: '{colors.surface-2}'
    textColor: '{colors.fg-muted}'
    typography: '{typography.stamp}'
    rounded: '{rounded.sm}'
    padding: '0 6px'
    height: '20px'
  kbd:
    backgroundColor: '{colors.surface-2}'
    textColor: '{colors.fg-faint}'
    typography: '{typography.stamp}'
    rounded: '{rounded.sm}'
    padding: '0 4px'
    height: '20px'
  card:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.fg}'
    rounded: '{rounded.md}'
    padding: '12px'
  panel:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.fg}'
    rounded: '{rounded.lg}'
    padding: '16px'
  popover:
    backgroundColor: '{colors.surface-2}'
    textColor: '{colors.fg}'
    rounded: '{rounded.md}'
    padding: '4px'
  nav-item:
    backgroundColor: 'transparent'
    textColor: '{colors.fg-muted}'
    typography: '{typography.body-sm}'
    rounded: '{rounded.md}'
    padding: '0 10px'
    height: '36px'
  nav-item-active:
    backgroundColor: '{colors.surface-3}'
    textColor: '{colors.fg}'
    typography: '{typography.body-sm}'
    rounded: '{rounded.md}'
    padding: '0 10px'
    height: '36px'
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

The build refuses the category's arrangement of metric tiles over a grid of identical cards. It
also refuses decorative motion: transitions are short (150–260ms), ease out, and vanish entirely
under `prefers-reduced-motion`.

**Key Characteristics:**

- Ink grounds in four steps (canvas, surface, surface-2, surface-3) with two hairline tones; dark is the default and the light theme swaps the same tokens.
- One brass accent, one purpose at a time: selection, primary action, focus, stamps, wordmark.
- Hairline rules and dividers before borders; borders before shadows; shadows only for lift (hover, popover, dialog, drag).
- Two faces with strict jobs: Schibsted Grotesk for words, Fragment Mono for measurements and stamps.
- Stage stamps are outlined, letterspaced monospace caps in the stage's tone; never solid-filled.
- Density of a tool used in flow: 14px body, 36px controls, 12px card padding, 16px panel padding.

## Colors

A near-monochrome ink ground with a muted brass accent and four semantic tones, each paired with a 14%-alpha tint; the light theme (`[data-theme='light']`) keeps every role and darkens the tones for contrast on paper. The frontmatter carries the dark values, which are the default; light values are recorded in `.impeccable/design.json`.

### Primary

- **Brass** (`accent`): the single accent. Primary button fill, the active nav rail, the focused inbox row's left rail, links inside the dashboard "today" sentence, the wordmark, the caret, text selection, the focus ring, the current-week label in the activity strip. `accent-strong` is the hover fill for the primary button; `accent-soft` is the 14% tint behind selected chips, the legal drop target and the account avatar disc; `accent-fg` is the ink used for text on a brass fill.

### Neutral

- **Canvas** (`canvas`): the page ground behind everything; also the sticky header at 85% with backdrop blur.
- **Surface** (`surface`): the sidebar, panels, cards, inputs, sheets and dialogs. One step above canvas.
- **Surface 2** (`surface-2`): secondary button fill, badges, kbd, popovers (menus, selects, tooltips), the focused inbox row, pipeline columns at 50–60% alpha.
- **Surface 3** (`surface-3`): the active nav item, the selected settings tab, highlighted menu items, the "on" segment, the chart hover cursor, ghost-button hover.
- **Line** (`line`): every hairline rule, divider and default border. `line-strong` is the hover border on cards, inputs and secondary buttons, the switch track edge, the scrollbar thumb, and the dashed border of empty states at 70%.
- **Ink** (`fg`): headings and primary text. `fg-muted` is body text on cards, labels, nav at rest, badge text. `fg-faint` is timestamps, hints, kbd, metadata, inactive bottom-tab labels.

### Semantic

- **Danger** (`danger`, `danger-soft`): the danger button, error banners (40% border on the soft tint), destructive menu items, the illegal drop target, failed source runs, the REJECTED stage.
- **Success** (`success`, `success-soft`): healthy source runs, the OFFER stage, success badges.
- **Info** (`info`, `info-soft`): running source runs, next-step dates on cards, the INTERVIEWING stage, the second radial in `surface-noise`.
- **Warning** (`warning`): a stale application's day-count (APPLIED for 7+ days). No soft tint exists; it is never a fill.

### Stage tones

- `stage-saved` = `fg-muted`; `stage-applied` = `accent`; `stage-interviewing` = `info`; `stage-offer` = `success`; `stage-rejected` = `danger`; `stage-withdrawn` = `fg-faint`. Used by stamps (text at 100%, border at 50–60% alpha), funnel bars, status dots and the pipeline column headers.

### Named Rules

**The One Brass Rule.** Brass marks exactly one thing per view as current or primary: the active nav item, the focused row, the primary button. It never fills a card, a panel or a chart background. If two things are brass, one of them is wrong.

**The Stage Tone Rule.** Stage colours are aliases of the semantic ramp, not new hues. A new status colour must map to one of the six existing tones.

**The Soft-Tint Rule.** Tints are the tone at 14% alpha (12% in light) and are always paired with a border of the same tone at 40–60% alpha. A tint is never used alone as a fill without its border, and a border tone never appears without its meaning (accent = selected or legal, danger = error or illegal).

## Typography

**Display / Body Font:** Schibsted Grotesk (with ui-sans-serif, system-ui, sans-serif)
**Label / Mono Font:** Fragment Mono, weight 400 only (with ui-monospace, SF Mono, Menlo, Consolas, monospace)

**Character:** A narrow-capped grotesk with good numerals does all the talking at 13–22px in three weights (400, 500, 600); the mono face never speaks in sentences. It stamps, counts and dates. `font-feature-settings: 'kern', 'liga', 'ss01'` is on globally; `.tabular` (tabular-nums) is applied wherever numbers align in columns.

### Hierarchy

- **Display** (600, 34px, 1.1, -0.025em): the auth panel's product sentence. The only place it appears.
- **Headline** (600, 22px, 1.375, -0.025em): page titles (`PageHeader`) and the dashboard "today" sentence, which is a real `h1` set in this size with brass links inline; max 40ch.
- **Title** (600, 17px, -0.025em): sheet headers (application, posting). **Title-sm** (600, 15px): dialog titles.
- **Section** (600, 13px, -0.025em): `SectionTitle` inside panels, with a 12px faint aside to its right.
- **Body** (400, 14px, 1.45): base. Card company names and inbox headlines are 14px 500. Ledes max 60ch; long prose max 72ch.
- **Body-sm** (400, 13px): sidebar nav, settings tabs, menu items, select items, command palette rows.
- **Caption** (400, 12px): card roles, labels (12px 500 muted), hints, pagination, list metadata.
- **Fine** (400, 11px): timestamps, day-counts, funnel labels, chart tooltips; the bottom tab bar labels drop to 10.5px.
- **Measure** (mono 400, 13px, tabular): scores, funnel counts. **Measure-sm** (mono 11px, tabular): badge text, column counts, `d` day-counts, pagination "1 / 8", menu shortcuts.
- **Stamp** (mono 400, 10.5px, 0.14em, uppercase, line-height 1): the `.stamp` utility. Stage stamps, pipeline column headers, menu and command-palette group labels, source badges, kbd.
- **Wordmark** (mono 400, 12px, 0.32em, uppercase, brass): "REEL" in the sidebar, mobile header and auth panel.

### Named Rules

**The Measurement Rule.** If it is a number, a date, a count, a keyboard key, a source name or the wordmark, it is set in Fragment Mono with tabular numerals. If it is a sentence, it is never in mono. Tooltip point values (`+30`) are mono inside a sans sentence for this reason.

**The Stamp Rule.** Any small uppercase label uses `.stamp` exactly: 10.5px mono, 0.14em tracking, line-height 1. There is no second small-caps style.

**The Three Weights Rule.** 400, 500, 600. Nothing bolder, nothing lighter; 500 marks a name (company, current page), 600 marks a heading.

## Layout

The shell is a 240px sidebar (`w-60`, surface, right hairline) beside a column with a sticky 56px header (`h-14`, canvas at 85% with 12px backdrop blur, bottom hairline) and a main area. Content is centred in a 1200px max-width column with gutters of 16px (phone), 24px (`md`) and 32px (`lg`); the main area has 24px top padding and 96px bottom padding on phones to clear the tab bar. Sidebar items are 36px rows with a 2px brass rail (`w-0.5`, `rounded-r`) at the left edge that scales in vertically when active.

Breakpoints are Tailwind's: 640 (`sm`), 768 (`md`), 1024 (`lg`), 1280 (`xl`). Below `md` the sidebar is gone and the five tabs become a fixed bottom bar (surface at 95%, blur, safe-area padding, 10.5px labels, brass when active). Sheets are bottom-anchored at 92dvh with rounded top corners below `sm`, and a right-anchored full-height panel (`max-w-lg` or `max-w-2xl`) from `sm` up.

Pages open with a `PageHeader` (headline plus 14px lede, actions aligned to the baseline on the right, 24px below). The dashboard is a `1.25fr 1fr` two-column grid at `lg` with 16px gaps, stacking on phones. The settings page uses a `180px 1fr` grid at `lg`, with the sub-nav becoming a horizontal scroller below. The pipeline is a horizontal, snap-mandatory row of 256px columns (288px at `sm`) that bleeds to the gutters; closed stages collapse into 40px vertical-stamp rails at the right edge. The inbox is a single bordered list (`rounded-lg`, surface) of hairline-divided rows in an `auto 1fr auto` grid; the focused row is surface-2 with the brass rail.

Spacing is a 4px grid. The rhythm actually used: 2px between chips, 4px between kbd keys and inline icons, 8px between cards in a column and between controls, 12px card padding, 16px panel padding and grid gaps, 20px dialog and sheet horizontal padding with 16px vertical, 24px page-header margin, 32px between the "today" block and the grid.

## Elevation & Depth

Depth is tonal first, shadow second. The four ink steps (canvas → surface → surface-2 → surface-3) carry most of the layering: a panel is surface on canvas; a popover is surface-2 on surface; the active item is surface-3. Hairlines do the separating. Shadows exist in three sizes and mark lift, not membership: a card and the primary button carry `shadow-sm` at rest; hover lifts a card to `shadow-md`; popovers, menus, selects and tooltips sit at `shadow-md`; dialogs, sheets and the dragged card overlay sit at `shadow-lg`. Shadows are pure black at high alpha in the dark theme and a warm brown (`rgba(40, 30, 10, …)`) at low alpha in light, so they read as the same lift on both grounds.

Overlays are canvas at 60–70% with a 1.5–2px backdrop blur. The only gradient in the system is `.surface-noise`: two large radial washes of `accent-soft` and `info-soft` behind the auth panel copy.

### Shadow Vocabulary

- **Rest** (`--shadow-sm`: `0 1px 2px rgba(0,0,0,0.5)`): cards at rest, the primary button, the "on" segment, the switch thumb.
- **Lift** (`--shadow-md`: `0 8px 24px -8px rgba(0,0,0,0.65), 0 2px 6px rgba(0,0,0,0.35)`): hovered cards, menus, selects, tooltips, chart tooltips.
- **Float** (`--shadow-lg`: `0 24px 48px -16px rgba(0,0,0,0.75), 0 4px 12px rgba(0,0,0,0.4)`): dialogs, sheets, the drag overlay (which also rotates 1.5° and takes a 60% brass border).

### Named Rules

**The Hairline-First Rule.** Separate with a `line` rule or `divide-y` before drawing a border; draw a border before casting a shadow. A list of rows is never a stack of cards.

**The Lift-Only Rule.** `shadow-md` and `shadow-lg` appear only on something that is above the page (hover, popover, dialog, drag). Nothing at rest exceeds `shadow-sm`.

## Shapes

Corners are small and stepped: 3px on stamps and funnel bar tops, 4px on badges, kbd, chips, select items and `xs` buttons, 6px on buttons, inputs, cards, nav items and popovers, 10px on panels, dialogs, pipeline columns and empty states, and full round on the switch, status dots and the avatar disc. Radius grows with the size of the thing, but nothing exceeds 10px and nothing is pill-shaped except toggles and dots.

Borders are 1px hairlines in `line` at rest and `line-strong` on hover. Dashed hairlines mean "not yet": empty states, the empty column drop zone, and the `via` badge on a manually added application. Toned borders at 40–60% alpha appear only together with their tint (see The Soft-Tint Rule). The brass rail is a 2px bar with a rounded right edge, used to mark the current nav item and the focused inbox row.

## Components

### Buttons

- **Shape:** softly squared (6px); 4px at `xs`. Heights 24 (`xs`), 28 (`sm`), 36 (`md`), 40 (`lg`); icon buttons are 28 or 32 square. Weight 500, 6px gap, 14px icons.
- **Primary:** brass fill, ink text, `shadow-sm`; hover to `accent-strong`; active drops the shadow. One per view.
- **Secondary (default):** surface-2 fill with a `line` border; hover raises the border to `line-strong` and the fill to surface-3.
- **Ghost:** transparent, muted text; hover to ink on surface-3. Used for icon buttons, tertiary actions and pagination.
- **Outline:** `line` border, no fill; hover to `line-strong` on surface-2.
- **Danger:** danger text on a `line` border; hover to a 60% danger border on `danger-soft`.
- **Link:** brass text, underline on hover, no height or padding.
- **States:** all buttons scale to 98% on press, transition background, border, colour, transform and shadow over 150ms ease-out, sit at 50% opacity when disabled, and show a 14px spinner when loading. Focus is the global 2px brass outline at 2px offset.

### Chips

- **Badge:** mono 11px, 4px corners, 2px × 6px padding, 1px border. Tones: neutral (surface-2, muted text, `line` border), outline (transparent), accent / success / danger / info (soft tint, 40% tone border, tone text), solid (ink fill, canvas text).
- **Reason chips:** a `role:` reason is an accent badge; every other reason is neutral; overflow is an outline badge reading `+n`. Each carries a tooltip with the mono point value and a one-sentence rule.
- **Score badge:** mono 13px 500, tabular, 28px tall, min 40px wide, 4px corners. 80 and above is a solid brass fill with ink text; 60–79 is brass text on the brass tint with a 50% brass border; below 60 is muted on surface-2.

### Stage stamp

An outline, never a fill: 20px tall (24px at `md`), 3px corners, 1px border in the stage tone at 50–60% alpha, `.stamp` text in the stage tone. `StageDot` is the 6px round companion for logs and lists. Pipeline column headers set the stage name in `.stamp` and the stage tone without the border.

### Source badge

20px, 4px corners, surface-2 fill, `line` border, mono 10.5px uppercase muted text with 0.025em tracking; when it links out it gains a 10px external-link glyph, a `line-strong` hover border and a tooltip carrying the source attribution.

### Cards / Containers

- **Application card:** surface, 6px corners, `line` border, 12px padding, `shadow-sm`; hover to `line-strong` and `shadow-md`. Company 14px 500, role 12px muted, location and salary 11px faint, then a hairline and a footer row of mono day-count (warning tone when stale), brass bell date, info calendar date. Dragging leaves the original at 30% and the overlay rotated 1.5° with a 60% brass border and `shadow-lg`.
- **Panel:** surface, 10px corners, `line` border, 16px padding; opens with a `SectionTitle`. Lists inside a panel use `divide-y divide-line`, never nested cards.
- **Pipeline column:** 10px corners, `line` border, surface-2 at 50%, a hairline header with the stamp, mono count and 10.5px hint; a legal drop turns the border brass and the fill `accent-soft`; an illegal one turns them danger.
- **Empty state:** dashed `line-strong` at 70%, 10px corners, centred; a 36px icon tile (surface-2, `line` border, faint 16px glyph), 14px 500 title, 12px muted hint, then actions.
- **Error state:** 40% danger border on `danger-soft`, 6px corners, 16px × 12px padding, a danger triangle and an outline "Try again".

### Inputs / Fields

- **Style:** surface fill, `line` border, 6px corners, 36px tall, 10px horizontal padding, 14px ink text, faint placeholder, no shadow. Textareas are 96px minimum with 8px vertical padding. Selects share the trigger style with a 14px faint chevron; the `sm` size is 28px with 12px text.
- **Hover / Focus:** hover to `line-strong`; focus to a brass border plus a 2px ring of brass at 25%. Invalid fields take a danger border and a danger ring.
- **Label:** 12px 500 muted, 6px above the control, with an optional faint hint right-aligned on the same baseline; errors are 12px danger with `role="alert"`.
- **Switch:** 36 × 20 pill, surface-3 track with a `line-strong` edge, 14px ink thumb; checked is a brass track with an ink thumb translated 18px.
- **Segmented:** a surface-2 tray (6px corners, 2px padding, `line` border) of 24px items (32px at `md`); the "on" item is surface with `shadow-sm` and ink text; counts are mono 10.5px faint.
- **Tabs:** a hairline underline row; triggers are 36px, 13px muted, with a 2px brass bottom border and ink text when active; counts sit in a surface-3 mono pill.

### Navigation

- **Sidebar:** 240px surface with a right hairline; wordmark row 56px; items are 36px, 13px, 6px corners, 16px lucide icon; at rest muted with faint icons, hover surface-2, active surface-3 with a brass icon and the 2px brass rail. Below, a hairline and a 36px command-palette trigger styled as a secondary control with `Ctrl` `K` kbd keys.
- **Header:** 56px, canvas at 85% with blur; current page name 13px 500 and its hint 12px faint at `lg`; on the right a ghost theme toggle and an account menu whose trigger is a 20px brass-tint avatar disc plus the email in 12px.
- **Bottom tab bar (below `md`):** fixed, surface at 95% with blur, five equal columns, 18px icon over a 10.5px label, brass when active, faint otherwise.
- **Menus and popovers:** surface-2, `line` border, 6px corners, 4px padding, `shadow-md`; items are 13px with 4px corners, surface-3 when highlighted, brass check marks; group labels use `.stamp`; separators are 1px `line`.

### Command palette

A dialog with a hairline search row (brass sparkle icon, 48px transparent input), a list padded 6px with `.stamp` group headings, 13px rows that highlight to surface-3, and kbd hints on the right.

### Kbd

20px, min 20px wide, 4px corners, surface-2 fill, `line` border, mono 10.5px faint. Always shown beside a label or in a key sequence, never as decoration.

### Motion

Every transition is `ease-out-quint` (`cubic-bezier(0.23, 1, 0.32, 1)`) unless it moves position, which uses `ease-in-out-quart` (`cubic-bezier(0.77, 0, 0.175, 1)`). State changes are 150ms; list rows enter with a 6px rise over 220ms staggered 30ms; popovers pop in over 160ms; dialogs scale from 97% over 220ms; sheets slide 24px over 260ms. Exits are always shorter than entries (120–180ms). Skeletons shimmer between surface-2 and surface-3 over 1.6s linear. `prefers-reduced-motion` collapses every animation and transition to 0.01ms and stops the shimmer.

## Do's and Don'ts

### Do:

- **Do** set every number, date, count, shortcut and source name in Fragment Mono with `.tabular`; keep Schibsted Grotesk for words.
- **Do** mark the current item with the 2px brass rail (`rounded-r`) and a one-step lighter surface, as the sidebar and the inbox do.
- **Do** separate rows with `divide-y divide-line` inside one `Panel` or one bordered list; reserve cards for things that move (pipeline applications).
- **Do** keep stamps as outlines in the stage tone (border at 50–60%, text at 100%) with `.stamp` type and 3px corners.
- **Do** use a dashed `line` border to mean "nothing here yet" or "entered by hand", and a toned border only together with its 14% tint.
- **Do** stay at 400 / 500 / 600 and the recorded ramp (34, 22, 17, 15, 14, 13, 12, 11, 10.5); 36px controls and 12px card / 16px panel padding.
- **Do** end every animation under 300ms with `ease-out-quint`, and let `prefers-reduced-motion` remove it.

### Don't:

- **Don't** put brass on more than one element per view as a fill; brass text is for the current link, the wordmark and the stamp, never for body copy.
- **Don't** introduce a hue outside brass, danger, success, info and warning; a new status must alias one of the six stage tones.
- **Don't** fill a stamp, chip or column with a solid tone. Solid brass belongs to the primary button and the 80+ score badge only; solid ink belongs to the `solid` badge.
- **Don't** cast `shadow-md` or `shadow-lg` on anything at rest; lift is for hover, popovers, dialogs and drag.
- **Don't** arrange the page as metric tiles over a card grid, and don't use gradients outside `.surface-noise` on the auth panel.
- **Don't** set prose in the mono face or use it above 13px except the 12px wordmark; don't add a second small-caps style beside `.stamp`.
- **Don't** exceed 10px corners or make anything pill-shaped except the switch, status dots and the avatar disc.
