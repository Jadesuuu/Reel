export type RemoteType = 'REMOTE' | 'HYBRID' | 'ONSITE' | 'UNKNOWN';

export type PostingForScoring = {
  headline: string;
  remote: RemoteType;
  stackKeywords: string[];
  salaryMinUsd: number | null;
  salaryMaxUsd: number | null;
  applyUrl: string | null;
};

export type CriteriaForScoring = {
  remoteOnly: boolean;
  roleKeywords: string[];
  includeKeywords: string[];
  excludeKeywords: string[];
  minSalaryUsd: number | null;
};

export type ScoreResult = { score: number; reasons: string[] };

export const MATCH_THRESHOLD = 40;

const REMOTE_POINTS = 25;
const ROLE_POINTS = 30;
const STACK_POINTS = 10;
const STACK_CAP = 40;
const SALARY_POINTS = 10;
const APPLY_URL_POINTS = 5;

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

export function score(
  posting: PostingForScoring,
  criteria: CriteriaForScoring,
): ScoreResult {
  if (criteria.remoteOnly && posting.remote !== 'REMOTE') {
    return { score: 0, reasons: ['not-remote'] };
  }

  for (const keyword of criteria.excludeKeywords) {
    if (matchesAnywhere(keyword, posting.headline, posting.stackKeywords)) {
      return { score: 0, reasons: [`excluded:${keyword}`] };
    }
  }

  let total = 0;
  const reasons: string[] = [];

  if (posting.remote === 'REMOTE') {
    total += REMOTE_POINTS;
    reasons.push('remote');
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

  return { score: total, reasons };
}
