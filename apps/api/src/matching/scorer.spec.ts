import { findRegionTerms, regionBasis } from './regions.js';
import {
  MATCH_THRESHOLD,
  score,
  type CriteriaForScoring,
  type PostingForScoring,
} from './scorer.js';

const NOW = new Date('2026-09-29T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * DAY);
}

function posting(
  overrides: Partial<PostingForScoring> = {},
): PostingForScoring {
  const headline = overrides.headline ?? 'Acme | Full Stack Engineer | Remote';
  const location = overrides.location ?? null;
  return {
    headline,
    location,
    remote: 'REMOTE',
    stackKeywords: [],
    regionTerms: findRegionTerms(regionBasis(headline, location)),
    level: null,
    salaryMinUsd: null,
    salaryMaxUsd: null,
    applyUrl: null,
    postedAt: daysAgo(30),
    ...overrides,
  };
}

function scoreNow(
  target: PostingForScoring,
  rules: CriteriaForScoring,
): ReturnType<typeof score> {
  return score(target, rules, NOW);
}

function criteria(
  overrides: Partial<CriteriaForScoring> = {},
): CriteriaForScoring {
  return {
    remoteOnly: false,
    roleKeywords: [],
    includeKeywords: [],
    excludeKeywords: [],
    regionKeywords: [],
    nearbyKeywords: [],
    levels: [],
    minSalaryUsd: null,
    ...overrides,
  };
}

