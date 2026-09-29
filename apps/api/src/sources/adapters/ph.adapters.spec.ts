import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizePosting } from '../normalize.js';
import {
  jobStreetRemote,
  jobStreetUrl,
  mapJobStreet,
  type JobStreetPayload,
} from './jobstreet.adapter.js';
import {
  kalibrrLocation,
  kalibrrRemote,
  kalibrrSalaryText,
  kalibrrUrl,
  mapKalibrr,
  type KalibrrPayload,
} from './kalibrr.adapter.js';

const FIXTURES = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '__fixtures__',
);

function fixture<T>(name: string): T {
  return JSON.parse(readFileSync(join(FIXTURES, name), 'utf8')) as T;
}

describe('JobStreet', () => {
  const payload = fixture<JobStreetPayload>('jobstreet.json');

  it('builds the search url from the board keyword', () => {
    const url = new URL(jobStreetUrl('full-stack-developer'));
    expect(url.host).toBe('ph.jobstreet.com');
    expect(url.pathname).toBe('/api/jobsearch/v5/search');
    expect(url.searchParams.get('keywords')).toBe('full stack developer');
    expect(url.searchParams.get('sortmode')).toBe('ListedDate');
    expect(url.searchParams.get('pageSize')).toBe('100');
    expect(url.searchParams.get('siteKey')).toBe('PH-Main');
  });

  it('keeps every job with an id and a title, once', () => {
    const items = mapJobStreet(payload, 'software-engineer');
    expect(items.map((item) => item.externalId)).toEqual([
      '94945210',
      '94944532',
      '94943817',
    ]);
    for (const item of items) {
      expect(item.source).toBe('JOBSTREET');
      expect(item.url).toBe(`https://ph.jobstreet.com/job/${item.externalId}`);
      expect(item.applyUrl).toBe(item.url);
    }
  });

  it('maps company, arrangement, location and the peso salary as text', () => {
    const [qbe, remote, ey] = mapJobStreet(payload, 'software-engineer');
    expect(qbe).toMatchObject({
      company: 'QBE Insurance',
      remote: 'HYBRID',
      location: 'Manila City, Metro Manila',
      salaryText: null,
    });
    expect(qbe!.postedAt.toISOString()).toBe('2026-09-29T06:42:22.000Z');
    expect(qbe!.tags).toContain('full time');
    expect(qbe!.tags).toContain('engineering - software');
    expect(qbe!.html).toContain('GenAI');

    expect(remote).toMatchObject({
      remote: 'REMOTE',
      salaryText: '₱180,000 – ₱220,000 per month',
    });

    expect(ey).toMatchObject({ company: 'EY GDS', remote: null });
  });

  it('never turns pesos into dollars', () => {
    const [, remote] = mapJobStreet(payload, 'software-engineer');
    const normalized = normalizePosting(remote!);
    expect(normalized.salaryText).toContain('₱');
    expect(normalized.salaryMinUsd).toBeNull();
    expect(normalized.salaryMaxUsd).toBeNull();
    expect(normalized.headline).toContain('Remote');
  });

  it('classifies work arrangements', () => {
    expect(jobStreetRemote('Remote')).toBe('REMOTE');
    expect(jobStreetRemote('Hybrid')).toBe('HYBRID');
    expect(jobStreetRemote('On-site')).toBe('ONSITE');
    expect(jobStreetRemote(undefined)).toBeNull();
  });

  it('returns nothing for an empty payload', () => {
    expect(mapJobStreet({}, 'x')).toEqual([]);
  });
});

describe('Kalibrr', () => {
  const payload = fixture<KalibrrPayload>('kalibrr.json');

  it('builds the board url with the function filter', () => {
    const url = new URL(kalibrrUrl('it-and-software'));
    expect(url.pathname).toBe('/kjs/job_board/search');
    expect(url.searchParams.get('function')).toBe('IT and Software');
    expect(url.searchParams.get('sort')).toBe('Newest');
    expect(url.searchParams.get('limit')).toBe('100');
    expect(new URL(kalibrrUrl('data-engineer')).searchParams.get('text')).toBe(
      'data engineer',
    );
  });

  it('keeps jobs with an id and a name', () => {
    const items = mapKalibrr(payload, 'it-and-software');
    expect(items.map((item) => item.externalId)).toEqual([
      '271747',
      '265258',
      '238867',
      '270716',
    ]);
  });

  it('maps company, flags, location and salary', () => {
    const [nova, salaried, hybrid, onsite] = mapKalibrr(
      payload,
      'it-and-software',
    );
    expect(nova).toMatchObject({
      company: 'Nova Virtual Solutions',
      role: 'Senior QA Lead Automation Engineer',
      url: 'https://www.kalibrr.com/c/nova-virtual-solutions/jobs/271747/senior-qa-lead-automation-engineer',
      remote: 'REMOTE',
      location: 'Mandaluyong, Metro Manila, Philippines',
      salaryText: null,
    });
    expect(nova!.applyUrl).toBe(nova!.url);
    expect(nova!.postedAt.toISOString()).toBe('2026-08-27T13:51:13.179Z');
    expect(nova!.tags).toContain('it and software');
    expect(nova!.html).toContain('<p>');

    expect(salaried).toMatchObject({
      salaryText: 'PHP 17,000–20,000 per month',
      remote: 'ONSITE',
    });
    expect(hybrid).toMatchObject({ remote: 'HYBRID' });
    expect(onsite).toMatchObject({
      remote: 'ONSITE',
      location: 'Pasig, Metro Manila, Philippines',
    });
  });

  it('reads skills into tags and lets the normalizer find the stack', () => {
    const [item] = mapKalibrr(
      {
        jobs: [
          {
            id: 1,
            name: 'Backend Developer',
            slug: 'backend-developer',
            company: { code: 'acme', name: 'Acme' },
            description: '<p>Node services on Postgres.</p>',
            job_sds_skills: [
              { sds_skill: { name: 'Python' } },
              { sds_skill: null },
            ],
            is_work_from_home: true,
          },
        ],
      },
      'it-and-software',
    );
    expect(item!.tags).toEqual(['python']);
    const normalized = normalizePosting(item!);
    expect(normalized.stackKeywords).toEqual(
      expect.arrayContaining(['node', 'postgres', 'python']),
    );
  });

  it('formats salaries and locations from partial data', () => {
    expect(kalibrrSalaryText({ base_salary: 50000 })).toBe('PHP 50,000');
    expect(
      kalibrrSalaryText({
        maximum_salary: 90000,
        salary_currency: 'usd',
        salary_interval: 'year',
      }),
    ).toBe('USD 90,000 per year');
    expect(kalibrrSalaryText({})).toBeNull();
    expect(kalibrrLocation({})).toBe('Philippines');
    expect(kalibrrRemote({ is_hybrid: true })).toBe('HYBRID');
  });
});
