import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SOURCE_META, type SourceMeta } from './source-meta.js';
import { SourceRegistry } from './source-registry.js';
import {
  BOARD_PROVIDERS,
  SOURCES,
  isBoardProvider,
  isSource,
  type BoardProvider,
  type Source,
} from './source.types.js';

export type IngestTarget = { source: Source; boardId?: string };

export type SourceInfo = SourceMeta & {
  enabled: boolean;
  postings: number;
  lastRun: Record<string, unknown> | null;
};

@Injectable()
export class SourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: SourceRegistry,
  ) {}

  private async ensureSettings(): Promise<Map<Source, boolean>> {
    await this.prisma.sourceSetting.createMany({
      data: SOURCES.map((source) => ({ source })),
      skipDuplicates: true,
    });
    const rows = await this.prisma.sourceSetting.findMany();
    return new Map(rows.map((row) => [row.source as Source, row.enabled]));
  }

  async list(): Promise<{ items: SourceInfo[] }> {
    const [enabled, counts, runs] = await Promise.all([
      this.ensureSettings(),
      this.prisma.posting.groupBy({ by: ['source'], _count: { _all: true } }),
      this.prisma.ingestRun.findMany({
        distinct: ['source'],
        orderBy: { startedAt: 'desc' },
      }),
    ]);

    const countBySource = new Map(
      counts.map((row) => [row.source as Source, row._count._all]),
    );
    const runBySource = new Map(runs.map((run) => [run.source as Source, run]));

    const items = SOURCES.map((source) => ({
      ...SOURCE_META[source],
      enabled: enabled.get(source) ?? true,
      postings: countBySource.get(source) ?? 0,
      lastRun: runBySource.get(source) ?? null,
    }));

    return { items };
  }

  async setEnabled(source: string, enabled: boolean): Promise<SourceInfo> {
    if (!isSource(source)) {
      throw new NotFoundException('Unknown source');
    }
    await this.prisma.sourceSetting.upsert({
      where: { source },
      create: { source, enabled },
      update: { enabled },
    });
    const { items } = await this.list();
    return items.find((item) => item.source === source)!;
  }

  listBoards() {
    return this.prisma.watchedBoard
      .findMany({ orderBy: [{ provider: 'asc' }, { company: 'asc' }] })
      .then((items) => ({ items }));
  }

  async addBoard(provider: string, slug: string) {
    if (!isBoardProvider(provider)) {
      throw new BadRequestException(
        `provider must be one of ${BOARD_PROVIDERS.join(', ')}`,
      );
    }
    const normalizedSlug = slug.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9._-]{0,80}$/.test(normalizedSlug)) {
      throw new BadRequestException(
        'slug must be the board identifier from the board URL',
      );
    }

    const existing = await this.prisma.watchedBoard.findUnique({
      where: { provider_slug: { provider, slug: normalizedSlug } },
    });
    if (existing) {
      throw new ConflictException('That board is already watched');
    }

    const description = await this.registry
      .board(provider)
      .describeBoard(normalizedSlug);
    if (!description) {
      throw new BadRequestException('Board not found');
    }

    return this.prisma.watchedBoard.create({
      data: { provider, slug: normalizedSlug, company: description.company },
    });
  }

  async removeBoard(id: string): Promise<void> {
    const deleted = await this.prisma.watchedBoard.deleteMany({
      where: { id },
    });
    if (deleted.count === 0) {
      throw new NotFoundException('Board not found');
    }
  }

  async enabledTargets(): Promise<IngestTarget[]> {
    const [enabled, boards] = await Promise.all([
      this.ensureSettings(),
      this.prisma.watchedBoard.findMany(),
    ]);

    const targets: IngestTarget[] = [];
    for (const source of SOURCES) {
      if (!(enabled.get(source) ?? true)) {
        continue;
      }
      if (SOURCE_META[source].kind === 'feed') {
        targets.push({ source });
        continue;
      }
      for (const board of boards) {
        if (board.provider === source) {
          targets.push({
            source: source as BoardProvider,
            boardId: board.slug,
          });
        }
      }
    }
    return targets;
  }
}
