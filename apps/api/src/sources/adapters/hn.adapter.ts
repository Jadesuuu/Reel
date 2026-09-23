import { Injectable } from '@nestjs/common';
import { HnClient } from '../../hn/hn.client.js';
import { parseComment } from '../../hn/hn.parser.js';
import type { HnItem } from '../../hn/hn.types.js';
import type {
  FetchResult,
  RawPosting,
  SourceAdapter,
} from '../source.types.js';

export function mapHnComment(item: HnItem, boardId: string): RawPosting {
  const parsed = parseComment(item);
  return {
    source: 'HN',
    externalId: String(item.id),
    boardId,
    author: item.by ?? 'unknown',
    postedAt: new Date(item.time * 1000),
    url: `https://news.ycombinator.com/item?id=${item.id}`,
    applyUrl: parsed.applyUrl,
    company: parsed.company,
    role: parsed.role,
    location: parsed.location,
    remote: parsed.remote,
    salaryText: parsed.salaryText,
    salaryMinUsd: parsed.salaryMinUsd,
    salaryMaxUsd: parsed.salaryMaxUsd,
    tags: [],
    html: item.text ?? '',
    headline: parsed.headline,
  };
}

@Injectable()
export class HnAdapter implements SourceAdapter {
  readonly source = 'HN' as const;

  constructor(private readonly hn: HnClient) {}

  async fetch(boardId?: string): Promise<FetchResult> {
    const threadId =
      boardId ?? (await this.hn.findLatestWhoIsHiringThread()).id;
    const items = await this.hn.fetchTopLevelComments(threadId);
    return {
      boardId: threadId,
      items: items.map((item) => mapHnComment(item, threadId)),
    };
  }
}
