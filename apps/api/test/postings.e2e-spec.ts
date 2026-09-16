import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp } from './create-app.js';

const THREAD_ID = 'e2e-postings-thread';

describe('Postings (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cookie: string;

  const email = `postings-${Date.now()}@example.com`;
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

    await prisma.posting.deleteMany({ where: { threadId: THREAD_ID } });
    await prisma.posting.createMany({
      data: [
        {
          source: 'HN',
          externalId: `${THREAD_ID}-1`,
          threadId: THREAD_ID,
          author: 'alice',
          postedAt: new Date('2026-09-01T00:00:00Z'),
          company: 'Northwind Labs',
          role: 'Full Stack Engineer',
          location: 'Anywhere',
          remote: 'REMOTE',
          stackKeywords: ['typescript', 'node'],
          rawHtml: '<p>Northwind Labs</p>',
          rawText: 'Northwind Labs',
          headline: 'Northwind Labs | Full Stack Engineer | Remote',
          fingerprint: `${THREAD_ID}-fp-1`,
        },
        {
          source: 'HN',
          externalId: `${THREAD_ID}-2`,
          threadId: THREAD_ID,
          author: 'bob',
          postedAt: new Date('2026-09-02T00:00:00Z'),
          company: 'Contoso',
          role: 'Backend Engineer',
          location: 'Anywhere',
          remote: 'REMOTE',
          stackKeywords: ['go'],
          rawHtml: '<p>Contoso</p>',
          rawText: 'Contoso',
          headline: 'Contoso | Backend Engineer | Remote',
          fingerprint: `${THREAD_ID}-fp-2`,
        },
        {
          source: 'HN',
          externalId: `${THREAD_ID}-3`,
          threadId: THREAD_ID,
          author: 'carol',
          postedAt: new Date('2026-09-03T00:00:00Z'),
          company: 'Initech',
          role: 'Platform Engineer',
          location: 'Berlin',
          remote: 'ONSITE',
          stackKeywords: ['java'],
          rawHtml: '<p>Initech</p>',
          rawText: 'Initech',
          headline: 'Initech | Platform Engineer | Berlin',
          fingerprint: `${THREAD_ID}-fp-3`,
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.posting.deleteMany({ where: { threadId: THREAD_ID } });
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('rejects unauthenticated access', async () => {
    await request(app.getHttpServer()).get('/api/v1/postings').expect(401);
  });

  it('lists every posting in the thread, newest first, without rawHtml', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/postings?threadId=${THREAD_ID}`)
      .set('Cookie', cookie)
      .expect(200);

    expect(res.body.total).toBe(3);
    expect(res.body.items).toHaveLength(3);
    expect(res.body.items[0].company).toBe('Initech');
    expect(res.body.items[0]).not.toHaveProperty('rawHtml');
  });

  it('filters by remote type', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/postings?threadId=${THREAD_ID}&remote=REMOTE`)
      .set('Cookie', cookie)
      .expect(200);

    expect(res.body.total).toBe(2);
  });

  it('searches case-insensitively', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/postings?threadId=${THREAD_ID}&q=northwind`)
      .set('Cookie', cookie)
      .expect(200);

    expect(res.body.total).toBe(1);
    expect(res.body.items[0].company).toBe('Northwind Labs');
  });

  it('paginates', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/postings?threadId=${THREAD_ID}&pageSize=1&page=2`)
      .set('Cookie', cookie)
      .expect(200);

    expect(res.body.items).toHaveLength(1);
    expect(res.body.total).toBe(3);
    expect(res.body.page).toBe(2);
  });

  it('returns a posting detail with rawText but not rawHtml', async () => {
    const list = await request(app.getHttpServer())
      .get(`/api/v1/postings?threadId=${THREAD_ID}`)
      .set('Cookie', cookie)
      .expect(200);

    const res = await request(app.getHttpServer())
      .get(`/api/v1/postings/${list.body.items[0].id}`)
      .set('Cookie', cookie)
      .expect(200);

    expect(res.body).toHaveProperty('rawText');
    expect(res.body).not.toHaveProperty('rawHtml');
  });

  it('404s on an unknown posting', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/postings/does-not-exist')
      .set('Cookie', cookie)
      .expect(404);
  });
});
