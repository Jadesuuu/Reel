import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RemindersService } from '../reminders/reminders.service.js';
import { paginate, toSkipTake, type Paginated } from '../common/pagination.js';
import { ALLOWED, canTransition, type Stage } from './stage-machine.js';
import type { CreateApplicationDto } from './dto/create-application.dto.js';
import type { UpdateApplicationDto } from './dto/update-application.dto.js';
import type { ListApplicationsQueryDto } from './dto/list-applications.query.js';

const POSTING_SUMMARY_SELECT = {
  id: true,
  company: true,
  role: true,
  location: true,
  remote: true,
  salaryText: true,
  applyUrl: true,
  headline: true,
  postedAt: true,
} as const;

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reminders: RemindersService,
  ) {}

  async create(userId: string, dto: CreateApplicationDto) {
    let company = dto.company ?? null;
    let role = dto.role ?? null;
    let url = dto.url ?? null;

    if (dto.postingId) {
      const posting = await this.prisma.posting.findUnique({
        where: { id: dto.postingId },
        select: { id: true, company: true, role: true, applyUrl: true },
      });
      if (!posting) {
        throw new NotFoundException('Posting not found');
      }
      company = company ?? posting.company;
      role = role ?? posting.role;
      url = url ?? posting.applyUrl;
    }

    if (!company || !role) {
      throw new BadRequestException(
        'company and role are required when no postingId is given',
      );
    }

    return this.prisma.application.create({
      data: {
        userId,
        postingId: dto.postingId ?? null,
        company,
        role,
        url,
        notes: dto.notes ?? null,
        events: { create: { fromStage: null, toStage: 'SAVED' } },
      },
      include: { events: true },
    });
  }

  async list(
    userId: string,
    query: ListApplicationsQueryDto,
  ): Promise<Paginated<Record<string, unknown>>> {
    const where = { userId, ...(query.stage ? { stage: query.stage } : {}) };

    const [items, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        ...toSkipTake(query.page, query.pageSize),
      }),
      this.prisma.application.count({ where }),
    ]);

    return paginate(items, query.page, query.pageSize, total);
  }

  async findOne(userId: string, id: string) {
    const application = await this.prisma.application.findFirst({
      where: { id, userId },
      include: {
        events: { orderBy: { createdAt: 'asc' } },
        posting: { select: POSTING_SUMMARY_SELECT },
        reminders: true,
      },
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    return application;
  }

  async update(userId: string, id: string, dto: UpdateApplicationDto) {
    await this.requireOwned(userId, id);

    return this.prisma.application.update({
      where: { id },
      data: {
        ...(dto.company === undefined ? {} : { company: dto.company }),
        ...(dto.role === undefined ? {} : { role: dto.role }),
        ...(dto.url === undefined ? {} : { url: dto.url }),
        ...(dto.notes === undefined ? {} : { notes: dto.notes }),
      },
    });
  }

  async changeStage(userId: string, id: string, to: Stage, note?: string) {
    const application = await this.requireOwned(userId, id);
    const from = application.stage as Stage;

    if (to === from) {
      throw new BadRequestException(`Application is already in stage ${to}`);
    }

    if (!canTransition(from, to)) {
      const allowed = ALLOWED[from];
      throw new BadRequestException(
        allowed.length === 0
          ? `${from} is a terminal stage`
          : `Cannot move from ${from} to ${to}. Allowed: ${allowed.join(', ')}`,
      );
    }

    const stageChangedAt = new Date();

    const [updated] = await this.prisma.$transaction([
      this.prisma.application.update({
        where: { id },
        data: { stage: to, stageChangedAt },
      }),
      this.prisma.stageEvent.create({
        data: {
          applicationId: id,
          fromStage: from,
          toStage: to,
          note: note ?? null,
        },
      }),
    ]);

    await this.reminders.cancel(id);
    if (to === 'APPLIED') {
      await this.reminders.schedule(id, stageChangedAt);
    }

    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.requireOwned(userId, id);
    await this.reminders.cancel(id);
    await this.prisma.application.delete({ where: { id } });
  }

  private async requireOwned(userId: string, id: string) {
    const application = await this.prisma.application.findFirst({
      where: { id, userId },
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    return application;
  }
}
