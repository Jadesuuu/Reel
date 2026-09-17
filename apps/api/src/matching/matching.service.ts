import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { paginate, toSkipTake, type Paginated } from '../common/pagination.js';
import { MATCH_THRESHOLD, score, type CriteriaForScoring } from './scorer.js';

const RESCORE_WINDOW_DAYS = 45;

const DEFAULT_CRITERIA: CriteriaForScoring = {
  remoteOnly: true,
  roleKeywords: [],
  includeKeywords: [],
  excludeKeywords: [],
  minSalaryUsd: null,
};

const POSTING_SUMMARY_SELECT = {
  id: true,
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
  postedAt: true,
} as const;

@Injectable()
export class MatchingService {
  constructor(private readonly prisma: PrismaService) {}

  async rescoreUser(userId: string): Promise<number> {
    const found = await this.prisma.criteria.findUnique({ where: { userId } });
    const criteria: CriteriaForScoring = found
      ? {
          remoteOnly: found.remoteOnly,
          roleKeywords: found.roleKeywords,
          includeKeywords: found.includeKeywords,
          excludeKeywords: found.excludeKeywords,
          minSalaryUsd: found.minSalaryUsd,
        }
      : DEFAULT_CRITERIA;

    const since = new Date(
      Date.now() - RESCORE_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );
    const postings = await this.prisma.posting.findMany({
      where: { postedAt: { gte: since } },
      select: {
        id: true,
        headline: true,
        remote: true,
        stackKeywords: true,
        salaryMinUsd: true,
        salaryMaxUsd: true,
        applyUrl: true,
      },
    });

    let written = 0;

    for (const posting of postings) {
      const result = score(posting, criteria);

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
    dismissed: boolean,
    page: number,
    pageSize: number,
  ): Promise<Paginated<Record<string, unknown>>> {
    const where = { userId, dismissed };

    const [items, total] = await Promise.all([
      this.prisma.match.findMany({
        where,
        include: { posting: { select: POSTING_SUMMARY_SELECT } },
        orderBy: [{ score: 'desc' }, { posting: { postedAt: 'desc' } }],
        ...toSkipTake(page, pageSize),
      }),
      this.prisma.match.count({ where }),
    ]);

    return paginate(items, page, pageSize, total);
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
}
