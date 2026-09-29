import {
  cleanTags,
  composeHeadline,
  formatUsdRange,
  normalizePosting,
  positive,
  text,
  toDate,
} from './normalize.js';
import type { RawPosting } from './source.types.js';

function raw(overrides: Partial<RawPosting> = {}): RawPosting {
  return {
    source: 'REMOTIVE',
    externalId: '42',
    boardId: 'software-dev',
    author: 'Acme',
    postedAt: new Date('2026-09-20T00:00:00Z'),
    url: 'https://example.com/jobs/42',
    applyUrl: null,
    company: 'Acme',
    role: 'Full Stack Engineer',
    location: 'USA',
    remote: null,
    salaryText: null,
    salaryMinUsd: null,
    salaryMaxUsd: null,
    tags: [],
    html: '<p>We use <b>TypeScript</b> and Postgres.</p><p>Apply now.</p>',
    headline: null,
    ...overrides,
  };
}

describe('composeHeadline', () => {
  it('joins the present parts in HN order', () => {
    expect(
      composeHeadline({
        company: 'Acme',
        role: 'Engineer',
        location: 'Berlin',
        remote: 'REMOTE',
        salaryText: '$100k–$140k',
      }),
    ).toBe('Acme | Engineer | Berlin | Remote | $100k–$140k');
  });

  it('skips missing parts and non-remote flags', () => {
    expect(
      composeHeadline({
        company: null,
        role: 'Engineer',
        location: null,
        remote: 'ONSITE',
        salaryText: null,
      }),
    ).toBe('Engineer');
  });

  it('marks hybrid roles', () => {
    expect(
      composeHeadline({
        company: 'Acme',
        role: 'Engineer',
        location: null,
        remote: 'HYBRID',
        salaryText: null,
      }),
    ).toBe('Acme | Engineer | Hybrid');
  });
});

describe('formatUsdRange', () => {
  it('formats a range in thousands', () => {
    expect(formatUsdRange(80_000, 250_000)).toBe('$80k–$250k');
  });

  it('handles open-ended values', () => {
    expect(formatUsdRange(120_000, null)).toBe('$120k+');
    expect(formatUsdRange(null, 90_000)).toBe('up to $90k');
    expect(formatUsdRange(null, null)).toBeNull();
  });
});

describe('normalizePosting', () => {
  it('composes a headline, strips html, and finds stack keywords across text and tags', () => {
    const result = normalizePosting(raw({ tags: ['react', 'aws'] }));

    expect(result.headline).toBe('Acme | Full Stack Engineer | USA');
    expect(result.rawText).toBe(
      'We use TypeScript and Postgres.\n\nApply now.',
    );
    expect(result.stackKeywords).toEqual([
      'typescript',
      'react',
      'postgres',
      'aws',
    ]);
    expect(result.applyUrl).toBe('https://example.com/jobs/42');
    expect(result.url).toBe('https://example.com/jobs/42');
  });

  it('prefers the remote hint over text detection', () => {
    expect(
      normalizePosting(raw({ remote: 'REMOTE', location: 'Berlin office' }))
        .remote,
    ).toBe('REMOTE');
    expect(
      normalizePosting(raw({ remote: null, location: 'Remote (EU)' })).remote,
    ).toBe('REMOTE');
    expect(
      normalizePosting(raw({ remote: null, location: 'Berlin' })).remote,
    ).toBe('UNKNOWN');
  });

  it('keeps supplied USD numbers and composes their text', () => {
    const result = normalizePosting(
      raw({ salaryMinUsd: 80_000, salaryMaxUsd: 250_000 }),
    );
    expect(result.salaryText).toBe('$80k–$250k');
    expect(result.salaryMinUsd).toBe(80_000);
    expect(result.salaryMaxUsd).toBe(250_000);
    expect(result.headline).toBe(
      'Acme | Full Stack Engineer | USA | $80k–$250k',
    );
  });

  it('parses a salary string in USD', () => {
    const result = normalizePosting(raw({ salaryText: '$90k - $105k' }));
    expect(result.salaryMinUsd).toBe(90_000);
    expect(result.salaryMaxUsd).toBe(105_000);
    expect(result.salaryText).toBe('$90k - $105k');
  });

  it('keeps non-USD salary text without numbers', () => {
    const result = normalizePosting(raw({ salaryText: '€110K - €185K' }));
    expect(result.salaryText).toBe('€110K - €185K');
    expect(result.salaryMinUsd).toBeNull();
    expect(result.salaryMaxUsd).toBeNull();
  });

  it('keeps an unparseable salary string as text', () => {
    const result = normalizePosting(raw({ salaryText: 'Competitive' }));
    expect(result.salaryText).toBe('Competitive');
    expect(result.salaryMinUsd).toBeNull();
  });

  it('keeps a supplied headline as-is', () => {
    const result = normalizePosting(
      raw({ source: 'HN', headline: 'Acme | Engineer | REMOTE | $150k' }),
    );
    expect(result.headline).toBe('Acme | Engineer | REMOTE | $150k');
  });

  it('fingerprints by company and role, falling back to source and id', () => {
    const a = normalizePosting(raw({ source: 'REMOTIVE', externalId: '1' }));
    const b = normalizePosting(raw({ source: 'JOBICY', externalId: '2' }));
    expect(a.fingerprint).toBe(b.fingerprint);

    const c = normalizePosting(
      raw({ company: null, source: 'REMOTIVE', externalId: '1' }),
    );
    const d = normalizePosting(
      raw({ company: null, source: 'JOBICY', externalId: '1' }),
    );
    expect(c.fingerprint).not.toBe(d.fingerprint);
  });
});

