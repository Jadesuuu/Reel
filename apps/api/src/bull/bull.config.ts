import { ConfigService } from '@nestjs/config';
import type { BullRootModuleOptions } from '@nestjs/bullmq';
import { Redis } from 'ioredis';
import type { Env } from '../config/env.schema.js';

export function bullFactory(
  config: ConfigService<Env, true>,
): BullRootModuleOptions {
  return {
    connection: new Redis(config.getOrThrow('REDIS_URL'), {
      maxRetriesPerRequest: null,
    }),
  };
}
