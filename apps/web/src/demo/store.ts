import { setClockOffset } from '../lib/clock';
import type {
  Application,
  Criteria,
  IngestRun,
  Match,
  Posting,
  Reminder,
  Source,
  StageEvent,
  User,
  WatchedBoard,
} from '../lib/types';
import { buildSeed } from './seed';

export const STORAGE_KEY = 'reel-demo:v1';
export const DEMO_EMAIL = 'you@reel.demo';
export const DEMO_PASSWORD = 'demo-password';

export type DemoMail = {
  id: string;
  to: string;
  subject: string;
  text: string;
  sentAt: string;
};

export type StoredMatch = Omit<Match, 'posting' | 'application'>;

export type DemoState = {
  version: number;
  signedIn: boolean;
  user: User & { timezone: string; createdAt: string };
  criteria: Criteria;
  postings: Posting[];
  reserve: Posting[];
  matches: StoredMatch[];
  applications: Application[];
  events: StageEvent[];
  reminders: Reminder[];
  runs: IngestRun[];
  sourceSettings: Record<Source, boolean>;
  boards: WatchedBoard[];
  clockOffsetMs: number;
  mail: DemoMail[];
  counter: number;
};

let state: DemoState | null = null;

function canStore(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function persist(): void {
  if (!state || !canStore()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    return;
  }
}

export function getState(): DemoState {
  if (state) return state;
  if (canStore()) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DemoState;
        const complete =
          Array.isArray(parsed.criteria?.regionKeywords) &&
          parsed.postings?.every((posting) => Array.isArray(posting.regionTerms));
        if (parsed.version === 1 && complete) {
          state = parsed;
          setClockOffset(parsed.clockOffsetMs);
          return state;
        }
      }
    } catch {
      state = null;
    }
  }
  state = buildSeed(new Date());
  setClockOffset(0);
  persist();
  return state;
}

export function mutate<T>(fn: (draft: DemoState) => T): T {
  const current = getState();
  const result = fn(current);
  persist();
  return result;
}

export function resetState(): DemoState {
  state = buildSeed(new Date());
  setClockOffset(0);
  persist();
  return state;
}

export function demoNow(): Date {
  return new Date(Date.now() + getState().clockOffsetMs);
}

export function nextId(prefix: string): string {
  return mutate((draft) => {
    draft.counter += 1;
    return `${prefix}_${draft.counter.toString(36).padStart(4, '0')}`;
  });
}

export function advanceClock(ms: number): void {
  mutate((draft) => {
    draft.clockOffsetMs += ms;
    setClockOffset(draft.clockOffsetMs);
  });
}