describe('helpers', () => {
  it('toDate reads unix seconds, unix ms, and zone-less ISO as UTC', () => {
    expect(toDate(1_790_067_601).toISOString()).toBe(
      '2026-09-22T09:00:01.000Z',
    );
    expect(toDate(1_565_990_241_800).toISOString()).toBe(
      '2019-08-16T21:17:21.800Z',
    );
    expect(toDate('2026-09-18T16:43:22').toISOString()).toBe(
      '2026-09-18T16:43:22.000Z',
    );
    expect(toDate('Tue, 08 Sep 2026 13:49:13 +0000').toISOString()).toBe(
      '2026-09-08T13:49:13.000Z',
    );
  });

  it('toDate falls back to now on garbage', () => {
    const before = Date.now();
    const result = toDate('not a date').getTime();
    expect(result).toBeGreaterThanOrEqual(before);
  });

  it('cleanTags lowercases, trims, drops empties and duplicates', () => {
    expect(cleanTags(['React ', 'react', '', 42, 'AWS'])).toEqual([
      'react',
      'aws',
    ]);
    expect(cleanTags(undefined)).toEqual([]);
  });

  it('text collapses whitespace and returns null for blanks', () => {
    expect(text('  Senior   Engineer ')).toBe('Senior Engineer');
    expect(text('   ')).toBeNull();
    expect(text(12)).toBeNull();
  });

  it('positive keeps only positive finite numbers', () => {
    expect(positive(80_000)).toBe(80_000);
    expect(positive(0)).toBeNull();
    expect(positive('80000')).toBeNull();
  });
});

describe('normalizePosting level and restrictions', () => {
  it('detects the level from the role', () => {
    expect(
      normalizePosting(raw({ role: 'Senior Full Stack Engineer' })).level,
    ).toBe('senior');
    expect(
      normalizePosting(raw({ role: 'Full Stack Engineer' })).level,
    ).toBeNull();
  });

  it('labels the location with a region', () => {
    expect(
      normalizePosting(raw({ location: 'Toronto, Ontario' })).regionTerms,
    ).toEqual(['canada']);
    expect(normalizePosting(raw({ location: 'Remote' })).regionTerms).toEqual(
      [],
    );
  });

  it('reads residency restrictions out of the description', () => {
    const normalized = normalizePosting(
      raw({
        location: 'Remote',
        html: '<p>We use TypeScript.</p><p>Candidates must be located in the United States.</p>',
      }),
    );
    expect(normalized.regionTerms).toEqual(['us']);
  });
});
