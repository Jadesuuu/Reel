import { STAGES, type Stage } from './stage-machine.js';

export type StatsApplication = {
  id: string;
  company: string;
  role: string;
  stage: Stage;
  nextStepAt: Date | null;
};

export type StatsEvent = {
  applicationId: string;
  toStage: Stage;
  kind: 'STAGE_CHANGE' | 'NOTE';
  createdAt: Date;
};

export type StatsReminder = {
  applicationId: string;
  dueAt: Date;
  sentAt: Date | null;
  cancelledAt: Date | null;
};

export type UpcomingItem = {
  applicationId: string;
  company: string;
  role: string;
  stage: Stage;
  at: string;
  kind: 'REMINDER' | 'NEXT_STEP';
};

export type WeeklyBucket = {
  weekStart: string;
  applied: number;
  interviewing: number;
  offer: number;
  rejected: number;
};

export type ApplicationStats = {
  total: number;
  active: number;
  byStage: Record<Stage, number>;
  appliedThisWeek: number;
  responseRate: number | null;
  medianDaysToResponse: number | null;
  upcoming: UpcomingItem[];
  weekly: WeeklyBucket[];
};

const ACTIVE_STAGES: Stage[] = ['SAVED', 'APPLIED', 'INTERVIEWING', 'OFFER'];
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const UPCOMING_WINDOW_DAYS = 14;
const WEEKS = 8;

export function startOfIsoWeek(date: Date): Date {
  const day = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const weekday = (day.getUTCDay() + 6) % 7;
  day.setUTCDate(day.getUTCDate() - weekday);
  return day;
}

export function median(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  const sorted = values.toSorted((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]!
    : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

export function summarize(input: {
  applications: StatsApplication[];
  events: StatsEvent[];
  reminders: StatsReminder[];
  now: Date;
}): ApplicationStats {
  const { applications, reminders, now } = input;
  const events = input.events.filter((event) => event.kind === 'STAGE_CHANGE');

  const byStage = Object.fromEntries(
    STAGES.map((stage) => [stage, 0]),
  ) as Record<Stage, number>;
  for (const application of applications) {
    byStage[application.stage] += 1;
  }

  const active = ACTIVE_STAGES.reduce((sum, stage) => sum + byStage[stage], 0);

  const weekAgo = now.getTime() - WEEK_MS;
  const appliedThisWeek = events.filter(
    (event) =>
      event.toStage === 'APPLIED' && event.createdAt.getTime() >= weekAgo,
  ).length;

  const firstAppliedAt = new Map<string, number>();
  const firstResponseAt = new Map<string, number>();
  for (const event of events) {
    const at = event.createdAt.getTime();
    if (event.toStage === 'APPLIED') {
      const current = firstAppliedAt.get(event.applicationId);
      if (current === undefined || at < current) {
        firstAppliedAt.set(event.applicationId, at);
      }
    }
    if (event.toStage === 'INTERVIEWING' || event.toStage === 'OFFER') {
      const current = firstResponseAt.get(event.applicationId);
      if (current === undefined || at < current) {
        firstResponseAt.set(event.applicationId, at);
      }
    }
  }

  const everApplied = firstAppliedAt.size;
  const responded = Array.from(firstAppliedAt.keys()).filter((id) =>
    firstResponseAt.has(id),
  );
  const responseRate =
    everApplied === 0 ? null : responded.length / everApplied;

  const daysToResponse = responded
    .map((id) => (firstResponseAt.get(id)! - firstAppliedAt.get(id)!) / DAY_MS)
    .filter((days) => days >= 0);
  const medianDaysToResponse = median(daysToResponse);

  const applicationById = new Map(
    applications.map((application) => [application.id, application]),
  );
  const horizon = now.getTime() + UPCOMING_WINDOW_DAYS * DAY_MS;
  const upcoming: UpcomingItem[] = [];

  for (const reminder of reminders) {
    const application = applicationById.get(reminder.applicationId);
    if (!application || reminder.sentAt || reminder.cancelledAt) {
      continue;
    }
    const at = reminder.dueAt.getTime();
    if (at <= horizon) {
      upcoming.push({
        applicationId: application.id,
        company: application.company,
        role: application.role,
        stage: application.stage,
        at: reminder.dueAt.toISOString(),
        kind: 'REMINDER',
      });
    }
  }

  for (const application of applications) {
    if (!application.nextStepAt || !ACTIVE_STAGES.includes(application.stage)) {
      continue;
    }
    const at = application.nextStepAt.getTime();
    if (at <= horizon) {
      upcoming.push({
        applicationId: application.id,
        company: application.company,
        role: application.role,
        stage: application.stage,
        at: application.nextStepAt.toISOString(),
        kind: 'NEXT_STEP',
      });
    }
  }

  upcoming.sort((a, b) => a.at.localeCompare(b.at));

  const thisWeek = startOfIsoWeek(now).getTime();
  const weekly: WeeklyBucket[] = Array.from({ length: WEEKS }, (_, index) => ({
    weekStart: new Date(thisWeek - (WEEKS - 1 - index) * WEEK_MS).toISOString(),
    applied: 0,
    interviewing: 0,
    offer: 0,
    rejected: 0,
  }));
  const firstWeek = thisWeek - (WEEKS - 1) * WEEK_MS;

  for (const event of events) {
    const at = event.createdAt.getTime();
    if (at < firstWeek || at >= thisWeek + WEEK_MS) {
      continue;
    }
    const bucket = weekly[Math.floor((at - firstWeek) / WEEK_MS)];
    if (!bucket) {
      continue;
    }
    if (event.toStage === 'APPLIED') bucket.applied += 1;
    if (event.toStage === 'INTERVIEWING') bucket.interviewing += 1;
    if (event.toStage === 'OFFER') bucket.offer += 1;
    if (event.toStage === 'REJECTED') bucket.rejected += 1;
  }

  return {
    total: applications.length,
    active,
    byStage,
    appliedThisWeek,
    responseRate,
    medianDaysToResponse,
    upcoming,
    weekly,
  };
}
