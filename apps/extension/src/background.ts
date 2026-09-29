import { complete, poll, type BrowserJob } from './api.js';
import { parseNextData } from './next-data.js';
import { loadSettings, recordStatus, type Settings } from './settings.js';
import { siteFor } from './sites/index.js';
import { closeTab, navigateTab, openTab, waitForNextData } from './tab.js';

const ALARM = 'reel-poll';
const POLL_MINUTES = 0.5;

let busy = false;

function schedule(): void {
  chrome.alarms.get(ALARM, (existing) => {
    if (!existing) {
      chrome.alarms.create(ALARM, { periodInMinutes: POLL_MINUTES });
    }
  });
}

async function runJob(settings: Settings, job: BrowserJob): Promise<void> {
  const site = siteFor(job.source);
  if (!site) {
    await complete(settings, job.runId, {
      items: [],
      pagesFetched: 0,
      error: `This extension does not know the source ${job.source}`,
    });
    return;
  }

  const sinceMs = job.since ? Date.parse(job.since) - 24 * 3_600_000 : null;
  const items: unknown[] = [];
  let pages = 0;
  let tabId: number | null = null;

  try {
    for (let page = 0; page < site.maxPages; page += 1) {
      const url = site.url(job.boardId, page);
      if (tabId === null) {
        tabId = await openTab(url);
      } else {
        await navigateTab(tabId, url);
      }
      await recordStatus('working', `Reading ${site.host} (${job.boardId}, page ${page + 1})`);
      const raw = await waitForNextData(
        tabId,
        site.host,
        () =>
          void recordStatus('working', `${site.host} wants a human check. Click it in the tab.`),
      );
      const result = site.project(parseNextData(raw));
      pages += 1;
      items.push(...result.items);
      if (result.lastPage) {
        break;
      }
      if (
        site.sortedByDate &&
        sinceMs !== null &&
        result.oldestMs !== null &&
        result.oldestMs < sinceMs
      ) {
        break;
      }
    }

    await complete(settings, job.runId, { items, pagesFetched: pages });
    await recordStatus('connected', `Sent ${items.length} jobs from ${site.host}`, {
      source: job.source,
      boardId: job.boardId,
      items: items.length,
      pages,
      error: null,
      at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await complete(settings, job.runId, { items: [], pagesFetched: pages, error: message }).catch(
      () => undefined,
    );
    await recordStatus('error', message, {
      source: job.source,
      boardId: job.boardId,
      items: 0,
      pages,
      error: message,
      at: new Date().toISOString(),
    });
  } finally {
    if (tabId !== null) {
      await closeTab(tabId);
    }
  }
}

export async function pollOnce(): Promise<{ claimed: number }> {
  const settings = await loadSettings();
  if (settings.token.length === 0) {
    await recordStatus('unlinked', 'No token yet. Paste one from Reel to start.');
    return { claimed: 0 };
  }
  if (busy) {
    return { claimed: 0 };
  }
  busy = true;
  try {
    const result = await poll(settings, navigator.userAgent);
    if (result.jobs.length === 0) {
      await recordStatus('connected', 'Connected. Nothing to fetch right now.');
    }
    for (const job of result.jobs) {
      await runJob(settings, job);
    }
    return { claimed: result.jobs.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await recordStatus('error', message);
    return { claimed: 0 };
  } finally {
    busy = false;
  }
}

chrome.runtime.onInstalled.addListener(() => {
  schedule();
  void loadSettings().then((settings) => {
    if (settings.token.length === 0) {
      void chrome.runtime.openOptionsPage();
    }
  });
});

chrome.runtime.onStartup.addListener(() => {
  schedule();
  void pollOnce();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM) {
    void pollOnce();
  }
});

chrome.action.onClicked.addListener(() => {
  void chrome.runtime.openOptionsPage();
});

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (typeof message === 'object' && message !== null && 'type' in message) {
    const type = (message as { type: unknown }).type;
    if (type === 'poll-now') {
      void pollOnce().then(sendResponse);
      return true;
    }
  }
  return false;
});

schedule();
