import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp } from './create-app.js';

const THREAD_ID = 'e2e-applications-thread';

describe('Applications (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cookie: string;
  let otherCookie: string;
  let postingId: string;

  const email = `apps-${Date.now()}@example.com`;
  const otherEmail = `apps-other-${Date.now()}@example.com`;
  const password = 'password12345';

  async function register(address: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: address, password })
      .expect(201);
    const setCookie = res.headers['set-cookie'];
    return Array.isArray(setCookie) ? setCookie[0] : String(setCookie);
  }

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    cookie = await register(email);
    otherCookie = await register(otherEmail);

    await prisma.posting.deleteMany({ where: { threadId: THREAD_ID } });
    const posting = await prisma.posting.create({
      data: {
        source: 'HN',
        externalId: `${THREAD_ID}-1`,
        threadId: THREAD_ID,
        author: 'alice',
        postedAt: new Date(),
        company: 'Northwind Labs',
        role: 'Full Stack Engineer',
        remote: 'REMOTE',
        applyUrl: 'https://northwind.example/apply',
        stackKeywords: [],
        rawHtml: '<p>x</p>',
        rawText: 'x',
        headline: 'Northwind Labs | Full Stack Engineer | Remote',
        fingerprint: `${THREAD_ID}-fp-1`,
      },
    });
    postingId = posting.id;
  });

  afterAll(async () => {
    await prisma.posting.deleteMany({ where: { threadId: THREAD_ID } });
    await prisma.user.deleteMany({
      where: { email: { in: [email, otherEmail] } },
    });
    await app.close();
  });

  it('creates from a posting and records the creation event', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/applications')
      .set('Cookie', cookie)
      .send({ postingId })
      .expect(201);

    expect(res.body.company).toBe('Northwind Labs');
    expect(res.body.role).toBe('Full Stack Engineer');
    expect(res.body.url).toBe('https://northwind.example/apply');
    expect(res.body.stage).toBe('SAVED');
    expect(res.body.events).toHaveLength(1);
    expect(res.body.events[0]).toMatchObject({
      fromStage: null,
      toStage: 'SAVED',
    });
  });

  it('rejects a manual create without company or role', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/applications')
      .set('Cookie', cookie)
      .send({ role: 'Engineer' })
      .expect(400);
  });

  it('404s when the posting does not exist', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/applications')
      .set('Cookie', cookie)
      .send({ postingId: 'does-not-exist' })
      .expect(404);
  });

  it('walks SAVED to APPLIED to INTERVIEWING to OFFER and keeps history', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/applications')
      .set('Cookie', cookie)
      .send({ company: 'Contoso', role: 'Backend Engineer' })
      .expect(201);

    const id: string = created.body.id;

    await request(app.getHttpServer())
      .post(`/api/v1/applications/${id}/stage`)
      .set('Cookie', cookie)
      .send({ to: 'INTERVIEWING' })
      .expect(400);

    for (const to of ['APPLIED', 'INTERVIEWING', 'OFFER']) {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/applications/${id}/stage`)
        .set('Cookie', cookie)
        .send({ to, note: `moved to ${to}` })
        .expect(200);
      expect(res.body.stage).toBe(to);
    }

    await request(app.getHttpServer())
      .post(`/api/v1/applications/${id}/stage`)
      .set('Cookie', cookie)
      .send({ to: 'OFFER' })
      .expect(400);

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/applications/${id}`)
      .set('Cookie', cookie)
      .expect(200);

    expect(detail.body.events).toHaveLength(4);
    expect(
      detail.body.events.map((e: { toStage: string }) => e.toStage),
    ).toEqual(['SAVED', 'APPLIED', 'INTERVIEWING', 'OFFER']);
    expect(detail.body.reminders).toEqual([]);
  });

  it('filters the list by stage', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/applications?stage=OFFER')
      .set('Cookie', cookie)
      .expect(200);

    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    for (const item of res.body.items) {
      expect(item.stage).toBe('OFFER');
    }
  });

  it('patches editable fields', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/applications')
      .set('Cookie', cookie)
      .send({ company: 'Initech', role: 'Platform Engineer' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/applications/${created.body.id}`)
      .set('Cookie', cookie)
      .send({ notes: 'referred by a friend' })
      .expect(200);

    expect(res.body.notes).toBe('referred by a friend');
    expect(res.body.company).toBe('Initech');
  });

  it("404s on another user's application", async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/applications')
      .set('Cookie', cookie)
      .send({ company: 'Private Co', role: 'Engineer' })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/v1/applications/${created.body.id}`)
      .set('Cookie', otherCookie)
      .expect(404);

    await request(app.getHttpServer())
      .post(`/api/v1/applications/${created.body.id}/stage`)
      .set('Cookie', otherCookie)
      .send({ to: 'APPLIED' })
      .expect(404);
  });

  it('deletes an application', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/applications')
      .set('Cookie', cookie)
      .send({ company: 'Temporary Co', role: 'Engineer' })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/api/v1/applications/${created.body.id}`)
      .set('Cookie', cookie)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/api/v1/applications/${created.body.id}`)
      .set('Cookie', cookie)
      .expect(404);
  });
});
