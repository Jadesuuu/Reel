export const USER_AGENT = 'Reel/1.0 (+https://github.com/Jadesuuu/reel)';

export const FETCH_TIMEOUT_MS = 15_000;

export class HttpError extends Error {
  readonly status: number;
  readonly url: string;

  constructor(status: number, url: string) {
    super(`Request failed ${status}: ${url}`);
    this.name = 'HttpError';
    this.status = status;
    this.url = url;
  }
}

async function request(
  url: string,
  accept: string,
  timeoutMs: number,
): Promise<Response> {
  const response = await fetch(url, {
    headers: { Accept: accept, 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    throw new HttpError(response.status, url);
  }
  return response;
}

export async function fetchJson<T>(
  url: string,
  options: { timeoutMs?: number } = {},
): Promise<T> {
  const response = await request(
    url,
    'application/json',
    options.timeoutMs ?? FETCH_TIMEOUT_MS,
  );
  return (await response.json()) as T;
}

export async function fetchText(
  url: string,
  options: { timeoutMs?: number } = {},
): Promise<string> {
  const response = await request(
    url,
    'application/rss+xml, application/xml, text/xml, */*',
    options.timeoutMs ?? FETCH_TIMEOUT_MS,
  );
  return response.text();
}

export async function postJson<T>(
  url: string,
  body: unknown,
  options: { timeoutMs?: number } = {},
): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(options.timeoutMs ?? FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new HttpError(response.status, url);
  }
  return (await response.json()) as T;
}

export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array<R>(items.length);
  let next = 0;
  async function run(): Promise<void> {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index] as T);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => run()),
  );
  return results;
}

export function isNotFound(error: unknown): boolean {
  return error instanceof HttpError && error.status === 404;
}
