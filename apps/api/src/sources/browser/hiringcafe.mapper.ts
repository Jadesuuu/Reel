import type { RemoteType } from '../../hn/hn.parser.js';
import { cleanTags, positive, text, toDate } from '../normalize.js';
import type { RawPosting } from '../source.types.js';
import { paragraphs } from './html.js';

export type HiringCafeJobData = {
  core_job_title?: string | null;
  company_name?: string | null;
  company_website?: string | null;
  workplace_type?: string | null;
  workplace_countries?: string[] | null;
  workplace_continents?: string[] | null;
  is_workplace_worldwide_ok?: boolean | null;
  formatted_workplace_location?: string | null;
  yearly_min_compensation?: number | null;
  yearly_max_compensation?: number | null;
  listed_compensation_currency?: string | null;
  listed_compensation_frequency?: string | null;
  estimated_publish_date?: string | null;
  technical_tools?: string[] | null;
  requirements_summary?: string | null;
  commitment?: string[] | null;
  seniority_level?: string | null;
  role_type?: string | null;
  job_category?: string | null;
  visa_sponsorship?: boolean | null;
};

export type HiringCafeHit = {
  id?: string;
  apply_url?: string | null;
  is_expired?: boolean;
  job_information?: { title?: string | null } | null;
  v5_processed_job_data?: HiringCafeJobData | null;
  attributed_org?: { name?: string | null; website?: string | null } | null;
  enriched_company_data?: {
    name?: string | null;
    homepage_uri?: string | null;
  } | null;
};

function strings(values: unknown): string[] {
  return Array.isArray(values)
    ? values.filter(
        (value): value is string =>
          typeof value === 'string' && value.trim().length > 0,
      )
    : [];
}

export function hiringCafeCompany(hit: HiringCafeHit): string | null {
  return (
    text(hit.v5_processed_job_data?.company_name) ??
    text(hit.attributed_org?.name) ??
    text(hit.enriched_company_data?.name)
  );
}

export function hiringCafeRemote(
  workplaceType: string | null | undefined,
): RemoteType | null {
  switch ((workplaceType ?? '').toLowerCase()) {
    case 'remote':
      return 'REMOTE';
    case 'hybrid':
      return 'HYBRID';
    case 'onsite':
    case 'field':
      return 'ONSITE';
    default:
      return null;
  }
}

export function hiringCafeLocation(data: HiringCafeJobData): string {
  if (data.is_workplace_worldwide_ok) {
    return 'Worldwide';
  }
  const formatted = text(data.formatted_workplace_location);
  if (formatted) {
    return formatted;
  }
  const countries = strings(data.workplace_countries);
  return countries.length > 0 ? countries.join(', ') : 'Remote';
}

export function hiringCafeSalary(data: HiringCafeJobData): {
  salaryText: string | null;
  salaryMinUsd: number | null;
  salaryMaxUsd: number | null;
} {
  const min = positive(data.yearly_min_compensation);
  const max = positive(data.yearly_max_compensation);
  if (min === null && max === null) {
    return { salaryText: null, salaryMinUsd: null, salaryMaxUsd: null };
  }
  const currency = (data.listed_compensation_currency ?? 'USD').toUpperCase();
  if (currency === 'USD') {
    return { salaryText: null, salaryMinUsd: min, salaryMaxUsd: max };
  }
  const parts = [min, max].filter((value): value is number => value !== null);
  return {
    salaryText: `${currency} ${parts.map((value) => value.toLocaleString('en-US')).join('–')}`,
    salaryMinUsd: null,
    salaryMaxUsd: null,
  };
}

function describe(data: HiringCafeJobData): string {
  const tools = strings(data.technical_tools);
  const commitment = strings(data.commitment);
  const facts = [
    data.seniority_level ? `Seniority: ${data.seniority_level}` : null,
    commitment.length > 0 ? `Commitment: ${commitment.join(', ')}` : null,
    data.role_type ? `Role type: ${data.role_type}` : null,
    data.visa_sponsorship ? 'Visa sponsorship offered' : null,
  ].filter((value): value is string => value !== null);

  return paragraphs([
    text(data.requirements_summary),
    tools.length > 0 ? `Tools: ${tools.join(', ')}` : null,
    facts.length > 0 ? facts.join('. ') : null,
  ]);
}

export function mapHiringCafe(hits: unknown, boardId: string): RawPosting[] {
  if (!Array.isArray(hits)) {
    return [];
  }
  const items: RawPosting[] = [];

  for (const entry of hits as HiringCafeHit[]) {
    if (!entry || typeof entry !== 'object' || entry.is_expired) {
      continue;
    }
    const data = entry.v5_processed_job_data ?? {};
    const id = text(entry.id);
    const role =
      text(entry.job_information?.title) ?? text(data.core_job_title);
    const applyUrl = text(entry.apply_url);
    if (!id || !role || !applyUrl) {
      continue;
    }
    const company = hiringCafeCompany(entry);

    items.push({
      source: 'HIRINGCAFE',
      externalId: id,
      boardId,
      author: company ?? 'HiringCafe',
      postedAt: toDate(data.estimated_publish_date),
      url: applyUrl,
      applyUrl,
      company,
      role,
      location: hiringCafeLocation(data),
      remote: hiringCafeRemote(data.workplace_type),
      ...hiringCafeSalary(data),
      tags: cleanTags([
        ...strings(data.technical_tools),
        ...strings(data.commitment),
        data.seniority_level ?? '',
        data.job_category ?? '',
        data.workplace_type ?? '',
      ]),
      html: describe(data),
      headline: null,
    });
  }

  return items;
}
