import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service.js';
import { paginate, toSkipTake, type Paginated } from '../common/pagination.js';
import type { Source } from '../sources/source.types.js';
import {
  INGEST_ALL_JOB,
  INGEST_JOB_OPTIONS,
  INGEST_QUEUE,
  INGEST_SOURCE_JOB,
  ingestStamp,
} from './ingest.constants.js';

export type IngestJobData = { source?: Source; boardId?: string };

@Injectable()
export class IngestService {
  constructor(
    @InjectQueue(INGEST_QUEUE) private readonly queue: Queue<IngestJobData>,
    private readonly prisma: PrismaService,
  ) {}

  async enqueue(data: IngestJobData = {}): Promise<{ jobId: string }> {
    const stamp = ingestStamp();

    if (data.source) {
      const job = await this.queue.add(
        INGEST_SOURCE_JOB,
        { source: data.source, boardId: data.boardId },
        {
          ...INGEST_JOB_OPTIONS,
          jobId: `manual-${data.source}-${data.boardId ?? 'latest'}-${stamp}`,
        },
      );
      return { jobId: String(job.id) };
    }

    const job = await this.queue.add(
      INGEST_ALL_JOB,
      {},
      { ...INGEST_JOB_OPTIONS, jobId: `manual-all-${stamp}` },
    );
    return { jobId: String(job.id) };
  }

  async listRuns(
    page: number,
    pageSize: number,
    source?: Source,
  ): Promise<Paginated<{ id: string }>> {
    const where = source ? { source } : {};
    const [items, total] = await Promise.all([
      this.prisma.ingestRun.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        ...toSkipTake(page, pageSize),
      }),
      this.prisma.ingestRun.count({ where }),
    ]);
    return paginate(items, page, pageSize, total);
  }
}
