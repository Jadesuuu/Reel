import type { BrowserSource, RawPosting } from '../source.types.js';
import { mapHiringCafe } from './hiringcafe.mapper.js';
import { mapWellfound } from './wellfound.mapper.js';

export function mapBrowserItems(
  source: BrowserSource,
  boardId: string,
  items: unknown,
): RawPosting[] {
  switch (source) {
    case 'HIRINGCAFE':
      return mapHiringCafe(items, boardId);
    case 'WELLFOUND':
      return mapWellfound(items, boardId);
  }
}
