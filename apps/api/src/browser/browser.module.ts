import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MatchingModule } from '../matching/matching.module.js';
import { PostingsModule } from '../postings/postings.module.js';
import { SourcesModule } from '../sources/sources.module.js';
import { BrowserController } from './browser.controller.js';
import { BrowserService } from './browser.service.js';
import { BrowserTokenGuard } from './browser-token.guard.js';

@Module({
  imports: [AuthModule, SourcesModule, PostingsModule, MatchingModule],
  controllers: [BrowserController],
  providers: [BrowserService, BrowserTokenGuard],
})
export class BrowserModule {}
