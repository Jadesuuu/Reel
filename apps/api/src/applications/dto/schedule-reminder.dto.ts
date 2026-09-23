import { IsISO8601 } from 'class-validator';

export class ScheduleReminderDto {
  @IsISO8601()
  dueAt!: string;
}
