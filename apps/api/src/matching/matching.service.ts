import { Injectable, NotFoundException } from '@nestjs/common';
import { trackedByPosting } from '../applications/tracked.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { paginate, toSkipTake, type Paginated } from '../common/pagination.js';
import type { Source } from '../sources/source.types.js';
import type { MatchSort } from './dto/list-matches.query.js';
import {
  MATCH_THRESHOLD,
  STRONG_MATCH,
  score,
  type CriteriaForScoring,
} from './scorer.js';

const RESCORE_WINDOW_DAYS = 45;
const FRESH_FALLBACK_HOURS = 24;
const FRESH_TOP = 3;

export const DEFAULT_CRITERIA: CriteriaForScoring = {
  remoteOnly: true,
  roleKeywords: [],
  includeKeywords: [],
  excludeKeywords: [],
  regionKeywords: [],
  nearbyKeywords: [],
  levels: [],
  minSalaryUsd: null,
};

const POSTING_SUMMARY_SELECT = {
  id: true,
  source: true,
  url: true,
  company: true,
  role: true,
  location: true,
  remote: true,
  salaryText: true,
  salaryMinUsd: true,
  salaryMaxUsd: true,
  stackKeywords: true,
  regionTerms: true,
  level: true,
  applyUrl: true,
  headline: true,
  postedAt: true,
} as const;

export type FreshMatches = {
  count: number;
  since: string;
  top: Array<{ company: string | null; role: string | null; score: number }>;
};

@Injectable()
export class MatchingService {
  constructor(private readonly prisma: PrismaService) {}

  async criteriaFor(userId: string): Promise<CriteriaForScoring> {
    const found = await this.prisma.criteria.findUnique({ where: { userId } });
    return found
      ? {
          remoteOnly: found.remoteOnly,
          roleKeywords: found.roleKeywords,
          includeKeywords: found.includeKeywords,
          excludeKeywords: found.excludeKeywords,
          regionKeywords: found.regionKeywords,
          nearbyKeywords: found.nearbyKeywords,
          levels: found.levels,
          minSalaryUsd: found.minSalaryUsd,
        }
      : DEFAULT_CRITERIA;
  }

  async rescoreUser(userId: string): Promise<number> {
    const criteria = await this.criteriaFor(userId);
    const now = new Date();
    const since = new Date(
      now.getTime() - RESCORE_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );
    const postings = await this.prisma.posting.findMany({
      where: { postedAt: { gte: since } },
      select: {
        id: true,
        headline: true,
        location: true,
        remote: true,
        stackKeywords: true,
        regionTerms: true,
        level: true,
        salaryMinUsd: true,
        salaryMaxUsd: true,
        applyUrl: true,
        postedAt: true,
      },
    });

    await this.prisma.match.deleteMany({
      where: { userId, posting: { postedAt: { lt: since } } },
    });

    let written = 0;

    for (const posting of postings) {
      const result = score(posting, criteria, now);

      if (result.score >= MATCH_THRESHOLD) {
        await this.prisma.match.upsert({
          where: { userId_postingId: { userId, postingId: posting.id } },
          create: {
            userId,
            postingId: posting.id,
            score: result.score,
            reasons: result.reasons,
          },
          update: { score: result.score, reasons: result.reasons },
        });
        written += 1;
      } else {
        await this.prisma.match.deleteMany({
          where: { userId, postingId: posting.id },
        });
      }
    }

    return written;
  }

  async rescoreAllUsers(): Promise<void> {
    const users = await this.prisma.user.findMany({ select: { id: true } });
    for (const user of users) {
      await this.rescoreUser(user.id);
    }
  }

  async list(
    userId: string,
    options: {
      dismissed: boolean;
      source?: Source;
      minScore?: number;
      days?: number;
      sort?: MatchSort;
    },
    page: number,
    pageSize: number,
  ): Promise<Paginated<Record<string, unknown>>> {
    const postingWhere = {
      ...(options.source ? { source: options.source } : {}),
      ...(options.days !== undefined
        ? {
            postedAt: {
              gte: new Date(Date.now() - options.days * 24 * 60 * 60 * 1000),
            },
          }
        : {}),
    };
    const where = {
      userId,
      dismissed: options.dismissed,
      ...(options.minScore !== undefined
        ? { score: { gte: options.minScore } }
        : {}),
      ...(Object.keys(postingWhere).length > 0
        ? { posting: postingWhere }
        : {}),
    };

    const orderBy =
      options.sort === 'newest'
        ? [
            { posting: { postedAt: 'desc' as const } },
            { score: 'desc' as const },
          ]
        : [
            { score: 'desc' as const },
            { posting: { postedAt: 'desc' as const } },
          ];

    const [items, total] = await Promise.all([
      this.prisma.match.findMany({
        where,
        include: { posting: { select: POSTING_SUMMARY_SELECT } },
        orderBy,
        ...toSkipTake(page, pageSize),
      }),
      this.prisma.match.count({ where }),
    ]);

    const byPosting = await trackedByPosting(
      this.prisma,
      userId,
      items.map((item) => item.postingId),
    );

    return paginate(
      items.map((item) => ({
        ...item,
        application: byPosting.get(item.postingId) ?? null,
      })),
      page,
      pageSize,
      total,
    );
  }

  async dismiss(userId: string, matchId: string) {
    const updated = await this.prisma.match.updateMany({
      where: { id: matchId, userId },
      data: { dismissed: true },
    });

    if (updated.count === 0) {
      throw new NotFoundException('Match not found');
    }

    return this.prisma.match.findUniqueOrThrow({ where: { id: matchId } });
  }

  async markSeen(userId: string): Promise<{ seenAt: string }> {
    const seenAt = new Date();
    await this.prisma.user.update({
      where: { id: userId },
      data: { matchesSeenAt: seenAt },
    });
    return { seenAt: seenAt.toISOString() };
  }

  async freshForUser(userId: string): Promise<FreshMatches> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { matchesSeenAt: true },
    });
    const since =
      user?.matchesSeenAt ??
      new Date(Date.now() - FRESH_FALLBACK_HOURS * 60 * 60 * 1000);
    const where = {
      userId,
      dismissed: false,
      score: { gte: STRONG_MATCH },
      createdAt: { gt: since },
    };
    const [count, top] = await Promise.all([
      this.prisma.match.count({ where }),
      this.prisma.match.findMany({
        where,
        orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
        take: FRESH_TOP,
        select: {
          score: true,
          posting: { select: { company: true, role: true } },
        },
      }),
    ]);
    return {
      count,
      since: since.toISOString(),
      top: top.map((item) => ({
        company: item.posting.company,
        role: item.posting.role,
        score: item.score,
      })),
    };
  }
}
