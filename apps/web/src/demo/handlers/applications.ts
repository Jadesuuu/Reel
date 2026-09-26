import { sourceLabel } from '../../lib/sources';
import { ALLOWED, canTransition } from '../../lib/stages';
import type { Application, Reminder, Stage, StageEvent } from '../../lib/types';
import { bad, notFound, paginate, requireSignedIn, route, text, conflict } from '../router';
import { summarize } from '../stats';
import { demoNow, getState, mutate, nextId } from '../store';
import { summaryOf } from './postings';

const STALE_DAYS = 10;
const DAY = 86_400_000;

function requireApplication(id: string): Application {
  const application = getState().applications.find((entry) => entry.id === id);
  if (!application) notFound('Application not found');
  return application;
}

function isoOrNull(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string') bad('dates must be ISO 8601 strings');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) bad('dates must be ISO 8601 strings');
  return date.toISOString();
}

function textOrNull(value: unknown, max = 200): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') bad('expected a string');
  return text(value, max);
}

function cancelReminders(applicationId: string, nowIso: string): void {
  mutate((draft) => {
    for (const reminder of draft.reminders) {
      if (reminder.applicationId === applicationId && !reminder.sentAt && !reminder.cancelledAt) {
        reminder.cancelledAt = nowIso;
      }
    }
  });
}

function pendingReminders(id: string) {
  return getState().reminders.filter(
    (reminder) => reminder.applicationId === id && !reminder.sentAt && !reminder.cancelledAt,
  );
}

route('GET', '/applications/stats', () => {
  const state = getState();
  requireSignedIn(state.signedIn);
  return summarize(state.applications, state.events, state.reminders, demoNow());
});

route('GET', '/applications', ({ query }) => {
  const state = getState();
  requireSignedIn(state.signedIn);
  const stage = query.get('stage');
  const q = (query.get('q') ?? '').trim().toLowerCase();
  const items = state.applications
    .filter((application) => !stage || application.stage === stage)
    .filter(
      (application) =>
        !q ||
        application.company.toLowerCase().includes(q) ||
        application.role.toLowerCase().includes(q),
    )
    .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((application) => ({
      ...application,
      reminders: pendingReminders(application.id).map(({ id, kind, dueAt }) => ({
        id,
        kind,
        dueAt,
      })),
      posting: application.postingId
        ? (() => {
            const posting = state.postings.find((entry) => entry.id === application.postingId);
            return posting ? { source: posting.source } : null;
          })()
        : null,
    }));
  return paginate(items, query);
});

route('POST', '/applications', ({ body }) => {
  const state = getState();
  requireSignedIn(state.signedIn);
  const postingId = typeof body.postingId === 'string' ? body.postingId : null;
  const posting = postingId ? state.postings.find((entry) => entry.id === postingId) : undefined;
  if (postingId && !posting) notFound('Posting not found');
  if (posting && state.applications.some((entry) => entry.postingId === posting.id))
    conflict('That posting is already in your pipeline');

  const company = text(body.company) ?? posting?.company ?? null;
  const role = text(body.role) ?? posting?.role ?? null;
  if (!company || !role) bad('company and role are required when no postingId is given');

  const contactEmail = text(body.contactEmail, 254);
  if (contactEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail))
    bad('contactEmail must be an email');

  const nowIso = demoNow().toISOString();
  const id = nextId('a');
  const application: Application = {
    id,
    userId: state.user.id,
    postingId: posting?.id ?? null,
    company,
    role,
    url: text(body.url) ?? posting?.applyUrl ?? posting?.url ?? null,
    stage: 'SAVED',
    notes: text(body.notes, 10_000),
    location: text(body.location) ?? posting?.location ?? null,
    salaryText: text(body.salaryText, 120) ?? posting?.salaryText ?? null,
    via: text(body.via, 120) ?? (posting ? sourceLabel(posting.source) : null),
    appliedAt: null,
    nextStepAt: isoOrNull(body.nextStepAt) ?? null,
    contactName: text(body.contactName),
    contactEmail,
    stageChangedAt: nowIso,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  const event: StageEvent = {
    id: nextId('e'),
    applicationId: id,
    fromStage: null,
    toStage: 'SAVED',
    kind: 'STAGE_CHANGE',
    note: null,
    createdAt: nowIso,
  };
  mutate((draft) => {
    draft.applications.unshift(application);
    draft.events.push(event);
  });
  return { ...application, events: [event] };
});

route('GET', '/applications/:id', ({ params }) => {
  const state = getState();
  requireSignedIn(state.signedIn);
  const application = requireApplication(params.id ?? '');
  const posting = application.postingId
    ? state.postings.find((entry) => entry.id === application.postingId)
    : undefined;
  return {
    ...application,
    events: state.events
      .filter((event) => event.applicationId === application.id)
      .toSorted((a, b) => a.createdAt.localeCompare(b.createdAt)),
    posting: posting ? summaryOf(posting) : null,
    reminders: state.reminders
      .filter((reminder) => reminder.applicationId === application.id)
      .toSorted((a, b) => b.dueAt.localeCompare(a.dueAt)),
  };
});

