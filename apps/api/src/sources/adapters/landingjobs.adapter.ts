import { Injectable } from '@nestjs/common';
import { fetchJson } from '../http.js';
import { cleanTags, positive, text, toDate } from '../normalize.js';
import type {
  FetchResult,
  RawPosting,
  SourceAdapter,
} from '../source.types.js';
import { titleCaseSlug } from './lever.adapter.js';

export const LANDINGJOBS_URL = 'https://landing.jobs/api/v1/jobs?limit=100';
export const LANDINGJOBS_BOARD = 'all';

const CURRENCY_SYMBOL: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
};

export type LandingJob = {
  id?: number;
  title?: string;
  url?: string;
  currency_code?: string;
  gross_salary_low?: number | null;
  gross_salary_high?: number | null;
  remote?: boolean;
  published_at?: string;
  tags?: string[];
  locations?: Array<{ city?: string; country_code?: string }>;
  role_description?: string;
  main_requirements?: string;
  nice_to_have?: string;
  perks?: string;
};

export function companyFromLandingUrl(url: string): string | null {
  const match = /\/at\/([^/]+)\//.exec(url);
  return match?.[1] ? titleCaseSlug(match[1]) : null;
}

export function landingSalary(job: LandingJob): {
  salaryText: string | null;
  salaryMinUsd: number | null;
  salaryMaxUsd: number | null;
} {
  const low = positive(job.gross_salary_low);
  const high = positive(job.gross_salary_high);
  if (low === null && high === null) {
    return { salaryText: null, salaryMinUsd: null, salaryMaxUsd: null };
  }
  const code = (job.currency_code ?? '').toUpperCase();
  const symbol = CURRENCY_SYMBOL[code] ?? `${code} `;
  const k = (value: number) => `${symbol}${Math.round(value / 1000)}k`;
  const salaryText =
    low !== null && high !== null
      ? `${k(low)}–${k(high)}`
      : k((low ?? high) as number);
  const usd = code === 'USD';
  return {
    salaryText,
    salaryMinUsd: usd ? low : null,
    salaryMaxUsd: usd ? high : null,
  };
}

export function mapLandingJobs(payload: unknown): RawPosting[] {
  if (!Array.isArray(payload)) {
    return [];
  }
  const items: RawPosting[] = [];

  for (const job of payload as LandingJob[]) {
    const url = text(job.url);
    const role = text(job.title);
    if (!url || !role || job.id === undefined) {
      continue;
    }
    const company = companyFromLandingUrl(url);
    const location =
      (job.locations ?? [])
        .map((entry) =>
          [entry.city, entry.country_code].filter(Boolean).join(', '),
        )
        .filter((entry) => entry.length > 0)
        .join(' · ') || null;
    const html = [
      job.role_description ?? '',
      job.main_requirements
        ? `<h4>Requirements</h4>${job.main_requirements}`
        : '',
      job.nice_to_have ? `<h4>Nice to have</h4>${job.nice_to_have}` : '',
      job.perks ? `<h4>Perks</h4>${job.perks}` : '',
    ]
      .filter((part) => part.length > 0)
      .join('');
    items.push({
      source: 'LANDINGJOBS',
      externalId: String(job.id),
      boardId: LANDINGJOBS_BOARD,
      author: company ?? 'Landing.jobs',
      postedAt: toDate(job.published_at),
      url,
      applyUrl: url,
      company,
      role,
      location,
      remote: job.remote === true ? 'REMOTE' : null,
      ...landingSalary(job),
      tags: cleanTags(job.tags),
      html,
      headline: null,
    });
  }

  return items;
}

@Injectable()
export class LandingJobsAdapter implements SourceAdapter {
  readonly source = 'LANDINGJOBS' as const;

  async fetch(): Promise<FetchResult> {
    const payload = await fetchJson<unknown>(LANDINGJOBS_URL);
    return { boardId: LANDINGJOBS_BOARD, items: mapLandingJobs(payload) };
  }
}
