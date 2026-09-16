import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { HnClient } from '../hn/hn.client.js';
import { parseComment } from '../hn/hn.parser.js';
import { MatchingService } from '../matching/matching.service.js';
import { PostingsService } from '../postings/postings.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { INGEST_QUEUE } from './ingest.constants.js';
import type { IngestJobData } from './ingest.service.js';

export type IngestJobResult = {
  runId: string;
  threadId: string;
  commentsSeen: number;
  created: number;
  updated: number;
};

@Processor(INGEST_QUEUE)
export class IngestProcessor extends WorkerHost {
  private readonly logger = new Logger(IngestProcessor.name);

  constructor(
    private readonly hn: HnClient,
    private readonly postings: PostingsService,
    private readonly matching: MatchingService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<IngestJobData>): Promise<IngestJobResult> {
    const threadId =
      job.data.threadId ?? (await this.hn.findLatestWhoIsHiringThread()).id;

    const run = await this.prisma.ingestRun.create({
      data: { source: 'HN', externalThreadId: threadId },
    });

    try {
      const items = await this.hn.fetchTopLevelComments(threadId);
      const parsed = items.map((item) => ({
        item,
        parsed: parseComment(item),
      }));
      const { created, updated } = await this.postings.upsertMany(
        threadId,
        parsed,
      );
      await this.matching.rescoreAllUsers();

      await this.prisma.ingestRun.update({
        where: { id: run.id },
        data: {
          status: 'SUCCEEDED',
          finishedAt: new Date(),
          commentsSeen: items.length,
          postingsCreated: created,
          postingsUpdated: updated,
        },
      });

      this.logger.log(
        `Ingested thread ${threadId}: ${items.length} comments, ${created} created, ${updated} updated`,
      );

      return {
        runId: run.id,
        threadId,
        commentsSeen: items.length,
        created,
        updated,
      };
    } catch (err) {
      await this.prisma.ingestRun.update({
        where: { id: run.id },
        data: {
          status: 'FAILED',
          finishedAt: new Date(),
          error: String(err),
        },
      });
      this.logger.error(`Ingest of thread ${threadId} failed: ${String(err)}`);
      throw err;
    }
  }
}
