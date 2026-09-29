import type { BrowserSource } from '../api.js';
import { hiringCafe } from './hiringcafe.js';
import type { Site } from './types.js';
import { wellfound } from './wellfound.js';

export const SITES: Record<BrowserSource, Site> = {
  HIRINGCAFE: hiringCafe,
  WELLFOUND: wellfound,
};

export function siteFor(source: string): Site | null {
  return source in SITES ? SITES[source as BrowserSource] : null;
}
