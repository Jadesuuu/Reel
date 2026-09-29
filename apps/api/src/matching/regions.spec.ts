import {
  findRegionTerms,
  mentionsOpenRegion,
  mentionsRegion,
  regionBasis,
  restrictionSnippets,
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

  it('reads time zone shorthands', () => {
    expect(findRegionTerms('Remote (EST)')).toEqual(['us']);
    expect(findRegionTerms('Remote, CET timezone')).toEqual(['europe']);
    expect(findRegionTerms('Remote GMT+8')).toEqual([]);
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

  it('reads time zone requirements', () => {
    expect(
      restrictionSnippets('Must overlap 4 hours with US time zones.'),
    ).toEqual(['US']);
    expect(
      restrictionSnippets('Working hours are in European time zones.'),
    ).toEqual(['European']);
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
