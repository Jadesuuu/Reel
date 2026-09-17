import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import argon2 from 'argon2';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main(): Promise<void> {
  const email = 'jade@example.com';
  const passwordHash = await argon2.hash('password12345');

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash },
  });

  await prisma.criteria.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      remoteOnly: true,
      roleKeywords: [
        'full stack',
        'fullstack',
        'full-stack',
        'software engineer',
      ],
      includeKeywords: [
        'typescript',
        'node',
        'react',
        'nestjs',
        'next.js',
        'postgres',
        'aws',
      ],
      excludeKeywords: ['php', 'wordpress', 'principal', 'staff'],
    },
  });
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
