const CHALLENGE_TITLES = [
  /just a moment/i,
  /verify you are human/i,
  /security verification/i,
  /additional verification/i,
  /access denied/i,
  /attention required/i,
];

export const LOAD_TIMEOUT_MS = 45_000;
export const CHALLENGE_TIMEOUT_MS = 150_000;
const CHALLENGE_GRACE_MS = 8_000;

type PageRead = { nextData: string | null; title: string };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function openTab(url: string): Promise<number> {
  const tab = await chrome.tabs.create({ url, active: false });
  if (tab.id === undefined) {
    throw new Error('Chrome did not return a tab id');
  }
  return tab.id;
}

export async function navigateTab(tabId: number, url: string): Promise<void> {
  await chrome.tabs.update(tabId, { url });
}

export async function closeTab(tabId: number): Promise<void> {
  try {
    await chrome.tabs.remove(tabId);
  } catch {
    return;
  }
}

async function readPage(tabId: number): Promise<PageRead | null> {
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => ({
        nextData: document.getElementById('__NEXT_DATA__')?.textContent ?? null,
        title: document.title,
      }),
    });
    return (result?.result as PageRead | undefined) ?? null;
  } catch {
    return null;
  }
}

export function looksLikeChallenge(title: string): boolean {
  return CHALLENGE_TITLES.some((pattern) => pattern.test(title));
}

export async function waitForNextData(
  tabId: number,
  host: string,
  onChallenge?: () => void,
): Promise<string> {
  const started = Date.now();
  let surfaced = false;

  for (;;) {
    const tab = await chrome.tabs.get(tabId);
    if (tab.status === 'complete') {
      const page = await readPage(tabId);
      if (page?.nextData) {
        return page.nextData;
      }
      const elapsed = Date.now() - started;
      if (page && looksLikeChallenge(page.title) && !surfaced && elapsed > CHALLENGE_GRACE_MS) {
        surfaced = true;
        await chrome.tabs.update(tabId, { active: true });
        if (tab.windowId !== undefined) {
          await chrome.windows.update(tab.windowId, { focused: true });
        }
        onChallenge?.();
      }
    }

    const limit = surfaced ? CHALLENGE_TIMEOUT_MS : LOAD_TIMEOUT_MS;
    if (Date.now() - started > limit) {
      throw new Error(
        surfaced
          ? `Blocked by a browser check on ${host}. Open the site once, pass the check, and run again.`
          : `Timed out loading ${host}`,
      );
    }
    await sleep(1000);
  }
}
