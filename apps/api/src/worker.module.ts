import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RedisModule } from './redis/redis.module.js';
import { AppBullModule } from './bull/bull.module.js';
import { MailerModule } from './mailer/mailer.module.js';
import { IngestWorkerModule } from './ingest/ingest.worker.module.js';
import { RemindersWorkerModule } from './reminders/reminders.worker.module.js';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    RedisModule,
    AppBullModule,
    MailerModule,
    IngestWorkerModule,
    RemindersWorkerModule,
  ],
})
export class WorkerModule {}
