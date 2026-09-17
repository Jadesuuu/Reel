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
import { PaginationQueryDto } from '../common/dto/pagination.query.js';
import { RunIngestDto } from './dto/run-ingest.dto.js';
import { IngestService } from './ingest.service.js';

@Controller('ingest')
@UseGuards(JwtAuthGuard)
export class IngestController {
  constructor(private readonly ingest: IngestService) {}

  @Post('run')
  @HttpCode(202)
  run(@Body() dto: RunIngestDto) {
    return this.ingest.enqueue(dto.threadId);
  }

  @Get('runs')
  runs(@Query() query: PaginationQueryDto) {
    return this.ingest.listRuns(query.page, query.pageSize);
  }
}
