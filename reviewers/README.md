# Reviewers

One document per build step, written to be read _after_ the code exists. The code carries no
comments by design; these are where the explanation lives. This page is the map: what the whole
application is, how the pieces fit, and which document explains which piece.

## What Reel is

Reel is a personal job-hunt tracker. It pulls postings from twenty sources on a schedule, scores
every one against your saved criteria, shows the ones that fit in an inbox, and tracks each
application you make from saved to an outcome. It runs on your machine; a synthetic demo of it is
hosted on Vercel as the portfolio link.

**Ingest.** A worker process runs every three hours and fans out one job per source and preset.
Feed sources (Hacker News "Who is hiring?", Remotive, Remote OK, Arbeitnow, Himalayas, Jobicy, We
Work Remotely, Working Nomads, Landing.jobs, The Muse, Jobspresso, JobStreet Philippines,
Kalibrr) are public JSON or RSS with no key. Board sources (Greenhouse, Lever, Ashby, Workable,
SmartRecruiters) read the careers pages of companies on a watchlist. Browser sources (HiringCafe,
Wellfound) sit behind bot checks, so a Chrome extension reads them from your own browser and
posts the results back. Every adapter maps its raw shape into one normalised posting: company,
role, location, remote type, salary, stack keywords, region labels, level, and the text.

**Score.** A pure function turns one posting plus your criteria into a number and a list of
reasons. Remote or near you, a role keyword in the headline, your stack keywords, an explicit
"open to your region" or a sign that the company pays people abroad (Deel, an employer of record, a B2B contract), a parsed salary, an apply link and freshness add points, to a maximum of 130. Exclude keywords, a level you did not pick, a region you cannot work from, or a salary
ceiling under your minimum drop it to zero. A posting that says nothing about who it can hire loses 10 as unverified, and one that asks for another region's working hours carries a flag. Forty or more is a match. Every chip in the inbox is
one of those rules.

**Triage.** The inbox lists matches, best first, filtered to the last two weeks by default, with
keyboard navigation and a dot on what arrived since your last visit. The Postings page is the
unscored firehose with search and filters.

**Track.** Saving a match, or adding a job found anywhere else, creates an application. It moves
through saved, applied, interviewing, offer, rejected, withdrawn on a board, with notes, a
contact, a next-step date and an immutable event log. An application that sits in applied for
ten days triggers a follow-up reminder through the mailer. The dashboard shows the funnel,
weekly activity, what is due, and source health.

**Notify.** The extension polls every thirty seconds anyway, so the poll also returns how many
strong new matches exist. That count sits on the toolbar icon and raises a Chrome notification.

## How it is built

- **Monorepo:** pnpm 10, ESM, TypeScript strict, Node 22. `apps/api`, `apps/web`,
  `apps/extension`, and one shared tsconfig package.
- **API:** NestJS 12 on port 4000, Prisma 7 over Postgres 16, BullMQ 5 over Redis 7. Modules:
  config, prisma, redis, bull, health, auth, users, criteria, sources, ingest, postings,
  matching, applications, reminders, mailer, browser. The worker is the same image started
  with a different entry file.
- **Web:** Next.js 16 on port 3000 with TanStack Query. Demo mode swaps the API client for an
  in-browser implementation of the same contract with seeded data.
- **Extension:** Manifest V3, plain TypeScript compiled by `tsc`, driven by Reel and never the
  other way round.
- **Gate:** oxlint, Prettier, `tsc`, Vitest unit tests beside each file, and an e2e suite that
  runs serially against real Postgres and Redis. CI runs all of it on every pull request.
- **Docs:** `docs/PLAN.md` is the single source of truth (fixed decisions, schema, API
  contract, scoring rules, one section per step). `docs/DEPLOY.md` is the operator's document.
  `README.md` is the case study.

## The documents

Read them in order. Each one follows the same shape: **What this step adds**, **Files, in
reading order**, **Concepts**, **Gotchas**.

