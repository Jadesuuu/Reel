import { MATCH_THRESHOLD, score } from '../scoring';
import { bad, notFound, paginate, requireSignedIn, route } from '../router';
import { demoNow, getState, mutate } from '../store';
import { trackedFor } from '../tracked';
import { summaryOf } from './postings';

export function rescore(): number {
  return mutate((draft) => {
    const since = demoNow().getTime() - 45 * 86_400_000;
    let written = 0;
    const kept = new Set<string>();
    for (const posting of draft.postings) {
      if (new Date(posting.postedAt).getTime() < since) continue;
      const result = score(posting, draft.criteria, demoNow());
      const existing = draft.matches.find((match) => match.postingId === posting.id);
      if (result.score >= MATCH_THRESHOLD) {
        if (existing) {
          existing.score = result.score;
          existing.reasons = result.reasons;
        } else {
          draft.matches.push({
            id: `m_${posting.id}`,
            userId: draft.user.id,
            postingId: posting.id,
            score: result.score,
            reasons: result.reasons,
            dismissed: false,
            createdAt: demoNow().toISOString(),
          });
        }
        kept.add(posting.id);
        written += 1;
      }
    }
    draft.matches = draft.matches.filter((match) => kept.has(match.postingId));
    return written;
  });
}

route('GET', '/matches', ({ query }) => {
  const state = getState();
  requireSignedIn(state.signedIn);
  const dismissed = query.get('dismissed') === 'true';
  const source = query.get('source');
  const minScore = Number(query.get('minScore') ?? '0') || 0;
  const days = Number(query.get('days') ?? '0') || 0;
  const sort = query.get('sort') ?? 'best';
  if (sort !== 'best' && sort !== 'newest') bad('sort must be best or newest');
  const since = days > 0 ? demoNow().getTime() - days * 86_400_000 : null;

  const items = state.matches
    .filter((match) => match.dismissed === dismissed && match.score >= minScore)
    .map((match) => ({
      match,
      posting: state.postings.find((entry) => entry.id === match.postingId),
    }))
    .filter((pair) => pair.posting !== undefined && (!source || pair.posting.source === source))
    .filter((pair) => since === null || new Date(pair.posting!.postedAt).getTime() >= since)
    .toSorted((a, b) =>
      sort === 'newest'
        ? b.posting!.postedAt.localeCompare(a.posting!.postedAt) || b.match.score - a.match.score
        : b.match.score - a.match.score || b.posting!.postedAt.localeCompare(a.posting!.postedAt),
    )
    .map(({ match, posting }) => ({
      ...match,
      posting: summaryOf(posting!),
      application: trackedFor(state, match.postingId),
    }));

  return paginate(items, query);
});

route('POST', '/matches/seen', () => {
  requireSignedIn(getState().signedIn);
  const seenAt = demoNow().toISOString();
  mutate((draft) => {
    draft.matchesSeenAt = seenAt;
  });
  return { seenAt };
});

route('POST', '/matches/rescore', () => {
  requireSignedIn(getState().signedIn);
  return { rescored: rescore() };
});

route('POST', '/matches/:id/dismiss', ({ params }) => {
  const state = getState();
  requireSignedIn(state.signedIn);
  const found = mutate((draft) => {
    const match = draft.matches.find((entry) => entry.id === params.id);
    if (!match) return null;
    match.dismissed = true;
    return match;
  });
  if (!found) notFound('Match not found');
  return found;
});
