import { describe, expect, it } from 'vitest';
import { parseNextData } from '../next-data.js';
import { hiringCafeSearchState, hiringCafeUrl, projectHiringCafe } from './hiringcafe.js';
import { siteFor } from './index.js';
import { projectWellfound, wellfoundUrl } from './wellfound.js';

const hiringCafePage = {
  props: {
    pageProps: {
      ssrPage: 0,
      ssrIsLastPage: false,
      ssrHits: [
        {
          id: 'ashby__ohr__6f1c2a',
          apply_url: 'https://jobs.ashbyhq.com/ohr/6f1c2a',
          is_expired: false,
          board_token: 'secret-looking-thing',
          job_information: { title: 'Software Engineer', num_views: 12 },
          v5_processed_job_data: {
            core_job_title: 'Software Engineer',
            company_name: 'Ohr',
            workplace_type: 'Remote',
            estimated_publish_date: '2026-09-29T02:18:10.313Z',
            estimated_publish_date_millis: 1790648290313,
            technical_tools: ['TypeScript'],
            oral_communication_level: 'High',
          },
          attributed_org: { name: 'Ohr', website: 'ohr.dev', org_entity_id: 'org_1' },
          enriched_company_data: null,
        },
        {
          id: 'older',
          apply_url: 'https://example.com/older',
          job_information: { title: 'Older role' },
          v5_processed_job_data: { estimated_publish_date_millis: 1790000000000 },
        },
      ],
    },
  },
};

const wellfoundPage = {
  props: {
    pageProps: {
      role: 'software-engineer',
      apolloState: {
        data: {
          ROOT_QUERY: {},
          'StartupResult:829771': {
            id: '829771',
            name: 'Confident LIMS',
            slug: 'confidentlims',
            highConcept: 'The easiest way to test',
            companySize: 'SIZE_11_50',
            badges: [{ __ref: 'Badge:ACTIVELY_HIRING' }],
            highlightedJobListings: [
              { __ref: 'JobListingSearchResult:4697947' },
              { __ref: 'JobListingSearchResult:missing' },
            ],
          },
          'JobListingSearchResult:4697947': {
            id: '4697947',
            title: 'Senior Software Engineer',
            slug: 'senior-software-engineer',
            description: 'Own the API',
            jobType: 'full-time',
            liveStartAt: 1789063154,
            locationNames: ['San Francisco Bay Area'],
            remote: true,
            remoteConfig: { kind: 'REMOTE', wfhFlexible: false, __typename: 'RemoteConfig' },
            acceptedRemoteLocationNames: ['United States'],
            compensation: '$100k – $180k',
            yearsExperienceMin: 5,
            isBookmarked: false,
          },
          'Badge:ACTIVELY_HIRING': { id: 'ACTIVELY_HIRING' },
        },
      },
    },
  },
};

describe('hiringcafe', () => {
  it('builds a remote, date-sorted search for the board query', () => {
    expect(hiringCafeSearchState('full-stack-engineer')).toEqual({
      searchQuery: 'full stack engineer',
      workplaceTypes: ['Remote'],
      defaultToUserLocation: false,
      locations: [],
      sortBy: 'date',
    });
    const url = new URL(hiringCafeUrl('backend-engineer', 2));
    expect(url.host).toBe('hiringcafe.com');
    expect(url.searchParams.get('page')).toBe('2');
    expect(JSON.parse(url.searchParams.get('searchState') ?? '{}')).toMatchObject({
      searchQuery: 'backend engineer',
    });
  });

  it('projects only the fields the server maps', () => {
    const result = projectHiringCafe(hiringCafePage);
    expect(result.lastPage).toBe(false);
    expect(result.oldestMs).toBe(1790000000000);
    expect(result.items).toHaveLength(2);
    const [first] = result.items as Array<Record<string, unknown>>;
    expect(first).toEqual({
      id: 'ashby__ohr__6f1c2a',
      apply_url: 'https://jobs.ashbyhq.com/ohr/6f1c2a',
      is_expired: false,
      job_information: { title: 'Software Engineer' },
      v5_processed_job_data: {
        core_job_title: 'Software Engineer',
        company_name: 'Ohr',
        workplace_type: 'Remote',
        estimated_publish_date: '2026-09-29T02:18:10.313Z',
        estimated_publish_date_millis: 1790648290313,
        technical_tools: ['TypeScript'],
      },
      attributed_org: { name: 'Ohr', website: 'ohr.dev' },
      enriched_company_data: null,
    });
    expect(JSON.stringify(first)).not.toContain('secret-looking-thing');
  });

  it('treats an empty or missing page as the last one', () => {
    expect(projectHiringCafe({ props: { pageProps: { ssrHits: [] } } })).toEqual({
      items: [],
      lastPage: true,
      oldestMs: null,
    });
    expect(projectHiringCafe(parseNextData('not json'))).toEqual({
      items: [],
      lastPage: true,
      oldestMs: null,
    });
  });
});

describe('wellfound', () => {
  it('builds role page urls with one-based page numbers after the first', () => {
    expect(wellfoundUrl('software-engineer', 0)).toBe(
      'https://wellfound.com/role/r/software-engineer',
    );
    expect(wellfoundUrl('devops-engineer', 2)).toBe(
      'https://wellfound.com/role/r/devops-engineer?page=3',
    );
  });

  it('walks the startups and resolves their listing refs', () => {
    const result = projectWellfound(wellfoundPage);
    expect(result.lastPage).toBe(false);
    expect(result.oldestMs).toBe(1789063154000);
    expect(result.items).toEqual([
      {
        id: '4697947',
        title: 'Senior Software Engineer',
        slug: 'senior-software-engineer',
        description: 'Own the API',
        jobType: 'full-time',
        liveStartAt: 1789063154,
        locationNames: ['San Francisco Bay Area'],
        remote: true,
        acceptedRemoteLocationNames: ['United States'],
        compensation: '$100k – $180k',
        yearsExperienceMin: 5,
        remoteConfig: { kind: 'REMOTE', wfhFlexible: false },
        startup: {
          id: '829771',
          name: 'Confident LIMS',
          slug: 'confidentlims',
          highConcept: 'The easiest way to test',
          companySize: 'SIZE_11_50',
        },
      },
    ]);
  });
});

describe('siteFor', () => {
  it('knows both sources and nothing else', () => {
    expect(siteFor('HIRINGCAFE')?.host).toBe('hiringcafe.com');
    expect(siteFor('WELLFOUND')?.maxPages).toBe(3);
    expect(siteFor('LINKEDIN')).toBeNull();
  });
});
