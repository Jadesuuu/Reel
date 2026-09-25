import { ApiError } from '../../lib/api';
import { BOARD_PROVIDERS, SOURCES, SOURCE_META, slugFromBoardInput } from '../../lib/sources';
import type { BoardProvider, Source, SourceInfo } from '../../lib/types';
import { bad, notFound, requireSignedIn, route, text } from '../router';
import { demoNow, getState, mutate, nextId } from '../store';

const DEFAULT_BOARD: Record<Source, string | null> = {
  HN: null,
  REMOTIVE: 'software-dev',
  REMOTEOK: 'all',
  ARBEITNOW: 'all',
  HIMALAYAS: 'all',
  JOBICY: 'developer',
  WEWORKREMOTELY: 'remote-programming-jobs',
  GREENHOUSE: null,
  LEVER: null,
  ASHBY: null,
  WORKINGNOMADS: 'development',
  LANDINGJOBS: 'all',
  THEMUSE: 'software-engineering',
  JOBSPRESSO: 'all',
  WORKABLE: null,
  SMARTRECRUITERS: null,
};

export function sourceInfo(source: Source): SourceInfo {
  const state = getState();
  const meta = SOURCE_META[source];
  const lastRun = state.runs.find((run) => run.source === source) ?? null;
  return {
    source,
    label: meta.label,
    kind: meta.kind,
    homepage: meta.homepage,
    attribution: meta.attribution,
    defaultBoardId: DEFAULT_BOARD[source],
    enabled: state.sourceSettings[source] ?? true,
    postings: state.postings.filter((posting) => posting.source === source).length,
    lastRun,
  };
}

route('GET', '/sources', () => {
  requireSignedIn(getState().signedIn);
  return { items: SOURCES.map(sourceInfo) };
});

route('PATCH', '/sources/:source', ({ params, body }) => {
  requireSignedIn(getState().signedIn);
  const source = params.source?.toUpperCase() as Source;
  if (!SOURCES.includes(source)) notFound('Unknown source');
  if (typeof body.enabled !== 'boolean') bad('enabled must be a boolean value');
  mutate((draft) => {
    draft.sourceSettings[source] = body.enabled as boolean;
  });
  return sourceInfo(source);
});

route('GET', '/sources/boards', () => {
  requireSignedIn(getState().signedIn);
  return { items: getState().boards };
});

const KNOWN_BOARDS: Record<string, string> = {
  stripe: 'Stripe',
  northwindlabs: 'Northwind Labs',
  umbrellarobotics: 'Umbrella Robotics',
  vandelay: 'Vandelay Systems',
  leverdemo: 'Leverdemo',
  ashby: 'Ashby',
  notion: 'Notion',
  ramp: 'Ramp',
  linear: 'Linear',
  vercel: 'Vercel',
};

route('POST', '/sources/boards', ({ body }) => {
  requireSignedIn(getState().signedIn);
  const provider = body.provider as BoardProvider;
  if (!BOARD_PROVIDERS.includes(provider))
    bad(`provider must be one of ${BOARD_PROVIDERS.join(', ')}`);
  const raw = text(body.slug, 80);
  if (!raw) bad('slug must be the board identifier from the board URL');
  const slug = slugFromBoardInput(provider, raw);
  if (!/^[a-z0-9][a-z0-9._-]{0,80}$/.test(slug))
    bad('slug must be the board identifier from the board URL');
  if (getState().boards.some((board) => board.provider === provider && board.slug === slug)) {
    throw new ApiError(409, 'That board is already watched');
  }
  if (!(slug in KNOWN_BOARDS) && slug.length < 4) bad('Board not found');
  const company =
    KNOWN_BOARDS[slug] ??
    slug
      .split(/[-_.]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  return mutate((draft) => {
    const board = { id: nextId('b'), provider, slug, company, createdAt: demoNow().toISOString() };
    draft.boards.push(board);
    return board;
  });
});

route('DELETE', '/sources/boards/:id', ({ params }) => {
  requireSignedIn(getState().signedIn);
  const removed = mutate((draft) => {
    const before = draft.boards.length;
    draft.boards = draft.boards.filter((board) => board.id !== params.id);
    return before !== draft.boards.length;
  });
  if (!removed) notFound('Board not found');
  return undefined;
});
