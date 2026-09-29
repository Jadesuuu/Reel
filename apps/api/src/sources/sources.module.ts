import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { HnModule } from '../hn/hn.module.js';
import { BrowserRunsService } from './browser/browser-runs.service.js';
import { ADAPTERS, SourceRegistry } from './source-registry.js';
import { SourcesController } from './sources.controller.js';
import { SourcesService } from './sources.service.js';

@Module({
  imports: [AuthModule, HnModule],
  controllers: [SourcesController],
  providers: [...ADAPTERS, SourceRegistry, SourcesService, BrowserRunsService],
  exports: [SourceRegistry, SourcesService, BrowserRunsService],
})
export class SourcesModule {}
