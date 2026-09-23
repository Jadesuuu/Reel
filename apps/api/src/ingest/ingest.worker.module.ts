import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { MatchingModule } from '../matching/matching.module.js';
import { PostingsModule } from '../postings/postings.module.js';
import { SourcesModule } from '../sources/sources.module.js';
import { INGEST_QUEUE } from './ingest.constants.js';
import { IngestProcessor } from './ingest.processor.js';

@Module({
  imports: [
    SourcesModule,
    PostingsModule,
    MatchingModule,
    BullModule.registerQueue({ name: INGEST_QUEUE }),
  ],
  providers: [IngestProcessor],
  exports: [BullModule],
})
export class IngestWorkerModule {}
