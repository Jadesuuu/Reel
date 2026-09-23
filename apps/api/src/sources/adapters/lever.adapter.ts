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

export const LEVER_BASE = 'https://api.lever.co/v0/postings';

export type LeverPosting = {
  id?: string;
  text?: string;
  categories?: {
    location?: string;
    team?: string;
    department?: string;
    commitment?: string;
    allLocations?: string[];
  };
  createdAt?: number;
  workplaceType?: string;
  country?: string;
  hostedUrl?: string;
  applyUrl?: string;
  description?: string;
  additional?: string;
  lists?: Array<{ text?: string; content?: string }>;
};

export function titleCaseSlug(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function remoteFor(workplaceType: string | undefined): RemoteType | null {
  switch ((workplaceType ?? '').toLowerCase()) {
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

export function mapLever(payload: unknown, slug: string): RawPosting[] {
  if (!Array.isArray(payload)) {
    return [];
  }
  const company = titleCaseSlug(slug);
  const items: RawPosting[] = [];

  for (const posting of payload as LeverPosting[]) {
    const role = text(posting.text);
    const id = text(posting.id);
    if (!role || !id) {
      continue;
    }
    const lists = (posting.lists ?? [])
      .map(
        (list) => `<h4>${list.text ?? ''}</h4><ul>${list.content ?? ''}</ul>`,
      )
      .join('');
    items.push({
      source: 'LEVER',
      externalId: id,
      boardId: slug,
      author: company,
      postedAt: toDate(posting.createdAt),
      url: text(posting.hostedUrl),
      applyUrl: text(posting.applyUrl) ?? text(posting.hostedUrl),
      company,
      role,
      location: text(posting.categories?.location),
      remote: remoteFor(posting.workplaceType),
      salaryText: null,
      salaryMinUsd: null,
      salaryMaxUsd: null,
      tags: cleanTags([
        posting.categories?.team ?? '',
        posting.categories?.department ?? '',
        posting.categories?.commitment ?? '',
      ]),
      html: `${posting.description ?? ''}${lists}${posting.additional ?? ''}`,
      headline: null,
    });
  }

  return items;
}

@Injectable()
export class LeverAdapter implements BoardAdapter {
  readonly source = 'LEVER' as const;

  async describeBoard(slug: string): Promise<BoardDescription | null> {
    try {
      const payload = await fetchJson<unknown>(
        `${LEVER_BASE}/${encodeURIComponent(slug)}?mode=json`,
      );
      if (!Array.isArray(payload)) {
        return null;
      }
      return { company: titleCaseSlug(slug), jobs: payload.length };
    } catch (error) {
      if (isNotFound(error)) {
        return null;
      }
      throw error;
    }
  }

  async fetch(boardId?: string): Promise<FetchResult> {
    if (!boardId) {
      throw new Error('Lever needs a board slug');
    }
    const payload = await fetchJson<unknown>(
      `${LEVER_BASE}/${encodeURIComponent(boardId)}?mode=json`,
    );
    return { boardId, items: mapLever(payload, boardId) };
  }
}
