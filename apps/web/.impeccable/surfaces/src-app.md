---
version: 1
slug: 'src-app'
primary_target: 'src/app'
related_targets: ['src/components']
---

# Surface brief — Reel app shell (dashboard, inbox, postings, pipeline, settings)

Scope: the authenticated app (`/(app)/*`) plus login/register. Visitor mode: Operate. One user
in flow, several times a day, laptop in the evening and phone by day; a recruiter opening the
demo for two minutes is the second reader.

Audience and job: Jade triages new matches, moves applications through stages, logs what
happened, and checks what is due. Success: from a fresh ingest to a saved application without
touching the API; a stalled application never goes unnoticed. Must remain untouched: the
"ink and brass" identity (dark default, near-black surfaces, brass accent), the API contract,
server-enforced stage machine, and the copy's plain voice. Wrong if polished: anything that
reads as a marketing dashboard (hero metrics, gradient tiles, decorative motion).

## Direction contract

THESIS: Reel is a working notebook, not a dashboard. The job search is a record you keep, so
every screen is a page of a notebook: the pipeline is a wall of index cards, each carrying a
stage stamp; history is a dated log; the inbox is a triage desk where one item is in focus and
the next is one keystroke away. It refuses the category's arrangement of metric tiles over a
grid of identical cards.

OWN-WORLD: Ink grounds (near-black in dark, warm paper-white in light), a single brass accent
for the current selection, primary action and stamps; hairline rules instead of card borders
wherever content can be separated by space and a rule. One workhorse sans for everything
(Geist Sans is not it; the face is chosen at build for its numerals and narrow caps) with the
monospace face reserved for measurement: scores, counts, dates, keyboard hints, the wordmark.
Stage stamps are rounded-rectangle outlines in the stage's tone, letterspaced small caps.
Focus ring, selection, caret and scrollbars are brass on ink. Removing all content, the page is
recognizable by its brass hairline rules, stamps and monospace numerals on ink.

STORY: The visitor sees what came in, what is moving, and what is due, then acts: dismiss or
save from the inbox with one key, drag a card to the next stage, log a note, set a follow-up.
They believe the number because the reasons are printed beside it.

FIRST VIEWPORT (dashboard, 1440): left, a narrow sidebar with the wordmark and five tabs
reading like notebook dividers; top, a slim bar with the command-palette search, ingest state
and the account menu. Content opens with a one-line "today" sentence in the body face (what is
due, what came in), then a two-column page: left, the pipeline as a horizontal funnel of stage
counts with tabular numerals and a weekly activity strip showing eight weeks with the current
week marked; right, "Coming up" as a dated log and "Sources" as a health list with the last run
per source. Primary action ("Open inbox · 12 new") sits in the today sentence, brass. At 390 the
sidebar becomes a bottom tab bar and the two columns stack.

FORM: Field notebook / stamped index cards, candidate 7 of 7 on the ordered list (kanban wall,
triage desk, ledger, control room, terminal, classifieds, notebook), dealt lead by seed key
07419b1b. Raised by the declined challengers: from the vertical feed, "the next item is one
keystroke away and already loaded" (inbox prefetches the next page and j/k moves focus); from
the drum machine, "the chase light always tells you where now is" (the current week is marked
in the activity strip, the current stage is marked on every card). Fused alternate: the triage
desk supplies the inbox's list-plus-focused-item structure.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the
verdict, DESIGN.md, and every shipping raster carrying its provenance.

Unresolved: the exact typeface pair (decided at build from candidates with tabular numerals and
a real small-caps or letterspaced caps setting); whether the pipeline shows closed stages
collapsed or behind a toggle (build: collapsed columns at the right edge, expandable).
