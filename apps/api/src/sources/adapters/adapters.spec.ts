import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizePosting } from '../normalize.js';
import type { RawPosting } from '../source.types.js';
import { mapArbeitnow } from './arbeitnow.adapter.js';
import { mapAshby } from './ashby.adapter.js';
import { mapGreenhouse } from './greenhouse.adapter.js';
import { mapHimalayas } from './himalayas.adapter.js';
import { mapHnComment } from './hn.adapter.js';
import { mapJobicy } from './jobicy.adapter.js';
import { mapLever, titleCaseSlug } from './lever.adapter.js';
import { mapRemoteOk } from './remoteok.adapter.js';
import { mapRemotive } from './remotive.adapter.js';
import {
  mapWeWorkRemotely,
  splitWwrTitle,
  weWorkRemotelyUrl,
} from './weworkremotely.adapter.js';
import {
  mapWorkingNomads,
  stripCompanyPrefix,
} from './workingnomads.adapter.js';
import {
  companyFromLandingUrl,
  landingSalary,
  mapLandingJobs,
} from './landingjobs.adapter.js';
import { mapTheMuse } from './themuse.adapter.js';
import { creatorCompany, mapJobspresso } from './jobspresso.adapter.js';
import { mapWorkable } from './workable.adapter.js';
import { mapSmartRecruiters, sectionsHtml } from './smartrecruiters.adapter.js';

const FIXTURES = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '__fixtures__',
);

function fixture<T>(name: string): T {
  return JSON.parse(readFileSync(join(FIXTURES, name), 'utf8')) as T;
}

function fixtureText(name: string): string {
  return readFileSync(join(FIXTURES, name), 'utf8');
}

function expectWellFormed(items: RawPosting[], source: string): void {
  expect(items.length).toBeGreaterThan(0);
  for (const item of items) {
    expect(item.source).toBe(source);
    expect(item.externalId.length).toBeGreaterThan(0);
    expect(item.boardId.length).toBeGreaterThan(0);
    expect(item.role).toBeTruthy();
    expect(Number.isNaN(item.postedAt.getTime())).toBe(false);
    const normalized = normalizePosting(item);
    expect(normalized.headline.length).toBeGreaterThan(0);
    expect(normalized.fingerprint).toMatch(/^[0-9a-f]{40}$/);
  }
}

describe('HN adapter', () => {
  it('maps a comment through the v1 parser and links to the permalink', () => {
    const item = mapHnComment(
      {
        id: 123,
        by: 'alice',
        time: 1_790_000_000,
        type: 'comment',
        text: 'Acme | Full Stack Engineer | REMOTE | $150k-$180k<p>We use <a href="https://acme.example/jobs">TypeScript</a>.',
      },
      '99',
    );
    expect(item).toMatchObject({
      source: 'HN',
      externalId: '123',
      boardId: '99',
      author: 'alice',
      url: 'https://news.ycombinator.com/item?id=123',
      applyUrl: 'https://acme.example/jobs',
      company: 'Acme',
      role: 'Full Stack Engineer',
      remote: 'REMOTE',
      salaryMinUsd: 150_000,
      salaryMaxUsd: 180_000,
      headline: 'Acme | Full Stack Engineer | REMOTE | $150k-$180k',
    });
    expectWellFormed([item], 'HN');
  });
});

describe('Remotive adapter', () => {
  const items = mapRemotive(fixture('remotive.json'));

  it('maps every job with company, role, location and salary text', () => {
    expectWellFormed(items, 'REMOTIVE');
    expect(items[0]).toMatchObject({
      externalId: '2091141',
      boardId: 'software-dev',
      company: 'KoboToolbox',
      role: 'Frontend Web Application Developer',
      location: 'USA, Canada, Argentina, Mexico, Peru',
      remote: 'REMOTE',
      salaryText: '$90k - $105k',
      url: 'https://remotive.com/remote-jobs/design/frontend-web-application-developer-2091141',
    });
    expect(items[0]?.postedAt.toISOString()).toBe('2026-09-18T16:43:22.000Z');
    expect(items[0]?.tags).toContain('django');
  });

  it('normalizes the salary string into USD numbers', () => {
    const normalized = normalizePosting(items[0]!);
    expect(normalized.salaryMinUsd).toBe(90_000);
    expect(normalized.salaryMaxUsd).toBe(105_000);
    expect(normalized.headline).toBe(
      'KoboToolbox | Frontend Web Application Developer | USA, Canada, Argentina, Mexico, Peru | Remote | $90k - $105k',
    );
    expect(normalized.stackKeywords).toEqual(
      expect.arrayContaining(['react', 'python', 'django', 'typescript']),
    );
  });
});

