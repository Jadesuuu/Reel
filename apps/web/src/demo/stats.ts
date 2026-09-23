import { STAGES } from '../lib/stages';
import type {
  Application,
  ApplicationStats,
  Reminder,
  Stage,
  StageEvent,
  UpcomingItem,
  WeeklyBucket,
} from '../lib/types';

const ACTIVE: Stage[] = ['SAVED', 'APPLIED', 'INTERVIEWING', 'OFFER'];
const DAY = 86_400_000;
const WEEK = 7 * DAY;

function startOfIsoWeek(date: Date): Date {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  return day;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = values.toSorted((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

export function summarize(
  applications: Application[],
  allEvents: StageEvent[],
  reminders: Reminder[],
  now: Date,
): ApplicationStats {
  const events = allEvents.filter((event) => event.kind === 'STAGE_CHANGE');
  const byStage = Object.fromEntries(STAGES.map((stage) => [stage, 0])) as Record<Stage, number>;
  for (const application of applications) byStage[application.stage] += 1;

  const firstApplied = new Map<string, number>();
  const firstResponse = new Map<string, number>();
  for (const event of events) {
    const at = new Date(event.createdAt).getTime();
    if (event.toStage === 'APPLIED') {
      const current = firstApplied.get(event.applicationId);
      if (current === undefined || at < current) firstApplied.set(event.applicationId, at);
    }
    if (event.toStage === 'INTERVIEWING' || event.toStage === 'OFFER') {
      const current = firstResponse.get(event.applicationId);
      if (current === undefined || at < current) firstResponse.set(event.applicationId, at);
    }
  }
  const responded = Array.from(firstApplied.keys()).filter((id) => firstResponse.has(id));

  const byId = new Map(applications.map((application) => [application.id, application]));
  const horizon = now.getTime() + 14 * DAY;
  const upcoming: UpcomingItem[] = [];
  for (const reminder of reminders) {
    const application = byId.get(reminder.applicationId);
    if (!application || reminder.sentAt || reminder.cancelledAt) continue;
    if (new Date(reminder.dueAt).getTime() <= horizon) {
      upcoming.push({
        applicationId: application.id,
        company: application.company,
        role: application.role,
        stage: application.stage,
        at: reminder.dueAt,
        kind: 'REMINDER',
      });
    }
  }
  for (const application of applications) {
    if (!application.nextStepAt || !ACTIVE.includes(application.stage)) continue;
    if (new Date(application.nextStepAt).getTime() <= horizon) {
      upcoming.push({
        applicationId: application.id,
        company: application.company,
        role: application.role,
        stage: application.stage,
        at: application.nextStepAt,
        kind: 'NEXT_STEP',
      });
    }
  }
  upcoming.sort((a, b) => a.at.localeCompare(b.at));

  const thisWeek = startOfIsoWeek(now).getTime();
  const firstWeek = thisWeek - 7 * WEEK;
  const weekly: WeeklyBucket[] = Array.from({ length: 8 }, (_, index) => ({
    weekStart: new Date(firstWeek + index * WEEK).toISOString(),
    applied: 0,
    interviewing: 0,
    offer: 0,
    rejected: 0,
  }));
  for (const event of events) {
    const at = new Date(event.createdAt).getTime();
    if (at < firstWeek || at >= thisWeek + WEEK) continue;
    const bucket = weekly[Math.floor((at - firstWeek) / WEEK)];
    if (!bucket) continue;
    if (event.toStage === 'APPLIED') bucket.applied += 1;
    if (event.toStage === 'INTERVIEWING') bucket.interviewing += 1;
    if (event.toStage === 'OFFER') bucket.offer += 1;
    if (event.toStage === 'REJECTED') bucket.rejected += 1;
  }

  return {
    total: applications.length,
    active: ACTIVE.reduce((sum, stage) => sum + byStage[stage], 0),
    byStage,
    appliedThisWeek: events.filter(
      (event) =>
        event.toStage === 'APPLIED' && new Date(event.createdAt).getTime() >= now.getTime() - WEEK,
    ).length,
    responseRate: firstApplied.size === 0 ? null : responded.length / firstApplied.size,
    medianDaysToResponse: median(
      responded.map((id) => (firstResponse.get(id)! - firstApplied.get(id)!) / DAY),
    ),
    upcoming,
    weekly,
  };
}
