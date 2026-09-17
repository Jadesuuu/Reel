import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { RemindersService } from './reminders.service.js';
import { REMINDERS_QUEUE } from './reminders.constants.js';

@Module({
  imports: [BullModule.registerQueue({ name: REMINDERS_QUEUE })],
  providers: [RemindersService],
  exports: [RemindersService, BullModule],
})
export class RemindersModule {}
