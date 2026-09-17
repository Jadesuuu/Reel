import type { Stage } from './types';

export const STAGES: Stage[] = [
  'SAVED',
  'APPLIED',
  'INTERVIEWING',
  'OFFER',
  'REJECTED',
  'WITHDRAWN',
];

export const ACTIVE_STAGES: Stage[] = ['SAVED', 'APPLIED', 'INTERVIEWING', 'OFFER'];

export const CLOSED_STAGES: Stage[] = ['REJECTED', 'WITHDRAWN'];

export const ALLOWED: Record<Stage, Stage[]> = {
  SAVED: ['APPLIED', 'WITHDRAWN'],
  APPLIED: ['INTERVIEWING', 'REJECTED', 'WITHDRAWN'],
  INTERVIEWING: ['OFFER', 'REJECTED', 'WITHDRAWN'],
  OFFER: ['REJECTED', 'WITHDRAWN'],
  REJECTED: [],
  WITHDRAWN: [],
};

export const STAGE_LABEL: Record<Stage, string> = {
  SAVED: 'Saved',
  APPLIED: 'Applied',
  INTERVIEWING: 'Interviewing',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

export const STAGE_ACCENT: Record<Stage, string> = {
  SAVED: 'text-text-300',
  APPLIED: 'text-brass-400',
  INTERVIEWING: 'text-brass-400',
  OFFER: 'text-success',
  REJECTED: 'text-danger',
  WITHDRAWN: 'text-text-500',
};
