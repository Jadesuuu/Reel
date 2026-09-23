import { getQueueToken } from '@nestjs/bullmq';
import { Test } from '@nestjs/testing';
import type { Job } from 'bullmq';
import { MatchingService } from '../matching/matching.service.js';
import { PostingsService } from '../postings/postings.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SourceRegistry } from '../sources/source-registry.js';
import type { RawPosting } from '../sources/source.types.js';
import { SourcesService } from '../sources/sources.service.js';
import {
  INGEST_ALL_JOB,
  INGEST_QUEUE,
  INGEST_SOURCE_JOB,
} from './ingest.constants.js';
import { IngestProcessor } from './ingest.processor.js';
import type { IngestJobData } from './ingest.service.js';

function rawPosting(id: string, company: string): RawPosting {
  return {
    source: 'REMOTIVE',
    externalId: id,
    boardId: 'software-dev',
    author: company,
    postedAt: new Date('2026-09-20T00:00:00Z'),
    url: `https://remotive.com/jobs/${id}`,
    applyUrl: null,
    company,
    role: 'Engineer',
    location: 'USA',
    remote: 'REMOTE',
    salaryText: null,
    salaryMinUsd: null,
    salaryMaxUsd: null,
    tags: [],
    html: '<p>Remote role using TypeScript.</p>',
    headline: null,
  };
}

function makeJob(name: string, data: IngestJobData): Job<IngestJobData> {
  return { name, data } as Job<IngestJobData>;
}

describe('IngestProcessor', () => {
  const adapter = { source: 'REMOTIVE', fetch: vi.fn() };
  const registry = { get: vi.fn(() => adapter) };
  const sources = { enabledTargets: vi.fn() };
  const postings = { upsertMany: vi.fn() };
  const matching = { rescoreAllUsers: vi.fn() };
  const queue = { addBulk: vi.fn() };
  const prisma = {
    ingestRun: { create: vi.fn(), update: vi.fn() },
  };

  let processor: IngestProcessor;

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        IngestProcessor,
        { provide: getQueueToken(INGEST_QUEUE), useValue: queue },
        { provide: SourceRegistry, useValue: registry },
        { provide: SourcesService, useValue: sources },
        { provide: PostingsService, useValue: postings },
        { provide: MatchingService, useValue: matching },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    processor = moduleRef.get(IngestProcessor);
    prisma.ingestRun.create.mockResolvedValue({ id: 'run-1' });
    prisma.ingestRun.update.mockResolvedValue({ id: 'run-1' });
  });

  it('fans out one source job per enabled target', async () => {
    sources.enabledTargets.mockResolvedValue([
      { source: 'HN' },
      { source: 'REMOTIVE' },
      { source: 'GREENHOUSE', boardId: 'stripe' },
    ]);

    const result = await processor.process(makeJob(INGEST_ALL_JOB, {}));

    expect(result).toEqual({ enqueued: 3 });
    expect(queue.addBulk).toHaveBeenCalledOnce();
    const bulk = queue.addBulk.mock.calls[0]![0] as Array<{
      name: string;
      data: IngestJobData;
      opts: { jobId: string };
    }>;
    expect(bulk.map((entry) => entry.name)).toEqual([
      INGEST_SOURCE_JOB,
      INGEST_SOURCE_JOB,
      INGEST_SOURCE_JOB,
    ]);
    expect(bulk[2]!.data).toEqual({ source: 'GREENHOUSE', boardId: 'stripe' });
    expect(bulk[2]!.opts.jobId).toMatch(/^cycle-GREENHOUSE-stripe-\d{12}$/);
    expect(bulk[0]!.opts.jobId).toMatch(/^cycle-HN-latest-\d{12}$/);
    expect(prisma.ingestRun.create).not.toHaveBeenCalled();
  });

  it('records a SUCCEEDED run with counts for one source', async () => {
    adapter.fetch.mockResolvedValue({
      boardId: 'software-dev',
      items: [rawPosting('1', 'Acme'), rawPosting('2', 'Globex')],
    });
    postings.upsertMany.mockResolvedValue({ created: 2, updated: 0 });

    const result = await processor.process(
      makeJob(INGEST_SOURCE_JOB, { source: 'REMOTIVE' }),
    );

    expect(registry.get).toHaveBeenCalledWith('REMOTIVE');
    expect(adapter.fetch).toHaveBeenCalledWith(undefined);
    expect(prisma.ingestRun.create).toHaveBeenCalledWith({
      data: { source: 'REMOTIVE', boardId: 'software-dev' },
    });

    const upsertArgs = postings.upsertMany.mock.calls[0]!;
    expect(upsertArgs[0]).toBe('REMOTIVE');
    expect(upsertArgs[1]).toBe('software-dev');
    expect(upsertArgs[2]).toHaveLength(2);
    expect(upsertArgs[2][0]).toMatchObject({
      externalId: '1',
      headline: 'Acme | Engineer | USA | Remote',
      stackKeywords: ['typescript'],
    });

    expect(matching.rescoreAllUsers).toHaveBeenCalledOnce();
    expect(prisma.ingestRun.update).toHaveBeenCalledWith({
      where: { id: 'run-1' },
      data: expect.objectContaining({
        status: 'SUCCEEDED',
        boardId: 'software-dev',
        itemsSeen: 2,
        postingsCreated: 2,
        postingsUpdated: 0,
      }),
    });
    expect(result).toMatchObject({
      source: 'REMOTIVE',
      itemsSeen: 2,
      created: 2,
    });
  });

  it('passes the board id through and records the resolved board', async () => {
    adapter.fetch.mockResolvedValue({ boardId: '99', items: [] });
    postings.upsertMany.mockResolvedValue({ created: 0, updated: 0 });

    const result = await processor.process(
      makeJob(INGEST_SOURCE_JOB, { source: 'HN', boardId: '99' }),
    );

    expect(adapter.fetch).toHaveBeenCalledWith('99');
    expect(prisma.ingestRun.create).toHaveBeenCalledWith({
      data: { source: 'HN', boardId: '99' },
    });
    expect(result).toMatchObject({ boardId: '99', itemsSeen: 0 });
  });

  it('records a FAILED run and rethrows so BullMQ retries', async () => {
    adapter.fetch.mockRejectedValue(new Error('network down'));

    await expect(
      processor.process(makeJob(INGEST_SOURCE_JOB, { source: 'REMOTIVE' })),
    ).rejects.toThrow('network down');

    expect(matching.rescoreAllUsers).not.toHaveBeenCalled();
    expect(prisma.ingestRun.update).toHaveBeenCalledWith({
      where: { id: 'run-1' },
      data: expect.objectContaining({
        status: 'FAILED',
        error: expect.stringContaining('network down'),
      }),
    });
  });

  it('rejects a source job without a source', async () => {
    await expect(
      processor.process(makeJob(INGEST_SOURCE_JOB, {})),
    ).rejects.toThrow('needs a source');
  });
});
