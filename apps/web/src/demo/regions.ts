export const REGION_TERMS = [
  'us',
  'usa',
  'u.s.',
  'united states',
  'america',
  'americas',
  'north america',
  'latam',
  'latin america',
  'canada',
  'mexico',
  'brazil',
  'argentina',
  'colombia',
  'uk',
  'united kingdom',
  'england',
  'ireland',
  'europe',
  'eu',
  'emea',
  'germany',
  'france',
  'spain',
  'portugal',
  'poland',
  'netherlands',
  'italy',
  'sweden',
  'denmark',
  'norway',
  'finland',
  'switzerland',
  'austria',
  'israel',
  'india',
  'pakistan',
  'australia',
  'new zealand',
  'japan',
  'singapore',
  'philippines',
  'asia',
  'apac',
  'southeast asia',
  'africa',
  'oceania',
  'est',
  'pst',
  'cst',
  'mst',
  'cet',
  'gmt',
  'bst',
] as const;

const SHORT_TERM = 3;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function patternFor(term: string): RegExp {
  const escaped = escapeRegExp(term.trim());
  if (term.trim().length <= SHORT_TERM) {
    return new RegExp(`(^|[^A-Za-z0-9])${escaped.toUpperCase()}([^A-Za-z0-9]|$)`);
  }
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
}

export function mentionsRegion(text: string, term: string): boolean {
  if (term.trim().length === 0) {
    return false;
  }
  return patternFor(term).test(text);
}

export function findRegionTerms(text: string): string[] {
  return REGION_TERMS.filter((term) => mentionsRegion(text, term));
}

export function regionBasis(headline: string, location: string | null): string {
  return location ? `${headline} ${location}` : headline;
}
