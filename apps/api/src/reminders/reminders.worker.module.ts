import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { RemindersProcessor } from './reminders.processor.js';
import { REMINDERS_QUEUE } from './reminders.constants.js';

@Module({
  imports: [BullModule.registerQueue({ name: REMINDERS_QUEUE })],
  providers: [RemindersProcessor],
  exports: [BullModule],
})
export class RemindersWorkerModule {}
