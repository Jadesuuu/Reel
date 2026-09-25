import { findRegionTerms, mentionsRegion, regionBasis } from './regions.js';

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
  it('returns every matching term in vocabulary order', () => {
    expect(findRegionTerms('Remote (US, Canada, Mexico)')).toEqual([
      'us',
      'canada',
      'mexico',
    ]);
  });

  it('returns nothing for a posting that names no region', () => {
    expect(findRegionTerms('Acme | Full Stack Engineer | Remote')).toEqual([]);
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
