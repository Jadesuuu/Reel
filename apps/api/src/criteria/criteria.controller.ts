import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { CriteriaService } from './criteria.service.js';
import { UpsertCriteriaDto } from './dto/upsert-criteria.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../auth/current-user.decorator.js';

@Controller('criteria')
@UseGuards(JwtAuthGuard)
export class CriteriaController {
  constructor(private readonly criteria: CriteriaService) {}

  @Get()
  get(@CurrentUser() user: CurrentUserPayload) {
    return this.criteria.getOrDefault(user.userId);
  }

  @Put()
  upsert(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpsertCriteriaDto,
  ) {
    return this.criteria.upsert(user.userId, dto);
  }
}
