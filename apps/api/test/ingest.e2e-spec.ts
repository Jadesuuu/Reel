import type { INestApplication } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { INGEST_QUEUE } from '../src/ingest/ingest.constants.js';
import { createTestApp } from './create-app.js';

describe('Ingest (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let queue: Queue;
  let cookie: string;

  const email = `ingest-${Date.now()}@example.com`;
  const password = 'password12345';

  beforeAll(async () => {
    app = await createTestApp();

    prisma = app.get(PrismaService);
    queue = app.get<Queue>(getQueueToken(INGEST_QUEUE));

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password })
      .expect(201);

    const setCookie = res.headers['set-cookie'];
    cookie = Array.isArray(setCookie) ? setCookie[0] : String(setCookie);
  });

  afterAll(async () => {
    await prisma.ingestRun.deleteMany({ where: { externalThreadId: '1' } });
    await prisma.user.deleteMany({ where: { email } });
    await queue.obliterate({ force: true });
    await app.close();
  });

  it('rejects an unauthenticated run', async () => {
    await request(app.getHttpServer()).post('/api/v1/ingest/run').expect(401);
  });

  it('POST /ingest/run accepts and returns a jobId', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/ingest/run')
      .set('Cookie', cookie)
      .send({ threadId: '1' })
      .expect(202);

    expect(res.body.jobId).toEqual(expect.any(String));
    expect(res.body.jobId.length).toBeGreaterThan(0);
  });

  it('GET /ingest/runs returns a paginated shape', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/ingest/runs?page=1&pageSize=5')
      .set('Cookie', cookie)
      .expect(200);

    expect(res.body).toMatchObject({ page: 1, pageSize: 5 });
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(typeof res.body.total).toBe('number');
  });
});
