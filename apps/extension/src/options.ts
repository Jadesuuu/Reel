import {
  isLocalOrigin,
  loadSettings,
  loadStatus,
  normalizeApiUrl,
  originOf,
  saveSettings,
  type Status,
} from './settings.js';

function element<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) {
    throw new Error(`Missing element #${id}`);
  }
  return node as T;
}

const form = element<HTMLFormElement>('form');
const apiUrlInput = element<HTMLInputElement>('api-url');
const tokenInput = element<HTMLInputElement>('token');
const saveButton = element<HTMLButtonElement>('save');
const checkButton = element<HTMLButtonElement>('check');
const savedNote = element<HTMLSpanElement>('saved');
const dot = element<HTMLSpanElement>('dot');
const headline = element<HTMLSpanElement>('headline');
const detail = element<HTMLParagraphElement>('detail');
const lastRun = element<HTMLParagraphElement>('last-run');

function relative(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return hours < 48 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
}

function render(status: Status | null): void {
  dot.className = `dot ${status?.state ?? ''}`;
  if (!status) {
    headline.textContent = 'Not set up yet';
    detail.textContent = 'Save an address and a token to start.';
    lastRun.textContent = '';
    return;
  }
  const titles: Record<Status['state'], string> = {
    unlinked: 'Not linked',
    connected: 'Connected to Reel',
    working: 'Working',
    error: 'Problem',
  };
  headline.textContent = titles[status.state];
  detail.textContent = `${status.message} (${relative(status.at)})`;
  if (status.lastRun) {
    const run = status.lastRun;
    lastRun.textContent = run.error
      ? `Last run: ${run.source} ${run.boardId} failed ${relative(run.at)}: ${run.error}`
      : `Last run: ${run.source} ${run.boardId}, ${run.items} jobs from ${run.pages} page${run.pages === 1 ? '' : 's'}, ${relative(run.at)}`;
  } else {
    lastRun.textContent = '';
  }
}

async function ensureHostPermission(apiUrl: string): Promise<boolean> {
  const origin = originOf(apiUrl);
  if (!origin || isLocalOrigin(origin)) {
    return true;
  }
  const pattern = `${origin}/*`;
  if (await chrome.permissions.contains({ origins: [pattern] })) {
    return true;
  }
  return chrome.permissions.request({ origins: [pattern] });
}

async function pollNow(): Promise<void> {
  checkButton.disabled = true;
  try {
    await chrome.runtime.sendMessage({ type: 'poll-now' });
  } finally {
    checkButton.disabled = false;
    render(await loadStatus());
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  void (async () => {
    saveButton.disabled = true;
    try {
      const apiUrl = normalizeApiUrl(apiUrlInput.value);
      const allowed = await ensureHostPermission(apiUrl);
      if (!allowed) {
        savedNote.textContent = 'Chrome needs permission for that address.';
        return;
      }
      await saveSettings({ apiUrl, token: tokenInput.value });
      apiUrlInput.value = apiUrl;
      savedNote.textContent = 'Saved.';
      await pollNow();
    } finally {
      saveButton.disabled = false;
    }
  })();
});

checkButton.addEventListener('click', () => {
  void pollNow();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.status) {
    render((changes.status.newValue as Status | undefined) ?? null);
  }
});

void (async () => {
  const settings = await loadSettings();
  apiUrlInput.value = settings.apiUrl;
  tokenInput.value = settings.token;
  render(await loadStatus());
})();
