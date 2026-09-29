export type NextData = { props?: { pageProps?: Record<string, unknown> } };

export function parseNextData(text: string | null): NextData | null {
  if (!text) {
    return null;
  }
  try {
    const parsed = JSON.parse(text) as unknown;
    return typeof parsed === 'object' && parsed !== null ? (parsed as NextData) : null;
  } catch {
    return null;
  }
}

export function pageProps(data: unknown): Record<string, unknown> {
  const props = (data as NextData | null)?.props?.pageProps;
  return typeof props === 'object' && props !== null ? props : {};
}

export function pick<T extends object>(
  source: unknown,
  keys: readonly string[],
): Partial<T> | null {
  if (typeof source !== 'object' || source === null) {
    return null;
  }
  const record = source as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    if (record[key] !== undefined) {
      out[key] = record[key];
    }
  }
  return out as Partial<T>;
}
