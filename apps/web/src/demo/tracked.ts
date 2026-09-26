import type { TrackedApplication } from '../lib/types';
import type { DemoState } from './store';

export function trackedFor(state: DemoState, postingId: string): TrackedApplication | null {
  const application = state.applications.filter((entry) => entry.postingId === postingId).at(-1);
  return application ? { id: application.id, stage: application.stage } : null;
}
