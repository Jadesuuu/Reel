import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule } from './config/config.module.js';
import { AppLoggingModule } from './logging/logging.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RedisModule } from './redis/redis.module.js';
import { AppBullModule } from './bull/bull.module.js';
import { HealthModule } from './health/health.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { CriteriaModule } from './criteria/criteria.module.js';
import { IngestModule } from './ingest/ingest.module.js';
import { PostingsModule } from './postings/postings.module.js';
import { MatchingModule } from './matching/matching.module.js';
import { ApplicationsModule } from './applications/applications.module.js';

@Module({
  imports: [
    AppConfigModule,
    AppLoggingModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    RedisModule,
    AppBullModule,
    HealthModule,
    AuthModule,
    UsersModule,
    CriteriaModule,
    IngestModule,
    PostingsModule,
    MatchingModule,
    ApplicationsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
