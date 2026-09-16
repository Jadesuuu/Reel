import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ListPostingsQueryDto } from './dto/list-postings.query.js';
import { PostingsService } from './postings.service.js';

@Controller('postings')
@UseGuards(JwtAuthGuard)
export class PostingsController {
  constructor(private readonly postings: PostingsService) {}

  @Get()
  list(@Query() query: ListPostingsQueryDto) {
    return this.postings.list(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postings.findOne(id);
  }
}
