import { Injectable } from '@nestjs/common';
import { fetchJson } from '../http.js';
import { cleanTags, text, toDate } from '../normalize.js';
import type {
  FetchResult,
  RawPosting,
  SourceAdapter,
} from '../source.types.js';

export const ARBEITNOW_URL = 'https://www.arbeitnow.com/api/job-board-api';
export const ARBEITNOW_BOARD = 'all';

export type ArbeitnowJob = {
  slug?: string;
  company_name?: string;
  title?: string;
  description?: string;
  remote?: boolean;
  url?: string;
  tags?: string[];
  job_types?: string[];
  location?: string;
  created_at?: number;
};

export type ArbeitnowPayload = { data?: ArbeitnowJob[] };

export function mapArbeitnow(payload: ArbeitnowPayload): RawPosting[] {
  const jobs = Array.isArray(payload.data) ? payload.data : [];
  const items: RawPosting[] = [];

  for (const job of jobs) {
    const role = text(job.title);
    const slug = text(job.slug);
    if (!role || !slug) {
      continue;
    }
    const company = text(job.company_name);
    items.push({
      source: 'ARBEITNOW',
      externalId: slug,
      boardId: ARBEITNOW_BOARD,
      author: company ?? 'Arbeitnow',
      postedAt: toDate(job.created_at),
      url: text(job.url),
      applyUrl: text(job.url),
      company,
      role,
      location: text(job.location),
      remote: job.remote === true ? 'REMOTE' : null,
      salaryText: null,
      salaryMinUsd: null,
      salaryMaxUsd: null,
      tags: cleanTags([...(job.tags ?? []), ...(job.job_types ?? [])]),
      html: job.description ?? '',
      headline: null,
    });
  }

  return items;
}

@Injectable()
export class ArbeitnowAdapter implements SourceAdapter {
  readonly source = 'ARBEITNOW' as const;

  async fetch(): Promise<FetchResult> {
    const payload = await fetchJson<ArbeitnowPayload>(ARBEITNOW_URL);
    return { boardId: ARBEITNOW_BOARD, items: mapArbeitnow(payload) };
  }
}