route('PATCH', '/applications/:id', ({ params, body }) => {
  requireSignedIn(getState().signedIn);
  requireApplication(params.id ?? '');
  const contactEmail = textOrNull(body.contactEmail, 254);
  if (contactEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail))
    bad('contactEmail must be an email');
  const patch = {
    company: textOrNull(body.company),
    role: textOrNull(body.role),
    url: textOrNull(body.url, 2000),
    notes:
      body.notes === undefined
        ? undefined
        : typeof body.notes === 'string'
          ? body.notes
          : bad('notes must be a string'),
    location: textOrNull(body.location),
    salaryText: textOrNull(body.salaryText, 120),
    via: textOrNull(body.via, 120),
    appliedAt: isoOrNull(body.appliedAt),
    nextStepAt: isoOrNull(body.nextStepAt),
    contactName: textOrNull(body.contactName),
    contactEmail,
  };
  return mutate((draft) => {
    const application = draft.applications.find((entry) => entry.id === params.id)!;
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      if ((key === 'company' || key === 'role') && value === null) continue;
      (application as unknown as Record<string, unknown>)[key] = value;
    }
    application.updatedAt = demoNow().toISOString();
    return application;
  });
});

route('POST', '/applications/:id/stage', ({ params, body }) => {
  requireSignedIn(getState().signedIn);
  const application = requireApplication(params.id ?? '');
  const to = body.to as Stage;
  if (!(to in ALLOWED)) bad('to must be a stage');
  const from = application.stage;
  if (to === from) bad(`Application is already in stage ${to}`);
  if (!canTransition(from, to)) {
    const allowed = ALLOWED[from];
    bad(
      allowed.length === 0
        ? `${from} is a terminal stage`
        : `Cannot move from ${from} to ${to}. Allowed: ${allowed.join(', ')}`,
    );
  }
  const nowIso = demoNow().toISOString();
  const note = text(body.note);
  const updated = mutate((draft) => {
    const entry = draft.applications.find((item) => item.id === application.id)!;
    entry.stage = to;
    entry.stageChangedAt = nowIso;
    entry.updatedAt = nowIso;
    if (to === 'APPLIED' && entry.appliedAt === null) entry.appliedAt = nowIso;
    draft.events.push({
      id: nextId('e'),
      applicationId: entry.id,
      fromStage: from,
      toStage: to,
      kind: 'STAGE_CHANGE',
      note,
      createdAt: nowIso,
    });
    return entry;
  });
  cancelReminders(application.id, nowIso);
  if (to === 'APPLIED') {
    mutate((draft) => {
      const jobId = `stale-${application.id}`;
      const dueAt = new Date(demoNow().getTime() + STALE_DAYS * DAY).toISOString();
      const existing = draft.reminders.find((reminder) => reminder.jobId === jobId);
      if (existing) {
        existing.dueAt = dueAt;
        existing.sentAt = null;
        existing.cancelledAt = null;
      } else {
        draft.reminders.push({
          id: nextId('r'),
          applicationId: application.id,
          kind: 'STALE_APPLICATION',
          dueAt,
          sentAt: null,
          cancelledAt: null,
          jobId,
          createdAt: nowIso,
        });
      }
    });
  }
  return updated;
});

route('POST', '/applications/:id/notes', ({ params, body }) => {
  requireSignedIn(getState().signedIn);
  const application = requireApplication(params.id ?? '');
  const note = text(body.note);
  if (!note) bad('note must be longer than or equal to 1 characters');
  return mutate((draft) => {
    const event: StageEvent = {
      id: nextId('e'),
      applicationId: application.id,
      fromStage: application.stage,
      toStage: application.stage,
      kind: 'NOTE',
      note,
      createdAt: demoNow().toISOString(),
    };
    draft.events.push(event);
    return event;
  });
});

route('POST', '/applications/:id/reminders', ({ params, body }) => {
  requireSignedIn(getState().signedIn);
  const application = requireApplication(params.id ?? '');
  const dueAt = isoOrNull(body.dueAt);
  if (!dueAt || new Date(dueAt).getTime() <= demoNow().getTime())
    bad('dueAt must be in the future');
  return mutate((draft) => {
    const jobId = `followup-${application.id}`;
    const nowIso = demoNow().toISOString();
    let reminder = draft.reminders.find((entry) => entry.jobId === jobId);
    if (reminder) {
      reminder.dueAt = dueAt;
      reminder.sentAt = null;
      reminder.cancelledAt = null;
    } else {
      reminder = {
        id: nextId('r'),
        applicationId: application.id,
        kind: 'FOLLOW_UP',
        dueAt,
        sentAt: null,
        cancelledAt: null,
        jobId,
        createdAt: nowIso,
      } satisfies Reminder;
      draft.reminders.push(reminder);
    }
    return reminder;
  });
});

route('DELETE', '/applications/:id/reminders/:reminderId', ({ params }) => {
  requireSignedIn(getState().signedIn);
  const application = requireApplication(params.id ?? '');
  const found = mutate((draft) => {
    const reminder = draft.reminders.find(
      (entry) => entry.id === params.reminderId && entry.applicationId === application.id,
    );
    if (!reminder) return false;
    if (!reminder.sentAt && !reminder.cancelledAt) reminder.cancelledAt = demoNow().toISOString();
    return true;
  });
  if (!found) notFound('Reminder not found');
  return undefined;
});

route('DELETE', '/applications/:id', ({ params }) => {
  requireSignedIn(getState().signedIn);
  const application = requireApplication(params.id ?? '');
  mutate((draft) => {
    draft.applications = draft.applications.filter((entry) => entry.id !== application.id);
    draft.events = draft.events.filter((event) => event.applicationId !== application.id);
    draft.reminders = draft.reminders.filter(
      (reminder) => reminder.applicationId !== application.id,
    );
  });
  return undefined;
});
