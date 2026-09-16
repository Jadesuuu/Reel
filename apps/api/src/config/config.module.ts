import { Module } from '@nestjs/common';
import { ConfigModule as NextConfigModule } from '@nestjs/config';
import { validateEnv } from './env.schema';

@Module({
  imports: [NextConfigModule.forRoot({ isGlobal: true, validate: validateEnv })],
})
export class ConfigModule {}
