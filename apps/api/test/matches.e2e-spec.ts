import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp } from './create-app.js';

const THREAD_ID = 'e2e-matches-thread';

describe('Matches (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cookie: string;

  const email = `matches-${Date.now()}@example.com`;
  const password = 'password12345';

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password })
      .expect(201);

    const setCookie = res.headers['set-cookie'];
    cookie = Array.isArray(setCookie) ? setCookie[0] : String(setCookie);

    await request(app.getHttpServer())
      .put('/api/v1/criteria')
      .set('Cookie', cookie)
      .send({
        remoteOnly: true,
        roleKeywords: ['full stack'],
        includeKeywords: ['typescript', 'node'],
        excludeKeywords: ['php'],
      })
      .expect(200);

    await prisma.posting.deleteMany({ where: { threadId: THREAD_ID } });
    await prisma.posting.createMany({
      data: [
        {
          source: 'HN',
          externalId: `${THREAD_ID}-strong`,
          threadId: THREAD_ID,
          author: 'alice',
          postedAt: new Date(),
          company: 'Northwind Labs',
          role: 'Full Stack Engineer',
          remote: 'REMOTE',
          stackKeywords: ['typescript', 'node'],
          applyUrl: 'https://northwind.example/apply',
          rawHtml: '<p>x</p>',
          rawText: 'x',
          headline: 'Northwind Labs | Full Stack Engineer | Remote',
          fingerprint: `${THREAD_ID}-fp-strong`,
        },
        {
          source: 'HN',
          externalId: `${THREAD_ID}-weak`,
          threadId: THREAD_ID,
          author: 'bob',
          postedAt: new Date(),
          company: 'Initech',
          role: 'Office Manager',
          remote: 'REMOTE',
          stackKeywords: [],
          rawHtml: '<p>x</p>',
          rawText: 'x',
          headline: 'Initech | Office Manager | Remote',
          fingerprint: `${THREAD_ID}-fp-weak`,
        },
        {
          source: 'HN',
          externalId: `${THREAD_ID}-excluded`,
          threadId: THREAD_ID,
          author: 'carol',
          postedAt: new Date(),
          company: 'Legacy Co',
          role: 'PHP Developer',
          remote: 'REMOTE',
          stackKeywords: ['php'],
          rawHtml: '<p>x</p>',
          rawText: 'x',
          headline: 'Legacy Co | PHP Developer | Remote',
          fingerprint: `${THREAD_ID}-fp-excluded`,
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.posting.deleteMany({ where: { threadId: THREAD_ID } });
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('rescores and writes only the matches above the threshold', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/matches/rescore')
      .set('Cookie', cookie)
      .expect(202);

    expect(res.body.rescored).toBeGreaterThanOrEqual(1);
  });

  it('writes a match for the strong posting and none for the others', async () => {
    const postings = await prisma.posting.findMany({
      where: { threadId: THREAD_ID },
      select: { id: true, externalId: true },
    });
    const byExternalId = new Map(
      postings.map((posting) => [posting.externalId, posting.id]),
    );

    const matches = await prisma.match.findMany({
      where: { postingId: { in: postings.map((posting) => posting.id) } },
      select: { postingId: true, score: true, reasons: true },
    });
    const matched = new Set(matches.map((match) => match.postingId));

    expect(matched.has(byExternalId.get(`${THREAD_ID}-strong`)!)).toBe(true);
    expect(matched.has(byExternalId.get(`${THREAD_ID}-weak`)!)).toBe(false);
    expect(matched.has(byExternalId.get(`${THREAD_ID}-excluded`)!)).toBe(false);
    expect(matches[0].reasons).toContain('remote');
  });

  it('lists matches ordered by score, with the posting summary', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/matches?pageSize=100')
      .set('Cookie', cookie)
      .expect(200);

    const scores = res.body.items.map((item: { score: number }) => item.score);
    expect([...scores].sort((a: number, b: number) => b - a)).toEqual(scores);
    expect(res.body.items[0].posting).toHaveProperty('company');
    expect(res.body.items[0].posting).not.toHaveProperty('rawText');
  });

  it('dismisses a match and hides it from the default list', async () => {
    const strong = await prisma.posting.findFirstOrThrow({
      where: { externalId: `${THREAD_ID}-strong` },
      select: { id: true },
    });
    const target = await prisma.match.findFirstOrThrow({
      where: { postingId: strong.id },
      select: { id: true },
    });

    const dismissed = await request(app.getHttpServer())
      .post(`/api/v1/matches/${target.id}/dismiss`)
      .set('Cookie', cookie)
      .expect(200);
    expect(dismissed.body.dismissed).toBe(true);

    const after = await request(app.getHttpServer())
      .get('/api/v1/matches?pageSize=100')
      .set('Cookie', cookie)
      .expect(200);
    expect(
      after.body.items.some((item: { id: string }) => item.id === target.id),
    ).toBe(false);

    const withDismissed = await request(app.getHttpServer())
      .get('/api/v1/matches?dismissed=true&pageSize=100')
      .set('Cookie', cookie)
      .expect(200);
    expect(
      withDismissed.body.items.some(
        (item: { id: string }) => item.id === target.id,
      ),
    ).toBe(true);
  });

  it('404s when dismissing a match that is not yours', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/matches/does-not-exist/dismiss')
      .set('Cookie', cookie)
      .expect(404);
  });
});
