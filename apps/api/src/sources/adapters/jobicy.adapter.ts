import { Injectable } from '@nestjs/common';
import { fetchJson } from '../http.js';
import { cleanTags, positive, text, toDate } from '../normalize.js';
import type {
  FetchResult,
  RawPosting,
  SourceAdapter,
} from '../source.types.js';

export const JOBICY_URL =
  'https://jobicy.com/api/v2/remote-jobs?count=100&tag=developer';
export const JOBICY_BOARD = 'developer';

export type JobicyJob = {
  id?: number | string;
  url?: string;
  jobSlug?: string;
  jobTitle?: string;
  companyName?: string;
  jobIndustry?: string[];
  jobType?: string[];
  jobGeo?: string;
  jobLevel?: string;
  jobExcerpt?: string;
  jobDescription?: string;
  pubDate?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
};

export type JobicyPayload = { jobs?: JobicyJob[] };

function salaryFor(job: JobicyJob): {
  salaryText: string | null;
  salaryMinUsd: number | null;
  salaryMaxUsd: number | null;
} {
  const min = positive(job.salaryMin);
  const max = positive(job.salaryMax);
  if (min === null && max === null) {
    return { salaryText: null, salaryMinUsd: null, salaryMaxUsd: null };
  }
  const currency = (job.salaryCurrency ?? 'USD').toUpperCase();
  const annual = !job.salaryPeriod || /year|annual/i.test(job.salaryPeriod);
  if (currency === 'USD' && annual) {
    return { salaryText: null, salaryMinUsd: min, salaryMaxUsd: max };
  }
  const parts = [min, max].filter((value): value is number => value !== null);
  return {
    salaryText: `${currency} ${parts.map((value) => value.toLocaleString('en-US')).join('–')}${
      annual ? '' : ` / ${job.salaryPeriod}`
    }`,
    salaryMinUsd: null,
    salaryMaxUsd: null,
  };
}

export function mapJobicy(payload: JobicyPayload): RawPosting[] {
  const jobs = Array.isArray(payload.jobs) ? payload.jobs : [];
  const items: RawPosting[] = [];

  for (const job of jobs) {
    const role = text(job.jobTitle);
    if (!role || job.id === undefined) {
      continue;
    }
    const company = text(job.companyName);
    items.push({
      source: 'JOBICY',
      externalId: String(job.id),
      boardId: JOBICY_BOARD,
      author: company ?? 'Jobicy',
      postedAt: toDate(job.pubDate),
      url: text(job.url),
      applyUrl: text(job.url),
      company,
      role,
      location: text(job.jobGeo),
      remote: 'REMOTE',
      ...salaryFor(job),
      tags: cleanTags([
        ...(job.jobIndustry ?? []),
        ...(job.jobType ?? []),
        job.jobLevel ?? '',
      ]),
      html: job.jobDescription ?? job.jobExcerpt ?? '',
      headline: null,
    });
  }

  return items;
}

@Injectable()
export class JobicyAdapter implements SourceAdapter {
  readonly source = 'JOBICY' as const;

  async fetch(): Promise<FetchResult> {
    const payload = await fetchJson<JobicyPayload>(JOBICY_URL);
    return { boardId: JOBICY_BOARD, items: mapJobicy(payload) };
  }
}
