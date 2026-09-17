import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConsoleMailer } from './console.mailer.js';
import { MAILER, type Mailer } from './mailer.interface.js';
import { ResendMailer } from './resend.mailer.js';
import type { Env } from '../config/env.schema.js';

@Global()
@Module({
  providers: [
    {
      provide: MAILER,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): Mailer =>
        config.getOrThrow('MAILER') === 'resend'
          ? new ResendMailer(
              config.getOrThrow('RESEND_API_KEY'),
              config.getOrThrow('MAIL_FROM'),
            )
          : new ConsoleMailer(),
    },
  ],
  exports: [MAILER],
})
export class MailerModule {}
