import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { paginate, toSkipTake, type Paginated } from '../common/pagination.js';
import type { NormalizedPosting, Source } from '../sources/source.types.js';
import type { ListPostingsQueryDto } from './dto/list-postings.query.js';

const LIST_SELECT = {
  id: true,
  source: true,
  externalId: true,
  boardId: true,
  author: true,
  postedAt: true,
  company: true,
  role: true,
  location: true,
  remote: true,
  salaryText: true,
  salaryMinUsd: true,
  salaryMaxUsd: true,
  stackKeywords: true,
  applyUrl: true,
  url: true,
  headline: true,
  fingerprint: true,
  createdAt: true,
  updatedAt: true,
} as const;

const DETAIL_SELECT = { ...LIST_SELECT, rawText: true } as const;

export type PostingStats = {
  total: number;
  bySource: Array<{
    source: string;
    count: number;
    latestPostedAt: Date | null;
  }>;
  byRemote: Array<{ remote: string; count: number }>;
};

@Injectable()
export class PostingsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    query: ListPostingsQueryDto,
  ): Promise<Paginated<Record<string, unknown>>> {
    const { page, pageSize, q, remote, source, boardId, stack } = query;

    const where = {
      ...(remote ? { remote } : {}),
      ...(source ? { source } : {}),
      ...(boardId ? { boardId } : {}),
      ...(stack ? { stackKeywords: { has: stack.trim().toLowerCase() } } : {}),
      ...(q
        ? {
            OR: [
              { headline: { contains: q, mode: 'insensitive' as const } },
              { company: { contains: q, mode: 'insensitive' as const } },
              { role: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.posting.findMany({
        where,
        select: LIST_SELECT,
        orderBy: { postedAt: 'desc' },
        ...toSkipTake(page, pageSize),
      }),
      this.prisma.posting.count({ where }),
    ]);

    return paginate(items, page, pageSize, total);
  }

  async findOne(id: string): Promise<Record<string, unknown>> {
    const posting = await this.prisma.posting.findUnique({
      where: { id },
      select: DETAIL_SELECT,
    });
    if (!posting) {
      throw new NotFoundException('Posting not found');
    }
    return posting;
  }

  async stats(): Promise<PostingStats> {
    const [total, bySource, byRemote] = await Promise.all([
      this.prisma.posting.count(),
      this.prisma.posting.groupBy({
        by: ['source'],
        _count: { _all: true },
        _max: { postedAt: true },
      }),
      this.prisma.posting.groupBy({ by: ['remote'], _count: { _all: true } }),
    ]);

    return {
      total,
      bySource: bySource
        .map((row) => ({
          source: row.source,
          count: row._count._all,
          latestPostedAt: row._max.postedAt,
        }))
        .toSorted((a, b) => b.count - a.count),
      byRemote: byRemote
        .map((row) => ({ remote: row.remote, count: row._count._all }))
        .toSorted((a, b) => b.count - a.count),
    };
  }

  async upsertMany(
    source: Source,
    boardId: string,
    items: NormalizedPosting[],
  ): Promise<{ created: number; updated: number }> {
    if (items.length === 0) {
      return { created: 0, updated: 0 };
    }

    const externalIds = items.map((item) => item.externalId);
    const existing = await this.prisma.posting.findMany({
      where: { source, externalId: { in: externalIds } },
      select: { externalId: true },
    });
    const existingIds = new Set(existing.map((row) => row.externalId));

    for (const item of items) {
      const fields = {
        boardId,
        author: item.author,
        postedAt: item.postedAt,
        company: item.company,
        role: item.role,
        location: item.location,
        remote: item.remote,
        salaryText: item.salaryText,
        salaryMinUsd: item.salaryMinUsd,
        salaryMaxUsd: item.salaryMaxUsd,
        stackKeywords: item.stackKeywords,
        applyUrl: item.applyUrl,
        url: item.url,
        rawHtml: item.rawHtml,
        rawText: item.rawText,
        headline: item.headline,
        fingerprint: item.fingerprint,
      };

      await this.prisma.posting.upsert({
        where: { source_externalId: { source, externalId: item.externalId } },
        create: { source, externalId: item.externalId, ...fields },
        update: fields,
      });
    }

    const created = items.filter(
      (item) => !existingIds.has(item.externalId),
    ).length;
    return { created, updated: items.length - created };
  }
}
