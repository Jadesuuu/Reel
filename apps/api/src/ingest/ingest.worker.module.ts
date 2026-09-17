import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { HnModule } from '../hn/hn.module.js';
import { MatchingModule } from '../matching/matching.module.js';
import { PostingsModule } from '../postings/postings.module.js';
import { INGEST_QUEUE } from './ingest.constants.js';
import { IngestProcessor } from './ingest.processor.js';

@Module({
  imports: [
    HnModule,
    PostingsModule,
    MatchingModule,
    BullModule.registerQueue({ name: INGEST_QUEUE }),
  ],
  providers: [IngestProcessor],
  exports: [BullModule],
})
export class IngestWorkerModule {}
