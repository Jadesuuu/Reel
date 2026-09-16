import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';
import IORedis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service.js';
import { REDIS_CLIENT } from '../redis/redis.module.js';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: IORedis,
  ) {}

  @Get()
  async check(): Promise<{ status: string; db: boolean; redis: boolean }> {
    let db = false;
    let redis = false;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      db = true;
    } catch {
      db = false;
    }

    try {
      const pong = await this.redis.ping();
      redis = pong === 'PONG';
    } catch {
      redis = false;
    }

    const body = { status: db && redis ? 'ok' : 'degraded', db, redis };
    if (!db || !redis) {
      throw new ServiceUnavailableException(body);
    }
    return body;
  }
}