describe('score', () => {
  it('rejects non-remote postings when remoteOnly is set', () => {
    const result = scoreNow(
      posting({ remote: 'ONSITE' }),
      criteria({ remoteOnly: true }),
    );
    expect(result).toEqual({ score: 0, reasons: ['not-remote'] });
  });

  it('rejects an excluded keyword found in the headline', () => {
    const result = scoreNow(
      posting({ headline: 'Acme | PHP Developer | Remote' }),
      criteria({ excludeKeywords: ['php'] }),
    );
    expect(result).toEqual({ score: 0, reasons: ['excluded:php'] });
  });

  it('rejects an excluded keyword found in the stack list', () => {
    const result = scoreNow(
      posting({ stackKeywords: ['wordpress'] }),
      criteria({ excludeKeywords: ['wordpress'] }),
    );
    expect(result).toEqual({ score: 0, reasons: ['excluded:wordpress'] });
  });

  it('rejects a posting limited to a region outside the user regions', () => {
    const result = scoreNow(
      posting({ headline: 'Acme | Full Stack Engineer | Remote (US only)' }),
      criteria({ regionKeywords: ['philippines', 'worldwide'] }),
    );
    expect(result).toEqual({ score: 0, reasons: ['outside:us'] });
  });

  it('reads the location field as well as the headline for regions', () => {
    const result = scoreNow(
      posting({ location: 'Remote (EU)' }),
      criteria({ regionKeywords: ['philippines'] }),
    );
    expect(result).toEqual({ score: 0, reasons: ['outside:europe'] });
  });

  it('keeps a posting that names one of the user regions', () => {
    const result = scoreNow(
      posting({ location: 'Remote (US, Philippines, Singapore)' }),
      criteria({ regionKeywords: ['philippines'] }),
    );
    expect(result.score).toBe(35);
    expect(result.reasons).toEqual(['remote', 'open:philippines']);
  });

  it('keeps a posting that names no region at all', () => {
    const result = scoreNow(
      posting(),
      criteria({ regionKeywords: ['philippines'] }),
    );
    expect(result.reasons).toEqual(['remote']);
  });

  it('ignores regions entirely when the user has none', () => {
    const result = scoreNow(
      posting({ location: 'Remote (US)' }),
      criteria({ regionKeywords: [] }),
    );
    expect(result.reasons).toEqual(['remote']);
  });

  it('awards 25 for a remote posting', () => {
    const result = scoreNow(posting(), criteria());
    expect(result.score).toBe(25);
    expect(result.reasons).toContain('remote');
  });

  it('awards 30 for the first role keyword only', () => {
    const result = scoreNow(
      posting({ headline: 'Acme | Full Stack Engineer | Remote' }),
      criteria({ roleKeywords: ['full stack', 'engineer'] }),
    );
    expect(result.score).toBe(55);
    expect(result.reasons.filter((r) => r.startsWith('role:'))).toHaveLength(1);
  });

  it('awards 10 per include keyword and caps the total at 40', () => {
    const result = scoreNow(
      posting({
        stackKeywords: ['typescript', 'node', 'react', 'postgres', 'aws'],
      }),
      criteria({
        includeKeywords: ['typescript', 'node', 'react', 'postgres', 'aws'],
      }),
    );
    expect(result.score).toBe(65);
    expect(result.reasons.filter((r) => r.startsWith('stack:'))).toHaveLength(
      4,
    );
  });

  it('awards 10 when a salary floor was parsed', () => {
    const result = scoreNow(posting({ salaryMinUsd: 120_000 }), criteria());
    expect(result.score).toBe(35);
    expect(result.reasons).toContain('salary');
  });

  it('rejects a posting whose ceiling is below the minimum salary', () => {
    const result = scoreNow(
      posting({ salaryMinUsd: 60_000, salaryMaxUsd: 80_000 }),
      criteria({ minSalaryUsd: 100_000 }),
    );
    expect(result).toEqual({ score: 0, reasons: ['below-min-salary'] });
  });

  it('awards 5 for an apply url', () => {
    const result = scoreNow(
      posting({ applyUrl: 'https://example.com/jobs' }),
      criteria(),
    );
    expect(result.score).toBe(30);
    expect(result.reasons).toContain('apply-url');
  });

  it('scores a strong match above the threshold', () => {
    const result = scoreNow(
      posting({
        headline: 'Northwind | Senior Full Stack Engineer | Remote | $150k',
        stackKeywords: ['typescript', 'node', 'react'],
        salaryMinUsd: 150_000,
        applyUrl: 'https://northwind.example/apply',
      }),
      criteria({
        remoteOnly: true,
        roleKeywords: ['full stack'],
        includeKeywords: ['typescript', 'node', 'react'],
      }),
    );
    expect(result.score).toBe(100);
    expect(result.score).toBeGreaterThanOrEqual(MATCH_THRESHOLD);
  });

  it('scores a weak match below the threshold', () => {
    const result = scoreNow(
      posting({ headline: 'Initech | Office Manager | Remote' }),
      criteria({ roleKeywords: ['full stack'], includeKeywords: ['rust'] }),
    );
    expect(result.score).toBe(25);
    expect(result.score).toBeLessThan(MATCH_THRESHOLD);
  });

  it('rejects a remote posting whose location is a US city or state', () => {
    const result = scoreNow(
      posting({
        headline:
          'Humana | Senior Full Stack Engineer | Kentucky or Louisville | Remote',
        location: 'Kentucky or Louisville',
      }),
      criteria({ regionKeywords: ['philippines', 'anywhere'] }),
    );
    expect(result).toEqual({ score: 0, reasons: ['outside:us'] });
  });

  it('does not let "anywhere" rescue a posting that also names a region', () => {
    const result = scoreNow(
      posting({ location: 'Remote (anywhere in the US)' }),
      criteria({ regionKeywords: ['philippines', 'anywhere'] }),
    );
    expect(result).toEqual({ score: 0, reasons: ['outside:us'] });
  });

  it('awards 10 for a posting that is explicitly open worldwide', () => {
    const result = scoreNow(
      posting({ location: 'Remote (worldwide)' }),
      criteria({ regionKeywords: ['philippines'] }),
    );
    expect(result.score).toBe(35);
    expect(result.reasons).toEqual(['remote', 'open:worldwide']);
  });

  it('trusts the stored region terms, which carry body restrictions', () => {
    const result = scoreNow(
      posting({ location: 'Remote', regionTerms: ['canada'] }),
      criteria({ regionKeywords: ['philippines'] }),
    );
    expect(result).toEqual({ score: 0, reasons: ['outside:canada'] });
  });

  it('lets a hybrid posting near the user through the remote-only gate', () => {
    const result = scoreNow(
      posting({
        headline: 'yGen | Frontend Engineer | Metro Manila | Hybrid',
        location: 'Metro Manila',
        remote: 'HYBRID',
      }),
      criteria({
        remoteOnly: true,
        nearbyKeywords: ['metro manila', 'makati'],
        regionKeywords: ['philippines'],
      }),
    );
    expect(result.score).toBe(30);
    expect(result.reasons).toEqual(['nearby:metro manila', 'open:philippines']);
  });

  it('still rejects a hybrid posting somewhere else', () => {
    const result = scoreNow(
      posting({ location: 'Berlin', remote: 'HYBRID' }),
      criteria({ remoteOnly: true, nearbyKeywords: ['metro manila'] }),
    );
    expect(result).toEqual({ score: 0, reasons: ['not-remote'] });
  });

  it('rejects a level the user did not pick and keeps unknown levels', () => {
    const rules = criteria({ levels: ['junior', 'mid'] });
    expect(scoreNow(posting({ level: 'senior' }), rules)).toEqual({
      score: 0,
      reasons: ['level:senior'],
    });
    expect(scoreNow(posting({ level: 'lead' }), rules).reasons).toEqual([
      'level:lead',
    ]);
    expect(scoreNow(posting({ level: 'mid' }), rules).reasons).toEqual([
      'remote',
    ]);
    expect(scoreNow(posting({ level: null }), rules).reasons).toEqual([
      'remote',
    ]);
  });

  it('ignores levels when the user picked none', () => {
    expect(scoreNow(posting({ level: 'lead' }), criteria()).reasons).toEqual([
      'remote',
    ]);
  });

  it('awards 10 within three days and 5 within ten', () => {
    expect(scoreNow(posting({ postedAt: daysAgo(1) }), criteria())).toEqual({
      score: 35,
      reasons: ['remote', 'fresh'],
    });
    expect(scoreNow(posting({ postedAt: daysAgo(7) }), criteria())).toEqual({
      score: 30,
      reasons: ['remote', 'recent'],
    });
    expect(scoreNow(posting({ postedAt: daysAgo(20) }), criteria())).toEqual({
      score: 25,
      reasons: ['remote'],
    });
  });

  it('scores a mid match exactly at the threshold', () => {
    const result = scoreNow(
      posting({
        headline: 'Contoso | Backend Engineer | Remote',
        stackKeywords: ['go'],
        applyUrl: 'https://contoso.example/apply',
      }),
      criteria({ includeKeywords: ['go'] }),
    );
    expect(result.score).toBe(40);
    expect(result.score).toBeGreaterThanOrEqual(MATCH_THRESHOLD);
  });
});
