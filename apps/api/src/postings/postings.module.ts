import { Module } from '@nestjs/common';
import { PostingsService } from './postings.service.js';

@Module({
  providers: [PostingsService],
  exports: [PostingsService],
})
export class PostingsModule {}
