import { Injectable } from '@nestjs/common';
import { fetchText } from '../http.js';
import { cleanTags, text, toDate } from '../normalize.js';
import { parseRssItems } from '../rss.js';
import type {
  FetchResult,
  RawPosting,
  SourceAdapter,
} from '../source.types.js';

export const JOBSPRESSO_URL = 'https://jobspresso.co/?feed=job_feed';
export const JOBSPRESSO_BOARD = 'all';

const TECHNICAL_TYPE =
  /engineer|develop|software|devops|sysadmin|data|technical|security|\bqa\b/i;

export function creatorCompany(creator: string | undefined): string | null {
  if (!creator) {
    return null;
  }
  return text(creator.split(/<br\s*\/?>/i)[0]);
}

export function mapJobspresso(xml: string): RawPosting[] {
  const items: RawPosting[] = [];

  for (const item of parseRssItems(xml)) {
    const role = text(item.title);
    const guid = text(item.guid) ?? text(item.link);
    const jobType = item.fields['job_listing:job_type'] ?? '';
    if (!role || !guid || !TECHNICAL_TYPE.test(jobType)) {
      continue;
    }
    const company =
      text(item.fields['job_listing:company']) ??
      creatorCompany(item.fields['dc:creator']);
    items.push({
      source: 'JOBSPRESSO',
      externalId: guid,
      boardId: JOBSPRESSO_BOARD,
      author: company ?? 'Jobspresso',
      postedAt: toDate(item.pubDate),
      url: text(item.link) ?? guid,
      applyUrl: text(item.link) ?? guid,
      company,
      role,
      location: text(item.fields['job_listing:location']),
      remote: 'REMOTE',
      salaryText: null,
      salaryMinUsd: null,
      salaryMaxUsd: null,
      tags: cleanTags([jobType, item.fields['job_listing:job_category'] ?? '']),
      html: item.fields['content:encoded'] ?? item.description ?? '',
      headline: null,
    });
  }

  return items;
}

@Injectable()
export class JobspressoAdapter implements SourceAdapter {
  readonly source = 'JOBSPRESSO' as const;

  async fetch(): Promise<FetchResult> {
    const xml = await fetchText(JOBSPRESSO_URL);
    return { boardId: JOBSPRESSO_BOARD, items: mapJobspresso(xml) };
  }
}
