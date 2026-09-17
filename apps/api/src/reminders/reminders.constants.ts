export const REMINDERS_QUEUE = 'reminders';
export const STALE_REMINDER_JOB = 'send-stale-reminder';

export function staleJobId(applicationId: string): string {
  return `stale-${applicationId}`;
}

export type StaleReminderJobData = {
  applicationId: string;
  stageChangedAt: string;
};
