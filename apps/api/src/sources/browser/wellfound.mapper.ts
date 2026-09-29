import type { RemoteType } from '../../hn/hn.parser.js';
import { cleanTags, text, toDate } from '../normalize.js';
import type { RawPosting } from '../source.types.js';
import { markdownToText, paragraphs } from './html.js';

export type WellfoundStartup = {
  id?: string;
  name?: string | null;
  slug?: string | null;
  highConcept?: string | null;
  companySize?: string | null;
};

export type WellfoundJob = {
  id?: string;
  title?: string | null;
  slug?: string | null;
  description?: string | null;
  jobType?: string | null;
  liveStartAt?: number | null;
  locationNames?: string[] | null;
  remote?: boolean | null;
  remoteConfig?: { kind?: string | null; wfhFlexible?: boolean | null } | null;
  acceptedRemoteLocationNames?: string[] | null;
  compensation?: string | null;
  yearsExperienceMin?: number | null;
  yearsExperienceMax?: number | null;
  startup?: WellfoundStartup | null;
};

function names(values: unknown): string[] {
  return Array.isArray(values)
    ? values.filter(
        (value): value is string =>
          typeof value === 'string' && value.trim().length > 0,
      )
    : [];
}

export function wellfoundUrl(id: string, slug: string | null): string {
  return `https://wellfound.com/jobs/${id}${slug ? `-${slug}` : ''}`;
}

export function wellfoundRemote(job: WellfoundJob): RemoteType | null {
  const kind = (job.remoteConfig?.kind ?? '').toUpperCase();
  if (kind === 'REMOTE') {
    return 'REMOTE';
  }
  if (kind === 'ONSITE') {
    return job.remoteConfig?.wfhFlexible || job.remote ? 'HYBRID' : 'ONSITE';
  }
  return job.remote ? 'REMOTE' : null;
}

export function wellfoundLocation(job: WellfoundJob): string {
  const accepted = names(job.acceptedRemoteLocationNames);
  const offices = names(job.locationNames);
  if (wellfoundRemote(job) === 'REMOTE' && accepted.length > 0) {
    return accepted.join(', ');
  }
  if (offices.length > 0) {
    return accepted.length > 0
      ? `${offices.join(', ')} (remote: ${accepted.join(', ')})`
      : offices.join(', ');
  }
  return accepted.length > 0 ? accepted.join(', ') : 'Remote';
}

export function wellfoundSalaryText(
  compensation: string | null | undefined,
): string | null {
  const first = (compensation ?? '').split('•')[0] ?? '';
  const cleaned = first.replace(/\s+/g, ' ').trim();
  return /\d/.test(cleaned) ? cleaned : null;
}

export function mapWellfound(jobs: unknown, boardId: string): RawPosting[] {
  if (!Array.isArray(jobs)) {
    return [];
  }
  const items: RawPosting[] = [];

  for (const job of jobs as WellfoundJob[]) {
    if (!job || typeof job !== 'object') {
      continue;
    }
    const id = text(job.id);
    const role = text(job.title);
    if (!id || !role) {
      continue;
    }
    const company = text(job.startup?.name);
    const url = wellfoundUrl(id, text(job.slug));
    const experience =
      typeof job.yearsExperienceMin === 'number'
        ? `${job.yearsExperienceMin}+ years of experience`
        : null;

    items.push({
      source: 'WELLFOUND',
      externalId: id,
      boardId,
      author: company ?? 'Wellfound',
      postedAt: toDate(job.liveStartAt),
      url,
      applyUrl: url,
      company,
      role,
      location: wellfoundLocation(job),
      remote: wellfoundRemote(job),
      salaryText: wellfoundSalaryText(job.compensation),
      salaryMinUsd: null,
      salaryMaxUsd: null,
      tags: cleanTags([job.jobType ?? '', job.startup?.companySize ?? '']),
      html: paragraphs([
        text(job.startup?.highConcept),
        experience,
        markdownToText(job.description ?? ''),
      ]),
      headline: null,
    });
  }

  return items;
}
