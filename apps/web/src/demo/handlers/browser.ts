import type { BrowserStatus, BrowserToken } from '../../lib/types';
import { requireSignedIn, route } from '../router';
import { demoNow, getState, mutate } from '../store';

export const DEMO_USER_AGENT = 'Chrome 143 on Windows (demo)';

function randomToken(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = 'reel_';
  for (let index = 0; index < 32; index += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export function browserStatus(): BrowserStatus {
  const { browser } = getState();
  return {
    linked: browser.linked,
    connected: browser.linked,
    createdAt: browser.createdAt,
    lastSeenAt: browser.linked ? new Date(demoNow().getTime() - 12_000).toISOString() : null,
    userAgent: browser.linked ? DEMO_USER_AGENT : null,
  };
}

route('GET', '/browser', () => {
  requireSignedIn(getState().signedIn);
  return browserStatus();
});

route('POST', '/browser/token', (): BrowserToken => {
  requireSignedIn(getState().signedIn);
  const createdAt = demoNow().toISOString();
  mutate((draft) => {
    draft.browser = { linked: true, createdAt };
  });
  return { token: randomToken(), createdAt };
});

route('DELETE', '/browser/token', () => {
  requireSignedIn(getState().signedIn);
  mutate((draft) => {
    draft.browser = { linked: false, createdAt: null };
  });
  return undefined;
});
