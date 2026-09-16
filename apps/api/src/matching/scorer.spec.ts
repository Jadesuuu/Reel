import {
  MATCH_THRESHOLD,
  score,
  type CriteriaForScoring,
  type PostingForScoring,
} from './scorer.js';

function posting(
  overrides: Partial<PostingForScoring> = {},
): PostingForScoring {
  return {
    headline: 'Acme | Full Stack Engineer | Remote',
    remote: 'REMOTE',
    stackKeywords: [],
    salaryMinUsd: null,
    salaryMaxUsd: null,
    applyUrl: null,
    ...overrides,
  };
}

function criteria(
  overrides: Partial<CriteriaForScoring> = {},
): CriteriaForScoring {
  return {
    remoteOnly: false,
    roleKeywords: [],
    includeKeywords: [],
    excludeKeywords: [],
    minSalaryUsd: null,
    ...overrides,
  };
}

describe('score', () => {
  it('rejects non-remote postings when remoteOnly is set', () => {
    const result = score(
      posting({ remote: 'ONSITE' }),
      criteria({ remoteOnly: true }),
    );
    expect(result).toEqual({ score: 0, reasons: ['not-remote'] });
  });

  it('rejects an excluded keyword found in the headline', () => {
    const result = score(
      posting({ headline: 'Acme | PHP Developer | Remote' }),
      criteria({ excludeKeywords: ['php'] }),
    );
    expect(result).toEqual({ score: 0, reasons: ['excluded:php'] });
  });

  it('rejects an excluded keyword found in the stack list', () => {
    const result = score(
      posting({ stackKeywords: ['wordpress'] }),
      criteria({ excludeKeywords: ['wordpress'] }),
    );
    expect(result).toEqual({ score: 0, reasons: ['excluded:wordpress'] });
  });

  it('awards 25 for a remote posting', () => {
    const result = score(posting(), criteria());
    expect(result.score).toBe(25);
    expect(result.reasons).toContain('remote');
  });

  it('awards 30 for the first role keyword only', () => {
    const result = score(
      posting({ headline: 'Acme | Full Stack Engineer | Remote' }),
      criteria({ roleKeywords: ['full stack', 'engineer'] }),
    );
    expect(result.score).toBe(55);
    expect(result.reasons.filter((r) => r.startsWith('role:'))).toHaveLength(1);
  });

  it('awards 10 per include keyword and caps the total at 40', () => {
    const result = score(
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
    const result = score(posting({ salaryMinUsd: 120_000 }), criteria());
    expect(result.score).toBe(35);
    expect(result.reasons).toContain('salary');
  });

  it('rejects a posting whose ceiling is below the minimum salary', () => {
    const result = score(
      posting({ salaryMinUsd: 60_000, salaryMaxUsd: 80_000 }),
      criteria({ minSalaryUsd: 100_000 }),
    );
    expect(result).toEqual({ score: 0, reasons: ['below-min-salary'] });
  });

  it('awards 5 for an apply url', () => {
    const result = score(
      posting({ applyUrl: 'https://example.com/jobs' }),
      criteria(),
    );
    expect(result.score).toBe(30);
    expect(result.reasons).toContain('apply-url');
  });

  it('scores a strong match above the threshold', () => {
    const result = score(
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
    const result = score(
      posting({ headline: 'Initech | Office Manager | Remote' }),
      criteria({ roleKeywords: ['full stack'], includeKeywords: ['rust'] }),
    );
    expect(result.score).toBe(25);
    expect(result.score).toBeLessThan(MATCH_THRESHOLD);
  });

  it('scores a mid match exactly at the threshold', () => {
    const result = score(
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
