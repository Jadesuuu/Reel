import { Injectable } from '@nestjs/common';
import type { RemoteType } from '../../hn/hn.parser.js';
import { fetchJson } from '../http.js';
import { cleanTags, positive, text, toDate } from '../normalize.js';
import type {
  FetchResult,
  RawPosting,
  SourceAdapter,
} from '../source.types.js';

export const KALIBRR_BASE = 'https://www.kalibrr.com';
export const KALIBRR_BOARD = 'it-and-software';
export const KALIBRR_LIMIT = 100;

const FUNCTION_FOR_BOARD: Record<string, string> = {
  'it-and-software': 'IT and Software',
};

export type KalibrrJob = {
  id?: number | string;
  name?: string;
  slug?: string;
  company_name?: string | null;
  company?: { code?: string; name?: string } | null;
  activation_date?: string | null;
  created_at?: string | null;
  base_salary?: number | null;
  maximum_salary?: number | null;
  salary_currency?: string | null;
  salary_interval?: string | null;
  google_location?: {
    address_components?: {
      city?: string | null;
      region?: string | null;
      country?: string | null;
    } | null;
  } | null;
  is_work_from_home?: boolean;
  is_hybrid?: boolean;
  tenure?: string | null;
  function?: string | null;
  job_sds_skills?: Array<{ sds_skill?: { name?: string } | null }>;
  apply_redirect_url?: string | null;
  description?: string | null;
};

export type KalibrrPayload = { jobs?: KalibrrJob[]; count?: number };

export function kalibrrUrl(boardId: string): string {
  const query = new URLSearchParams({
    limit: String(KALIBRR_LIMIT),
    offset: '0',
    sort: 'Newest',
  });
  const fn = FUNCTION_FOR_BOARD[boardId];
  if (fn) {
    query.set('function', fn);
  } else {
    query.set('text', boardId.replace(/-+/g, ' ').trim());
  }
  return `${KALIBRR_BASE}/kjs/job_board/search?${query.toString()}`;
}

export function kalibrrRemote(job: KalibrrJob): RemoteType {
  if (job.is_work_from_home) {
    return 'REMOTE';
  }
  if (job.is_hybrid) {
    return 'HYBRID';
  }
  return 'ONSITE';
}

export function kalibrrLocation(job: KalibrrJob): string {
  const parts = job.google_location?.address_components ?? {};
  const named = [parts.city, parts.region, parts.country]
    .map((value) => text(value))
    .filter((value): value is string => value !== null);
  return named.length > 0 ? named.join(', ') : 'Philippines';
}

export function kalibrrSalaryText(job: KalibrrJob): string | null {
  const min = positive(job.base_salary);
  const max = positive(job.maximum_salary);
  if (min === null && max === null) {
    return null;
  }
  const currency = (job.salary_currency ?? 'PHP').toUpperCase();
  const range = [min, max]
    .filter((value): value is number => value !== null)
    .map((value) => value.toLocaleString('en-US'))
    .join('–');
  const interval = text(job.salary_interval);
  return `${currency} ${range}${interval ? ` per ${interval}` : ''}`;
}

export function mapKalibrr(
  payload: KalibrrPayload,
  boardId: string,
): RawPosting[] {
  const jobs = Array.isArray(payload.jobs) ? payload.jobs : [];
  const items: RawPosting[] = [];

  for (const job of jobs) {
    const id =
      typeof job.id === 'number' && Number.isFinite(job.id)
        ? String(job.id)
        : text(job.id);
    const role = text(job.name);
    if (!id || !role) {
      continue;
    }
    const company = text(job.company_name) ?? text(job.company?.name);
    const code = text(job.company?.code);
    const slug = text(job.slug) ?? id;
    const url = code
      ? `${KALIBRR_BASE}/c/${code}/jobs/${id}/${slug}`
      : `${KALIBRR_BASE}/jobs/${id}`;
    const skills = (job.job_sds_skills ?? [])
      .map((entry) => text(entry.sds_skill?.name))
      .filter((value): value is string => value !== null);

    items.push({
      source: 'KALIBRR',
      externalId: id,
      boardId,
      author: company ?? 'Kalibrr',
      postedAt: toDate(job.activation_date ?? job.created_at),
      url,
      applyUrl: text(job.apply_redirect_url) ?? url,
      company,
      role,
      location: kalibrrLocation(job),
      remote: kalibrrRemote(job),
      salaryText: kalibrrSalaryText(job),
      salaryMinUsd: null,
      salaryMaxUsd: null,
      tags: cleanTags([job.function ?? '', job.tenure ?? '', ...skills]),
      html: job.description ?? '',
      headline: null,
    });
  }

  return items;
}

@Injectable()
export class KalibrrAdapter implements SourceAdapter {
  readonly source = 'KALIBRR' as const;

  async fetch(boardId: string = KALIBRR_BOARD): Promise<FetchResult> {
    const payload = await fetchJson<KalibrrPayload>(kalibrrUrl(boardId));
    return { boardId, items: mapKalibrr(payload, boardId) };
  }
}
