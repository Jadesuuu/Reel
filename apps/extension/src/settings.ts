export const DEFAULT_API_URL = 'http://localhost:4000/api/v1';

export type Settings = { apiUrl: string; token: string };

export type LastRun = {
  source: string;
  boardId: string;
  items: number;
  pages: number;
  error: string | null;
  at: string;
};

export type Status = {
  state: 'unlinked' | 'connected' | 'working' | 'error';
  message: string;
  at: string;
  lastRun: LastRun | null;
};

export function normalizeApiUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (trimmed.length === 0) {
    return DEFAULT_API_URL;
  }
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  return /\/api\/v1$/i.test(withScheme) ? withScheme : `${withScheme}/api/v1`;
}

export function originOf(apiUrl: string): string | null {
  try {
    return new URL(apiUrl).origin;
  } catch {
    return null;
  }
}

export function isLocalOrigin(origin: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(origin);
}

export async function loadSettings(): Promise<Settings> {
  const stored = await chrome.storage.local.get(['apiUrl', 'token']);
  return {
    apiUrl: normalizeApiUrl(typeof stored.apiUrl === 'string' ? stored.apiUrl : ''),
    token: typeof stored.token === 'string' ? stored.token.trim() : '',
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({
    apiUrl: normalizeApiUrl(settings.apiUrl),
    token: settings.token.trim(),
  });
}

export async function loadStatus(): Promise<Status | null> {
  const stored = await chrome.storage.local.get('status');
  return (stored.status as Status | undefined) ?? null;
}

export async function recordStatus(
  state: Status['state'],
  message: string,
  lastRun?: LastRun | null,
): Promise<void> {
  const previous = await loadStatus();
  const status: Status = {
    state,
    message,
    at: new Date().toISOString(),
    lastRun: lastRun === undefined ? (previous?.lastRun ?? null) : lastRun,
  };
  await chrome.storage.local.set({ status });
}
