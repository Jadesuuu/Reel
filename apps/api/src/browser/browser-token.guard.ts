import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { Request } from 'express';
import type { CurrentUserPayload } from '../auth/current-user.decorator.js';
import { PrismaService } from '../prisma/prisma.service.js';

export type BrowserRequest = Request & {
  user?: CurrentUserPayload;
  browserTokenId?: string;
};

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class BrowserTokenGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<BrowserRequest>();
    const header = request.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (token.length === 0) {
      throw new UnauthorizedException('Missing browser token');
    }

    const row = await this.prisma.browserToken.findUnique({
      where: { tokenHash: hashToken(token) },
      select: { id: true, user: { select: { id: true, email: true } } },
    });
    if (!row) {
      throw new UnauthorizedException('Unknown browser token');
    }

    request.user = { userId: row.user.id, email: row.user.email };
    request.browserTokenId = row.id;
    return true;
  }
}
