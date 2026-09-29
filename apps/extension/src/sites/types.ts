import type { BrowserSource } from '../api.js';

export type PageResult = {
  items: unknown[];
  lastPage: boolean;
  oldestMs: number | null;
};

export type Site = {
  source: BrowserSource;
  host: string;
  maxPages: number;
  sortedByDate: boolean;
  url(boardId: string, page: number): string;
  project(nextData: unknown): PageResult;
};
