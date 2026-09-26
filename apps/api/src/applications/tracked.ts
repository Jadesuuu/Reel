import type { PrismaService } from '../prisma/prisma.service.js';

export type TrackedApplication = { id: string; stage: string };

export async function trackedByPosting(
  prisma: PrismaService,
  userId: string,
  postingIds: string[],
): Promise<Map<string, TrackedApplication>> {
  if (postingIds.length === 0) {
    return new Map();
  }
  const applications = await prisma.application.findMany({
    where: { userId, postingId: { in: postingIds } },
    select: { id: true, stage: true, postingId: true },
    orderBy: { createdAt: 'asc' },
  });
  return new Map(
    applications.map((application) => [
      application.postingId!,
      { id: application.id, stage: application.stage },
    ]),
  );
}
