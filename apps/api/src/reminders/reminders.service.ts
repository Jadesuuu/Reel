import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Env } from '../config/env.schema.js';
import {
  FOLLOW_UP_JOB,
  REMINDERS_QUEUE,
  STALE_REMINDER_JOB,
  followUpJobId,
  staleJobId,
  type ReminderJobData,
} from './reminders.constants.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 30_000 },
  removeOnComplete: 100,
  removeOnFail: 100,
} as const;

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    @InjectQueue(REMINDERS_QUEUE)
    private readonly queue: Queue<ReminderJobData>,
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
      { ...JOB_OPTIONS, jobId, delay },
    );

    const dueAt = new Date(Date.now() + delay);

    await this.prisma.reminder.upsert({
      where: { jobId },
      create: { applicationId, kind: 'STALE_APPLICATION', dueAt, jobId },
      update: { dueAt, cancelledAt: null, sentAt: null },
    });
  }

  async scheduleFollowUp(applicationId: string, dueAt: Date) {
    const jobId = followUpJobId(applicationId);
    await this.removeJob(jobId);

    const reminder = await this.prisma.reminder.upsert({
      where: { jobId },
      create: { applicationId, kind: 'FOLLOW_UP', dueAt, jobId },
      update: { dueAt, cancelledAt: null, sentAt: null },
    });

    await this.queue.add(
      FOLLOW_UP_JOB,
      { applicationId, reminderId: reminder.id },
      {
        ...JOB_OPTIONS,
        jobId,
        delay: Math.max(0, dueAt.getTime() - Date.now()),
      },
    );

    return reminder;
  }

  async cancel(applicationId: string): Promise<void> {
    await this.cancelByJobId(staleJobId(applicationId));
    await this.cancelByJobId(followUpJobId(applicationId));
  }

  async cancelReminder(
    applicationId: string,
    reminderId: string,
  ): Promise<void> {
    const reminder = await this.prisma.reminder.findFirst({
      where: { id: reminderId, applicationId },
    });
    if (!reminder) {
      throw new NotFoundException('Reminder not found');
    }
    await this.cancelByJobId(reminder.jobId);
  }

  private async cancelByJobId(jobId: string): Promise<void> {
    await this.removeJob(jobId);
    await this.prisma.reminder.updateMany({
      where: { jobId, sentAt: null, cancelledAt: null },
      data: { cancelledAt: new Date() },
    });
  }

  private async removeJob(jobId: string): Promise<void> {
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
  }
}
