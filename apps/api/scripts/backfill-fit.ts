import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { detectLevel } from '../src/matching/level.js';
import {
  findRegionTerms,
  regionBasis,
  restrictionBasis,
} from '../src/matching/regions.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const BATCH = 500;

async function main(): Promise<void> {
  let cursor: string | null = null;
  let seen = 0;
  let changed = 0;

  for (;;) {
    const rows: Array<{
      id: string;
      headline: string;
      role: string | null;
      location: string | null;
      rawText: string;
      regionTerms: string[];
      level: string | null;
    }> = await prisma.posting.findMany({
      take: BATCH,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
      select: {
        id: true,
        headline: true,
        role: true,
        location: true,
        rawText: true,
        regionTerms: true,
        level: true,
      },
    });
    if (rows.length === 0) {
      break;
    }
    for (const row of rows) {
      const regionTerms = findRegionTerms(
        `${regionBasis(row.headline, row.location)} | ${restrictionBasis(row.rawText)}`,
      );
      const level = detectLevel(row.headline, row.role);
      const same =
        level === row.level &&
        regionTerms.length === row.regionTerms.length &&
        regionTerms.every((term, index) => term === row.regionTerms[index]);
      if (!same) {
        await prisma.posting.update({
          where: { id: row.id },
          data: { regionTerms, level },
        });
        changed += 1;
      }
    }
    seen += rows.length;
    cursor = rows[rows.length - 1]!.id;
    console.log(`${seen} postings read, ${changed} updated`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
