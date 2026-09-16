import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service.js';
import { paginate, toSkipTake, type Paginated } from '../common/pagination.js';
import { INGEST_JOB, INGEST_QUEUE } from './ingest.constants.js';

export type IngestJobData = { threadId?: string };

@Injectable()
export class IngestService {
  constructor(
    @InjectQueue(INGEST_QUEUE) private readonly queue: Queue<IngestJobData>,
    private readonly prisma: PrismaService,
  ) {}

  async enqueue(threadId?: string): Promise<{ jobId: string }> {
    const job = await this.queue.add(
      INGEST_JOB,
      { threadId },
      {
        jobId: `manual-${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 10_000 },
        removeOnComplete: 50,
        removeOnFail: 100,
      },
    );
    return { jobId: String(job.id) };
  }

  async listRuns(
    page: number,
    pageSize: number,
  ): Promise<Paginated<{ id: string }>> {
    const [items, total] = await Promise.all([
      this.prisma.ingestRun.findMany({
        orderBy: { startedAt: 'desc' },
        ...toSkipTake(page, pageSize),
      }),
      this.prisma.ingestRun.count(),
    ]);
    return paginate(items, page, pageSize, total);
  }
}
