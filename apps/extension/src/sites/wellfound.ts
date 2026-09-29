import { pageProps, pick } from '../next-data.js';
import type { PageResult, Site } from './types.js';

export const WELLFOUND_HOST = 'wellfound.com';

const JOB_KEYS = [
  'id',
  'title',
  'slug',
  'description',
  'jobType',
  'liveStartAt',
  'locationNames',
  'remote',
  'acceptedRemoteLocationNames',
  'compensation',
  'yearsExperienceMin',
  'yearsExperienceMax',
] as const;

const STARTUP_KEYS = ['id', 'name', 'slug', 'highConcept', 'companySize'] as const;

export function wellfoundUrl(boardId: string, page: number): string {
  const suffix = page > 0 ? `?page=${page + 1}` : '';
  return `https://${WELLFOUND_HOST}/role/r/${encodeURIComponent(boardId)}${suffix}`;
}

type Entity = Record<string, unknown>;

function apolloEntities(nextData: unknown): Record<string, Entity> {
  const props = pageProps(nextData);
  const apollo = props.apolloState as { data?: unknown } | undefined;
  const data = apollo?.data;
  return typeof data === 'object' && data !== null ? (data as Record<string, Entity>) : {};
}

export function projectWellfound(nextData: unknown): PageResult {
  const entities = apolloEntities(nextData);
  const items: unknown[] = [];
  let oldestMs: number | null = null;

  for (const [key, startup] of Object.entries(entities)) {
    if (!key.startsWith('StartupResult:') || typeof startup !== 'object' || !startup) {
      continue;
    }
    const listings = startup.highlightedJobListings;
    if (!Array.isArray(listings)) {
      continue;
    }
    for (const ref of listings) {
      const target = (ref as { __ref?: unknown } | null)?.__ref;
      const job = typeof target === 'string' ? entities[target] : undefined;
      if (!job) {
        continue;
      }
      const picked = pick<Record<string, unknown>>(job, JOB_KEYS) ?? {};
      const config = job.remoteConfig as Entity | null | undefined;
      const liveStartAt = picked.liveStartAt;
      if (typeof liveStartAt === 'number' && Number.isFinite(liveStartAt)) {
        const millis = liveStartAt * 1000;
        oldestMs = oldestMs === null ? millis : Math.min(oldestMs, millis);
      }
      items.push({
        ...picked,
        remoteConfig: config
          ? { kind: config.kind ?? null, wfhFlexible: config.wfhFlexible === true }
          : null,
        startup: pick(startup, STARTUP_KEYS),
      });
    }
  }

  return { items, lastPage: items.length === 0, oldestMs };
}

export const wellfound: Site = {
  source: 'WELLFOUND',
  host: WELLFOUND_HOST,
  maxPages: 3,
  sortedByDate: false,
  url: wellfoundUrl,
  project: projectWellfound,
};
