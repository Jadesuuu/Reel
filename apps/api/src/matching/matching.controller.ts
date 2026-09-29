import {
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ListMatchesQueryDto } from './dto/list-matches.query.js';
import { MatchingService } from './matching.service.js';

@Controller('matches')
@UseGuards(JwtAuthGuard)
export class MatchingController {
  constructor(private readonly matching: MatchingService) {}

  @Get()
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: ListMatchesQueryDto,
  ) {
    return this.matching.list(
      user.userId,
      {
        dismissed: query.dismissed,
        source: query.source,
        minScore: query.minScore,
        days: query.days,
        sort: query.sort,
      },
      query.page,
      query.pageSize,
    );
  }

  @Post(':id/dismiss')
  @HttpCode(200)
  dismiss(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.matching.dismiss(user.userId, id);
  }

  @Post('seen')
  @HttpCode(200)
  seen(@CurrentUser() user: CurrentUserPayload) {
    return this.matching.markSeen(user.userId);
  }

  @Post('rescore')
  @HttpCode(202)
  async rescore(@CurrentUser() user: CurrentUserPayload) {
    const rescored = await this.matching.rescoreUser(user.userId);
    return { rescored };
  }
}
