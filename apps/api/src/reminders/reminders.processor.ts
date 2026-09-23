import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service.js';
import { MAILER, type Mailer } from '../mailer/mailer.interface.js';
import {
  FOLLOW_UP_JOB,
  REMINDERS_QUEUE,
  STALE_REMINDER_JOB,
  staleJobId,
  type FollowUpJobData,
  type ReminderJobData,
  type StaleReminderJobData,
} from './reminders.constants.js';

@Processor(REMINDERS_QUEUE)
export class RemindersProcessor extends WorkerHost {
  private readonly logger = new Logger(RemindersProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(MAILER) private readonly mailer: Mailer,
  ) {
    super();
  }

  async process(job: Job<ReminderJobData>): Promise<void> {
    if (job.name === FOLLOW_UP_JOB) {
      return this.sendFollowUp(job.data as FollowUpJobData);
    }
    if (job.name === STALE_REMINDER_JOB || job.name === undefined) {
      return this.sendStale(job.data as StaleReminderJobData);
    }
    throw new Error(`Unknown reminder job ${job.name}`);
  }

  private async sendStale(data: StaleReminderJobData): Promise<void> {
    const { applicationId, stageChangedAt } = data;

    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { user: { select: { email: true } } },
    });

    if (!application) {
      this.logger.log(`Stale reminder skipped: ${applicationId} is gone`);
      return;
    }

    if (application.stage !== 'APPLIED') {
      this.logger.log(
        `Stale reminder skipped: ${applicationId} moved to ${application.stage}`,
      );
      return;
    }

    if (application.stageChangedAt.toISOString() !== stageChangedAt) {
      this.logger.log(
        `Stale reminder skipped: ${applicationId} changed stage again`,
      );
      return;
    }

    await this.mailer.send({
      to: application.user.email,
      subject: `Follow up: ${application.company} — ${application.role}`,
      text: [
        `You applied to ${application.company} for ${application.role} and have not heard back.`,
        application.url ? `Posting: ${application.url}` : null,
        'Consider following up or moving it to WITHDRAWN.',
      ]
        .filter(Boolean)
        .join('\n\n'),
    });

    await this.prisma.reminder.update({
      where: { jobId: staleJobId(applicationId) },
      data: { sentAt: new Date() },
    });

    this.logger.log(`Stale reminder sent for ${applicationId}`);
  }

  private async sendFollowUp(data: FollowUpJobData): Promise<void> {
    const { applicationId, reminderId } = data;

    const reminder = await this.prisma.reminder.findUnique({
      where: { id: reminderId },
      include: {
        application: { include: { user: { select: { email: true } } } },
      },
    });

    if (!reminder || reminder.applicationId !== applicationId) {
      this.logger.log(`Follow-up skipped: reminder ${reminderId} is gone`);
      return;
    }

    if (reminder.cancelledAt !== null || reminder.sentAt !== null) {
      this.logger.log(
        `Follow-up skipped: reminder ${reminderId} already handled`,
      );
      return;
    }

    const application = reminder.application;

    await this.mailer.send({
      to: application.user.email,
      subject: `Reminder: ${application.company} — ${application.role}`,
      text: [
        `You asked to be reminded about ${application.company} (${application.role}), currently ${application.stage}.`,
        application.nextStepAt
          ? `Next step: ${application.nextStepAt.toISOString().slice(0, 10)}`
          : null,
        application.notes ? `Your notes:\n${application.notes}` : null,
        application.url ? `Posting: ${application.url}` : null,
      ]
        .filter(Boolean)
        .join('\n\n'),
    });

    await this.prisma.reminder.update({
      where: { id: reminderId },
      data: { sentAt: new Date() },
    });

    this.logger.log(`Follow-up sent for ${applicationId}`);
  }
}
