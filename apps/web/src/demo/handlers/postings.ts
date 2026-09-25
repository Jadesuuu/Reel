import { mentionsRegion } from '../regions';
import type { Posting } from '../../lib/types';
import { notFound, paginate, requireSignedIn, route } from '../router';
import { getState } from '../store';

export function summaryOf(posting: Posting) {
  const { rawText: _rawText, ...rest } = posting;
  return rest;
}

route('GET', '/postings', ({ query }) => {
  const state = getState();
  requireSignedIn(state.signedIn);
  const q = (query.get('q') ?? '').trim().toLowerCase();
  const remote = query.get('remote');
  const source = query.get('source');
  const boardId = query.get('boardId');
  const stack = (query.get('stack') ?? '').trim().toLowerCase();
  const open = query.get('open') === 'true';
  const regions = open ? state.criteria.regionKeywords : [];

  const items = state.postings
    .filter(
      (posting) =>
        regions.length === 0 ||
        posting.regionTerms.length === 0 ||
        regions.some((keyword) =>
          mentionsRegion(`${posting.headline} ${posting.location ?? ''}`, keyword),
        ),
    )
    .filter((posting) => !remote || posting.remote === remote)
    .filter((posting) => !source || posting.source === source)
    .filter((posting) => !boardId || posting.boardId === boardId)
    .filter((posting) => !stack || posting.stackKeywords.includes(stack))
    .filter(
      (posting) =>
        !q ||
        posting.headline.toLowerCase().includes(q) ||
        (posting.company ?? '').toLowerCase().includes(q) ||
        (posting.role ?? '').toLowerCase().includes(q),
    )
    .toSorted((a, b) => b.postedAt.localeCompare(a.postedAt))
    .map(summaryOf);

  return paginate(items, query);
});

route('GET', '/postings/stats', () => {
  const state = getState();
  requireSignedIn(state.signedIn);
  const bySource = new Map<string, { count: number; latest: string | null }>();
  const byRemote = new Map<string, number>();
  for (const posting of state.postings) {
    const entry = bySource.get(posting.source) ?? { count: 0, latest: null };
    entry.count += 1;
    if (!entry.latest || posting.postedAt > entry.latest) entry.latest = posting.postedAt;
    bySource.set(posting.source, entry);
    byRemote.set(posting.remote, (byRemote.get(posting.remote) ?? 0) + 1);
  }
  return {
    total: state.postings.length,
    bySource: Array.from(bySource.entries())
      .map(([source, entry]) => ({ source, count: entry.count, latestPostedAt: entry.latest }))
      .toSorted((a, b) => b.count - a.count),
    byRemote: Array.from(byRemote.entries())
      .map(([remote, count]) => ({ remote, count }))
      .toSorted((a, b) => b.count - a.count),
  };
});

route('GET', '/postings/:id', ({ params }) => {
  const state = getState();
  requireSignedIn(state.signedIn);
  const posting = state.postings.find((entry) => entry.id === params.id);
  if (!posting) notFound('Posting not found');
  return posting;
});
