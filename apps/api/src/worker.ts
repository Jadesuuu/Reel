import { getQueueToken } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { Queue } from 'bullmq';
import { WorkerModule } from './worker.module.js';
import {
  INGEST_CRON,
  INGEST_JOB,
  INGEST_QUEUE,
  INGEST_SCHEDULER_ID,
} from './ingest/ingest.constants.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(WorkerModule);
  app.enableShutdownHooks();

  const logger = new Logger('Worker');
  const queue = app.get<Queue>(getQueueToken(INGEST_QUEUE));

  await queue.upsertJobScheduler(
    INGEST_SCHEDULER_ID,
    { pattern: INGEST_CRON },
    { name: INGEST_JOB, data: {} },
  );

  logger.log(`Worker ready, ingest scheduled at "${INGEST_CRON}"`);

  const shutdown = async (signal: string): Promise<void> => {
    logger.log(`Received ${signal}, shutting down`);
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

void bootstrap();
