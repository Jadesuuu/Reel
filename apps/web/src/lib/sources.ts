import type { BoardProvider, BrowserSource, Source, SourceKind } from './types';

export type SourceMeta = {
  source: Source;
  label: string;
  short: string;
  kind: SourceKind;
  homepage: string;
  attribution: string | null;
};

export const SOURCES: Source[] = [
  'HN',
  'REMOTIVE',
  'REMOTEOK',
  'ARBEITNOW',
  'HIMALAYAS',
  'JOBICY',
  'WEWORKREMOTELY',
  'GREENHOUSE',
  'LEVER',
  'ASHBY',
  'WORKINGNOMADS',
  'LANDINGJOBS',
  'THEMUSE',
  'JOBSPRESSO',
  'WORKABLE',
  'SMARTRECRUITERS',
  'HIRINGCAFE',
  'WELLFOUND',
  'JOBSTREET',
  'KALIBRR',
];

export const BROWSER_SOURCES: BrowserSource[] = ['HIRINGCAFE', 'WELLFOUND'];

export const BOARD_PROVIDERS: BoardProvider[] = [
  'GREENHOUSE',
  'LEVER',
  'ASHBY',
  'WORKABLE',
  'SMARTRECRUITERS',
];

export const SOURCE_META: Record<Source, SourceMeta> = {
  HN: {
    source: 'HN',
    label: 'Hacker News',
    short: 'HN',
    kind: 'feed',
    homepage: 'https://news.ycombinator.com/submitted?id=whoishiring',
    attribution: null,
  },
  REMOTIVE: {
    source: 'REMOTIVE',
    label: 'Remotive',
    short: 'Remotive',
    kind: 'feed',
    homepage: 'https://remotive.com/remote-jobs/software-dev',
    attribution: 'Jobs shared via the Remotive public API',
  },
  REMOTEOK: {
    source: 'REMOTEOK',
    label: 'Remote OK',
    short: 'Remote OK',
    kind: 'feed',
    homepage: 'https://remoteok.com',
    attribution: 'Jobs from Remote OK — each posting links back to remoteok.com',
  },
  ARBEITNOW: {
    source: 'ARBEITNOW',
    label: 'Arbeitnow',
    short: 'Arbeitnow',
    kind: 'feed',
    homepage: 'https://www.arbeitnow.com',
    attribution: 'Jobs from the Arbeitnow job board API',
  },
  HIMALAYAS: {
    source: 'HIMALAYAS',
    label: 'Himalayas',
    short: 'Himalayas',
    kind: 'feed',
    homepage: 'https://himalayas.app/jobs',
    attribution: 'Jobs from the Himalayas public API',
  },
  JOBICY: {
    source: 'JOBICY',
    label: 'Jobicy',
    short: 'Jobicy',
    kind: 'feed',
    homepage: 'https://jobicy.com/jobs',
    attribution: 'Jobs from the Jobicy remote jobs API',
  },
  WEWORKREMOTELY: {
    source: 'WEWORKREMOTELY',
    label: 'We Work Remotely',
    short: 'WWR',
    kind: 'feed',
    homepage: 'https://weworkremotely.com/categories/remote-programming-jobs',
    attribution: 'Jobs from the We Work Remotely RSS feed',
  },
  GREENHOUSE: {
    source: 'GREENHOUSE',
    label: 'Greenhouse',
    short: 'Greenhouse',
    kind: 'board',
    homepage: 'https://boards.greenhouse.io',
    attribution: null,
  },
  LEVER: {
    source: 'LEVER',
    label: 'Lever',
    short: 'Lever',
    kind: 'board',
    homepage: 'https://jobs.lever.co',
    attribution: null,
  },
  ASHBY: {
    source: 'ASHBY',
    label: 'Ashby',
    short: 'Ashby',
    kind: 'board',
    homepage: 'https://jobs.ashbyhq.com',
    attribution: null,
  },
  WORKINGNOMADS: {
    source: 'WORKINGNOMADS',
    label: 'Working Nomads',
    short: 'Nomads',
    kind: 'feed',
    homepage: 'https://www.workingnomads.com/jobs',
    attribution: 'Jobs from the Working Nomads public API',
  },
  LANDINGJOBS: {
    source: 'LANDINGJOBS',
    label: 'Landing.jobs',
    short: 'Landing',
    kind: 'feed',
    homepage: 'https://landing.jobs/jobs',
    attribution: 'Jobs from the Landing.jobs public API',
  },
  THEMUSE: {
    source: 'THEMUSE',
    label: 'The Muse',
    short: 'Muse',
    kind: 'feed',
    homepage: 'https://www.themuse.com/jobs',
    attribution: 'Jobs from The Muse public API',
  },
  JOBSPRESSO: {
    source: 'JOBSPRESSO',
    label: 'Jobspresso',
    short: 'Jobspresso',
    kind: 'feed',
    homepage: 'https://jobspresso.co/remote-work/',
    attribution: 'Jobs from the Jobspresso RSS feed',
  },
  WORKABLE: {
    source: 'WORKABLE',
    label: 'Workable',
    short: 'Workable',
    kind: 'board',
    homepage: 'https://apply.workable.com',
    attribution: null,
  },
  SMARTRECRUITERS: {
    source: 'SMARTRECRUITERS',
    label: 'SmartRecruiters',
    short: 'SmartRec',
    kind: 'board',
    homepage: 'https://jobs.smartrecruiters.com',
    attribution: null,
  },
  HIRINGCAFE: {
    source: 'HIRINGCAFE',
    label: 'HiringCafe',
    short: 'HiringCafe',
    kind: 'browser',
    homepage: 'https://hiringcafe.com',
    attribution: 'Read from hiringcafe.com by the Reel browser extension',
  },
  WELLFOUND: {
    source: 'WELLFOUND',
    label: 'Wellfound',
    short: 'Wellfound',
    kind: 'browser',
    homepage: 'https://wellfound.com/jobs',
    attribution: 'Read from wellfound.com by the Reel browser extension',
  },
  JOBSTREET: {
    source: 'JOBSTREET',
    label: 'JobStreet',
    short: 'JobStreet',
    kind: 'feed',
    homepage: 'https://ph.jobstreet.com/software-engineer-jobs',
    attribution: 'Jobs from the JobStreet Philippines search API',
  },
  KALIBRR: {
    source: 'KALIBRR',
    label: 'Kalibrr',
    short: 'Kalibrr',
    kind: 'feed',
    homepage: 'https://www.kalibrr.com/home/all-jobs',
    attribution: 'Jobs from the Kalibrr job board API',
  },
};

