import {
  detectRemote,
  extractStackKeywords,
  fingerprintFor,
  htmlToText,
  parseSalary,
  type RemoteType,
} from '../hn/hn.parser.js';
import { findRegionTerms, regionBasis } from '../matching/regions.js';
import type { NormalizedPosting, RawPosting } from './source.types.js';

const HEADLINE_MAX = 300;

function k(value: number): string {
  return `$${Math.round(value / 1000)}k`;
}

export function formatUsdRange(
  min: number | null,
  max: number | null,
): string | null {
  if (min !== null && max !== null) {
    return min === max ? k(min) : `${k(min)}–${k(max)}`;
  }
  if (min !== null) {
    return `${k(min)}+`;
  }
  if (max !== null) {
    return `up to ${k(max)}`;
  }
  return null;
}

export function composeHeadline(parts: {
  company: string | null;
  role: string | null;
  location: string | null;
  remote: RemoteType;
  salaryText: string | null;
}): string {
  const segments = [
    parts.company,
    parts.role,
    parts.location,
    parts.remote === 'REMOTE'
      ? 'Remote'
      : parts.remote === 'HYBRID'
        ? 'Hybrid'
        : null,
    parts.salaryText,
  ]
    .map((segment) => (segment ?? '').replace(/\s+/g, ' ').trim())
    .filter((segment) => segment.length > 0);

  return segments.join(' | ').slice(0, HEADLINE_MAX);
}

function resolveSalary(raw: RawPosting): {
  salaryText: string | null;
  salaryMinUsd: number | null;
  salaryMaxUsd: number | null;
} {
  if (raw.salaryMinUsd !== null || raw.salaryMaxUsd !== null) {
    return {
      salaryText:
        raw.salaryText ?? formatUsdRange(raw.salaryMinUsd, raw.salaryMaxUsd),
      salaryMinUsd: raw.salaryMinUsd,
      salaryMaxUsd: raw.salaryMaxUsd,
    };
  }

  const basis = raw.salaryText ?? raw.headline ?? '';
  const parsed = parseSalary(basis);
  if (parsed.salaryText === null && raw.salaryText) {
    return {
      salaryText: raw.salaryText.trim() || null,
      salaryMinUsd: null,
      salaryMaxUsd: null,
    };
  }
  return parsed;
}

export function normalizePosting(raw: RawPosting): NormalizedPosting {
  const rawText = htmlToText(raw.html);
  const salary = resolveSalary(raw);

  const remoteBasis = `${raw.headline ?? ''} ${raw.location ?? ''} ${raw.role ?? ''}`;
  const remote: RemoteType = raw.remote ?? detectRemote(remoteBasis);

  const headline =
    raw.headline?.trim() ||
    composeHeadline({
      company: raw.company,
      role: raw.role,
      location: raw.location,
      remote,
      salaryText: salary.salaryText,
    });

  const stackKeywords = extractStackKeywords(
    `${headline}\n${rawText}\n${raw.tags.join(' ')}`,
  );

  return {
    source: raw.source,
    externalId: raw.externalId,
    boardId: raw.boardId,
    author: raw.author,
    postedAt: raw.postedAt,
    url: raw.url,
    applyUrl: raw.applyUrl ?? raw.url,
    company: raw.company,
    role: raw.role,
    location: raw.location,
    remote,
    salaryText: salary.salaryText,
    salaryMinUsd: salary.salaryMinUsd,
    salaryMaxUsd: salary.salaryMaxUsd,
    stackKeywords,
    regionTerms: findRegionTerms(regionBasis(headline, raw.location)),
    rawHtml: raw.html,
    rawText,
    headline,
    fingerprint: fingerprintFor(
      raw.company,
      raw.role,
      `${raw.source}-${raw.externalId}`,
    ),
  };
}

export function toDate(value: unknown): Date {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const ms = value < 1e12 ? value * 1000 : value;
    return new Date(ms);
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const stamp = value.trim();
    const hasZone = /(?:Z|[+-]\d{2}:?\d{2}|GMT|UTC)$/i.test(stamp);
    const isoLike = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(stamp);
    const parsed = new Date(isoLike && !hasZone ? `${stamp}Z` : stamp);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
}

export function cleanTags(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }
  const tags = values
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);
  return Array.from(new Set(tags));
}

export function text(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.replace(/\s+/g, ' ').trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function positive(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.round(value)
    : null;
}
