import { Injectable } from '@nestjs/common';
import { fetchJson } from '../http.js';
import { cleanTags, positive, text, toDate } from '../normalize.js';
import type {
  FetchResult,
  RawPosting,
  SourceAdapter,
} from '../source.types.js';

export const REMOTEOK_URL = 'https://remoteok.com/api';
export const REMOTEOK_BOARD = 'all';

export type RemoteOkJob = {
  id?: string | number;
  slug?: string;
  epoch?: number;
  date?: string;
  company?: string;
  position?: string;
  tags?: string[];
  description?: string;
  location?: string;
  apply_url?: string;
  url?: string;
  salary_min?: number;
  salary_max?: number;
  legal?: string;
};

export function mapRemoteOk(payload: unknown): RawPosting[] {
  if (!Array.isArray(payload)) {
    return [];
  }
  const items: RawPosting[] = [];

  for (const entry of payload as RemoteOkJob[]) {
    if (!entry || typeof entry !== 'object' || 'legal' in entry) {
      continue;
    }
    const role = text(entry.position);
    if (!role || entry.id === undefined) {
      continue;
    }
    const company = text(entry.company);
    items.push({
      source: 'REMOTEOK',
      externalId: String(entry.id),
      boardId: REMOTEOK_BOARD,
      author: company ?? 'Remote OK',
      postedAt: toDate(entry.date ?? entry.epoch),
      url: text(entry.url),
      applyUrl: text(entry.apply_url) ?? text(entry.url),
      company,
      role,
      location: text(entry.location),
      remote: 'REMOTE',
      salaryText: null,
      salaryMinUsd: positive(entry.salary_min),
      salaryMaxUsd: positive(entry.salary_max),
      tags: cleanTags(entry.tags),
      html: entry.description ?? '',
      headline: null,
    });
  }

  return items;
}

@Injectable()
export class RemoteOkAdapter implements SourceAdapter {
  readonly source = 'REMOTEOK' as const;

  async fetch(): Promise<FetchResult> {
    const payload = await fetchJson<unknown>(REMOTEOK_URL);
    return { boardId: REMOTEOK_BOARD, items: mapRemoteOk(payload) };
  }
}
