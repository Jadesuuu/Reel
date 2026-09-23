import { SOURCES, SOURCE_META } from '../../lib/sources';
import type { IngestRun, Source } from '../../lib/types';
import { bad, paginate, requireSignedIn, route } from '../router';
import { demoNow, getState, mutate, nextId } from '../store';
import { rescore } from './matches';

const FEED_DEFAULT: Partial<Record<Source, string>> = {
  HN: '49501234',
  REMOTIVE: 'software-dev',
  REMOTEOK: 'all',
  ARBEITNOW: 'all',
  HIMALAYAS: 'all',
  JOBICY: 'developer',
  WEWORKREMOTELY: 'remote-programming-jobs',
};

function stamp(): string {
  return demoNow().toISOString().slice(0, 16).replace(/[-:T]/g, '');
}

function targets(state = getState()): Array<{ source: Source; boardId: string }> {
  const list: Array<{ source: Source; boardId: string }> = [];
  for (const source of SOURCES) {
    if (!(state.sourceSettings[source] ?? true)) continue;
    if (SOURCE_META[source].kind === 'feed') {
      list.push({ source, boardId: FEED_DEFAULT[source] ?? 'all' });
    } else {
      for (const board of state.boards) {
        if (board.provider === source) list.push({ source, boardId: board.slug });
      }
    }
  }
  return list;
}

function startRun(source: Source, boardId: string): IngestRun {
  const run: IngestRun = {
    id: nextId('run'),
    source,
    boardId,
    status: 'RUNNING',
    startedAt: demoNow().toISOString(),
    finishedAt: null,
    itemsSeen: 0,
    postingsCreated: 0,
    postingsUpdated: 0,
    error: null,
  };
  mutate((draft) => {
    draft.runs.unshift(run);
    draft.runs = draft.runs.slice(0, 200);
  });
  return run;
}

function finishRun(runId: string): void {
  mutate((draft) => {
    const run = draft.runs.find((entry) => entry.id === runId);
    if (!run) return;
    const released = draft.reserve.filter(
      (posting) => posting.source === run.source && posting.boardId === run.boardId,
    );
    const nowIso = demoNow().toISOString();
    for (const posting of released) {
      draft.postings.unshift({
        ...posting,
        postedAt: nowIso,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    }
    draft.reserve = draft.reserve.filter((posting) => !released.includes(posting));
    const existing = draft.postings.filter(
      (posting) => posting.source === run.source && posting.boardId === run.boardId,
    ).length;
    run.status = 'SUCCEEDED';
    run.finishedAt = nowIso;
    run.itemsSeen = existing;
    run.postingsCreated = released.length;
    run.postingsUpdated = existing - released.length;
  });
  rescore();
}

function schedule(run: IngestRun, delay: number): void {
  if (typeof window === 'undefined') return;
  window.setTimeout(() => finishRun(run.id), delay);
}

route('POST', '/ingest/run', ({ body }) => {
  requireSignedIn(getState().signedIn);
  const source = body.source as Source | undefined;
  if (source !== undefined && !SOURCES.includes(source))
    bad('source must be one of the known sources');
  const boardId =
    typeof body.boardId === 'string' && body.boardId.trim() ? body.boardId.trim() : undefined;

  if (source) {
    const run = startRun(source, boardId ?? FEED_DEFAULT[source] ?? 'latest');
    schedule(run, 1400 + Math.random() * 1200);
    return { jobId: `manual-${source}-${boardId ?? 'latest'}-${stamp()}` };
  }

  targets().forEach((target, index) => {
    const run = startRun(target.source, target.boardId);
    schedule(run, 1200 + index * 700 + Math.random() * 600);
  });
  return { jobId: `manual-all-${stamp()}` };
});

route('GET', '/ingest/runs', ({ query }) => {
  requireSignedIn(getState().signedIn);
  const source = query.get('source');
  const runs = getState().runs.filter((run) => !source || run.source === source);
  return paginate(runs, query);
});
