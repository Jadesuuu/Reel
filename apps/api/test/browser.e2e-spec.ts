import type { INestApplication } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import {
  BROWSER_RUN_TIMEOUT_MS,
  BrowserRunsService,
} from '../src/sources/browser/browser-runs.service.js';
import { createTestApp } from './create-app.js';

const FIXTURES = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'sources',
  '__fixtures__',
);

describe('Browser (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let runs: BrowserRunsService;
  let cookie: string;
  let token: string;

  const email = `browser-${Date.now()}@example.com`;
  const password = 'password12345';
  const boardId = `e2e-${Date.now()}`;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    runs = app.get(BrowserRunsService);

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password })
      .expect(201);
    const setCookie = res.headers['set-cookie'];
    cookie = Array.isArray(setCookie) ? setCookie[0] : String(setCookie);
  });

  afterAll(async () => {
    await prisma.posting.deleteMany({ where: { boardId } });
    await prisma.ingestRun.deleteMany({ where: { boardId } });
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('reports an unlinked browser before a token exists', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/browser')
      .set('Cookie', cookie)
      .expect(200);
    expect(res.body).toEqual({
      linked: false,
      connected: false,
      createdAt: null,
      lastSeenAt: null,
      userAgent: null,
    });
  });

  it('rejects a poll without a token', async () => {
    await request(app.getHttpServer()).post('/api/v1/browser/poll').expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/browser/poll')
      .set('Authorization', 'Bearer reel_not-a-token')
      .expect(401);
  });

  it('creates a token once and shows the browser as linked', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/browser/token')
      .set('Cookie', cookie)
      .expect(201);
    token = res.body.token;
    expect(token).toMatch(/^reel_[A-Za-z0-9_-]{32}$/);

    const status = await request(app.getHttpServer())
      .get('/api/v1/browser')
      .set('Cookie', cookie)
      .expect(200);
    expect(status.body).toMatchObject({ linked: true, connected: false });
  });

  it('polling marks the browser connected and claims waiting runs', async () => {
    const requested = await runs.request('HIRINGCAFE', boardId);
    expect(requested.created).toBe(true);
    const again = await runs.request('HIRINGCAFE', boardId);
    expect(again).toEqual({ runId: requested.runId, created: false });

    const poll = await request(app.getHttpServer())
      .post('/api/v1/browser/poll')
      .set('Authorization', `Bearer ${token}`)
      .send({ userAgent: 'e2e' })
      .expect(200);
    expect(poll.body.pollIntervalMs).toBe(30_000);
    expect(poll.body.jobs).toEqual([
      { runId: requested.runId, source: 'HIRINGCAFE', boardId, since: null },
    ]);

    const run = await prisma.ingestRun.findUniqueOrThrow({
      where: { id: requested.runId },
    });
    expect(run.status).toBe('RUNNING');

    const status = await request(app.getHttpServer())
      .get('/api/v1/browser')
      .set('Cookie', cookie)
      .expect(200);
    expect(status.body).toMatchObject({
      linked: true,
      connected: true,
      userAgent: 'e2e',
    });

    const empty = await request(app.getHttpServer())
      .post('/api/v1/browser/poll')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(200);
    expect(empty.body.jobs).toEqual([]);
  });

  it('completing a run stores the postings and records counts', async () => {
    const run = await prisma.ingestRun.findFirstOrThrow({
      where: { boardId, status: 'RUNNING' },
    });
    const items = JSON.parse(
      readFileSync(join(FIXTURES, 'hiringcafe.json'), 'utf8'),
    ) as unknown[];

    const res = await request(app.getHttpServer())
      .post(`/api/v1/browser/runs/${run.id}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({ items, pagesFetched: 1 })
      .expect(200);
    expect(res.body).toMatchObject({
      status: 'SUCCEEDED',
      itemsSeen: items.length,
      postingsCreated: 3,
      postingsUpdated: 0,
    });

    const stored = await prisma.posting.findMany({ where: { boardId } });
    expect(stored.map((posting) => posting.source)).toEqual([
      'HIRINGCAFE',
      'HIRINGCAFE',
      'HIRINGCAFE',
    ]);

    await request(app.getHttpServer())
      .post(`/api/v1/browser/runs/${run.id}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [] })
      .expect(409);
  });

  it('the next claim carries the last success as since', async () => {
    const { runId } = await runs.request('HIRINGCAFE', boardId);
    const poll = await request(app.getHttpServer())
      .post('/api/v1/browser/poll')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(200);
    expect(poll.body.jobs[0]).toMatchObject({ runId, boardId });
    expect(poll.body.jobs[0].since).toEqual(expect.any(String));

    const failed = await request(app.getHttpServer())
      .post(`/api/v1/browser/runs/${runId}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({ error: 'Blocked by a browser check on hiringcafe.com' })
      .expect(200);
    expect(failed.body).toMatchObject({
      status: 'FAILED',
      error: 'Blocked by a browser check on hiringcafe.com',
    });
  });

  it('expires a waiting run nobody picked up', async () => {
    const { runId } = await runs.request('WELLFOUND', boardId);
    await prisma.ingestRun.update({
      where: { id: runId },
      data: { startedAt: new Date(Date.now() - BROWSER_RUN_TIMEOUT_MS - 1000) },
    });

    const sources = await request(app.getHttpServer())
      .get('/api/v1/sources')
      .set('Cookie', cookie)
      .expect(200);
    const wellfound = sources.body.items.find(
      (item: { source: string }) => item.source === 'WELLFOUND',
    );
    expect(wellfound.kind).toBe('browser');

    const run = await prisma.ingestRun.findUniqueOrThrow({
      where: { id: runId },
    });
    expect(run.status).toBe('FAILED');
    expect(run.error).toBe('No browser connected');

    await request(app.getHttpServer())
      .post(`/api/v1/browser/runs/${runId}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [] })
      .expect(409);
  });

  it('revoking the token cuts the browser off', async () => {
    await request(app.getHttpServer())
      .delete('/api/v1/browser/token')
      .set('Cookie', cookie)
      .expect(204);
    await request(app.getHttpServer())
      .post('/api/v1/browser/poll')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
    const status = await request(app.getHttpServer())
      .get('/api/v1/browser')
      .set('Cookie', cookie)
      .expect(200);
    expect(status.body.linked).toBe(false);
  });
});
