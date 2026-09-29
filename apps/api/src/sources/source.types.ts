import type { RemoteType } from '../hn/hn.parser.js';

export const SOURCES = [
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
] as const;

export type Source = (typeof SOURCES)[number];

export const BOARD_PROVIDERS = [
  'GREENHOUSE',
  'LEVER',
  'ASHBY',
  'WORKABLE',
  'SMARTRECRUITERS',
] as const;

export type BoardProvider = (typeof BOARD_PROVIDERS)[number];

export const BROWSER_SOURCES = ['HIRINGCAFE', 'WELLFOUND'] as const;

export type BrowserSource = (typeof BROWSER_SOURCES)[number];

export type SourceKind = 'feed' | 'board' | 'browser';

export function isSource(value: unknown): value is Source {
  return (
    typeof value === 'string' && (SOURCES as readonly string[]).includes(value)
  );
}

export function isBrowserSource(value: unknown): value is BrowserSource {
  return (
    typeof value === 'string' &&
    (BROWSER_SOURCES as readonly string[]).includes(value)
  );
}

export function isBoardProvider(value: unknown): value is BoardProvider {
  return (
    typeof value === 'string' &&
    (BOARD_PROVIDERS as readonly string[]).includes(value)
  );
}

export type RawPosting = {
  source: Source;
  externalId: string;
  boardId: string;
  author: string;
  postedAt: Date;
  url: string | null;
  applyUrl: string | null;
  company: string | null;
  role: string | null;
  location: string | null;
  remote: RemoteType | null;
  salaryText: string | null;
  salaryMinUsd: number | null;
  salaryMaxUsd: number | null;
  tags: string[];
  html: string;
  headline: string | null;
};

export type NormalizedPosting = {
  source: Source;
  externalId: string;
  boardId: string;
  author: string;
  postedAt: Date;
  url: string | null;
  applyUrl: string | null;
  company: string | null;
  role: string | null;
  location: string | null;
  remote: RemoteType;
  salaryText: string | null;
  salaryMinUsd: number | null;
  salaryMaxUsd: number | null;
  stackKeywords: string[];
  regionTerms: string[];
  level: string | null;
  rawHtml: string;
  rawText: string;
  headline: string;
  fingerprint: string;
};

export type FetchResult = { boardId: string; items: RawPosting[] };

export interface SourceAdapter {
  readonly source: Source;
  fetch(boardId?: string): Promise<FetchResult>;
}

export type BoardDescription = { company: string; jobs: number };

export interface BoardAdapter extends SourceAdapter {
  readonly source: BoardProvider;
  describeBoard(slug: string): Promise<BoardDescription | null>;
}
