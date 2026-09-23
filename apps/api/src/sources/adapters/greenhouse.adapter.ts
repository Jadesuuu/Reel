import { Injectable } from '@nestjs/common';
import he from 'he';
import { fetchJson, isNotFound } from '../http.js';
import { cleanTags, text, toDate } from '../normalize.js';
import type {
  BoardAdapter,
  BoardDescription,
  FetchResult,
  RawPosting,
} from '../source.types.js';

export const GREENHOUSE_BASE = 'https://boards-api.greenhouse.io/v1/boards';

export type GreenhouseJob = {
  id?: number | string;
  absolute_url?: string;
  title?: string;
  location?: { name?: string } | null;
  first_published?: string;
  updated_at?: string;
  company_name?: string;
  content?: string;
  departments?: Array<{ name?: string }>;
};

export type GreenhousePayload = { jobs?: GreenhouseJob[] };

export type GreenhouseBoard = { name?: string };

export function mapGreenhouse(
  payload: GreenhousePayload,
  slug: string,
  company: string | null,
): RawPosting[] {
  const jobs = Array.isArray(payload.jobs) ? payload.jobs : [];
  const items: RawPosting[] = [];

  for (const job of jobs) {
    const role = text(job.title);
    if (!role || job.id === undefined) {
      continue;
    }
    const name = text(job.company_name) ?? company;
    items.push({
      source: 'GREENHOUSE',
      externalId: String(job.id),
      boardId: slug,
      author: name ?? slug,
      postedAt: toDate(job.first_published ?? job.updated_at),
      url: text(job.absolute_url),
      applyUrl: text(job.absolute_url),
      company: name,
      role,
      location: text(job.location?.name),
      remote: null,
      salaryText: null,
      salaryMinUsd: null,
      salaryMaxUsd: null,
      tags: cleanTags(
        (job.departments ?? []).map((department) => department.name ?? ''),
      ),
      html: he.decode(job.content ?? ''),
      headline: null,
    });
  }

  return items;
}

@Injectable()
export class GreenhouseAdapter implements BoardAdapter {
  readonly source = 'GREENHOUSE' as const;

  async describeBoard(slug: string): Promise<BoardDescription | null> {
    try {
      const [board, jobs] = await Promise.all([
        fetchJson<GreenhouseBoard>(
          `${GREENHOUSE_BASE}/${encodeURIComponent(slug)}`,
        ),
        fetchJson<GreenhousePayload>(
          `${GREENHOUSE_BASE}/${encodeURIComponent(slug)}/jobs`,
        ),
      ]);
      return {
        company: text(board.name) ?? slug,
        jobs: jobs.jobs?.length ?? 0,
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
      throw new Error('Greenhouse needs a board slug');
    }
    const [board, payload] = await Promise.all([
      fetchJson<GreenhouseBoard>(
        `${GREENHOUSE_BASE}/${encodeURIComponent(boardId)}`,
      ),
      fetchJson<GreenhousePayload>(
        `${GREENHOUSE_BASE}/${encodeURIComponent(boardId)}/jobs?content=true`,
      ),
    ]);
    return {
      boardId,
      items: mapGreenhouse(payload, boardId, text(board.name)),
    };
  }
}
