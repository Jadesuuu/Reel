import { mentionsOpenRegion, mentionsRegion, regionBasis } from './regions.js';

export type RemoteType = 'REMOTE' | 'HYBRID' | 'ONSITE' | 'UNKNOWN';

export type PostingForScoring = {
  headline: string;
  location: string | null;
  remote: RemoteType;
  stackKeywords: string[];
  regionTerms: string[];
  level: string | null;
  salaryMinUsd: number | null;
  salaryMaxUsd: number | null;
  applyUrl: string | null;
  postedAt: Date;
};

export type CriteriaForScoring = {
  remoteOnly: boolean;
  roleKeywords: string[];
  includeKeywords: string[];
  excludeKeywords: string[];
  regionKeywords: string[];
  nearbyKeywords: string[];
  levels: string[];
  minSalaryUsd: number | null;
};

export type ScoreResult = { score: number; reasons: string[] };

export const MATCH_THRESHOLD = 40;
export const STRONG_MATCH = 80;
export const MAX_SCORE = 130;

const REMOTE_POINTS = 25;
const NEARBY_POINTS = 20;
const ROLE_POINTS = 30;
const STACK_POINTS = 10;
const STACK_CAP = 40;
const OPEN_POINTS = 10;
const SALARY_POINTS = 10;
const APPLY_URL_POINTS = 5;
const FRESH_POINTS = 10;
const RECENT_POINTS = 5;

export const FRESH_DAYS = 3;
export const RECENT_DAYS = 10;

const DAY_MS = 24 * 60 * 60 * 1000;

const OPEN_KEYWORDS = new Set([
  'worldwide',
  'anywhere',
  'global',
  'any',
  'any country',
  'any location',
]);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsKeyword(haystack: string, keyword: string): boolean {
  if (keyword.length === 0) {
    return false;
  }
  return new RegExp(
    `(^|[^a-z0-9])${escapeRegExp(keyword)}([^a-z0-9]|$)`,
    'i',
  ).test(haystack);
}

function matchesAnywhere(
  keyword: string,
  headline: string,
  stackKeywords: string[],
): boolean {
  if (containsKeyword(headline, keyword)) {
    return true;
  }
  return stackKeywords.some(
    (entry) => entry.toLowerCase() === keyword.toLowerCase(),
  );
}

function regionVerdict(
  posting: PostingForScoring,
  criteria: CriteriaForScoring,
): { allowed: boolean; reason: string | null } {
  if (criteria.regionKeywords.length === 0) {
    return { allowed: true, reason: null };
  }
  const basis = regionBasis(posting.headline, posting.location);
  const labels = posting.regionTerms.map((term) => term.toLowerCase());

  const explicit = criteria.regionKeywords.find(
    (keyword) =>
      !OPEN_KEYWORDS.has(keyword) &&
      (labels.includes(keyword) || mentionsRegion(basis, keyword)),
  );
  if (explicit !== undefined) {
    return { allowed: true, reason: `open:${explicit}` };
  }

  if (labels.length > 0) {
    return { allowed: false, reason: `outside:${labels[0]}` };
  }

  const open =
    criteria.regionKeywords.find(
      (keyword) => OPEN_KEYWORDS.has(keyword) && mentionsRegion(basis, keyword),
    ) ?? (mentionsOpenRegion(basis) ? 'worldwide' : undefined);
  if (open !== undefined) {
    return { allowed: true, reason: `open:${open}` };
  }

  return { allowed: true, reason: null };
}

function nearbyHit(
  posting: PostingForScoring,
  criteria: CriteriaForScoring,
): string | null {
  const basis = regionBasis(posting.headline, posting.location);
  return (
    criteria.nearbyKeywords.find((keyword) =>
      containsKeyword(basis, keyword),
    ) ?? null
  );
}

export function score(
  posting: PostingForScoring,
  criteria: CriteriaForScoring,
  now: Date = new Date(),
): ScoreResult {
  const nearby =
    posting.remote === 'REMOTE' ? null : nearbyHit(posting, criteria);

  if (criteria.remoteOnly && posting.remote !== 'REMOTE' && nearby === null) {
    return { score: 0, reasons: ['not-remote'] };
  }

  for (const keyword of criteria.excludeKeywords) {
    if (matchesAnywhere(keyword, posting.headline, posting.stackKeywords)) {
      return { score: 0, reasons: [`excluded:${keyword}`] };
    }
  }

  if (
    criteria.levels.length > 0 &&
    posting.level !== null &&
    !criteria.levels.includes(posting.level)
  ) {
    return { score: 0, reasons: [`level:${posting.level}`] };
  }

  const region = regionVerdict(posting, criteria);
  if (!region.allowed) {
    return { score: 0, reasons: [region.reason ?? 'outside'] };
  }

  let total = 0;
  const reasons: string[] = [];

  if (posting.remote === 'REMOTE') {
    total += REMOTE_POINTS;
    reasons.push('remote');
  } else if (nearby !== null) {
    total += NEARBY_POINTS;
    reasons.push(`nearby:${nearby}`);
  }

  const roleHit = criteria.roleKeywords.find((keyword) =>
    containsKeyword(posting.headline, keyword),
  );
  if (roleHit) {
    total += ROLE_POINTS;
    reasons.push(`role:${roleHit}`);
  }

  let stackTotal = 0;
  for (const keyword of criteria.includeKeywords) {
    if (stackTotal >= STACK_CAP) {
      break;
    }
    if (matchesAnywhere(keyword, posting.headline, posting.stackKeywords)) {
      stackTotal += STACK_POINTS;
      reasons.push(`stack:${keyword}`);
    }
  }
  total += Math.min(stackTotal, STACK_CAP);

  if (region.reason !== null) {
    total += OPEN_POINTS;
    reasons.push(region.reason);
  }

  if (
    criteria.minSalaryUsd !== null &&
    posting.salaryMaxUsd !== null &&
    posting.salaryMaxUsd < criteria.minSalaryUsd
  ) {
    return { score: 0, reasons: ['below-min-salary'] };
  }

  if (posting.salaryMinUsd !== null) {
    total += SALARY_POINTS;
    reasons.push('salary');
  }

  if (posting.applyUrl !== null) {
    total += APPLY_URL_POINTS;
    reasons.push('apply-url');
  }

  const ageDays = (now.getTime() - posting.postedAt.getTime()) / DAY_MS;
  if (ageDays <= FRESH_DAYS) {
    total += FRESH_POINTS;
    reasons.push('fresh');
  } else if (ageDays <= RECENT_DAYS) {
    total += RECENT_POINTS;
    reasons.push('recent');
  }

  return { score: total, reasons };
}
