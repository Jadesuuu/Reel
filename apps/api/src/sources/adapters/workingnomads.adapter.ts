import { Injectable } from '@nestjs/common';
import { fetchJson } from '../http.js';
import { cleanTags, text, toDate } from '../normalize.js';
import type {
  FetchResult,
  RawPosting,
  SourceAdapter,
} from '../source.types.js';

export const WORKINGNOMADS_URL =
  'https://www.workingnomads.com/api/exposed_jobs/';
export const WORKINGNOMADS_BOARD = 'development';

const DEVELOPMENT_CATEGORIES = new Set(['development', 'devops', 'sysadmin']);

export type WorkingNomadsJob = {
  url?: string;
  title?: string;
  description?: string;
  company_name?: string;
  category_name?: string;
  tags?: string;
  location?: string;
  pub_date?: string;
};

export function stripCompanyPrefix(
  title: string,
  company: string | null,
): string {
  if (!company) {
    return title;
  }
  const prefix = `${company} - `;
  return title.startsWith(prefix) ? title.slice(prefix.length).trim() : title;
}

export function mapWorkingNomads(payload: unknown): RawPosting[] {
  if (!Array.isArray(payload)) {
    return [];
  }
  const items: RawPosting[] = [];

  for (const job of payload as WorkingNomadsJob[]) {
    const url = text(job.url);
    const title = text(job.title);
    const category = (job.category_name ?? '').trim().toLowerCase();
    if (!url || !title || !DEVELOPMENT_CATEGORIES.has(category)) {
      continue;
    }
    const idMatch = /\/job\/go\/(\d+)\/?$/.exec(url);
    const company = text(job.company_name);
    items.push({
      source: 'WORKINGNOMADS',
      externalId: idMatch?.[1] ?? url,
      boardId: WORKINGNOMADS_BOARD,
      author: company ?? 'Working Nomads',
      postedAt: toDate(job.pub_date),
      url,
      applyUrl: url,
      company,
      role: stripCompanyPrefix(title, company),
      location: text(job.location),
      remote: 'REMOTE',
      salaryText: null,
      salaryMinUsd: null,
      salaryMaxUsd: null,
      tags: cleanTags((job.tags ?? '').split(',')),
      html: job.description ?? '',
      headline: null,
    });
  }

  return items;
}

@Injectable()
export class WorkingNomadsAdapter implements SourceAdapter {
  readonly source = 'WORKINGNOMADS' as const;

  async fetch(): Promise<FetchResult> {
    const payload = await fetchJson<unknown>(WORKINGNOMADS_URL);
    return { boardId: WORKINGNOMADS_BOARD, items: mapWorkingNomads(payload) };
  }
}