| Step | Document                                                              | Branch                             |
| ---- | --------------------------------------------------------------------- | ---------------------------------- |
| 1    | [Scaffold the monorepo](step-01-scaffold.md)                          | `chore/scaffold-monorepo`          |
| 2    | [Prisma schema and first migration](step-02-schema.md)                | `feat/schema`                      |
| 3    | [Auth](step-03-auth.md)                                               | `feat/auth`                        |
| 4    | [Criteria](step-04-criteria.md)                                       | `feat/criteria`                    |
| 5    | [HN client](step-05-hn-client.md)                                     | `feat/hn-client`                   |
| 6    | [Parser](step-06-parser.md)                                           | `feat/hn-parser`                   |
| —    | [Repairs to steps 1–6](step-00-repairs.md)                            | `feat/ingest-job`                  |
| 7    | [Ingest job and worker](step-07-ingest.md)                            | `feat/ingest-job`                  |
| 8    | [Postings API](step-08-postings.md)                                   | `feat/postings-api`                |
| 9    | [Scoring and matches](step-09-matching.md)                            | `feat/matching`                    |
| 10   | [Applications and stages](step-10-applications.md)                    | `feat/applications`                |
| 11   | [Reminders and mailer](step-11-reminders.md)                          | `feat/reminders`                   |
| 12   | [Hardening and Dockerfile](step-12-hardening.md)                      | `chore/hardening`                  |
| 13   | [Frontend](step-13-frontend.md)                                       | `feat/web-*`                       |
| 14   | [Deploy](step-14-deploy.md)                                           | `chore/deploy`                     |
| 15   | [Case study README](step-15-case-study.md)                            | `docs/case-study`                  |
| 16   | [Sources](step-16-sources.md)                                         | `feat/sources`                     |
| 17   | [Application tracking v2](step-17-applications-v2.md)                 | `feat/applications-v2`             |
| 18   | [Web overhaul](step-18-web-overhaul.md)                               | `feat/web-overhaul`                |
| 19   | [Demo mode](step-19-demo.md)                                          | `feat/web-demo`                    |
| 20   | [Readability pass](step-20-readability.md)                            | `feat/web-readability`             |
| 21   | [Where you can work](step-21-regions.md)                              | `feat/regions`                     |
| 22   | [More sources](step-22-more-sources.md)                               | `feat/more-sources`                |
| 23   | [Refetch and tracked matches](step-23-refetch-and-tracked-matches.md) | `feat/refetch-and-tracked-matches` |
| 24   | [Browser sources](step-24-browser-sources.md)                         | `feat/browser-sources`             |
| 25   | [Fit: geography, level, near you, freshness](step-25-fit.md)          | `feat/fit-v2`                      |
| 26   | [Eligibility: hours, hiring signals, queue](step-26-eligibility.md)   | `feat/eligibility`                 |

Steps 1 to 6 were built in one pass before the reviewers existed. Their documents were written
afterwards from the code as it stands; the repairs document records what had to change before
any of it ran.

## The fastest way in

If you only read three files, read these:

1. `apps/api/src/ingest/ingest.processor.ts` — the whole ingest pipeline in one method
2. `apps/api/src/matching/scorer.ts` — a pure function, no framework, all the product logic
3. `apps/api/src/applications/applications.service.ts` — the state machine and transactions

Everything else is wiring around those three.

## Where each idea lives

| If you want to understand…                       | Read                                                                  |
| ------------------------------------------------ | --------------------------------------------------------------------- |
| how a request becomes a response                 | `main.ts`, then any controller, then Step 1 and Step 3                |
| why there are two processes                      | Step 7, then Step 14                                                  |
| how a source is added                            | Step 16, then one adapter and its fixture spec, then Step 22          |
| how text becomes columns                         | Step 6, then `sources/normalize.ts`, then Step 21 and Step 25         |
| why a posting scored what it scored              | Step 9, then Step 21, then Step 25, next to `docs/PLAN.md` §6.5       |
| how a reminder cannot fire twice                 | Step 11                                                               |
| what the web app talks to                        | `apps/web/src/lib/api.ts`, `lib/queries.ts`, then Step 13 and Step 18 |
| how the demo works without a server              | Step 19                                                               |
| how the extension reads a site the server cannot | Step 24                                                               |
| what the badge on the extension icon means       | Step 25                                                               |
| why a posting is unverified or flagged for hours | Step 26                                                               |
