import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  BROWSER_SOURCES,
  isBrowserSource,
  type BrowserSource,
} from '../source.types.js';

export const BROWSER_RUN_TIMEOUT_MS = 15 * 60_000;
export const BROWSER_CLAIM_LIMIT = 2;

export type BrowserJob = {
  runId: string;
  source: BrowserSource;
  boardId: string;
  since: string | null;
};

export type BrowserRun = {
  id: string;
  source: BrowserSource;
  boardId: string;
  status: string;
};

@Injectable()
export class BrowserRunsService {
  constructor(private readonly prisma: PrismaService) {}

  async expireStale(now: Date = new Date()): Promise<number> {
    const cutoff = new Date(now.getTime() - BROWSER_RUN_TIMEOUT_MS);
    const [waiting, running] = await Promise.all([
      this.prisma.ingestRun.updateMany({
        where: {
          source: { in: [...BROWSER_SOURCES] },
          status: 'WAITING',
          startedAt: { lt: cutoff },
        },
        data: {
          status: 'FAILED',
          finishedAt: now,
          error: 'No browser connected',
        },
      }),
      this.prisma.ingestRun.updateMany({
        where: {
          source: { in: [...BROWSER_SOURCES] },
          status: 'RUNNING',
          startedAt: { lt: cutoff },
        },
        data: {
          status: 'FAILED',
          finishedAt: now,
          error: 'The browser did not finish the run',
        },
      }),
    ]);
    return waiting.count + running.count;
  }

  async request(
    source: BrowserSource,
    boardId: string,
  ): Promise<{ runId: string; created: boolean }> {
    const open = await this.prisma.ingestRun.findFirst({
      where: { source, boardId, status: { in: ['WAITING', 'RUNNING'] } },
      select: { id: true },
    });
    if (open) {
      return { runId: open.id, created: false };
    }
    const run = await this.prisma.ingestRun.create({
      data: { source, boardId, status: 'WAITING' },
      select: { id: true },
    });
    return { runId: run.id, created: true };
  }

  async claim(limit: number = BROWSER_CLAIM_LIMIT): Promise<BrowserJob[]> {
    const waiting = await this.prisma.ingestRun.findMany({
      where: { source: { in: [...BROWSER_SOURCES] }, status: 'WAITING' },
      orderBy: { startedAt: 'asc' },
      take: limit,
      select: { id: true, source: true, boardId: true },
    });

    const jobs: BrowserJob[] = [];
    for (const run of waiting) {
      const claimed = await this.prisma.ingestRun.updateMany({
        where: { id: run.id, status: 'WAITING' },
        data: { status: 'RUNNING', startedAt: new Date() },
      });
      if (claimed.count !== 1 || !isBrowserSource(run.source)) {
        continue;
      }
      const previous = await this.prisma.ingestRun.findFirst({
        where: {
          source: run.source,
          boardId: run.boardId,
          status: 'SUCCEEDED',
        },
        orderBy: { startedAt: 'desc' },
        select: { startedAt: true },
      });
      jobs.push({
        runId: run.id,
        source: run.source,
        boardId: run.boardId,
        since: previous?.startedAt.toISOString() ?? null,
      });
    }
    return jobs;
  }

  async findClaimed(runId: string): Promise<BrowserRun> {
    const run = await this.prisma.ingestRun.findUnique({
      where: { id: runId },
      select: { id: true, source: true, boardId: true, status: true },
    });
    if (!run || !isBrowserSource(run.source)) {
      throw new NotFoundException('Run not found');
    }
    if (run.status !== 'RUNNING') {
      throw new ConflictException(
        `Run is ${run.status.toLowerCase()}, not running`,
      );
    }
    return { ...run, source: run.source };
  }

  succeed(
    runId: string,
    counts: { itemsSeen: number; created: number; updated: number },
  ) {
    return this.prisma.ingestRun.update({
      where: { id: runId },
      data: {
        status: 'SUCCEEDED',
        finishedAt: new Date(),
        itemsSeen: counts.itemsSeen,
        postingsCreated: counts.created,
        postingsUpdated: counts.updated,
      },
    });
  }

  fail(runId: string, error: string) {
    return this.prisma.ingestRun.update({
      where: { id: runId },
      data: {
        status: 'FAILED',
        finishedAt: new Date(),
        error: error.slice(0, 500),
      },
    });
  }
}
