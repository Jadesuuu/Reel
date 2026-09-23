import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RemindersService } from '../reminders/reminders.service.js';
import { paginate, toSkipTake, type Paginated } from '../common/pagination.js';
import { sourceLabel } from '../sources/source-meta.js';
import type { Source } from '../sources/source.types.js';
import { ALLOWED, canTransition, type Stage } from './stage-machine.js';
import { summarize, type ApplicationStats } from './stats.js';
import type { CreateApplicationDto } from './dto/create-application.dto.js';
import type { UpdateApplicationDto } from './dto/update-application.dto.js';
import type { ListApplicationsQueryDto } from './dto/list-applications.query.js';

const POSTING_SUMMARY_SELECT = {
  id: true,
  source: true,
  url: true,
  company: true,
  role: true,
  location: true,
  remote: true,
  salaryText: true,
  applyUrl: true,
  headline: true,
  postedAt: true,
} as const;

function toDateOrNull(
  value: string | null | undefined,
): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  return new Date(value);
}

function toTextOrNull(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

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
    let location = dto.location ?? null;
    let salaryText = dto.salaryText ?? null;
    let via = dto.via ?? null;

    if (dto.postingId) {
      const posting = await this.prisma.posting.findUnique({
        where: { id: dto.postingId },
        select: {
          id: true,
          source: true,
          company: true,
          role: true,
          applyUrl: true,
          url: true,
          location: true,
          salaryText: true,
        },
      });
      if (!posting) {
        throw new NotFoundException('Posting not found');
      }
      company = company ?? posting.company;
      role = role ?? posting.role;
      url = url ?? posting.applyUrl ?? posting.url;
      location = location ?? posting.location;
      salaryText = salaryText ?? posting.salaryText;
      via = via ?? sourceLabel(posting.source as Source);
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
        location,
        salaryText,
        via,
        nextStepAt: dto.nextStepAt ? new Date(dto.nextStepAt) : null,
        contactName: dto.contactName ?? null,
        contactEmail: dto.contactEmail ?? null,
        events: { create: { fromStage: null, toStage: 'SAVED' } },
      },
      include: { events: true },
    });
  }

  async list(
    userId: string,
    query: ListApplicationsQueryDto,
  ): Promise<Paginated<Record<string, unknown>>> {
    const where = {
      userId,
      ...(query.stage ? { stage: query.stage } : {}),
      ...(query.q
        ? {
            OR: [
              { company: { contains: query.q, mode: 'insensitive' as const } },
              { role: { contains: query.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: {
          reminders: {
            where: { sentAt: null, cancelledAt: null },
            select: { id: true, kind: true, dueAt: true },
          },
          posting: { select: { source: true } },
        },
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
        reminders: { orderBy: { dueAt: 'desc' } },
      },
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    return application;
  }

  async update(userId: string, id: string, dto: UpdateApplicationDto) {
    await this.requireOwned(userId, id);

    const data = {
      ...(dto.company === undefined ? {} : { company: dto.company }),
      ...(dto.role === undefined ? {} : { role: dto.role }),
      ...(dto.url === undefined ? {} : { url: toTextOrNull(dto.url) }),
      ...(dto.notes === undefined ? {} : { notes: dto.notes }),
      ...(dto.location === undefined
        ? {}
        : { location: toTextOrNull(dto.location) }),
      ...(dto.salaryText === undefined
        ? {}
        : { salaryText: toTextOrNull(dto.salaryText) }),
      ...(dto.via === undefined ? {} : { via: toTextOrNull(dto.via) }),
      ...(dto.appliedAt === undefined
        ? {}
        : { appliedAt: toDateOrNull(dto.appliedAt) }),
      ...(dto.nextStepAt === undefined
        ? {}
        : { nextStepAt: toDateOrNull(dto.nextStepAt) }),
      ...(dto.contactName === undefined
        ? {}
        : { contactName: toTextOrNull(dto.contactName) }),
      ...(dto.contactEmail === undefined
        ? {}
        : { contactEmail: toTextOrNull(dto.contactEmail) }),
    };

    return this.prisma.application.update({ where: { id }, data });
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
        data: {
          stage: to,
          stageChangedAt,
          ...(to === 'APPLIED' && application.appliedAt === null
            ? { appliedAt: stageChangedAt }
            : {}),
        },
      }),
      this.prisma.stageEvent.create({
        data: {
          applicationId: id,
          fromStage: from,
          toStage: to,
          kind: 'STAGE_CHANGE',
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

  async addNote(userId: string, id: string, note: string) {
    const application = await this.requireOwned(userId, id);
    const stage = application.stage as Stage;

    return this.prisma.stageEvent.create({
      data: {
        applicationId: id,
        fromStage: stage,
        toStage: stage,
        kind: 'NOTE',
        note: note.trim(),
      },
    });
  }

  async scheduleFollowUp(userId: string, id: string, dueAt: Date) {
    await this.requireOwned(userId, id);
    if (Number.isNaN(dueAt.getTime()) || dueAt.getTime() <= Date.now()) {
      throw new BadRequestException('dueAt must be in the future');
    }
    return this.reminders.scheduleFollowUp(id, dueAt);
  }

  async cancelReminder(
    userId: string,
    id: string,
    reminderId: string,
  ): Promise<void> {
    await this.requireOwned(userId, id);
    await this.reminders.cancelReminder(id, reminderId);
  }

  async stats(userId: string): Promise<ApplicationStats> {
    const [applications, events, reminders] = await Promise.all([
      this.prisma.application.findMany({
        where: { userId },
        select: {
          id: true,
          company: true,
          role: true,
          stage: true,
          nextStepAt: true,
        },
      }),
      this.prisma.stageEvent.findMany({
        where: { application: { userId } },
        select: {
          applicationId: true,
          toStage: true,
          kind: true,
          createdAt: true,
        },
      }),
      this.prisma.reminder.findMany({
        where: { application: { userId } },
        select: {
          applicationId: true,
          dueAt: true,
          sentAt: true,
          cancelledAt: true,
        },
      }),
    ]);

    return summarize({
      applications: applications.map((application) => ({
        ...application,
        stage: application.stage as Stage,
      })),
      events: events.map((event) => ({
        ...event,
        toStage: event.toStage as Stage,
        kind: event.kind as 'STAGE_CHANGE' | 'NOTE',
      })),
      reminders,
      now: new Date(),
    });
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
