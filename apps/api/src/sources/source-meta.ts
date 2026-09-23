import type { Source, SourceKind } from './source.types.js';

export type SourceMeta = {
  source: Source;
  label: string;
  kind: SourceKind;
  homepage: string;
  attribution: string | null;
  defaultBoardId: string | null;
};

export const SOURCE_META: Record<Source, SourceMeta> = {
  HN: {
    source: 'HN',
    label: 'Hacker News',
    kind: 'feed',
    homepage: 'https://news.ycombinator.com/submitted?id=whoishiring',
    attribution: null,
    defaultBoardId: null,
  },
  REMOTIVE: {
    source: 'REMOTIVE',
    label: 'Remotive',
    kind: 'feed',
    homepage: 'https://remotive.com/remote-jobs/software-dev',
    attribution: 'Jobs shared via the Remotive public API',
    defaultBoardId: 'software-dev',
  },
  REMOTEOK: {
    source: 'REMOTEOK',
    label: 'Remote OK',
    kind: 'feed',
    homepage: 'https://remoteok.com',
    attribution:
      'Jobs from Remote OK — each posting links back to remoteok.com',
    defaultBoardId: 'all',
  },
  ARBEITNOW: {
    source: 'ARBEITNOW',
    label: 'Arbeitnow',
    kind: 'feed',
    homepage: 'https://www.arbeitnow.com',
    attribution: 'Jobs from the Arbeitnow job board API',
    defaultBoardId: 'all',
  },
  HIMALAYAS: {
    source: 'HIMALAYAS',
    label: 'Himalayas',
    kind: 'feed',
    homepage: 'https://himalayas.app/jobs',
    attribution: 'Jobs from the Himalayas public API',
    defaultBoardId: 'all',
  },
  JOBICY: {
    source: 'JOBICY',
    label: 'Jobicy',
    kind: 'feed',
    homepage: 'https://jobicy.com/jobs',
    attribution: 'Jobs from the Jobicy remote jobs API',
    defaultBoardId: 'developer',
  },
  WEWORKREMOTELY: {
    source: 'WEWORKREMOTELY',
    label: 'We Work Remotely',
    kind: 'feed',
    homepage: 'https://weworkremotely.com/categories/remote-programming-jobs',
    attribution: 'Jobs from the We Work Remotely RSS feed',
    defaultBoardId: 'remote-programming-jobs',
  },
  GREENHOUSE: {
    source: 'GREENHOUSE',
    label: 'Greenhouse',
    kind: 'board',
    homepage: 'https://boards.greenhouse.io',
    attribution: null,
    defaultBoardId: null,
  },
  LEVER: {
    source: 'LEVER',
    label: 'Lever',
    kind: 'board',
    homepage: 'https://jobs.lever.co',
    attribution: null,
    defaultBoardId: null,
  },
  ASHBY: {
    source: 'ASHBY',
    label: 'Ashby',
    kind: 'board',
    homepage: 'https://jobs.ashbyhq.com',
    attribution: null,
    defaultBoardId: null,
  },
};

export function sourceLabel(source: Source): string {
  return SOURCE_META[source].label;
}
