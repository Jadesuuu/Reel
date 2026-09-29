import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { BrowserService } from './browser.service.js';
import {
  BrowserTokenGuard,
  type BrowserRequest,
} from './browser-token.guard.js';
import { CompleteRunDto } from './dto/complete-run.dto.js';
import { PollDto } from './dto/poll.dto.js';

@Controller('browser')
export class BrowserController {
  constructor(private readonly browser: BrowserService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  status(@CurrentUser() user: CurrentUserPayload) {
    return this.browser.status(user.userId);
  }

  @Post('token')
  @UseGuards(JwtAuthGuard)
  createToken(@CurrentUser() user: CurrentUserPayload) {
    return this.browser.createToken(user.userId);
  }

  @Delete('token')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async revokeToken(@CurrentUser() user: CurrentUserPayload): Promise<void> {
    await this.browser.revokeToken(user.userId);
  }

  @Post('poll')
  @UseGuards(BrowserTokenGuard)
  @HttpCode(200)
  poll(@Req() request: BrowserRequest, @Body() dto: PollDto) {
    return this.browser.poll(
      request.browserTokenId!,
      request.user!.userId,
      dto.userAgent,
    );
  }

  @Post('runs/:id/complete')
  @UseGuards(BrowserTokenGuard)
  @HttpCode(200)
  complete(@Param('id') id: string, @Body() dto: CompleteRunDto) {
    return this.browser.complete(id, dto);
  }
}
