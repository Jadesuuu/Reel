import { Test } from '@nestjs/testing';
import type { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service.js';
import { MAILER } from '../mailer/mailer.interface.js';
import { RemindersProcessor } from './reminders.processor.js';
import {
  staleJobId,
  type StaleReminderJobData,
} from './reminders.constants.js';

const STAGE_CHANGED_AT = '2026-09-01T10:00:00.000Z';

function makeJob(
  data: Partial<StaleReminderJobData> = {},
): Job<StaleReminderJobData> {
  return {
    data: {
      applicationId: 'app-1',
      stageChangedAt: STAGE_CHANGED_AT,
      ...data,
    },
  } as Job<StaleReminderJobData>;
}

function application(overrides: Record<string, unknown> = {}) {
  return {
    id: 'app-1',
    company: 'Northwind Labs',
    role: 'Full Stack Engineer',
    url: 'https://northwind.example/apply',
    stage: 'APPLIED',
    stageChangedAt: new Date(STAGE_CHANGED_AT),
    user: { email: 'jade@example.com' },
    ...overrides,
  };
}

describe('RemindersProcessor', () => {
  const prisma = {
    application: { findUnique: vi.fn() },
    reminder: { update: vi.fn() },
  };
  const mailer = { send: vi.fn() };

  let processor: RemindersProcessor;

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        RemindersProcessor,
        { provide: PrismaService, useValue: prisma },
        { provide: MAILER, useValue: mailer },
      ],
    }).compile();

    processor = moduleRef.get(RemindersProcessor);
  });

  it('sends when the application is still APPLIED at the same timestamp', async () => {
    prisma.application.findUnique.mockResolvedValue(application());

    await processor.process(makeJob());

    expect(mailer.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'jade@example.com',
        subject: 'Follow up: Northwind Labs — Full Stack Engineer',
      }),
    );
    expect(prisma.reminder.update).toHaveBeenCalledWith({
      where: { jobId: staleJobId('app-1') },
      data: { sentAt: expect.any(Date) },
    });
  });

  it('skips when the application no longer exists', async () => {
    prisma.application.findUnique.mockResolvedValue(null);

    await processor.process(makeJob());

    expect(mailer.send).not.toHaveBeenCalled();
  });

  it('skips when the stage has moved on', async () => {
    prisma.application.findUnique.mockResolvedValue(
      application({ stage: 'INTERVIEWING' }),
    );

    await processor.process(makeJob());

    expect(mailer.send).not.toHaveBeenCalled();
  });

  it('skips when the stage was re-entered after the job was scheduled', async () => {
    prisma.application.findUnique.mockResolvedValue(
      application({ stageChangedAt: new Date('2026-09-05T10:00:00.000Z') }),
    );

    await processor.process(makeJob());

    expect(mailer.send).not.toHaveBeenCalled();
    expect(prisma.reminder.update).not.toHaveBeenCalled();
  });
});
