import { ApiError } from '../lib/api';
import { dispatch, route, type Method } from './router';
import { advanceClock, demoNow, getState, mutate, nextId, resetState } from './store';
import './handlers/auth';
import './handlers/criteria';
import './handlers/sources';
import './handlers/ingest';
import './handlers/postings';
import './handlers/matches';
import './handlers/applications';

export const DEMO_STORAGE_EVENT = 'reel-demo-changed';

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

function latency(): number {
  return 90 + Math.random() * 220;
}

function parseBody(init: RequestInit): Record<string, unknown> {
  if (typeof init.body !== 'string' || init.body.length === 0) return {};
  try {
    const parsed = JSON.parse(init.body) as unknown;
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
  } catch {
    throw new ApiError(400, 'Malformed JSON body');
  }
}

export async function demoFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase() as Method satisfies Method;
  const body = parseBody(init);
  await new Promise((resolve) => setTimeout(resolve, latency()));
  const result = await dispatch(method, path, body);
  return JSON.parse(JSON.stringify(result ?? null)) as T;
}

export function deliverDueReminders(): number {
  return mutate((draft) => {
    const nowMs = demoNow().getTime();
    let sent = 0;
    for (const reminder of draft.reminders) {
      if (reminder.sentAt || reminder.cancelledAt) continue;
      if (new Date(reminder.dueAt).getTime() > nowMs) continue;
      const application = draft.applications.find((entry) => entry.id === reminder.applicationId);
      if (!application) continue;
      if (reminder.kind === 'STALE_APPLICATION' && application.stage !== 'APPLIED') {
        reminder.cancelledAt = demoNow().toISOString();
        continue;
      }
      const sentAt = demoNow().toISOString();
      reminder.sentAt = sentAt;
      draft.mail.unshift({
        id: nextId('mail'),
        to: draft.user.email,
        subject:
          reminder.kind === 'STALE_APPLICATION'
            ? `Follow up: ${application.company} — ${application.role}`
            : `Reminder: ${application.company} — ${application.role}`,
        text:
          reminder.kind === 'STALE_APPLICATION'
            ? [
                `You applied to ${application.company} for ${application.role} and have not heard back.`,
                application.url ? `Posting: ${application.url}` : null,
                'Consider following up or moving it to WITHDRAWN.',
              ]
                .filter(Boolean)
                .join('\n\n')
            : [
                `You asked to be reminded about ${application.company} (${application.role}), currently ${application.stage}.`,
                application.notes ? `Your notes:\n${application.notes}` : null,
                application.url ? `Posting: ${application.url}` : null,
              ]
                .filter(Boolean)
                .join('\n\n'),
        sentAt,
      });
      sent += 1;
    }
    return sent;
  });
}

export function fastForward(days: number): { sent: number; now: string } {
  advanceClock(days * 86_400_000);
  const sent = deliverDueReminders();
  return { sent, now: demoNow().toISOString() };
}

export function resetDemo(): void {
  resetState();
}

export function demoClockOffsetDays(): number {
  return Math.round(getState().clockOffsetMs / 86_400_000);
}

route('GET', '/demo/mail', () => ({ items: getState().mail }));
route('GET', '/demo/state', () => ({
  offsetDays: demoClockOffsetDays(),
  signedIn: getState().signedIn,
}));
