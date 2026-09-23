import { Test } from '@nestjs/testing';
import type { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service.js';
import { MAILER } from '../mailer/mailer.interface.js';
import { RemindersProcessor } from './reminders.processor.js';
import {
  FOLLOW_UP_JOB,
  STALE_REMINDER_JOB,
  staleJobId,
  type FollowUpJobData,
  type ReminderJobData,
  type StaleReminderJobData,
} from './reminders.constants.js';

const STAGE_CHANGED_AT = '2026-09-01T10:00:00.000Z';

function staleJob(
  data: Partial<StaleReminderJobData> = {},
): Job<ReminderJobData> {
  return {
    name: STALE_REMINDER_JOB,
    data: {
      applicationId: 'app-1',
      stageChangedAt: STAGE_CHANGED_AT,
      ...data,
    },
  } as Job<ReminderJobData>;
}

function followUpJob(
  data: Partial<FollowUpJobData> = {},
): Job<ReminderJobData> {
  return {
    name: FOLLOW_UP_JOB,
    data: { applicationId: 'app-1', reminderId: 'rem-1', ...data },
  } as Job<ReminderJobData>;
}

function application(overrides: Record<string, unknown> = {}) {
  return {
    id: 'app-1',
    company: 'Northwind Labs',
    role: 'Full Stack Engineer',
    url: 'https://northwind.example/apply',
    stage: 'APPLIED',
    notes: null,
    nextStepAt: null,
    stageChangedAt: new Date(STAGE_CHANGED_AT),
    user: { email: 'jade@example.com' },
    ...overrides,
  };
}

describe('RemindersProcessor', () => {
  const prisma = {
    application: { findUnique: vi.fn() },
    reminder: { update: vi.fn(), findUnique: vi.fn() },
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

  describe('stale reminders', () => {
    it('sends when the application is still APPLIED at the same timestamp', async () => {
      prisma.application.findUnique.mockResolvedValue(application());

      await processor.process(staleJob());

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

      await processor.process(staleJob());

      expect(mailer.send).not.toHaveBeenCalled();
    });

    it('skips when the stage has moved on', async () => {
      prisma.application.findUnique.mockResolvedValue(
        application({ stage: 'INTERVIEWING' }),
      );

      await processor.process(staleJob());

      expect(mailer.send).not.toHaveBeenCalled();
    });

    it('skips when the stage was re-entered after the job was scheduled', async () => {
      prisma.application.findUnique.mockResolvedValue(
        application({ stageChangedAt: new Date('2026-09-05T10:00:00.000Z') }),
      );

      await processor.process(staleJob());

      expect(mailer.send).not.toHaveBeenCalled();
      expect(prisma.reminder.update).not.toHaveBeenCalled();
    });
  });

  describe('follow-ups', () => {
    it('sends when the reminder row is still pending', async () => {
      prisma.reminder.findUnique.mockResolvedValue({
        id: 'rem-1',
        applicationId: 'app-1',
        sentAt: null,
        cancelledAt: null,
        application: application({
          stage: 'INTERVIEWING',
          notes: 'Ask about the team size',
          nextStepAt: new Date('2026-10-01T09:00:00.000Z'),
        }),
      });

      await processor.process(followUpJob());

      expect(mailer.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'jade@example.com',
          subject: 'Reminder: Northwind Labs — Full Stack Engineer',
          text: expect.stringContaining('Next step: 2026-10-01'),
        }),
      );
      expect(mailer.send.mock.calls[0]![0].text).toContain(
        'Ask about the team size',
      );
      expect(prisma.reminder.update).toHaveBeenCalledWith({
        where: { id: 'rem-1' },
        data: { sentAt: expect.any(Date) },
      });
    });

    it('skips a cancelled or already sent reminder', async () => {
      prisma.reminder.findUnique.mockResolvedValue({
        id: 'rem-1',
        applicationId: 'app-1',
        sentAt: null,
        cancelledAt: new Date(),
        application: application(),
      });

      await processor.process(followUpJob());

      expect(mailer.send).not.toHaveBeenCalled();
      expect(prisma.reminder.update).not.toHaveBeenCalled();
    });

    it('skips when the reminder row is gone or belongs to another application', async () => {
      prisma.reminder.findUnique.mockResolvedValue(null);
      await processor.process(followUpJob());

      prisma.reminder.findUnique.mockResolvedValue({
        id: 'rem-1',
        applicationId: 'app-2',
        sentAt: null,
        cancelledAt: null,
        application: application({ id: 'app-2' }),
      });
      await processor.process(followUpJob());

      expect(mailer.send).not.toHaveBeenCalled();
    });
  });

  it('rejects an unknown job name', async () => {
    await expect(
      processor.process({
        name: 'send-postcard',
        data: {},
      } as unknown as Job<ReminderJobData>),
    ).rejects.toThrow('Unknown reminder job');
  });
});
