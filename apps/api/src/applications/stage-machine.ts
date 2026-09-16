export const STAGES = [
  'SAVED',
  'APPLIED',
  'INTERVIEWING',
  'OFFER',
  'REJECTED',
  'WITHDRAWN',
] as const;

export type Stage = (typeof STAGES)[number];

export const ALLOWED: Record<Stage, Stage[]> = {
  SAVED: ['APPLIED', 'WITHDRAWN'],
  APPLIED: ['INTERVIEWING', 'REJECTED', 'WITHDRAWN'],
  INTERVIEWING: ['OFFER', 'REJECTED', 'WITHDRAWN'],
  OFFER: ['REJECTED', 'WITHDRAWN'],
  REJECTED: [],
  WITHDRAWN: [],
};

export function canTransition(from: Stage, to: Stage): boolean {
  return ALLOWED[from].includes(to);
}
