import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizePosting } from '../normalize.js';
import { mapBrowserItems } from './browser.mappers.js';
import {
  hiringCafeRemote,
  hiringCafeSalary,
  mapHiringCafe,
  type HiringCafeHit,
} from './hiringcafe.mapper.js';
import { markdownToText } from './html.js';
import {
  mapWellfound,
  wellfoundLocation,
  wellfoundRemote,
  wellfoundSalaryText,
  type WellfoundJob,
} from './wellfound.mapper.js';

const FIXTURES = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '__fixtures__',
);

function fixture<T>(name: string): T {
  return JSON.parse(readFileSync(join(FIXTURES, name), 'utf8')) as T;
}

describe('mapHiringCafe', () => {
  const hits = fixture<HiringCafeHit[]>('hiringcafe.json');

  it('keeps live hits with an id, a title and an apply link', () => {
    const items = mapHiringCafe(hits, 'backend-engineer');
    expect(items.map((item) => item.externalId)).toEqual([
      'recruitee__patsnap__2711725',
      'ashby__ohr__6f1c2a',
      'zohorecruit__taker__608819000000325008',
    ]);
    for (const item of items) {
      expect(item.source).toBe('HIRINGCAFE');
      expect(item.boardId).toBe('backend-engineer');
      expect(item.url).toBe(item.applyUrl);
    }
  });

  it('maps the structured fields and composes a description', () => {
    const [patsnap, ohr, taker] = mapHiringCafe(hits, 'backend-engineer');
    expect(patsnap).toMatchObject({
      company: 'Patsnap',
      role: 'Backend Engineer / Senior Backend Engineer',
      location: 'Singapore, Central Singapore, Singapore',
      remote: 'REMOTE',
      salaryText: null,
      salaryMinUsd: null,
    });
    expect(patsnap!.postedAt.toISOString()).toBe('2026-09-28T06:16:25.000Z');
    expect(patsnap!.tags).toContain('java');
    expect(patsnap!.tags).toContain('full time');
    expect(patsnap!.html).toContain('Tools: Java, Spring');

    expect(ohr).toMatchObject({
      location: 'Worldwide',
      salaryMinUsd: 120000,
      salaryMaxUsd: 160000,
    });
    expect(ohr!.html).toContain('Visa sponsorship offered');

    expect(taker).toMatchObject({
      company: 'Taker',
      remote: 'HYBRID',
      location: 'US',
      salaryText: 'EUR 90,000–110,000',
      salaryMinUsd: null,
    });
  });

  it('feeds the normalizer with a headline and stack keywords', () => {
    const [ohr] = mapHiringCafe(hits, 'software-engineer').filter(
      (item) => item.company === 'Ohr',
    );
    const normalized = normalizePosting(ohr!);
    expect(normalized.headline).toBe(
      'Ohr | Software Engineer | Worldwide | Remote | $120k–$160k',
    );
    expect(normalized.stackKeywords).toEqual(
      expect.arrayContaining(['typescript', 'react', 'aws']),
    );
    expect(normalized.regionTerms).toEqual([]);
  });

  it('classifies workplace types', () => {
    expect(hiringCafeRemote('Remote')).toBe('REMOTE');
    expect(hiringCafeRemote('Hybrid')).toBe('HYBRID');
    expect(hiringCafeRemote('Field')).toBe('ONSITE');
    expect(hiringCafeRemote(undefined)).toBeNull();
  });

  it('keeps foreign salaries as text', () => {
    expect(
      hiringCafeSalary({
        yearly_min_compensation: 50000,
        listed_compensation_currency: 'GBP',
      }),
    ).toEqual({
      salaryText: 'GBP 50,000',
      salaryMinUsd: null,
      salaryMaxUsd: null,
    });
  });

  it('returns nothing for a payload that is not a list', () => {
    expect(mapHiringCafe({ ssrHits: [] }, 'x')).toEqual([]);
  });
});

describe('mapWellfound', () => {
  const jobs = fixture<WellfoundJob[]>('wellfound.json');

  it('keeps jobs with an id and a title', () => {
    const items = mapWellfound(jobs, 'software-engineer');
    expect(items.map((item) => item.externalId)).toEqual([
      '4697947',
      '3392132',
      '4762995',
    ]);
  });

  it('maps company, location, remote kind and salary text', () => {
    const [confident, speak, staff] = mapWellfound(jobs, 'software-engineer');
    expect(confident).toMatchObject({
      company: 'Confident LIMS',
      role: 'Senior Software Engineer',
      url: 'https://wellfound.com/jobs/4697947-senior-software-engineer',
      location: 'Canada, South America, United States, Latin America',
      remote: 'REMOTE',
      salaryText: '$100k – $180k',
      tags: ['full-time', 'size_11_50'],
    });
    expect(confident!.postedAt.toISOString()).toBe('2026-09-10T17:59:14.000Z');
    expect(confident!.html).toContain('5+ years of experience');
    expect(confident!.html).not.toContain('#');

    expect(speak).toMatchObject({
      company: 'Speak',
      remote: 'HYBRID',
      location: 'San Francisco (remote: United States)',
      salaryText: '$150k – $280k',
    });

    expect(staff).toMatchObject({
      company: null,
      author: 'Wellfound',
      remote: 'ONSITE',
      location: 'Berlin',
      salaryText: null,
    });
  });

  it('lets the normalizer parse the salary text into numbers', () => {
    const [confident] = mapWellfound(jobs, 'software-engineer');
    const normalized = normalizePosting(confident!);
    expect(normalized.salaryMinUsd).toBe(100000);
    expect(normalized.salaryMaxUsd).toBe(180000);
    expect(normalized.stackKeywords).toEqual(
      expect.arrayContaining(['typescript', 'postgres', 'react']),
    );
  });

  it('reads remote kind from the config first', () => {
    expect(wellfoundRemote({ remoteConfig: { kind: 'REMOTE' } })).toBe(
      'REMOTE',
    );
    expect(
      wellfoundRemote({ remoteConfig: { kind: 'ONSITE', wfhFlexible: true } }),
    ).toBe('HYBRID');
    expect(wellfoundRemote({ remote: true })).toBe('REMOTE');
    expect(wellfoundRemote({})).toBeNull();
  });

  it('falls back through the location fields', () => {
    expect(wellfoundLocation({ locationNames: ['Berlin'] })).toBe('Berlin');
    expect(wellfoundLocation({})).toBe('Remote');
  });

  it('drops the equity part of the compensation line', () => {
    expect(wellfoundSalaryText('$100k – $180k • 0.05% – 0.25%')).toBe(
      '$100k – $180k',
    );
    expect(wellfoundSalaryText('Not specified')).toBeNull();
  });
});

describe('mapBrowserItems', () => {
  it('dispatches on the source', () => {
    expect(
      mapBrowserItems('WELLFOUND', 'x', fixture('wellfound.json')),
    ).toHaveLength(3);
    expect(
      mapBrowserItems('HIRINGCAFE', 'x', fixture('hiringcafe.json')),
    ).toHaveLength(3);
  });
});

describe('markdownToText', () => {
  it('strips headings, emphasis, links and bullets', () => {
    expect(
      markdownToText(
        '# **About us**\n\n- Own the [API](https://x.y)\n- `Node`',
      ),
    ).toBe('About us\n\nOwn the API\nNode');
  });
});
