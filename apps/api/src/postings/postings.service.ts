import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { paginate, toSkipTake, type Paginated } from '../common/pagination.js';
import type { ListPostingsQueryDto } from './dto/list-postings.query.js';
import type { ParsedPosting } from '../hn/hn.parser.js';
import type { HnItem } from '../hn/hn.types.js';

export type ParsedWithMeta = { item: HnItem; parsed: ParsedPosting };

const LIST_SELECT = {
  id: true,
  source: true,
  externalId: true,
  threadId: true,
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
  headline: true,
  fingerprint: true,
  createdAt: true,
  updatedAt: true,
} as const;

const DETAIL_SELECT = { ...LIST_SELECT, rawText: true } as const;

@Injectable()
export class PostingsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    query: ListPostingsQueryDto,
  ): Promise<Paginated<Record<string, unknown>>> {
    const { page, pageSize, q, remote, threadId } = query;

    const where = {
      ...(remote ? { remote } : {}),
      ...(threadId ? { threadId } : {}),
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

  async upsertMany(
    threadId: string,
    entries: ParsedWithMeta[],
  ): Promise<{ created: number; updated: number }> {
    if (entries.length === 0) {
      return { created: 0, updated: 0 };
    }

    const externalIds = entries.map((entry) => String(entry.item.id));
    const existing = await this.prisma.posting.findMany({
      where: { source: 'HN', externalId: { in: externalIds } },
      select: { externalId: true },
    });
    const existingIds = new Set(existing.map((row) => row.externalId));

    for (const { item, parsed } of entries) {
      const externalId = String(item.id);
      const fields = {
        threadId,
        author: item.by ?? 'unknown',
        postedAt: new Date(item.time * 1000),
        company: parsed.company,
        role: parsed.role,
        location: parsed.location,
        remote: parsed.remote,
        salaryText: parsed.salaryText,
        salaryMinUsd: parsed.salaryMinUsd,
        salaryMaxUsd: parsed.salaryMaxUsd,
        stackKeywords: parsed.stackKeywords,
        applyUrl: parsed.applyUrl,
        rawHtml: item.text ?? '',
        rawText: parsed.rawText,
        headline: parsed.headline,
        fingerprint: parsed.fingerprint,
      };

      await this.prisma.posting.upsert({
        where: { source_externalId: { source: 'HN', externalId } },
        create: { source: 'HN', externalId, ...fields },
        update: fields,
      });
    }

    const created = entries.filter(
      (entry) => !existingIds.has(String(entry.item.id)),
    ).length;

    return { created, updated: entries.length - created };
  }
}
