import { Test } from '@nestjs/testing';
import type { Job } from 'bullmq';
import { HnClient } from '../hn/hn.client.js';
import { MatchingService } from '../matching/matching.service.js';
import { PostingsService } from '../postings/postings.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { IngestProcessor } from './ingest.processor.js';
import type { IngestJobData } from './ingest.service.js';
import type { HnItem } from '../hn/hn.types.js';

function makeComment(id: number, text: string): HnItem {
  return { id, by: 'someone', time: 1_700_000_000, text, type: 'comment' };
}

function makeJob(data: IngestJobData): Job<IngestJobData> {
  return { data } as Job<IngestJobData>;
}

describe('IngestProcessor', () => {
  const hn = {
    findLatestWhoIsHiringThread: vi.fn(),
    fetchTopLevelComments: vi.fn(),
  };
  const postings = { upsertMany: vi.fn() };
  const matching = { rescoreAllUsers: vi.fn() };
  const prisma = {
    ingestRun: { create: vi.fn(), update: vi.fn() },
  };

  let processor: IngestProcessor;

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        IngestProcessor,
        { provide: HnClient, useValue: hn },
        { provide: PostingsService, useValue: postings },
        { provide: MatchingService, useValue: matching },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    processor = moduleRef.get(IngestProcessor);
    prisma.ingestRun.create.mockResolvedValue({ id: 'run-1' });
    prisma.ingestRun.update.mockResolvedValue({ id: 'run-1' });
  });

  it('records a SUCCEEDED run with counts', async () => {
    hn.fetchTopLevelComments.mockResolvedValue([
      makeComment(1, 'Acme | Engineer | Remote'),
      makeComment(2, 'Globex | Designer | Onsite'),
    ]);
    postings.upsertMany.mockResolvedValue({ created: 2, updated: 0 });

    const result = await processor.process(makeJob({ threadId: '42' }));

    expect(hn.findLatestWhoIsHiringThread).not.toHaveBeenCalled();
    expect(postings.upsertMany).toHaveBeenCalledWith('42', expect.any(Array));
    expect(matching.rescoreAllUsers).toHaveBeenCalledOnce();
    expect(prisma.ingestRun.update).toHaveBeenCalledWith({
      where: { id: 'run-1' },
      data: expect.objectContaining({
        status: 'SUCCEEDED',
        commentsSeen: 2,
        postingsCreated: 2,
        postingsUpdated: 0,
      }),
    });
    expect(result).toMatchObject({ threadId: '42', commentsSeen: 2 });
  });

  it('resolves the latest thread when the job carries no threadId', async () => {
    hn.findLatestWhoIsHiringThread.mockResolvedValue({
      id: '99',
      title: 'Ask HN: Who is hiring?',
      createdAt: new Date(),
    });
    hn.fetchTopLevelComments.mockResolvedValue([]);
    postings.upsertMany.mockResolvedValue({ created: 0, updated: 0 });

    const result = await processor.process(makeJob({}));

    expect(hn.findLatestWhoIsHiringThread).toHaveBeenCalledOnce();
    expect(result.threadId).toBe('99');
  });

  it('records a FAILED run and rethrows so BullMQ retries', async () => {
    hn.fetchTopLevelComments.mockRejectedValue(new Error('network down'));

    await expect(
      processor.process(makeJob({ threadId: '42' })),
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
});
