import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PostingsController } from './postings.controller.js';
import { PostingsService } from './postings.service.js';

@Module({
  imports: [AuthModule],
  controllers: [PostingsController],
  providers: [PostingsService],
  exports: [PostingsService],
})
export class PostingsModule {}
