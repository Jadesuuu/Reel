import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pLimit from 'p-limit';
import type { Env } from '../config/env.schema.js';
import type { HnItem, HnSearchResponse } from './hn.types.js';

export class HnThreadNotFoundError extends Error {
  constructor() {
    super('No "Who is hiring?" thread found');
    this.name = 'HnThreadNotFoundError';
  }
}

const FETCH_TIMEOUT_MS = 10_000;

@Injectable()
export class HnClient {
  private readonly logger = new Logger(HnClient.name);
  private readonly algoliaBase: string;
  private readonly firebaseBase: string;

  constructor(config: ConfigService<Env, true>) {
    this.algoliaBase = config.getOrThrow('HN_ALGOLIA_BASE');
    this.firebaseBase = config.getOrThrow('HN_FIREBASE_BASE');
  }

  private async getJson<T>(url: string): Promise<T> {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      throw new Error(`HN request failed ${res.status}: ${url}`);
    }
    return (await res.json()) as T;
  }

  async findLatestWhoIsHiringThread(): Promise<{
    id: string;
    title: string;
    createdAt: Date;
  }> {
    const url =
      `${this.algoliaBase}/search_by_date?tags=story,author_whoishiring` +
      `&query=${encodeURIComponent('"Who is hiring"')}&hitsPerPage=5`;
    const data = await this.getJson<HnSearchResponse>(url);
    const hit = data.hits.find((h) =>
      /^Ask HN: Who is hiring\?/i.test(h.title),
    );
    if (!hit) {
      throw new HnThreadNotFoundError();
    }
    return {
      id: hit.objectID,
      title: hit.title,
      createdAt: new Date(hit.created_at),
    };
  }

  async fetchItem(id: number | string): Promise<HnItem | null> {
    try {
      const item = await this.getJson<HnItem | null>(
        `${this.firebaseBase}/item/${id}.json`,
      );
      return item ?? null;
    } catch (err) {
      this.logger.warn(`Failed to fetch item ${id}: ${String(err)}`);
      return null;
    }
  }

  async fetchTopLevelComments(
    storyId: string,
    options: { concurrency?: number } = {},
  ): Promise<HnItem[]> {
    const story = await this.fetchItem(storyId);
    const kids = story?.kids ?? [];
    const limit = pLimit(options.concurrency ?? 10);

    const results = await Promise.all(
      kids.map((kid) => limit(() => this.fetchItem(kid))),
    );

    const comments: HnItem[] = [];
    let skipped = 0;
    for (const item of results) {
      if (!item || item.deleted || item.dead || !item.text) {
        skipped += 1;
        continue;
      }
      comments.push(item);
    }
    this.logger.log(`Fetched ${comments.length} comments, skipped ${skipped}`);
    return comments;
  }
}