describe('Remote OK adapter', () => {
  const items = mapRemoteOk(fixture('remoteok.json'));

  it('skips the legal notice and maps the jobs', () => {
    expect(items).toHaveLength(2);
    expectWellFormed(items, 'REMOTEOK');
    expect(items[0]).toMatchObject({
      externalId: '1137417',
      company: 'RedMimicry',
      role: 'Software Developer Security Analytics',
      remote: 'REMOTE',
      location: null,
      salaryMinUsd: null,
      salaryMaxUsd: null,
    });
  });

  it('keeps supplied salary numbers and composes the text', () => {
    expect(items[1]).toMatchObject({
      salaryMinUsd: 80_000,
      salaryMaxUsd: 250_000,
    });
    const normalized = normalizePosting(items[1]!);
    expect(normalized.salaryText).toBe('$80k–$250k');
    expect(normalized.url).toContain('remoteOK.com/remote-jobs/');
  });

  it('returns nothing for a non-array payload', () => {
    expect(mapRemoteOk({ jobs: [] })).toEqual([]);
  });
});

describe('Arbeitnow adapter', () => {
  const items = mapArbeitnow(fixture('arbeitnow.json'));

  it('maps slugs as ids and honours the remote flag', () => {
    expectWellFormed(items, 'ARBEITNOW');
    expect(items[0]).toMatchObject({
      externalId: 'integration-solutions-engineer-remote-eu-koln-379113',
      company: 'epilot GmbH',
      remote: 'REMOTE',
      location: 'Remote job',
    });
    expect(items[1]).toMatchObject({
      company: 'Neptun Freight Services GmbH',
      remote: null,
      location: 'Bielefeld, Nordrhein-Westfalen, Deutschland',
    });
    expect(normalizePosting(items[1]!).remote).toBe('UNKNOWN');
    expect(items[0]?.postedAt.toISOString()).toBe('2026-09-23T11:30:11.000Z');
  });
});

