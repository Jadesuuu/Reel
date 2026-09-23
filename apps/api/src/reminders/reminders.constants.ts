export const REMINDERS_QUEUE = 'reminders';
export const STALE_REMINDER_JOB = 'send-stale-reminder';
export const FOLLOW_UP_JOB = 'send-follow-up';

export function staleJobId(applicationId: string): string {
  return `stale-${applicationId}`;
}

export function followUpJobId(applicationId: string): string {
  return `followup-${applicationId}`;
}

export type StaleReminderJobData = {
  applicationId: string;
  stageChangedAt: string;
};

export type FollowUpJobData = {
  applicationId: string;
  reminderId: string;
};

export type ReminderJobData = StaleReminderJobData | FollowUpJobData;
