import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ApplicationsService } from './applications.service.js';
import { ChangeStageDto } from './dto/change-stage.dto.js';
import { CreateApplicationDto } from './dto/create-application.dto.js';
import { ListApplicationsQueryDto } from './dto/list-applications.query.js';
import { UpdateApplicationDto } from './dto/update-application.dto.js';

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Post()
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.applications.create(user.userId, dto);
  }

  @Get()
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: ListApplicationsQueryDto,
  ) {
    return this.applications.list(user.userId, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.applications.findOne(user.userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationDto,
  ) {
    return this.applications.update(user.userId, id, dto);
  }

  @Post(':id/stage')
  @HttpCode(200)
  changeStage(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: ChangeStageDto,
  ) {
    return this.applications.changeStage(user.userId, id, dto.to, dto.note);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ): Promise<void> {
    await this.applications.remove(user.userId, id);
  }
}
