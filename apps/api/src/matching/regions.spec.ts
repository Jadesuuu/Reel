import {
  authorizationLabels,
  eligibilityOf,
  findHireSignals,
  findRegionTerms,
  findZoneTerms,
  mentionsOpenRegion,
  mentionsRegion,
  regionBasis,
  restrictionSnippets,
  zoneSnippets,
} from './regions.js';

describe('mentionsRegion', () => {
  it('matches long terms case-insensitively on word boundaries', () => {
    expect(mentionsRegion('Remote (Philippines)', 'philippines')).toBe(true);
    expect(mentionsRegion('Remote (EU time zones)', 'europe')).toBe(false);
    expect(mentionsRegion('Software Engineer, Backend', 'india')).toBe(false);
  });

  it('matches short terms only as uppercase words', () => {
    expect(mentionsRegion('Remote (US)', 'us')).toBe(true);
    expect(mentionsRegion('Join us remotely', 'us')).toBe(false);
    expect(mentionsRegion('Remote - EU/UK', 'uk')).toBe(true);
    expect(mentionsRegion('BONUS included', 'us')).toBe(false);
  });

  it('handles dotted abbreviations', () => {
    expect(mentionsRegion('Remote U.S. only', 'u.s.')).toBe(true);
  });

  it('ignores blank terms', () => {
    expect(mentionsRegion('Remote (US)', '   ')).toBe(false);
  });
});

describe('findRegionTerms', () => {
  it('returns one label per region, in vocabulary order', () => {
    expect(findRegionTerms('Remote (US, Canada, Mexico)')).toEqual([
      'us',
      'canada',
      'latam',
    ]);
  });

  it('labels US states and cities as us', () => {
    expect(findRegionTerms('Kentucky or Louisville or Charlotte')).toEqual([
      'us',
    ]);
    expect(findRegionTerms('San Francisco, CA')).toEqual(['us']);
    expect(findRegionTerms('New York City | Remote')).toEqual(['us']);
  });

  it('labels cities elsewhere with their region', () => {
    expect(findRegionTerms('Toronto | Remote')).toEqual(['canada']);
    expect(findRegionTerms('Berlin or Munich')).toEqual(['europe']);
    expect(findRegionTerms('London, England')).toEqual(['uk']);
    expect(findRegionTerms('Bangalore, Karnataka')).toEqual(['india']);
    expect(findRegionTerms('Metro Manila')).toEqual(['philippines']);
    expect(findRegionTerms('Makati City, NCR')).toEqual(['philippines']);
    expect(findRegionTerms('Kuala Lumpur, Malaysia')).toEqual(['malaysia']);
  });

  it('treats time zones as working hours, not places', () => {
    expect(findRegionTerms('Remote (EST)')).toEqual([]);
    expect(findRegionTerms('Remote, CET timezone')).toEqual([]);
    expect(findRegionTerms('Remote (US time zones)')).toEqual([]);
    expect(findRegionTerms('Remote - US, EST')).toEqual(['us']);
    expect(findZoneTerms('Remote (EST)')).toEqual(['us']);
    expect(findZoneTerms('Remote, CET timezone')).toEqual(['europe']);
    expect(findZoneTerms('Remote GMT+8')).toEqual([]);
    expect(findZoneTerms('Remote (Asia Pacific)')).toEqual([]);
  });

  it('returns nothing for a posting that names no region', () => {
    expect(findRegionTerms('Acme | Full Stack Engineer | Remote')).toEqual([]);
    expect(findRegionTerms('Remote (worldwide)')).toEqual([]);
  });

  it('does not confuse common words with places', () => {
    expect(findRegionTerms('Join us to build the future')).toEqual([]);
    expect(findRegionTerms('Established in 2010')).toEqual([]);
    expect(findRegionTerms('Indiana Jones Ltd')).toEqual(['us']);
  });
});

describe('mentionsOpenRegion', () => {
  it('recognises explicit worldwide wording', () => {
    expect(mentionsOpenRegion('Remote (worldwide)')).toBe(true);
    expect(mentionsOpenRegion('Remote - anywhere')).toBe(true);
    expect(mentionsOpenRegion('Work from any country')).toBe(true);
    expect(mentionsOpenRegion('Remote')).toBe(false);
    expect(mentionsOpenRegion('Remote-first company')).toBe(false);
  });
});

