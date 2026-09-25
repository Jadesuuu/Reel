import { Injectable } from '@nestjs/common';
import { fetchJson } from '../http.js';
import { cleanTags, text, toDate } from '../normalize.js';
import type {
  FetchResult,
  RawPosting,
  SourceAdapter,
} from '../source.types.js';

export const THEMUSE_BASE =
  'https://www.themuse.com/api/public/jobs?category=Software%20Engineering&page=';
export const THEMUSE_BOARD = 'software-engineering';
export const THEMUSE_PAGES = 3;

export type MuseJob = {
  id?: number;
  name?: string;
  contents?: string;
  publication_date?: string;
  locations?: Array<{ name?: string }>;
  categories?: Array<{ name?: string }>;
  levels?: Array<{ name?: string }>;
  refs?: { landing_page?: string };
  company?: { name?: string };
};

export type MusePayload = { results?: MuseJob[] };

export function mapTheMuse(payload: MusePayload): RawPosting[] {
  const items: RawPosting[] = [];

  for (const job of payload.results ?? []) {
    const role = text(job.name);
    const url = text(job.refs?.landing_page);
    if (!role || !url || job.id === undefined) {
      continue;
    }
    const locations = (job.locations ?? [])
      .map((entry) => text(entry.name))
      .filter((entry): entry is string => entry !== null);
    const remote = locations.some((entry) => /remote|flexible/i.test(entry));
    items.push({
      source: 'THEMUSE',
      externalId: String(job.id),
      boardId: THEMUSE_BOARD,
      author: text(job.company?.name) ?? 'The Muse',
      postedAt: toDate(job.publication_date),
      url,
      applyUrl: url,
      company: text(job.company?.name),
      role,
      location: locations.length > 0 ? locations.join(', ') : null,
      remote: remote ? 'REMOTE' : null,
      salaryText: null,
      salaryMinUsd: null,
      salaryMaxUsd: null,
      tags: cleanTags([
        ...(job.categories ?? []).map((entry) => entry.name ?? ''),
        ...(job.levels ?? []).map((entry) => entry.name ?? ''),
      ]),
      html: job.contents ?? '',
      headline: null,
    });
  }

  return items;
}

@Injectable()
export class TheMuseAdapter implements SourceAdapter {
  readonly source = 'THEMUSE' as const;

  async fetch(): Promise<FetchResult> {
    const items: RawPosting[] = [];
    for (let page = 1; page <= THEMUSE_PAGES; page += 1) {
      const payload = await fetchJson<MusePayload>(`${THEMUSE_BASE}${page}`);
      items.push(...mapTheMuse(payload));
    }
    return { boardId: THEMUSE_BOARD, items };
  }
}
