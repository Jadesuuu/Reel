import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Env } from '../config/env.schema.js';
import {
  REMINDERS_QUEUE,
  STALE_REMINDER_JOB,
  staleJobId,
  type StaleReminderJobData,
} from './reminders.constants.js';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    @InjectQueue(REMINDERS_QUEUE)
    private readonly queue: Queue<StaleReminderJobData>,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  private delayMs(): number {
    const override = this.config.get('STALE_DELAY_MS', { infer: true });
    if (override !== undefined && override !== null) {
      return Number(override);
    }
    return this.config.getOrThrow('STALE_AFTER_DAYS') * DAY_MS;
  }

  async schedule(applicationId: string, stageChangedAt: Date): Promise<void> {
    const jobId = staleJobId(applicationId);
    const delay = this.delayMs();

    await this.queue.add(
      STALE_REMINDER_JOB,
      { applicationId, stageChangedAt: stageChangedAt.toISOString() },
      {
        jobId,
        delay,
        attempts: 3,
        backoff: { type: 'exponential', delay: 30_000 },
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    );

    const dueAt = new Date(Date.now() + delay);

    await this.prisma.reminder.upsert({
      where: { jobId },
      create: {
        applicationId,
        kind: 'STALE_APPLICATION',
        dueAt,
        jobId,
      },
      update: { dueAt, cancelledAt: null, sentAt: null },
    });
  }

  async cancel(applicationId: string): Promise<void> {
    const jobId = staleJobId(applicationId);

    try {
      const job = await this.queue.getJob(jobId);
      if (job) {
        await job.remove();
      }
    } catch (err) {
      this.logger.warn(
        `Could not remove reminder job ${jobId}: ${String(err)}`,
      );
    }

    await this.prisma.reminder.updateMany({
      where: { jobId, sentAt: null },
      data: { cancelledAt: new Date() },
    });
  }
}
