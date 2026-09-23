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

export function canTransition(from: Stage, to: Stage): boolean {
  return ALLOWED[from].includes(to);
}

export const STAGE_LABEL: Record<Stage, string> = {
  SAVED: 'Saved',
  APPLIED: 'Applied',
  INTERVIEWING: 'Interviewing',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

export const STAGE_HINT: Record<Stage, string> = {
  SAVED: 'Worth pursuing, not sent yet',
  APPLIED: 'Sent, waiting to hear back',
  INTERVIEWING: 'In conversation',
  OFFER: 'They said yes',
  REJECTED: 'They said no',
  WITHDRAWN: 'You stepped away',
};

export const STAGE_TEXT: Record<Stage, string> = {
  SAVED: 'text-stage-saved',
  APPLIED: 'text-stage-applied',
  INTERVIEWING: 'text-stage-interviewing',
  OFFER: 'text-stage-offer',
  REJECTED: 'text-stage-rejected',
  WITHDRAWN: 'text-stage-withdrawn',
};

export const STAGE_BORDER: Record<Stage, string> = {
  SAVED: 'border-stage-saved/50',
  APPLIED: 'border-stage-applied/60',
  INTERVIEWING: 'border-stage-interviewing/60',
  OFFER: 'border-stage-offer/60',
  REJECTED: 'border-stage-rejected/60',
  WITHDRAWN: 'border-stage-withdrawn/50',
};

export const STAGE_BG: Record<Stage, string> = {
  SAVED: 'bg-stage-saved',
  APPLIED: 'bg-stage-applied',
  INTERVIEWING: 'bg-stage-interviewing',
  OFFER: 'bg-stage-offer',
  REJECTED: 'bg-stage-rejected',
  WITHDRAWN: 'bg-stage-withdrawn',
};

export const STAGE_VAR: Record<Stage, string> = {
  SAVED: 'var(--stage-saved)',
  APPLIED: 'var(--stage-applied)',
  INTERVIEWING: 'var(--stage-interviewing)',
  OFFER: 'var(--stage-offer)',
  REJECTED: 'var(--stage-rejected)',
  WITHDRAWN: 'var(--stage-withdrawn)',
};

export function isClosed(stage: Stage): boolean {
  return CLOSED_STAGES.includes(stage);
}
