import { pageProps, pick } from '../next-data.js';
import type { PageResult, Site } from './types.js';

export const HIRINGCAFE_HOST = 'hiringcafe.com';

const V5_KEYS = [
  'core_job_title',
  'company_name',
  'company_website',
  'workplace_type',
  'workplace_countries',
  'workplace_continents',
  'is_workplace_worldwide_ok',
  'formatted_workplace_location',
  'yearly_min_compensation',
  'yearly_max_compensation',
  'listed_compensation_currency',
  'listed_compensation_frequency',
  'estimated_publish_date',
  'estimated_publish_date_millis',
  'technical_tools',
  'requirements_summary',
  'commitment',
  'seniority_level',
  'role_type',
  'job_category',
  'visa_sponsorship',
] as const;

export function hiringCafeSearchState(boardId: string): Record<string, unknown> {
  return {
    searchQuery: boardId.replace(/-+/g, ' ').trim(),
    workplaceTypes: ['Remote'],
    defaultToUserLocation: false,
    locations: [],
    sortBy: 'date',
  };
}

export function hiringCafeUrl(boardId: string, page: number): string {
  const state = encodeURIComponent(JSON.stringify(hiringCafeSearchState(boardId)));
  return `https://${HIRINGCAFE_HOST}/?searchState=${state}&page=${page}`;
}

type Hit = Record<string, unknown>;

export function projectHiringCafe(nextData: unknown): PageResult {
  const props = pageProps(nextData);
  const hits = Array.isArray(props.ssrHits) ? (props.ssrHits as Hit[]) : [];
  let oldestMs: number | null = null;

  const items = hits
    .filter((hit) => typeof hit === 'object' && hit !== null)
    .map((hit) => {
      const data = pick<Record<string, unknown>>(hit.v5_processed_job_data, V5_KEYS);
      const millis = data?.estimated_publish_date_millis;
      if (typeof millis === 'number' && Number.isFinite(millis)) {
        oldestMs = oldestMs === null ? millis : Math.min(oldestMs, millis);
      }
      const info = pick<Record<string, unknown>>(hit.job_information, ['title']);
      return {
        id: hit.id,
        apply_url: hit.apply_url ?? null,
        is_expired: hit.is_expired === true,
        job_information: info,
        v5_processed_job_data: data,
        attributed_org: pick(hit.attributed_org, ['name', 'website']),
        enriched_company_data: pick(hit.enriched_company_data, ['name', 'homepage_uri']),
      };
    });

  return {
    items,
    lastPage: props.ssrIsLastPage === true || items.length === 0,
    oldestMs,
  };
}

export const hiringCafe: Site = {
  source: 'HIRINGCAFE',
  host: HIRINGCAFE_HOST,
  maxPages: 3,
  sortedByDate: true,
  url: hiringCafeUrl,
  project: projectHiringCafe,
};
