import { ConfigService } from '@nestjs/config';
import type { BullRootModuleOptions } from '@nestjs/bullmq';
import IORedis from 'ioredis';
import type { Env } from '../config/env.schema.js';

export function bullFactory(
  config: ConfigService<Env, true>,
): BullRootModuleOptions {
  return {
    connection: new IORedis(config.getOrThrow('REDIS_URL'), {
      maxRetriesPerRequest: null,
    }),
  };
}
