# Product

<!-- impeccable:product-schema 1 -->

Source of truth for every fact below is `docs/PLAN.md` (Sections 1, 3, 5, 11), written and
revised by the owner. Facts marked _(inferred)_ were derived from the plan and the 23 Sep 2026
brief rather than confirmed in an interview.

## Platform

web

## Users

One person: Jade, a software engineer job-hunting in Sept–Oct 2026, using the tool daily on a
laptop in the evenings and on a phone during the day to check what came in. Recruiters and
hiring managers are a second audience _(inferred)_: they open the resume link, click around a
demo for two minutes, and decide whether the code behind it is worth reading.

## Product Purpose

Reel does the boring half of a job search. It reads ten public job sources on a schedule (the
monthly Hacker News hiring thread, six remote-job feeds, and any company boards on Greenhouse,
Lever or Ashby you add), parses each posting into structured fields, scores it against saved
criteria, and puts the matches in an inbox. From a match, or by hand for jobs found anywhere
else, an application moves through SAVED → APPLIED → INTERVIEWING → OFFER / REJECTED /
WITHDRAWN with an immutable history, notes, contacts, and follow-up reminders that email you
when something goes quiet. Success is that Jade actually uses it every day and never again
forgets to follow up on an application that mattered.

## Positioning

Every posting is scored transparently: the reasons are shown as chips (`remote`,
`role:full stack`, `stack:typescript`) that add up to the number, and the rules are plain
arithmetic in `docs/PLAN.md` §6.5. No model, no black box. Reminders are idempotent by
construction (deterministic job id plus a database re-check before sending), so the tool can be
trusted to nag exactly once.

## Operating Context

- Inbox is read a few times a day; the pipeline is touched whenever something changes; settings
  are visited rarely.
- Ingest runs every six hours in a separate worker process; the user can trigger one manually
  and watch the run history.
- Emails arrive via Resend in production and are logged to the console in development.
- A demo build (`NEXT_PUBLIC_DEMO_MODE=true`) runs the same interface against seeded in-browser
  data with no backend, for the resume link.

## Capabilities and Constraints

- API contract: `docs/PLAN.md` §5 (v1) and §11.3 (v2). The web app never invents fields and
  never imports from the API package.
- Stage transitions are enforced by the server; the UI mirrors them for affordance only.
- Postings, source toggles and board watchlists are global; criteria, matches, applications
  and reminders are per user.
- Ten sources: HN, Remotive, Remote OK, Arbeitnow, Himalayas, Jobicy, We Work Remotely
  (feeds); Greenhouse, Lever, Ashby (company boards by slug). Remote OK and Arbeitnow require
  a visible source attribution and a link back on every posting shown.
- Stack: Next.js 16 App Router, Tailwind 4, TanStack Query, radix-ui, motion, dnd-kit, cmdk,
  sonner, recharts, next-themes. Auth is an httpOnly cookie; every request uses
  `credentials: 'include'`.
- Terminology: posting (a job someone published), match (a posting scored for this user),
  application (something the user is pursuing), stage, event, reminder, source, board.
- Undecided: whether the real deployment goes live before the demo; both are supported.

## Brand Commitments

- Name: Reel. Wordmark set in the interface's monospace face, letterspaced, brass on ink.
- Visual lineage: the owner's portfolio "ink and brass" direction — dark by default, near-black
  surfaces, a muted brass accent; a light theme is added in v2 and both are tokens. This is
  pinned by `docs/PLAN.md` Step 13 and Step 18.
- Voice: plain, direct, no exclamation marks; the tool talks like a careful colleague.

## Evidence on Hand

- Real data: 264 HN postings plus roughly 1,300 postings from the other nine sources in the
  local database after the 23 Sep 2026 live ingest; seed user `jade@example.com`.
- No screenshots, GIF, or live URL yet; the README marks them pending.
- No testimonials, customers, or metrics exist and none may be invented.

## Product Principles

1. The number is never a mystery: every score, count and reminder can be traced to a rule the
   user can read.
2. Density over decoration; this is a tool used in flow, not a landing page.
3. Every state is designed: loading, empty, error and success each say what to do next.
4. The server is the authority; the interface is honest about what it does not know yet.
5. Nothing in the UI depends on a backend feature that is not in the plan.

## Accessibility & Inclusion

Keyboard-only operation of the inbox and pipeline; visible focus; contrast at or above WCAG AA
in both themes; `prefers-reduced-motion` disables non-essential motion. _(inferred from the
plan's Step 18 "Done when")_
