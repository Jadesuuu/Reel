import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service.js';
import { MAILER, type Mailer } from '../mailer/mailer.interface.js';
import {
  REMINDERS_QUEUE,
  staleJobId,
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

  async process(job: Job<StaleReminderJobData>): Promise<void> {
    const { applicationId, stageChangedAt } = job.data;

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
}
