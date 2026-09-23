import { bad, requireSignedIn, route } from '../router';
import { getState, mutate } from '../store';

function normalizeKeywords(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const cleaned = value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
  return Array.from(new Set(cleaned)).slice(0, 50);
}

route('GET', '/criteria', () => {
  const state = getState();
  requireSignedIn(state.signedIn);
  return state.criteria;
});

route('PUT', '/criteria', ({ body }) => {
  const state = getState();
  requireSignedIn(state.signedIn);
  if (typeof body.remoteOnly !== 'boolean') bad('remoteOnly must be a boolean value');
  const minSalary = body.minSalaryUsd;
  if (minSalary !== undefined && minSalary !== null && typeof minSalary !== 'number') {
    bad('minSalaryUsd must be a number');
  }
  return mutate((draft) => {
    draft.criteria = {
      ...draft.criteria,
      id: draft.criteria.id ?? 'crit_demo',
      remoteOnly: body.remoteOnly as boolean,
      roleKeywords: normalizeKeywords(body.roleKeywords),
      includeKeywords: normalizeKeywords(body.includeKeywords),
      excludeKeywords: normalizeKeywords(body.excludeKeywords),
      minSalaryUsd: typeof minSalary === 'number' ? minSalary : null,
    };
    return draft.criteria;
  });
});
