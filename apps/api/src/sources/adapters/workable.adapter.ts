import { Injectable } from '@nestjs/common';
import { fetchJson, isNotFound, mapLimit, postJson } from '../http.js';
import { cleanTags, text, toDate } from '../normalize.js';
import type {
  BoardAdapter,
  BoardDescription,
  FetchResult,
  RawPosting,
} from '../source.types.js';
import type { RemoteType } from '../../hn/hn.parser.js';

export const WORKABLE_BASE = 'https://apply.workable.com/api';
export const WORKABLE_DETAIL_LIMIT = 60;
const DETAIL_CONCURRENCY = 5;

export type WorkableJob = {
  shortcode?: string;
  title?: string;
  remote?: boolean;
  workplace?: string;
  published?: string;
  department?: string[];
  location?: { city?: string; region?: string; country?: string };
};

export type WorkableDetail = WorkableJob & {
  description?: string;
  requirements?: string;
  benefits?: string;
};

export type WorkableList = { total?: number; results?: WorkableJob[] };
export type WorkableWidget = { name?: string; jobs?: unknown[] };

function remoteFor(job: WorkableJob): RemoteType | null {
  switch ((job.workplace ?? '').toLowerCase()) {
    case 'remote':
      return 'REMOTE';
    case 'hybrid':
      return 'HYBRID';
    case 'on_site':
    case 'onsite':
      return 'ONSITE';
    default:
      return job.remote === true ? 'REMOTE' : null;
  }
}

export function mapWorkable(
  list: WorkableList,
  details: Record<string, WorkableDetail | undefined>,
  slug: string,
  company: string | null,
): RawPosting[] {
  const items: RawPosting[] = [];

  for (const job of list.results ?? []) {
    const shortcode = text(job.shortcode);
    const role = text(job.title);
    if (!shortcode || !role) {
      continue;
    }
    const detail = details[shortcode];
    const url = `https://apply.workable.com/${slug}/j/${shortcode}/`;
    const location =
      [job.location?.city, job.location?.country]
        .map((part) => text(part))
        .filter((part): part is string => part !== null)
        .join(', ') || null;
    const html = [
      detail?.description ?? '',
      detail?.requirements ? `<h4>Requirements</h4>${detail.requirements}` : '',
      detail?.benefits ? `<h4>Benefits</h4>${detail.benefits}` : '',
    ]
      .filter((part) => part.length > 0)
      .join('');
    items.push({
      source: 'WORKABLE',
      externalId: shortcode,
      boardId: slug,
      author: company ?? slug,
      postedAt: toDate(job.published),
      url,
      applyUrl: `${url}apply/`,
      company,
      role,
      location,
      remote: remoteFor(job),
      salaryText: null,
      salaryMinUsd: null,
      salaryMaxUsd: null,
      tags: cleanTags(job.department),
      html,
      headline: null,
    });
  }

  return items;
}

@Injectable()
export class WorkableAdapter implements BoardAdapter {
  readonly source = 'WORKABLE' as const;

  async describeBoard(slug: string): Promise<BoardDescription | null> {
    try {
      const widget = await fetchJson<WorkableWidget>(
        `${WORKABLE_BASE}/v1/widget/accounts/${encodeURIComponent(slug)}`,
      );
      return {
        company: text(widget.name) ?? slug,
        jobs: widget.jobs?.length ?? 0,
      };
    } catch (error) {
      if (isNotFound(error)) {
        return null;
      }
      throw error;
    }
  }

  async fetch(boardId?: string): Promise<FetchResult> {
    if (!boardId) {
      throw new Error('Workable needs an account slug');
    }
    const account = encodeURIComponent(boardId);
    const [widget, list] = await Promise.all([
      fetchJson<WorkableWidget>(
        `${WORKABLE_BASE}/v1/widget/accounts/${account}`,
      ),
      postJson<WorkableList>(`${WORKABLE_BASE}/v3/accounts/${account}/jobs`, {
        query: '',
        location: [],
        department: [],
        worktype: [],
        remote: [],
      }),
    ]);
    const jobs = (list.results ?? []).slice(0, WORKABLE_DETAIL_LIMIT);
    const fetched = await mapLimit(jobs, DETAIL_CONCURRENCY, async (job) => {
      const shortcode = text(job.shortcode);
      if (!shortcode) {
        return null;
      }
      return fetchJson<WorkableDetail>(
        `${WORKABLE_BASE}/v2/accounts/${account}/jobs/${shortcode}`,
      );
    });
    const details: Record<string, WorkableDetail | undefined> = {};
    for (const detail of fetched) {
      if (detail?.shortcode) {
        details[detail.shortcode] = detail;
      }
    }
    return {
      boardId,
      items: mapWorkable(
        { results: jobs },
        details,
        boardId,
        text(widget.name),
      ),
    };
  }
}
