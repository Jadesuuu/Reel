import { Injectable } from '@nestjs/common';
import { fetchJson, isNotFound } from '../http.js';
import { cleanTags, text, toDate } from '../normalize.js';
import type {
  BoardAdapter,
  BoardDescription,
  FetchResult,
  RawPosting,
} from '../source.types.js';
import type { RemoteType } from '../../hn/hn.parser.js';
import { titleCaseSlug } from './lever.adapter.js';

export const ASHBY_BASE = 'https://api.ashbyhq.com/posting-api/job-board';

export type AshbyJob = {
  id?: string;
  title?: string;
  department?: string;
  team?: string;
  employmentType?: string;
  location?: string;
  publishedAt?: string;
  isListed?: boolean;
  isRemote?: boolean;
  workplaceType?: string;
  jobUrl?: string;
  applyUrl?: string;
  descriptionHtml?: string;
  descriptionPlain?: string;
  compensation?: {
    compensationTierSummary?: string;
    scrapeableCompensationSalarySummary?: string;
  } | null;
};

export type AshbyPayload = { jobs?: AshbyJob[] };

function remoteFor(job: AshbyJob): RemoteType | null {
  if (job.isRemote === true) {
    return 'REMOTE';
  }
  switch ((job.workplaceType ?? '').toLowerCase()) {
    case 'remote':
      return 'REMOTE';
    case 'hybrid':
      return 'HYBRID';
    case 'onsite':
    case 'on-site':
      return 'ONSITE';
    default:
      return null;
  }
}

export function mapAshby(payload: AshbyPayload, slug: string): RawPosting[] {
  const jobs = Array.isArray(payload.jobs) ? payload.jobs : [];
  const company = titleCaseSlug(slug);
  const items: RawPosting[] = [];

  for (const job of jobs) {
    const role = text(job.title);
    const id = text(job.id);
    if (!role || !id || job.isListed === false) {
      continue;
    }
    items.push({
      source: 'ASHBY',
      externalId: id,
      boardId: slug,
      author: company,
      postedAt: toDate(job.publishedAt),
      url: text(job.jobUrl),
      applyUrl: text(job.applyUrl) ?? text(job.jobUrl),
      company,
      role,
      location: text(job.location),
      remote: remoteFor(job),
      salaryText:
        text(job.compensation?.scrapeableCompensationSalarySummary) ??
        text(job.compensation?.compensationTierSummary),
      salaryMinUsd: null,
      salaryMaxUsd: null,
      tags: cleanTags([
        job.department ?? '',
        job.team ?? '',
        job.employmentType ?? '',
      ]),
      html: job.descriptionHtml ?? job.descriptionPlain ?? '',
      headline: null,
    });
  }

  return items;
}

@Injectable()
export class AshbyAdapter implements BoardAdapter {
  readonly source = 'ASHBY' as const;

  async describeBoard(slug: string): Promise<BoardDescription | null> {
    try {
      const payload = await fetchJson<AshbyPayload>(
        `${ASHBY_BASE}/${encodeURIComponent(slug)}`,
      );
      if (!Array.isArray(payload.jobs)) {
        return null;
      }
      return { company: titleCaseSlug(slug), jobs: payload.jobs.length };
    } catch (error) {
      if (isNotFound(error)) {
        return null;
      }
      throw error;
    }
  }

  async fetch(boardId?: string): Promise<FetchResult> {
    if (!boardId) {
      throw new Error('Ashby needs a board slug');
    }
    const payload = await fetchJson<AshbyPayload>(
      `${ASHBY_BASE}/${encodeURIComponent(boardId)}?includeCompensation=true`,
    );
    return { boardId, items: mapAshby(payload, boardId) };
  }
}
