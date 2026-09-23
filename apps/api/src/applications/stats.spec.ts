import { median, startOfIsoWeek, summarize, type StatsEvent } from './stats.js';

const NOW = new Date('2026-09-23T12:00:00.000Z');

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
}

function event(
  applicationId: string,
  toStage: StatsEvent['toStage'],
  createdAt: Date,
  kind: StatsEvent['kind'] = 'STAGE_CHANGE',
): StatsEvent {
  return { applicationId, toStage, kind, createdAt };
}

describe('startOfIsoWeek', () => {
  it('returns the Monday at midnight UTC', () => {
    expect(startOfIsoWeek(new Date('2026-09-23T12:00:00Z')).toISOString()).toBe(
      '2026-09-21T00:00:00.000Z',
    );
    expect(startOfIsoWeek(new Date('2026-09-21T00:00:00Z')).toISOString()).toBe(
      '2026-09-21T00:00:00.000Z',
    );
    expect(startOfIsoWeek(new Date('2026-09-27T23:59:59Z')).toISOString()).toBe(
      '2026-09-21T00:00:00.000Z',
    );
  });
});

describe('median', () => {
  it('handles odd, even and empty lists', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 10])).toBe(2.5);
    expect(median([])).toBeNull();
  });
});

describe('summarize', () => {
  const applications = [
    {
      id: 'a',
      company: 'Acme',
      role: 'Engineer',
      stage: 'INTERVIEWING' as const,
      nextStepAt: daysAgo(-2),
    },
    {
      id: 'b',
      company: 'Globex',
      role: 'Engineer',
      stage: 'APPLIED' as const,
      nextStepAt: null,
    },
    {
      id: 'c',
      company: 'Initech',
      role: 'Engineer',
      stage: 'REJECTED' as const,
      nextStepAt: null,
    },
    {
      id: 'd',
      company: 'Umbrella',
      role: 'Engineer',
      stage: 'SAVED' as const,
      nextStepAt: daysAgo(-30),
    },
    {
      id: 'e',
      company: 'Hooli',
      role: 'Engineer',
      stage: 'OFFER' as const,
      nextStepAt: null,
    },
  ];

  const events = [
    event('a', 'SAVED', daysAgo(20)),
    event('a', 'APPLIED', daysAgo(14)),
    event('a', 'INTERVIEWING', daysAgo(4)),
    event('a', 'INTERVIEWING', daysAgo(3), 'NOTE'),
    event('b', 'SAVED', daysAgo(6)),
    event('b', 'APPLIED', daysAgo(2)),
    event('c', 'SAVED', daysAgo(40)),
    event('c', 'APPLIED', daysAgo(35)),
    event('c', 'REJECTED', daysAgo(30)),
    event('d', 'SAVED', daysAgo(1)),
    event('e', 'SAVED', daysAgo(30)),
    event('e', 'APPLIED', daysAgo(28)),
    event('e', 'INTERVIEWING', daysAgo(8)),
    event('e', 'OFFER', daysAgo(1)),
  ];

  const reminders = [
    { applicationId: 'b', dueAt: daysAgo(-8), sentAt: null, cancelledAt: null },
    {
      applicationId: 'a',
      dueAt: daysAgo(-1),
      sentAt: null,
      cancelledAt: daysAgo(1),
    },
    {
      applicationId: 'c',
      dueAt: daysAgo(-3),
      sentAt: daysAgo(0),
      cancelledAt: null,
    },
  ];

  const stats = summarize({ applications, events, reminders, now: NOW });

  it('counts totals and stages', () => {
    expect(stats.total).toBe(5);
    expect(stats.active).toBe(4);
    expect(stats.byStage).toEqual({
      SAVED: 1,
      APPLIED: 1,
      INTERVIEWING: 1,
      OFFER: 1,
      REJECTED: 1,
      WITHDRAWN: 0,
    });
  });

  it('counts applications in the last seven days from stage changes only', () => {
    expect(stats.appliedThisWeek).toBe(1);
  });

  it('computes response rate over everything that was ever applied', () => {
    expect(stats.responseRate).toBe(2 / 4);
  });

  it('computes the median days from applied to first response', () => {
    expect(stats.medianDaysToResponse).toBe(15);
  });

  it('lists pending reminders and next steps within two weeks, soonest first', () => {
    expect(
      stats.upcoming.map((item) => [item.applicationId, item.kind]),
    ).toEqual([
      ['a', 'NEXT_STEP'],
      ['b', 'REMINDER'],
    ]);
  });

  it('buckets stage changes into the last eight ISO weeks, oldest first', () => {
    expect(stats.weekly).toHaveLength(8);
    expect(stats.weekly[0]!.weekStart).toBe('2026-08-03T00:00:00.000Z');
    expect(stats.weekly[7]!.weekStart).toBe('2026-09-21T00:00:00.000Z');
    const current = stats.weekly[7]!;
    expect(current).toMatchObject({ applied: 1, offer: 1 });
    const total = stats.weekly.reduce((sum, week) => sum + week.applied, 0);
    expect(total).toBe(4);
  });

  it('returns nulls for an empty account', () => {
    const empty = summarize({
      applications: [],
      events: [],
      reminders: [],
      now: NOW,
    });
    expect(empty.total).toBe(0);
    expect(empty.responseRate).toBeNull();
    expect(empty.medianDaysToResponse).toBeNull();
    expect(empty.upcoming).toEqual([]);
  });
});
