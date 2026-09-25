import type { Criteria, RemoteType } from '../lib/types';
import { findRegionTerms, mentionsRegion, regionBasis } from './regions';

export type PostingForScoring = {
  headline: string;
  location: string | null;
  remote: RemoteType;
  stackKeywords: string[];
  salaryMinUsd: number | null;
  salaryMaxUsd: number | null;
  applyUrl: string | null;
};

export const MATCH_THRESHOLD = 40;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsKeyword(haystack: string, keyword: string): boolean {
  if (keyword.length === 0) return false;
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(keyword)}([^a-z0-9]|$)`, 'i').test(haystack);
}

function matchesAnywhere(keyword: string, headline: string, stack: string[]): boolean {
  if (containsKeyword(headline, keyword)) return true;
  return stack.some((entry) => entry.toLowerCase() === keyword.toLowerCase());
}

export function score(
  posting: PostingForScoring,
  criteria: Pick<
    Criteria,
    | 'remoteOnly'
    | 'roleKeywords'
    | 'includeKeywords'
    | 'excludeKeywords'
    | 'regionKeywords'
    | 'minSalaryUsd'
  >,
): { score: number; reasons: string[] } {
  if (criteria.remoteOnly && posting.remote !== 'REMOTE') {
    return { score: 0, reasons: ['not-remote'] };
  }
  for (const keyword of criteria.excludeKeywords) {
    if (matchesAnywhere(keyword, posting.headline, posting.stackKeywords)) {
      return { score: 0, reasons: [`excluded:${keyword}`] };
    }
  }
  if (criteria.regionKeywords.length > 0) {
    const basis = regionBasis(posting.headline, posting.location);
    const allowed = criteria.regionKeywords.some((keyword) => mentionsRegion(basis, keyword));
    if (!allowed) {
      const [term] = findRegionTerms(basis);
      if (term !== undefined) return { score: 0, reasons: [`outside:${term}`] };
    }
  }

  let total = 0;
  const reasons: string[] = [];

  if (posting.remote === 'REMOTE') {
    total += 25;
    reasons.push('remote');
  }

  const roleHit = criteria.roleKeywords.find((keyword) =>
    containsKeyword(posting.headline, keyword),
  );
  if (roleHit) {
    total += 30;
    reasons.push(`role:${roleHit}`);
  }

  let stackTotal = 0;
  for (const keyword of criteria.includeKeywords) {
    if (stackTotal >= 40) break;
    if (matchesAnywhere(keyword, posting.headline, posting.stackKeywords)) {
      stackTotal += 10;
      reasons.push(`stack:${keyword}`);
    }
  }
  total += Math.min(stackTotal, 40);

  if (
    criteria.minSalaryUsd !== null &&
    posting.salaryMaxUsd !== null &&
    posting.salaryMaxUsd < criteria.minSalaryUsd
  ) {
    return { score: 0, reasons: ['below-min-salary'] };
  }

  if (posting.salaryMinUsd !== null) {
    total += 10;
    reasons.push('salary');
  }
  if (posting.applyUrl !== null) {
    total += 5;
    reasons.push('apply-url');
  }

  return { score: total, reasons };
}
