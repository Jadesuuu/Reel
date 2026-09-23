import { Injectable } from '@nestjs/common';
import { fetchJson } from '../http.js';
import { cleanTags, text, toDate } from '../normalize.js';
import type {
  FetchResult,
  RawPosting,
  SourceAdapter,
} from '../source.types.js';

export const REMOTIVE_URL =
  'https://remotive.com/api/remote-jobs?category=software-dev';
export const REMOTIVE_BOARD = 'software-dev';

export type RemotiveJob = {
  id?: number | string;
  url?: string;
  title?: string;
  company_name?: string;
  category?: string;
  tags?: string[];
  job_type?: string;
  publication_date?: string;
  candidate_required_location?: string;
  salary?: string;
  description?: string;
};

export type RemotivePayload = { jobs?: RemotiveJob[] };

export function mapRemotive(payload: RemotivePayload): RawPosting[] {
  const jobs = Array.isArray(payload.jobs) ? payload.jobs : [];
  const items: RawPosting[] = [];

  for (const job of jobs) {
    const role = text(job.title);
    if (!role || job.id === undefined) {
      continue;
    }
    const company = text(job.company_name);
    items.push({
      source: 'REMOTIVE',
      externalId: String(job.id),
      boardId: REMOTIVE_BOARD,
      author: company ?? 'Remotive',
      postedAt: toDate(job.publication_date),
      url: text(job.url),
      applyUrl: text(job.url),
      company,
      role,
      location: text(job.candidate_required_location),
      remote: 'REMOTE',
      salaryText: text(job.salary),
      salaryMinUsd: null,
      salaryMaxUsd: null,
      tags: cleanTags([
        ...(job.tags ?? []),
        job.category ?? '',
        job.job_type ?? '',
      ]),
      html: job.description ?? '',
      headline: null,
    });
  }

  return items;
}

@Injectable()
export class RemotiveAdapter implements SourceAdapter {
  readonly source = 'REMOTIVE' as const;

  async fetch(): Promise<FetchResult> {
    const payload = await fetchJson<RemotivePayload>(REMOTIVE_URL);
    return { boardId: REMOTIVE_BOARD, items: mapRemotive(payload) };
  }
}
