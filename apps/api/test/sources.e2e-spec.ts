import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp } from './create-app.js';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response;
}

describe('Sources (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cookie: string;

  const email = `sources-${Date.now()}@example.com`;
  const password = 'password12345';
  const slug = `e2e-board-${Date.now()}`;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password })
      .expect(201);

    const setCookie = res.headers['set-cookie'];
    cookie = Array.isArray(setCookie) ? setCookie[0] : String(setCookie);
  });

  afterAll(async () => {
    await prisma.watchedBoard.deleteMany({ where: { slug } });
    await prisma.sourceSetting.updateMany({
      where: { source: 'JOBICY' },
      data: { enabled: true },
    });
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects unauthenticated access', async () => {
    await request(app.getHttpServer()).get('/api/v1/sources').expect(401);
  });

  it('GET /sources lists all ten sources with metadata', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/sources')
      .set('Cookie', cookie)
      .expect(200);

    expect(res.body.items).toHaveLength(10);
    const hn = res.body.items.find(
      (item: { source: string }) => item.source === 'HN',
    );
    expect(hn).toMatchObject({
      label: 'Hacker News',
      kind: 'feed',
      enabled: expect.any(Boolean),
      postings: expect.any(Number),
    });
    const greenhouse = res.body.items.find(
      (item: { source: string }) => item.source === 'GREENHOUSE',
    );
    expect(greenhouse.kind).toBe('board');
  });

  it('PATCH /sources/:source toggles a source and persists it', async () => {
    const off = await request(app.getHttpServer())
      .patch('/api/v1/sources/jobicy')
      .set('Cookie', cookie)
      .send({ enabled: false })
      .expect(200);
    expect(off.body).toMatchObject({ source: 'JOBICY', enabled: false });

    const list = await request(app.getHttpServer())
      .get('/api/v1/sources')
      .set('Cookie', cookie)
      .expect(200);
    const jobicy = list.body.items.find(
      (item: { source: string }) => item.source === 'JOBICY',
    );
    expect(jobicy.enabled).toBe(false);

    await request(app.getHttpServer())
      .patch('/api/v1/sources/jobicy')
      .set('Cookie', cookie)
      .send({ enabled: true })
      .expect(200);
  });

  it('PATCH /sources/:source rejects an unknown source', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/sources/linkedin')
      .set('Cookie', cookie)
      .send({ enabled: true })
      .expect(404);
  });

  it('PATCH /sources/:source validates the body', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/sources/hn')
      .set('Cookie', cookie)
      .send({ enabled: 'yes' })
      .expect(400);
  });

  it('POST /sources/boards validates the board against the provider then saves it', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const url = String(input);
      if (url.endsWith(`/boards/${slug}`)) {
        return Promise.resolve(jsonResponse({ name: 'E2E Corp', content: '' }));
      }
      return Promise.resolve(
        jsonResponse({ jobs: [{ id: 1, title: 'Engineer' }] }),
      );
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/sources/boards')
      .set('Cookie', cookie)
      .send({ provider: 'GREENHOUSE', slug: slug.toUpperCase() })
      .expect(201);

    expect(res.body).toMatchObject({
      provider: 'GREENHOUSE',
      slug,
      company: 'E2E Corp',
    });
    expect(globalThis.fetch).toHaveBeenCalled();
  });

  it('POST /sources/boards refuses a duplicate', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ name: 'E2E Corp' }),
    );

    await request(app.getHttpServer())
      .post('/api/v1/sources/boards')
      .set('Cookie', cookie)
      .send({ provider: 'GREENHOUSE', slug })
      .expect(409);
  });

  it('POST /sources/boards rejects a board the provider does not know', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({}, 404));

    const res = await request(app.getHttpServer())
      .post('/api/v1/sources/boards')
      .set('Cookie', cookie)
      .send({ provider: 'LEVER', slug: `${slug}-missing` })
      .expect(400);
    expect(res.body.message).toBe('Board not found');
  });

  it('POST /sources/boards rejects a feed source as provider', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/sources/boards')
      .set('Cookie', cookie)
      .send({ provider: 'REMOTIVE', slug: 'anything' })
      .expect(400);
  });

  it('GET /sources/boards lists the watched board and DELETE removes it', async () => {
    const list = await request(app.getHttpServer())
      .get('/api/v1/sources/boards')
      .set('Cookie', cookie)
      .expect(200);
    const board = list.body.items.find(
      (item: { slug: string }) => item.slug === slug,
    );
    expect(board).toBeDefined();

    await request(app.getHttpServer())
      .delete(`/api/v1/sources/boards/${board.id}`)
      .set('Cookie', cookie)
      .expect(204);

    await request(app.getHttpServer())
      .delete(`/api/v1/sources/boards/${board.id}`)
      .set('Cookie', cookie)
      .expect(404);
  });
});
