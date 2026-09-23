import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AddBoardDto } from './dto/add-board.dto.js';
import { UpdateSourceDto } from './dto/update-source.dto.js';
import { SourcesService } from './sources.service.js';

@Controller('sources')
@UseGuards(JwtAuthGuard)
export class SourcesController {
  constructor(private readonly sources: SourcesService) {}

  @Get()
  list() {
    return this.sources.list();
  }

  @Get('boards')
  boards() {
    return this.sources.listBoards();
  }

  @Post('boards')
  addBoard(@Body() dto: AddBoardDto) {
    return this.sources.addBoard(dto.provider, dto.slug);
  }

  @Delete('boards/:id')
  @HttpCode(204)
  async removeBoard(@Param('id') id: string): Promise<void> {
    await this.sources.removeBoard(id);
  }

  @Patch(':source')
  update(@Param('source') source: string, @Body() dto: UpdateSourceDto) {
    return this.sources.setEnabled(source.toUpperCase(), dto.enabled);
  }
}
