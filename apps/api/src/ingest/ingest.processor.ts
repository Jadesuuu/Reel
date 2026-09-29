import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Queue, type Job } from 'bullmq';
import { MatchingService } from '../matching/matching.service.js';
import { PostingsService } from '../postings/postings.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BrowserRunsService } from '../sources/browser/browser-runs.service.js';
import { normalizePosting } from '../sources/normalize.js';
import { SOURCE_META } from '../sources/source-meta.js';
import { SourceRegistry } from '../sources/source-registry.js';
import { isBrowserSource } from '../sources/source.types.js';
import { SourcesService } from '../sources/sources.service.js';
import {
  INGEST_ALL_JOB,
  INGEST_JOB_OPTIONS,
  INGEST_QUEUE,
  INGEST_SOURCE_JOB,
  ingestStamp,
} from './ingest.constants.js';
import type { IngestJobData } from './ingest.service.js';

export type FanOutResult = { enqueued: number };

export type IngestSourceResult = {
  runId: string;
  source: string;
  boardId: string;
  itemsSeen: number;
  created: number;
  updated: number;
};

@Processor(INGEST_QUEUE)
export class IngestProcessor extends WorkerHost {
  private readonly logger = new Logger(IngestProcessor.name);

  constructor(
    @InjectQueue(INGEST_QUEUE) private readonly queue: Queue<IngestJobData>,
    private readonly registry: SourceRegistry,
    private readonly sources: SourcesService,
    private readonly postings: PostingsService,
    private readonly matching: MatchingService,
    private readonly prisma: PrismaService,
    private readonly browserRuns: BrowserRunsService,
  ) {
    super();
  }

  async process(
    job: Job<IngestJobData>,
  ): Promise<FanOutResult | IngestSourceResult> {
    if (job.name === INGEST_ALL_JOB) {
      return this.fanOut();
    }
    if (job.name === INGEST_SOURCE_JOB) {
      return this.ingestSource(job.data);
    }
    throw new Error(`Unknown ingest job ${job.name}`);
  }

  private async fanOut(): Promise<FanOutResult> {
    const targets = await this.sources.enabledTargets();
    const stamp = ingestStamp();

    await this.queue.addBulk(
      targets.map((target) => ({
        name: INGEST_SOURCE_JOB,
        data: target,
        opts: {
          ...INGEST_JOB_OPTIONS,
          jobId: `cycle-${target.source}-${target.boardId ?? 'latest'}-${stamp}`,
        },
      })),
    );

    this.logger.log(`Fan-out enqueued ${targets.length} source jobs`);
    return { enqueued: targets.length };
  }

  private async ingestSource(data: IngestJobData): Promise<IngestSourceResult> {
    if (!data.source) {
      throw new Error('ingest-source job needs a source');
    }
    const source = data.source;
    const requestedBoard =
      data.boardId ?? SOURCE_META[source].defaultBoardId ?? 'latest';

    if (isBrowserSource(source)) {
      const { runId, created } = await this.browserRuns.request(
        source,
        requestedBoard,
      );
      this.logger.log(
        created
          ? `Waiting for a browser to fetch ${source}/${requestedBoard}`
          : `${source}/${requestedBoard} already has an open browser run`,
      );
      return {
        runId,
        source,
        boardId: requestedBoard,
        itemsSeen: 0,
        created: 0,
        updated: 0,
      };
    }

    const adapter = this.registry.get(source);

    const run = await this.prisma.ingestRun.create({
      data: { source, boardId: requestedBoard },
    });

    try {
      const { boardId, items } = await adapter.fetch(data.boardId);
      const normalized = items.map(normalizePosting);
      const { created, updated } = await this.postings.upsertMany(
        source,
        boardId,
        normalized,
      );
      await this.matching.rescoreAllUsers();

      await this.prisma.ingestRun.update({
        where: { id: run.id },
        data: {
          boardId,
          status: 'SUCCEEDED',
          finishedAt: new Date(),
          itemsSeen: items.length,
          postingsCreated: created,
          postingsUpdated: updated,
        },
      });

      this.logger.log(
        `Ingested ${source}/${boardId}: ${items.length} items, ${created} created, ${updated} updated`,
      );

      return {
        runId: run.id,
        source,
        boardId,
        itemsSeen: items.length,
        created,
        updated,
      };
    } catch (err) {
      await this.prisma.ingestRun.update({
        where: { id: run.id },
        data: { status: 'FAILED', finishedAt: new Date(), error: String(err) },
      });
      this.logger.error(
        `Ingest of ${source}/${requestedBoard} failed: ${String(err)}`,
      );
      throw err;
    }
  }
}
