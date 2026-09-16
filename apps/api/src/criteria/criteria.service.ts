import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { normalizeKeywords } from './normalize.js';
import { UpsertCriteriaDto } from './dto/upsert-criteria.dto.js';

const DEFAULTS = {
  id: null,
  remoteOnly: true,
  roleKeywords: [] as string[],
  includeKeywords: [] as string[],
  excludeKeywords: [] as string[],
  minSalaryUsd: null as number | null,
};

@Injectable()
export class CriteriaService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrDefault(userId: string) {
    const found = await this.prisma.criteria.findUnique({ where: { userId } });
    return found ?? { userId, ...DEFAULTS };
  }

  upsert(userId: string, dto: UpsertCriteriaDto) {
    const data = {
      remoteOnly: dto.remoteOnly,
      roleKeywords: normalizeKeywords(dto.roleKeywords),
      includeKeywords: normalizeKeywords(dto.includeKeywords),
      excludeKeywords: normalizeKeywords(dto.excludeKeywords),
      minSalaryUsd: dto.minSalaryUsd ?? null,
    };
    return this.prisma.criteria.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }
}
