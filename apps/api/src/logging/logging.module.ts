import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import type { Env } from '../config/env.schema.js';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        pinoHttp: {
          level: config.getOrThrow('NODE_ENV') === 'test' ? 'silent' : 'info',
          transport:
            config.getOrThrow('NODE_ENV') === 'production'
              ? undefined
              : { target: 'pino-pretty', options: { singleLine: true } },
          redact: ['req.headers.cookie', 'req.headers.authorization'],
        },
      }),
    }),
  ],
  exports: [LoggerModule],
})
export class AppLoggingModule {}