export function sourceLabel(source: Source): string {
  return SOURCE_META[source]?.label ?? source;
}

export function sourceShort(source: Source): string {
  return SOURCE_META[source]?.short ?? source;
}

export const BOARD_HINT: Record<BoardProvider, { example: string; urlPattern: string }> = {
  GREENHOUSE: { example: 'stripe', urlPattern: 'boards.greenhouse.io/<slug>' },
  LEVER: { example: 'leverdemo', urlPattern: 'jobs.lever.co/<slug>' },
  ASHBY: { example: 'ashby', urlPattern: 'jobs.ashbyhq.com/<slug>' },
  WORKABLE: { example: 'epignosis', urlPattern: 'apply.workable.com/<slug>' },
  SMARTRECRUITERS: { example: 'boschgroup', urlPattern: 'jobs.smartrecruiters.com/<company>' },
};

export function slugFromBoardInput(provider: BoardProvider, input: string): string {
  const trimmed = input.trim();
  const patterns: Record<BoardProvider, RegExp> = {
    GREENHOUSE: /greenhouse\.io\/(?:embed\/job_board\?for=)?([a-z0-9._-]+)/i,
    LEVER: /lever\.co\/([a-z0-9._-]+)/i,
    ASHBY: /ashbyhq\.com\/([a-z0-9._-]+)/i,
    WORKABLE: /workable\.com\/([a-z0-9._-]+)/i,
    SMARTRECRUITERS: /smartrecruiters\.com\/([a-z0-9._-]+)/i,
  };
  const match = patterns[provider].exec(trimmed);
  return (match?.[1] ?? trimmed).toLowerCase();
}
