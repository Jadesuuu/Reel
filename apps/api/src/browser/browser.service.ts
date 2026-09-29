import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { MatchingService } from '../matching/matching.service.js';
import { PostingsService } from '../postings/postings.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { mapBrowserItems } from '../sources/browser/browser.mappers.js';
import {
  BrowserRunsService,
  type BrowserJob,
} from '../sources/browser/browser-runs.service.js';
import { normalizePosting } from '../sources/normalize.js';
import { hashToken } from './browser-token.guard.js';
import type { CompleteRunDto } from './dto/complete-run.dto.js';

export const BROWSER_CONNECTED_WINDOW_MS = 90_000;
export const BROWSER_POLL_INTERVAL_MS = 30_000;

export type BrowserStatus = {
  linked: boolean;
  connected: boolean;
  createdAt: string | null;
  lastSeenAt: string | null;
  userAgent: string | null;
};

export type PollResult = { jobs: BrowserJob[]; pollIntervalMs: number };

@Injectable()
export class BrowserService {
  private readonly logger = new Logger(BrowserService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly runs: BrowserRunsService,
    private readonly postings: PostingsService,
    private readonly matching: MatchingService,
  ) {}

  async status(userId: string, now: Date = new Date()): Promise<BrowserStatus> {
    const row = await this.prisma.browserToken.findUnique({
      where: { userId },
    });
    const lastSeen = row?.lastSeenAt ?? null;
    return {
      linked: row !== null,
      connected:
        lastSeen !== null &&
        now.getTime() - lastSeen.getTime() < BROWSER_CONNECTED_WINDOW_MS,
      createdAt: row?.createdAt.toISOString() ?? null,
      lastSeenAt: lastSeen?.toISOString() ?? null,
      userAgent: row?.userAgent ?? null,
    };
  }

  async createToken(
    userId: string,
  ): Promise<{ token: string; createdAt: string }> {
    const token = `reel_${randomBytes(24).toString('base64url')}`;
    const tokenHash = hashToken(token);
    const row = await this.prisma.browserToken.upsert({
      where: { userId },
      create: { userId, tokenHash },
      update: {
        tokenHash,
        createdAt: new Date(),
        lastSeenAt: null,
        userAgent: null,
      },
    });
    return { token, createdAt: row.createdAt.toISOString() };
  }

  async revokeToken(userId: string): Promise<void> {
    await this.prisma.browserToken.deleteMany({ where: { userId } });
  }

  async poll(tokenId: string, userAgent?: string): Promise<PollResult> {
    await this.prisma.browserToken.update({
      where: { id: tokenId },
      data: { lastSeenAt: new Date(), ...(userAgent ? { userAgent } : {}) },
    });
    await this.runs.expireStale();
    const jobs = await this.runs.claim();
    return { jobs, pollIntervalMs: BROWSER_POLL_INTERVAL_MS };
  }

  async complete(runId: string, dto: CompleteRunDto) {
    const run = await this.runs.findClaimed(runId);
    if (dto.error) {
      this.logger.warn(
        `Browser run ${run.source}/${run.boardId} failed: ${dto.error}`,
      );
      return this.runs.fail(runId, dto.error);
    }

    const items = dto.items ?? [];
    try {
      const normalized = mapBrowserItems(run.source, run.boardId, items).map(
        normalizePosting,
      );
      const { created, updated } = await this.postings.upsertMany(
        run.source,
        run.boardId,
        normalized,
      );
      await this.matching.rescoreAllUsers();
      this.logger.log(
        `Browser run ${run.source}/${run.boardId}: ${items.length} items, ${created} created, ${updated} updated`,
      );
      return await this.runs.succeed(runId, {
        itemsSeen: items.length,
        created,
        updated,
      });
    } catch (err) {
      await this.runs.fail(runId, String(err));
      throw err;
    }
  }
}