describe('Himalayas adapter', () => {
  const items = mapHimalayas(fixture('himalayas.json'));

  it('maps guid urls, location restrictions and categories', () => {
    expectWellFormed(items, 'HIMALAYAS');
    expect(items[0]).toMatchObject({
      company: 'Emma Grün',
      location: 'Germany',
      remote: 'REMOTE',
      salaryMinUsd: null,
    });
    expect(items[0]?.externalId).toMatch(/^https:\/\/himalayas\.app\//);
    expect(items[0]?.tags).toContain('ecommerce');
    expect(items[1]?.location).toBe('United States');
  });

  it('treats USD salaries as numbers and other currencies as text', () => {
    const [usd] = mapHimalayas({
      jobs: [
        {
          title: 'Engineer',
          guid: 'https://x/1',
          minSalary: 100_000,
          maxSalary: 150_000,
          currency: 'USD',
        },
      ],
    });
    expect(usd).toMatchObject({
      salaryMinUsd: 100_000,
      salaryMaxUsd: 150_000,
      salaryText: null,
    });

    const [eur] = mapHimalayas({
      jobs: [
        {
          title: 'Engineer',
          guid: 'https://x/2',
          minSalary: 60_000,
          maxSalary: 80_000,
          currency: 'EUR',
        },
      ],
    });
    expect(eur).toMatchObject({
      salaryMinUsd: null,
      salaryText: 'EUR 60,000–80,000',
    });
  });
});

describe('Jobicy adapter', () => {
  const items = mapJobicy(fixture('jobicy.json'));

  it('maps jobs and reads salary fields when present', () => {
    expectWellFormed(items, 'JOBICY');
    expect(items[0]).toMatchObject({
      externalId: '151412',
      company: 'Roboflow',
      role: 'Developer Advocate',
      location: 'USA',
      remote: 'REMOTE',
      salaryMinUsd: null,
    });
    expect(items[1]).toMatchObject({
      company: 'Temporal Technologies',
      salaryMinUsd: 140_000,
      salaryMaxUsd: 180_000,
    });
    expect(items[0]?.tags).toContain('software engineering');
  });
});

describe('We Work Remotely adapter', () => {
  const items = mapWeWorkRemotely(fixtureText('weworkremotely.xml'));

  it('splits "Company: Role" titles and reads region and category', () => {
    expectWellFormed(items, 'WEWORKREMOTELY');
    expect(items[0]).toMatchObject({
      company: 'Lemon.io',
      role: 'Senior .NET Full-stack Developer',
      location: 'Anywhere in the World',
      remote: 'REMOTE',
      url: 'https://weworkremotely.com/remote-jobs/lemon-io-senior-net-full-stack-developer-1',
    });
    expect(items[0]?.tags).toContain('full-stack programming');
    expect(items[0]?.postedAt.toISOString()).toBe('2026-09-08T13:49:13.000Z');
  });

  it('decodes the escaped description into real html before text extraction', () => {
    const normalized = normalizePosting(items[0]!);
    expect(normalized.rawText).toContain('Headquarters: New York, NY');
    expect(normalized.rawText).not.toContain('&lt;');
    expect(normalized.stackKeywords).toContain('.net');
  });

  it('splitWwrTitle handles titles without a company', () => {
    expect(splitWwrTitle('Just a role')).toEqual({
      company: null,
      role: 'Just a role',
    });
    expect(splitWwrTitle('Acme: ')).toEqual({ company: null, role: 'Acme:' });
  });
});

describe('Greenhouse adapter', () => {
  const items = mapGreenhouse(fixture('greenhouse.json'), 'stripe', 'Stripe');

  it('maps board jobs with the board slug and decodes double-escaped content', () => {
    expectWellFormed(items, 'GREENHOUSE');
    expect(items[0]).toMatchObject({
      externalId: '8172503',
      boardId: 'stripe',
      company: 'Stripe',
      role: 'Abuse Research Engineer',
      location: 'Remote from the US',
      url: 'https://stripe.com/jobs/search?gh_jid=8172503',
    });
    expect(items[0]?.html.startsWith('<h2>')).toBe(true);
    const normalized = normalizePosting(items[0]!);
    expect(normalized.remote).toBe('REMOTE');
    expect(normalized.rawText.startsWith('Who we are')).toBe(true);
    expect(normalizePosting(items[1]!).remote).toBe('UNKNOWN');
  });

  it('falls back to the board name when a job carries no company', () => {
    const [item] = mapGreenhouse(
      { jobs: [{ id: 1, title: 'Engineer' }] },
      'acme',
      'Acme Inc',
    );
    expect(item?.company).toBe('Acme Inc');
  });
});

describe('Lever adapter', () => {
  const items = mapLever(fixture('lever.json'), 'leverdemo');

  it('maps postings with workplace type and title-cased company', () => {
    expectWellFormed(items, 'LEVER');
    expect(items[0]).toMatchObject({
      externalId: '681fbc53-1e34-4a46-8677-3a78118674eb',
      boardId: 'leverdemo',
      company: 'Leverdemo',
      role: 'Approved Professional 3',
      location: 'Baltimore, MD',
      remote: 'REMOTE',
      url: 'https://jobs.lever.co/leverdemo/681fbc53-1e34-4a46-8677-3a78118674eb',
      applyUrl:
        'https://jobs.lever.co/leverdemo/681fbc53-1e34-4a46-8677-3a78118674eb/apply',
    });
    expect(items[1]?.remote).toBe('HYBRID');
    expect(items[1]?.html).toContain('<h4>Skill Set:</h4>');
    expect(items[0]?.postedAt.toISOString()).toBe('2019-08-16T21:17:21.800Z');
  });

  it('titleCaseSlug turns a slug into a readable name', () => {
    expect(titleCaseSlug('acme-labs')).toBe('Acme Labs');
    expect(titleCaseSlug('stripe')).toBe('Stripe');
  });
});

describe('Ashby adapter', () => {
  const items = mapAshby(fixture('ashby.json'), 'ashby');

  it('maps listed jobs with compensation text and remote flag', () => {
    expectWellFormed(items, 'ASHBY');
    expect(items[0]).toMatchObject({
      externalId: '7458d4e9-da2e-47bd-98cb-adfda43d42b2',
      boardId: 'ashby',
      company: 'Ashby',
      role: 'Engineering Manager - EU',
      location: 'Remote - European Union',
      remote: 'REMOTE',
      salaryText: '€110K - €185K',
    });
    const normalized = normalizePosting(items[0]!);
    expect(normalized.salaryMinUsd).toBeNull();
    expect(normalized.headline).toBe(
      'Ashby | Engineering Manager - EU | Remote - European Union | Remote | €110K - €185K',
    );
  });

  it('skips unlisted jobs', () => {
    expect(
      mapAshby(
        { jobs: [{ id: 'x', title: 'Hidden', isListed: false }] },
        'acme',
      ),
    ).toEqual([]);
  });
});

describe('We Work Remotely category boards', () => {
  const items = mapWeWorkRemotely(
    fixtureText('weworkremotely-fullstack.xml'),
    'remote-full-stack-programming-jobs',
  );

  it('tags every item with the category board it came from', () => {
    expectWellFormed(items, 'WEWORKREMOTELY');
    expect(
      items.every(
        (item) => item.boardId === 'remote-full-stack-programming-jobs',
      ),
    ).toBe(true);
  });

  it('builds the feed url from the board id', () => {
    expect(weWorkRemotelyUrl('remote-devops-sysadmin-jobs')).toBe(
      'https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss',
    );
  });
});

describe('Working Nomads adapter', () => {
  const items = mapWorkingNomads(fixture('workingnomads.json'));

  it('keeps development jobs only and reads the id from the url', () => {
    expectWellFormed(items, 'WORKINGNOMADS');
    expect(items).toHaveLength(3);
    for (const item of items) {
      expect(item.externalId).toMatch(/^\d+$/);
      expect(item.remote).toBe('REMOTE');
      expect(item.boardId).toBe('development');
    }
  });

  it('strips a leading company prefix from the title', () => {
    expect(stripCompanyPrefix('Acme - Backend Engineer', 'Acme')).toBe(
      'Backend Engineer',
    );
    expect(stripCompanyPrefix('Backend Engineer', 'Acme')).toBe(
      'Backend Engineer',
    );
    expect(stripCompanyPrefix('Acme - Backend Engineer', null)).toBe(
      'Acme - Backend Engineer',
    );
  });
});

describe('Landing.jobs adapter', () => {
  const items = mapLandingJobs(fixture('landingjobs.json'));

  it('maps jobs with the company taken from the url', () => {
    expectWellFormed(items, 'LANDINGJOBS');
    expect(items[0]).toMatchObject({
      externalId: '19066',
      boardId: 'all',
      company: 'Inscale',
      role: 'Senior Java Software Developer',
      location: 'Lisbon, PT',
      salaryText: '€50k–€67k',
      salaryMinUsd: null,
    });
    expect(items[0]?.html).toContain('<h4>Requirements</h4>');
  });

  it('keeps USD numbers and drops the rest', () => {
    expect(
      landingSalary({
        currency_code: 'USD',
        gross_salary_low: 90000,
        gross_salary_high: 120000,
      }),
    ).toEqual({
      salaryText: '$90k–$120k',
      salaryMinUsd: 90000,
      salaryMaxUsd: 120000,
    });
    expect(
      landingSalary({ currency_code: 'GBP', gross_salary_low: 60000 }),
    ).toEqual({
      salaryText: '£60k',
      salaryMinUsd: null,
      salaryMaxUsd: null,
    });
    expect(
      companyFromLandingUrl('https://landing.jobs/at/acme-labs/role-1'),
    ).toBe('Acme Labs');
  });
});

describe('The Muse adapter', () => {
  const items = mapTheMuse(fixture('themuse.json'));

  it('maps results with company, locations and landing page', () => {
    expectWellFormed(items, 'THEMUSE');
    expect(items[0]).toMatchObject({
      externalId: '22167029',
      boardId: 'software-engineering',
      company: 'SpaceX',
      role: 'Lead Production Test Development Engineer, Customer Hardware (Starlink)',
      location: 'Lockhart, TX',
      url: 'https://www.themuse.com/jobs/spacex/lead-production-test-development-engineer-customer-hardware-starlink',
    });
    expect(items[0]?.tags).toContain('software engineering');
  });

  it('marks flexible or remote locations as remote', () => {
    const [item] = mapTheMuse({
      results: [
        {
          id: 1,
          name: 'Engineer',
          locations: [{ name: 'Flexible / Remote' }],
          refs: { landing_page: 'https://www.themuse.com/jobs/acme/engineer' },
          company: { name: 'Acme' },
        },
      ],
    });
    expect(item?.remote).toBe('REMOTE');
  });
});

describe('Jobspresso adapter', () => {
  const items = mapJobspresso(fixtureText('jobspresso.xml'));

  it('keeps technical job types and reads the namespaced fields', () => {
    expectWellFormed(items, 'JOBSPRESSO');
    expect(items.length).toBeGreaterThanOrEqual(1);
    for (const item of items) {
      expect(item.company).toBeTruthy();
      expect(item.remote).toBe('REMOTE');
      expect(item.url).toMatch(/^https:\/\/jobspresso\.co\/job\//);
    }
  });

  it('falls back to the creator line for the company', () => {
    expect(creatorCompany('Hopper<br>⚲&nbsp;Various US States')).toBe('Hopper');
    expect(creatorCompany(undefined)).toBeNull();
  });
});

describe('Workable adapter', () => {
  const list = fixture<{ results: unknown[] }>('workable.json');
  const detail = fixture<{ shortcode: string }>('workable-detail.json');
  const items = mapWorkable(
    list as never,
    { [detail.shortcode]: detail as never },
    'epignosis',
    'Epignosis',
  );

  it('maps jobs with the account slug and detail html when present', () => {
    expectWellFormed(items, 'WORKABLE');
    expect(items[0]).toMatchObject({
      externalId: '2F9375BEB9',
      boardId: 'epignosis',
      company: 'Epignosis',
      role: 'Generalist, Product-Minded Software Engineer (Junior - Mid level)',
      location: 'Athens, Greece',
      remote: 'HYBRID',
      url: 'https://apply.workable.com/epignosis/j/2F9375BEB9/',
      applyUrl: 'https://apply.workable.com/epignosis/j/2F9375BEB9/apply/',
    });
    expect(items[0]?.html).toContain('<h4>Requirements</h4>');
    expect(items[1]?.html).toBe('');
  });
});

describe('SmartRecruiters adapter', () => {
  const list = fixture<{ content: Array<{ id: string }> }>(
    'smartrecruiters.json',
  );
  const detail = fixture<{ id: string }>('smartrecruiters-posting.json');
  const items = mapSmartRecruiters(
    list as never,
    { [detail.id]: detail as never },
    'boschgroup',
  );

  it('maps postings with the company name from the payload', () => {
    expectWellFormed(items, 'SMARTRECRUITERS');
    expect(items[0]).toMatchObject({
      externalId: '744000151928744',
      boardId: 'boschgroup',
      company: 'Bosch Group',
      role: 'Design Engineer',
      location: 'Pleasanton, CA, United States',
    });
    expect(items[0]?.html).toContain('<h4>');
    expect(items[0]?.url).toMatch(/^https:\/\//);
  });

  it('renders job ad sections as headed html', () => {
    expect(
      sectionsHtml({
        jobAd: {
          sections: {
            a: { title: 'About', text: '<p>Hi</p>' },
            b: { text: '' },
          },
        },
      }),
    ).toBe('<h4>About</h4><p>Hi</p>');
    expect(sectionsHtml(undefined)).toBe('');
  });
});
