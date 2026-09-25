import { Injectable } from '@nestjs/common';
import { fetchJson, mapLimit } from '../http.js';
import { cleanTags, text, toDate } from '../normalize.js';
import type {
  BoardAdapter,
  BoardDescription,
  FetchResult,
  RawPosting,
} from '../source.types.js';
import type { RemoteType } from '../../hn/hn.parser.js';

export const SMARTRECRUITERS_BASE =
  'https://api.smartrecruiters.com/v1/companies';
export const SMARTRECRUITERS_DETAIL_LIMIT = 60;
const DETAIL_CONCURRENCY = 5;

export type SmartRecruitersSection = { title?: string; text?: string };

export type SmartRecruitersPosting = {
  id?: string;
  name?: string;
  releasedDate?: string;
  company?: { identifier?: string; name?: string };
  location?: {
    fullLocation?: string;
    city?: string;
    country?: string;
    remote?: boolean;
    hybrid?: boolean;
  };
  function?: { label?: string };
  department?: { label?: string };
  experienceLevel?: { label?: string };
  postingUrl?: string;
  applyUrl?: string;
  jobAd?: { sections?: Record<string, SmartRecruitersSection | undefined> };
};

export type SmartRecruitersList = {
  totalFound?: number;
  content?: SmartRecruitersPosting[];
};

function remoteFor(posting: SmartRecruitersPosting): RemoteType | null {
  if (posting.location?.remote === true) {
    return 'REMOTE';
  }
  if (posting.location?.hybrid === true) {
    return 'HYBRID';
  }
  return null;
}

export function sectionsHtml(
  detail: SmartRecruitersPosting | undefined,
): string {
  const sections = detail?.jobAd?.sections ?? {};
  return Object.values(sections)
    .filter((section): section is SmartRecruitersSection =>
      Boolean(section?.text),
    )
    .map((section) =>
      section.title
        ? `<h4>${section.title}</h4>${section.text ?? ''}`
        : (section.text ?? ''),
    )
    .join('');
}

export function mapSmartRecruiters(
  list: SmartRecruitersList,
  details: Record<string, SmartRecruitersPosting | undefined>,
  identifier: string,
): RawPosting[] {
  const items: RawPosting[] = [];

  for (const posting of list.content ?? []) {
    const id = text(posting.id);
    const role = text(posting.name);
    if (!id || !role) {
      continue;
    }
    const detail = details[id];
    const company = text(posting.company?.name);
    const companyId = text(posting.company?.identifier) ?? identifier;
    const url =
      text(detail?.postingUrl) ??
      `https://jobs.smartrecruiters.com/${companyId}/${id}`;
    items.push({
      source: 'SMARTRECRUITERS',
      externalId: id,
      boardId: identifier,
      author: company ?? identifier,
      postedAt: toDate(posting.releasedDate),
      url,
      applyUrl: text(detail?.applyUrl) ?? url,
      company,
      role,
      location: text(posting.location?.fullLocation),
      remote: remoteFor(posting),
      salaryText: null,
      salaryMinUsd: null,
      salaryMaxUsd: null,
      tags: cleanTags([
        posting.function?.label ?? '',
        posting.department?.label ?? '',
        posting.experienceLevel?.label ?? '',
      ]),
      html: sectionsHtml(detail),
      headline: null,
    });
  }

  return items;
}

@Injectable()
export class SmartRecruitersAdapter implements BoardAdapter {
  readonly source = 'SMARTRECRUITERS' as const;

  async describeBoard(identifier: string): Promise<BoardDescription | null> {
    const list = await fetchJson<SmartRecruitersList>(
      `${SMARTRECRUITERS_BASE}/${encodeURIComponent(identifier)}/postings?limit=1`,
    );
    const first = list.content?.[0];
    if (!first || (list.totalFound ?? 0) === 0) {
      return null;
    }
    return {
      company: text(first.company?.name) ?? identifier,
      jobs: list.totalFound ?? 0,
    };
  }

  async fetch(boardId?: string): Promise<FetchResult> {
    if (!boardId) {
      throw new Error('SmartRecruiters needs a company identifier');
    }
    const company = encodeURIComponent(boardId);
    const list = await fetchJson<SmartRecruitersList>(
      `${SMARTRECRUITERS_BASE}/${company}/postings?limit=100`,
    );
    const postings = (list.content ?? []).slice(
      0,
      SMARTRECRUITERS_DETAIL_LIMIT,
    );
    const fetched = await mapLimit(
      postings,
      DETAIL_CONCURRENCY,
      async (posting) => {
        const id = text(posting.id);
        if (!id) {
          return null;
        }
        return fetchJson<SmartRecruitersPosting>(
          `${SMARTRECRUITERS_BASE}/${company}/postings/${id}`,
        );
      },
    );
    const details: Record<string, SmartRecruitersPosting | undefined> = {};
    for (const detail of fetched) {
      if (detail?.id) {
        details[detail.id] = detail;
      }
    }
    return {
      boardId,
      items: mapSmartRecruiters({ content: postings }, details, boardId),
    };
  }
}
