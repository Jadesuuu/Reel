import { Module } from '@nestjs/common';
import { RemindersService } from './reminders.service.js';

@Module({
  providers: [RemindersService],
  exports: [RemindersService],
})
export class RemindersModule {}
