import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { RemindersModule } from '../reminders/reminders.module.js';
import { ApplicationsController } from './applications.controller.js';
import { ApplicationsService } from './applications.service.js';

@Module({
  imports: [AuthModule, RemindersModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
