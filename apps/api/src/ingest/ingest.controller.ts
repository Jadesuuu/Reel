import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ListRunsQueryDto } from './dto/list-runs.query.js';
import { RunIngestDto } from './dto/run-ingest.dto.js';
import { IngestService } from './ingest.service.js';

@Controller('ingest')
@UseGuards(JwtAuthGuard)
export class IngestController {
  constructor(private readonly ingest: IngestService) {}

  @Post('run')
  @HttpCode(202)
  run(@Body() dto: RunIngestDto) {
    return this.ingest.enqueue({ source: dto.source, boardId: dto.boardId });
  }

  @Get('runs')
  runs(@Query() query: ListRunsQueryDto) {
    return this.ingest.listRuns(query.page, query.pageSize, query.source);
  }
}