describe('restrictionSnippets', () => {
  it('pulls the place out of "must be located in" sentences', () => {
    expect(
      restrictionSnippets(
        'Great team. Candidates must be located in the United States. Apply now.',
      ),
    ).toEqual(['United States']);
  });

  it('reads work authorisation and "only" wording', () => {
    expect(
      restrictionSnippets(
        'You must be authorized to work in the US without sponsorship.',
      ),
    ).toEqual(['US without sponsorship']);
    expect(
      restrictionSnippets('This role is only open to candidates in Canada.'),
    ).toEqual(['Canada']);
    expect(restrictionSnippets('US-based candidates only.')).toEqual(['US']);
  });

  it('leaves time zone sentences to zoneSnippets', () => {
    expect(
      restrictionSnippets('Must overlap 4 hours with US time zones.'),
    ).toEqual([]);
    expect(zoneSnippets('Working hours are in European time zones.')).toEqual([
      'European',
    ]);
    expect(zoneSnippets('Core hours are 9am-5pm EST.')).toContain('EST');
  });

  it('returns nothing when the body names no restriction', () => {
    expect(
      restrictionSnippets('We are a fully remote team using TypeScript.'),
    ).toEqual([]);
    expect(restrictionSnippets('')).toEqual([]);
  });

  it('feeds findRegionTerms', () => {
    const snippets = restrictionSnippets(
      'Applicants must reside in the UK or Ireland. We use Node.',
    );
    expect(findRegionTerms(snippets.join(' | '))).toEqual(['uk', 'europe']);
  });
});

describe('regionBasis', () => {
  it('joins the headline and the location when both exist', () => {
    expect(regionBasis('Acme | Engineer', 'Worldwide')).toBe(
      'Acme | Engineer Worldwide',
    );
    expect(regionBasis('Acme | Engineer', null)).toBe('Acme | Engineer');
  });
});

describe('authorizationLabels', () => {
  it('reads US-only authorisation anywhere in the body', () => {
    expect(
      authorizationLabels('This is a W-2 position with benefits.'),
    ).toEqual(['us']);
    expect(authorizationLabels('Applicants must be US citizens.')).toEqual([
      'us',
    ]);
    expect(
      authorizationLabels('An active security clearance is required.'),
    ).toEqual(['us']);
    expect(authorizationLabels('Subject to ITAR regulations.')).toEqual(['us']);
  });

  it('ignores negated mentions and unrelated text', () => {
    expect(authorizationLabels('No security clearance required.')).toEqual([]);
    expect(authorizationLabels('This is not a W-2 role.')).toEqual([]);
    expect(authorizationLabels('Join us and our citizens of the web.')).toEqual(
      [],
    );
  });
});

describe('findHireSignals', () => {
  it('labels each international hiring signal', () => {
    expect(findHireSignals('We pay through Deel in USD.')).toEqual(['deel']);
    expect(findHireSignals('Contracts via Oyster HR.')).toEqual(['oyster']);
    expect(findHireSignals('We use Remote.com for payroll.')).toEqual([
      'remote.com',
    ]);
    expect(findHireSignals('Hired through an employer of record.')).toEqual([
      'eor',
    ]);
    expect(findHireSignals('We hire international contractors.')).toEqual([
      'contractor',
    ]);
    expect(findHireSignals('Paid on a B2B contract.')).toEqual(['b2b']);
    expect(findHireSignals('We are hiring globally.')).toEqual(['global']);
  });

  it('skips the deliberate misses', () => {
    expect(findHireSignals('This is a 1099 contractor role.')).toEqual([]);
    expect(findHireSignals('We build B2B SaaS for finance teams.')).toEqual([]);
    expect(findHireSignals('Work from anywhere in the US.')).toEqual([]);
    expect(findHireSignals('We hire anywhere in the United States.')).toEqual(
      [],
    );
    expect(findHireSignals('Join our global team.')).toEqual([]);
    expect(findHireSignals('Het grootste deel van je tijd.')).toEqual([]);
    expect(findHireSignals('We do not use an employer of record.')).toEqual([]);
  });
});

describe('eligibilityOf', () => {
  it('flags partial overlap without restricting the region', () => {
    const result = eligibilityOf(
      'Acme | Full Stack Engineer | Remote',
      'Remote',
      'You need 4 hours of overlap with US Eastern time. We pay via Deel.',
    );
    expect(result).toEqual({
      regionTerms: [],
      zoneTerms: ['us'],
      zoneOverlap: true,
      hireSignals: ['deel'],
    });
  });

  it('reads full business hours as hours, not overlap', () => {
    const result = eligibilityOf(
      'Acme | Engineer | Remote',
      null,
      'You will work EST business hours.',
    );
    expect(result.zoneTerms).toEqual(['us']);
    expect(result.zoneOverlap).toBe(false);
    expect(result.regionTerms).toEqual([]);
  });

  it('treats full overlap as full hours', () => {
    expect(
      eligibilityOf('Acme | Engineer', 'Remote', 'Full overlap with PST hours.')
        .zoneOverlap,
    ).toBe(false);
  });

  it('adds body authorisation to the region terms', () => {
    expect(
      eligibilityOf('Acme | Engineer', 'Remote', 'Must be a US citizen.')
        .regionTerms,
    ).toEqual(['us']);
  });
});
