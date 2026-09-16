import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ParsedPosting } from '../hn/hn.parser.js';
import type { HnItem } from '../hn/hn.types.js';

export type ParsedWithMeta = { item: HnItem; parsed: ParsedPosting };

@Injectable()
export class PostingsService {
  constructor(private readonly prisma: PrismaService) {}

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
