import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp } from './create-app.js';

describe('Hardening (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const email = `hardening-${Date.now()}@example.com`;
  const password = 'password12345';

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password })
      .expect(201);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('sets security headers from helmet', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('rate limits repeated login attempts', async () => {
    const statuses: number[] = [];

    for (let attempt = 0; attempt < 11; attempt += 1) {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: 'wrong-password-entirely' });
      statuses.push(res.status);
    }

    expect(statuses.slice(0, 10).every((status) => status === 401)).toBe(true);
    expect(statuses[10]).toBe(429);
  });
});
