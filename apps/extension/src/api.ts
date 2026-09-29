import type { Settings } from './settings.js';

export type BrowserSource = 'HIRINGCAFE' | 'WELLFOUND';

export type BrowserJob = {
  runId: string;
  source: BrowserSource;
  boardId: string;
  since: string | null;
};

export type FreshMatches = {
  count: number;
  since: string;
  top: Array<{ company: string | null; role: string | null; score: number }>;
};

export type PollResult = {
  jobs: BrowserJob[];
  fresh?: FreshMatches;
  pollIntervalMs: number;
};

export type CompletePayload = {
  items: unknown[];
  pagesFetched: number;
  error?: string;
};

export class ReelApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ReelApiError';
    this.status = status;
  }
}

function messageFrom(body: unknown, fallback: string): string {
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const value = (body as { message: unknown }).message;
    if (typeof value === 'string') {
      return value;
    }
  }
  return fallback;
}

async function post<T>(settings: Settings, path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${settings.apiUrl}${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${settings.token}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new ReelApiError(0, `Could not reach Reel at ${settings.apiUrl}: ${String(err)}`);
  }

  const raw = await response.text();
  let parsed: unknown = null;
  try {
    parsed = raw.length > 0 ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }
  if (!response.ok) {
    throw new ReelApiError(
      response.status,
      messageFrom(parsed, `Reel answered ${response.status}`),
    );
  }
  return parsed as T;
}

export function poll(settings: Settings, userAgent: string): Promise<PollResult> {
  return post<PollResult>(settings, '/browser/poll', { userAgent });
}

export function complete(
  settings: Settings,
  runId: string,
  payload: CompletePayload,
): Promise<unknown> {
  return post(settings, `/browser/runs/${encodeURIComponent(runId)}/complete`, payload);
}
