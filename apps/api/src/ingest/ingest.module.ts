import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { IngestController } from './ingest.controller.js';
import { IngestService } from './ingest.service.js';
import { INGEST_QUEUE } from './ingest.constants.js';

@Module({
  imports: [AuthModule, BullModule.registerQueue({ name: INGEST_QUEUE })],
  controllers: [IngestController],
  providers: [IngestService],
  exports: [IngestService, BullModule],
})
export class IngestModule {}
