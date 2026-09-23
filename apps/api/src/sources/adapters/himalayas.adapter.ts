import { Injectable } from '@nestjs/common';
import { fetchJson } from '../http.js';
import { cleanTags, positive, text, toDate } from '../normalize.js';
import type {
  FetchResult,
  RawPosting,
  SourceAdapter,
} from '../source.types.js';

export const HIMALAYAS_URL = 'https://himalayas.app/jobs/api?limit=100';
export const HIMALAYAS_BOARD = 'all';

export type HimalayasJob = {
  title?: string;
  excerpt?: string;
  companyName?: string;
  companySlug?: string;
  employmentType?: string;
  minSalary?: number | null;
  maxSalary?: number | null;
  currency?: string | null;
  seniority?: string[];
  locationRestrictions?: string[];
  categories?: string[];
  parentCategories?: string[];
  description?: string;
  pubDate?: number;
  applicationLink?: string;
  guid?: string;
};

export type HimalayasPayload = { jobs?: HimalayasJob[] };

function salaryFor(job: HimalayasJob): {
  salaryText: string | null;
  salaryMinUsd: number | null;
  salaryMaxUsd: number | null;
} {
  const min = positive(job.minSalary);
  const max = positive(job.maxSalary);
  if (min === null && max === null) {
    return { salaryText: null, salaryMinUsd: null, salaryMaxUsd: null };
  }
  const currency = (job.currency ?? 'USD').toUpperCase();
  if (currency === 'USD') {
    return { salaryText: null, salaryMinUsd: min, salaryMaxUsd: max };
  }
  const parts = [min, max].filter((value): value is number => value !== null);
  return {
    salaryText: `${currency} ${parts.map((value) => value.toLocaleString('en-US')).join('–')}`,
    salaryMinUsd: null,
    salaryMaxUsd: null,
  };
}

export function mapHimalayas(payload: HimalayasPayload): RawPosting[] {
  const jobs = Array.isArray(payload.jobs) ? payload.jobs : [];
  const items: RawPosting[] = [];

  for (const job of jobs) {
    const role = text(job.title);
    const guid = text(job.guid) ?? text(job.applicationLink);
    if (!role || !guid) {
      continue;
    }
    const company = text(job.companyName);
    const locations = (job.locationRestrictions ?? []).filter(
      (value): value is string =>
        typeof value === 'string' && value.trim().length > 0,
    );
    items.push({
      source: 'HIMALAYAS',
      externalId: guid,
      boardId: HIMALAYAS_BOARD,
      author: company ?? 'Himalayas',
      postedAt: toDate(job.pubDate),
      url: guid,
      applyUrl: text(job.applicationLink) ?? guid,
      company,
      role,
      location: locations.length > 0 ? locations.join(', ') : 'Worldwide',
      remote: 'REMOTE',
      ...salaryFor(job),
      tags: cleanTags([
        ...(job.categories ?? []),
        ...(job.parentCategories ?? []),
        ...(job.seniority ?? []),
        job.employmentType ?? '',
      ]),
      html: job.description ?? job.excerpt ?? '',
      headline: null,
    });
  }

  return items;
}

@Injectable()
export class HimalayasAdapter implements SourceAdapter {
  readonly source = 'HIMALAYAS' as const;

  async fetch(): Promise<FetchResult> {
    const payload = await fetchJson<HimalayasPayload>(HIMALAYAS_URL);
    return { boardId: HIMALAYAS_BOARD, items: mapHimalayas(payload) };
  }
}
