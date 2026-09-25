import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ListPostingsQueryDto } from './dto/list-postings.query.js';
import { PostingsService } from './postings.service.js';

@Controller('postings')
@UseGuards(JwtAuthGuard)
export class PostingsController {
  constructor(private readonly postings: PostingsService) {}

  @Get()
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: ListPostingsQueryDto,
  ) {
    return this.postings.list(query, user.userId);
  }

  @Get('stats')
  stats() {
    return this.postings.stats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postings.findOne(id);
  }
}
