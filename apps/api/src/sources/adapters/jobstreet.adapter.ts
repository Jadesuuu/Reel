import { Injectable } from '@nestjs/common';
import type { RemoteType } from '../../hn/hn.parser.js';
import { escapeHtml, paragraphs } from '../browser/html.js';
import { fetchJson } from '../http.js';
import { cleanTags, text, toDate } from '../normalize.js';
import type {
  FetchResult,
  RawPosting,
  SourceAdapter,
} from '../source.types.js';

export const JOBSTREET_BASE = 'https://ph.jobstreet.com';
export const JOBSTREET_BOARD = 'software-engineer';
export const JOBSTREET_PAGE_SIZE = 100;

export type JobStreetJob = {
  id?: string;
  title?: string;
  companyName?: string | null;
  advertiser?: { id?: string; description?: string } | null;
  listingDate?: string;
  salaryLabel?: string | null;
  workTypes?: string[];
  workArrangements?: { displayText?: string | null } | null;
  teaser?: string | null;
  bulletPoints?: string[];
  locations?: Array<{ label?: string; countryCode?: string }>;
  classifications?: Array<{
    classification?: { description?: string };
    subclassification?: { description?: string };
  }>;
  roleId?: string;
};

export type JobStreetPayload = { data?: JobStreetJob[]; totalCount?: number };

export function jobStreetUrl(boardId: string): string {
  const query = new URLSearchParams({
    siteKey: 'PH-Main',
    sourcesystem: 'houston',
    keywords: boardId.replace(/-+/g, ' ').trim(),
    page: '1',
    sortmode: 'ListedDate',
    pageSize: String(JOBSTREET_PAGE_SIZE),
    locale: 'en-PH',
  });
  return `${JOBSTREET_BASE}/api/jobsearch/v5/search?${query.toString()}`;
}

export function jobStreetRemote(
  displayText: string | null | undefined,
): RemoteType | null {
  switch ((displayText ?? '').toLowerCase()) {
    case 'remote':
      return 'REMOTE';
    case 'hybrid':
      return 'HYBRID';
    case 'on-site':
    case 'onsite':
      return 'ONSITE';
    default:
      return null;
  }
}

function strings(values: unknown): string[] {
  return Array.isArray(values)
    ? values.filter(
        (value): value is string =>
          typeof value === 'string' && value.trim().length > 0,
      )
    : [];
}

export function mapJobStreet(
  payload: JobStreetPayload,
  boardId: string,
): RawPosting[] {
  const jobs = Array.isArray(payload.data) ? payload.data : [];
  const items: RawPosting[] = [];
  const seen = new Set<string>();

  for (const job of jobs) {
    const id = text(job.id);
    const role = text(job.title);
    if (!id || !role || seen.has(id)) {
      continue;
    }
    seen.add(id);

    const company = text(job.companyName) ?? text(job.advertiser?.description);
    const url = `${JOBSTREET_BASE}/job/${encodeURIComponent(id)}`;
    const locations = (job.locations ?? [])
      .map((location) => text(location.label))
      .filter((label): label is string => label !== null);
    const bullets = strings(job.bulletPoints);
    const classification = (job.classifications ?? [])
      .map((entry) => text(entry.subclassification?.description))
      .filter((value): value is string => value !== null);

    items.push({
      source: 'JOBSTREET',
      externalId: id,
      boardId,
      author: company ?? 'JobStreet',
      postedAt: toDate(job.listingDate),
      url,
      applyUrl: url,
      company,
      role,
      location: locations.length > 0 ? locations.join('; ') : 'Philippines',
      remote: jobStreetRemote(job.workArrangements?.displayText),
      salaryText: text(job.salaryLabel),
      salaryMinUsd: null,
      salaryMaxUsd: null,
      tags: cleanTags([
        ...strings(job.workTypes),
        ...classification,
        job.workArrangements?.displayText ?? '',
      ]),
      html:
        paragraphs([text(job.teaser)]) +
        (bullets.length > 0
          ? `<ul>${bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul>`
          : ''),
      headline: null,
    });
  }

  return items;
}

@Injectable()
export class JobStreetAdapter implements SourceAdapter {
  readonly source = 'JOBSTREET' as const;

  async fetch(boardId: string = JOBSTREET_BOARD): Promise<FetchResult> {
    const payload = await fetchJson<JobStreetPayload>(jobStreetUrl(boardId));
    return { boardId, items: mapJobStreet(payload, boardId) };
  }
}
