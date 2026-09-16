import { createHash } from 'node:crypto';
import he from 'he';
import type { HnItem } from './hn.types.js';

export type RemoteType = 'REMOTE' | 'HYBRID' | 'ONSITE' | 'UNKNOWN';

export type ParsedPosting = {
  company: string | null;
  role: string | null;
  location: string | null;
  remote: RemoteType;
  salaryText: string | null;
  salaryMinUsd: number | null;
  salaryMaxUsd: number | null;
  stackKeywords: string[];
  applyUrl: string | null;
  rawText: string;
  headline: string;
  fingerprint: string;
};

const STACK_KEYWORDS = [
  'typescript',
  'javascript',
  'node',
  'nodejs',
  'react',
  'next.js',
  'nextjs',
  'vue',
  'angular',
  'svelte',
  'nestjs',
  'express',
  'python',
  'django',
  'fastapi',
  'flask',
  'go',
  'golang',
  'rust',
  'java',
  'kotlin',
  'spring',
  'c#',
  '.net',
  'ruby',
  'rails',
  'php',
  'laravel',
  'elixir',
  'postgres',
  'postgresql',
  'mysql',
  'mongodb',
  'dynamodb',
  'redis',
  'kafka',
  'rabbitmq',
  'graphql',
  'grpc',
  'aws',
  'gcp',
  'azure',
  'kubernetes',
  'k8s',
  'docker',
  'terraform',
  'react native',
  'flutter',
  'swift',
  'ios',
  'android',
  'ml',
  'machine learning',
  'llm',
  'pytorch',
  'tensorflow',
];

const STACK_ALIASES: Record<string, string> = {
  nodejs: 'node',
  golang: 'go',
  nextjs: 'next.js',
  k8s: 'kubernetes',
  postgresql: 'postgres',
};

const ROLE_REGEX =
  /engineer|developer|swe|full[- ]?stack|frontend|front[- ]end|backend|back[- ]end|devops|sre|data|ml|founding/i;
const SALARY_REGEX =
  /[$€£]\s?(\d{2,3})\s?k?(?:\s?[-–—]|\s+to\s+)\s?[$€£]?\s?(\d{2,3})\s?k|[$€£]\s?(\d{2,3})\s?k/i;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\#]/g, '\\$&');
}

export function htmlToText(html: string): string {
  const withBreaks = html
    .replace(/<\s*p\s*>/gi, '\n\n')
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  return he
    .decode(withBreaks)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function extractHeadline(rawText: string): string {
  const firstLine =
    rawText.split('\n').find((line) => line.trim().length > 0) ?? '';
  return firstLine.trim().slice(0, 300);
}

export function splitSegments(headline: string): string[] {
  return headline
    .split('|')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function detectRemote(headline: string): RemoteType {
  if (/\bhybrid\b/i.test(headline)) return 'HYBRID';
  if (/\bremote\b/i.test(headline)) return 'REMOTE';
  if (/\bon[- ]?site\b|\bin[- ]?office\b/i.test(headline)) return 'ONSITE';
  return 'UNKNOWN';
}

export function parseSalary(headline: string): {
  salaryText: string | null;
  salaryMinUsd: number | null;
  salaryMaxUsd: number | null;
} {
  const match = SALARY_REGEX.exec(headline);
  if (!match) {
    return { salaryText: null, salaryMinUsd: null, salaryMaxUsd: null };
  }
  const salaryText = match[0].trim();
  const isUsd = salaryText.includes('$');
  const minRaw = match[1] ?? match[3];
  const maxRaw = match[2] ?? null;
  const min = minRaw ? Number(minRaw) : null;
  const max = maxRaw ? Number(maxRaw) : null;
  if (min !== null && min < 30) {
    return { salaryText, salaryMinUsd: null, salaryMaxUsd: null };
  }
  return {
    salaryText,
    salaryMinUsd: isUsd && min !== null ? min * 1000 : null,
    salaryMaxUsd: isUsd && max !== null ? max * 1000 : null,
  };
}

export function extractStackKeywords(rawText: string): string[] {
  const haystack = rawText.toLowerCase();
  const found: string[] = [];
  for (const keyword of STACK_KEYWORDS) {
    const pattern = new RegExp(
      `(?<![a-z0-9])${escapeRegExp(keyword)}(?![a-z0-9])`,
      'i',
    );
    if (pattern.test(haystack)) {
      found.push(STACK_ALIASES[keyword] ?? keyword);
    }
  }
  return Array.from(new Set(found));
}

export function extractApplyUrl(html: string): string | null {
  const hrefs = Array.from(html.matchAll(/href="([^"]+)"/gi)).map(
    (m) => m[1] ?? '',
  );
  const external = hrefs.find(
    (href) =>
      !href.startsWith('mailto:') && !href.includes('news.ycombinator.com'),
  );
  if (external) return external;
  const mailto = hrefs.find((href) => href.startsWith('mailto:'));
  return mailto ?? null;
}

function normalizeForFingerprint(value: string | null): string {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function fingerprintFor(
  company: string | null,
  role: string | null,
  externalId: string,
): string {
  const basis = company
    ? `${normalizeForFingerprint(company)}|${normalizeForFingerprint(role)}`
    : `hn:${externalId}`;
  return createHash('sha1').update(basis).digest('hex');
}

export function parseComment(item: HnItem): ParsedPosting {
  const html = item.text ?? '';
  const rawText = htmlToText(html);
  const headline = extractHeadline(rawText);
  const segments = splitSegments(headline);

  const company =
    segments.length >= 2 && segments[0] && segments[0].length <= 80
      ? segments[0]
      : null;

  const rest = segments.slice(1);
  const role = rest.find((s) => ROLE_REGEX.test(s)) ?? rest[0] ?? null;

  const remote = detectRemote(headline);
  const salary = parseSalary(headline);

  const location =
    rest.find(
      (s) =>
        s !== role &&
        !/\b(remote|hybrid|on[- ]?site)\b/i.test(s) &&
        !SALARY_REGEX.test(s),
    ) ?? null;

  const stackKeywords = extractStackKeywords(rawText);
  const applyUrl = extractApplyUrl(html);
  const fingerprint = fingerprintFor(company, role, String(item.id));

  return {
    company,
    role,
    location,
    remote,
    salaryText: salary.salaryText,
    salaryMinUsd: salary.salaryMinUsd,
    salaryMaxUsd: salary.salaryMaxUsd,
    stackKeywords,
    applyUrl,
    rawText,
    headline,
    fingerprint,
  };
}
