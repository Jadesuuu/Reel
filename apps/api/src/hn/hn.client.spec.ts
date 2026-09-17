import { HnClient, HnThreadNotFoundError } from './hn.client.js';
import type { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.schema.js';

function makeClient() {
  const config = {
    getOrThrow: (key: keyof Env) =>
      key === 'HN_ALGOLIA_BASE'
        ? 'https://algolia.test/api/v1'
        : 'https://firebase.test/v0',
  } as unknown as ConfigService<Env, true>;
  return new HnClient(config);
}

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: () => Promise.resolve(body) } as Response;
}

describe('HnClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('picks the "Who is hiring" hit and skips other whoishiring threads', async () => {
    const client = makeClient();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        hits: [
          {
            objectID: '1',
            title: 'Ask HN: Who wants to be hired?',
            created_at: '2026-09-01',
          },
          {
            objectID: '2',
            title: 'Ask HN: Who is hiring? (September 2026)',
            created_at: '2026-09-02',
          },
        ],
      }),
    );
    const thread = await client.findLatestWhoIsHiringThread();
    expect(thread.id).toBe('2');
  });

  it('throws when no hiring thread matches', async () => {
    const client = makeClient();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        hits: [
          {
            objectID: '1',
            title: 'Freelancer? Seeking freelancer?',
            created_at: 'x',
          },
        ],
      }),
    );
    await expect(client.findLatestWhoIsHiringThread()).rejects.toBeInstanceOf(
      HnThreadNotFoundError,
    );
  });

  it('drops deleted, dead, and text-less comments', async () => {
    const client = makeClient();
    const story = { id: 10, type: 'story', time: 0, kids: [11, 12, 13, 14] };
    const items: Record<number, unknown> = {
      11: { id: 11, type: 'comment', time: 1, text: 'Real job' },
      12: { id: 12, type: 'comment', time: 1, deleted: true },
      13: { id: 13, type: 'comment', time: 1, dead: true, text: 'spam' },
      14: { id: 14, type: 'comment', time: 1 },
    };
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      (input: string | URL | Request) => {
        const url = String(input);
        if (url.includes('/item/10.json'))
          return Promise.resolve(jsonResponse(story));
        const id = Number(url.match(/item\/(\d+)\.json/)?.[1]);
        return Promise.resolve(jsonResponse(items[id] ?? null));
      },
    );
    const comments = await client.fetchTopLevelComments('10');
    expect(comments.map((c) => c.id)).toEqual([11]);
  });

  it('skips a single failing item without failing the whole fetch', async () => {
    const client = makeClient();
    const story = { id: 20, type: 'story', time: 0, kids: [21, 22] };
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      (input: string | URL | Request) => {
        const url = String(input);
        if (url.includes('/item/20.json'))
          return Promise.resolve(jsonResponse(story));
        if (url.includes('/item/21.json'))
          return Promise.reject(new Error('network'));
        return Promise.resolve(
          jsonResponse({ id: 22, type: 'comment', time: 1, text: 'ok' }),
        );
      },
    );
    const comments = await client.fetchTopLevelComments('20');
    expect(comments.map((c) => c.id)).toEqual([22]);
  });
});
