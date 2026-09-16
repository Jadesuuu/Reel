import { Test } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { RemindersService } from './reminders.service.js';
import { REMINDERS_QUEUE, staleJobId } from './reminders.constants.js';

describe('RemindersService', () => {
  const queue = { add: vi.fn(), getJob: vi.fn() };
  const prisma = { reminder: { upsert: vi.fn(), updateMany: vi.fn() } };
  const config = {
    get: vi.fn(),
    getOrThrow: vi.fn(),
  };

  let service: RemindersService;

  beforeEach(async () => {
    vi.clearAllMocks();
    config.get.mockReturnValue(undefined);
    config.getOrThrow.mockReturnValue(10);

    const moduleRef = await Test.createTestingModule({
      providers: [
        RemindersService,
        { provide: getQueueToken(REMINDERS_QUEUE), useValue: queue },
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = moduleRef.get(RemindersService);
  });

  it('schedules with a deterministic job id and a ten day delay', async () => {
    const stageChangedAt = new Date('2026-09-01T10:00:00.000Z');

    await service.schedule('app-1', stageChangedAt);

    expect(queue.add).toHaveBeenCalledWith(
      'send-stale-reminder',
      {
        applicationId: 'app-1',
        stageChangedAt: '2026-09-01T10:00:00.000Z',
      },
      expect.objectContaining({
        jobId: staleJobId('app-1'),
        delay: 10 * 24 * 60 * 60 * 1000,
        attempts: 3,
      }),
    );
    expect(prisma.reminder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { jobId: staleJobId('app-1') } }),
    );
  });

  it('prefers STALE_DELAY_MS when it is set', async () => {
    config.get.mockReturnValue(1500);

    await service.schedule('app-1', new Date());

    expect(queue.add).toHaveBeenCalledWith(
      'send-stale-reminder',
      expect.anything(),
      expect.objectContaining({ delay: 1500 }),
    );
  });

  it('removes the job and marks the reminder cancelled', async () => {
    const remove = vi.fn();
    queue.getJob.mockResolvedValue({ remove });

    await service.cancel('app-1');

    expect(queue.getJob).toHaveBeenCalledWith(staleJobId('app-1'));
    expect(remove).toHaveBeenCalledOnce();
    expect(prisma.reminder.updateMany).toHaveBeenCalledWith({
      where: { jobId: staleJobId('app-1'), sentAt: null },
      data: { cancelledAt: expect.any(Date) },
    });
  });

  it('does not throw when there is no job to cancel', async () => {
    queue.getJob.mockResolvedValue(null);

    await expect(service.cancel('app-1')).resolves.toBeUndefined();
    expect(prisma.reminder.updateMany).toHaveBeenCalledOnce();
  });

  it('still marks the reminder cancelled when job removal fails', async () => {
    queue.getJob.mockResolvedValue({
      remove: vi.fn().mockRejectedValue(new Error('job is active')),
    });

    await expect(service.cancel('app-1')).resolves.toBeUndefined();
    expect(prisma.reminder.updateMany).toHaveBeenCalledOnce();
  });
});
