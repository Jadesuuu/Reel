import { Injectable } from '@nestjs/common';
import { fetchText } from '../http.js';
import { cleanTags, text, toDate } from '../normalize.js';
import { parseRssItems } from '../rss.js';
import type {
  FetchResult,
  RawPosting,
  SourceAdapter,
} from '../source.types.js';

export const WEWORKREMOTELY_URL =
  'https://weworkremotely.com/categories/remote-programming-jobs.rss';
export const WEWORKREMOTELY_BOARD = 'remote-programming-jobs';

export function splitWwrTitle(title: string): {
  company: string | null;
  role: string;
} {
  const index = title.indexOf(':');
  if (index <= 0) {
    return { company: null, role: title.trim() };
  }
  const company = title.slice(0, index).trim();
  const role = title.slice(index + 1).trim();
  return role.length > 0
    ? { company, role }
    : { company: null, role: title.trim() };
}

export function mapWeWorkRemotely(xml: string): RawPosting[] {
  const items: RawPosting[] = [];

  for (const item of parseRssItems(xml)) {
    const title = text(item.title);
    const guid = text(item.guid) ?? text(item.link);
    if (!title || !guid) {
      continue;
    }
    const { company, role } = splitWwrTitle(title);
    items.push({
      source: 'WEWORKREMOTELY',
      externalId: guid,
      boardId: WEWORKREMOTELY_BOARD,
      author: company ?? 'We Work Remotely',
      postedAt: toDate(item.pubDate),
      url: text(item.link) ?? guid,
      applyUrl: text(item.link) ?? guid,
      company,
      role,
      location: text(item.fields.region),
      remote: 'REMOTE',
      salaryText: null,
      salaryMinUsd: null,
      salaryMaxUsd: null,
      tags: cleanTags([item.fields.category ?? '', item.fields.type ?? '']),
      html: item.description ?? '',
      headline: null,
    });
  }

  return items;
}

@Injectable()
export class WeWorkRemotelyAdapter implements SourceAdapter {
  readonly source = 'WEWORKREMOTELY' as const;

  async fetch(): Promise<FetchResult> {
    const xml = await fetchText(WEWORKREMOTELY_URL);
    return { boardId: WEWORKREMOTELY_BOARD, items: mapWeWorkRemotely(xml) };
  }
}
