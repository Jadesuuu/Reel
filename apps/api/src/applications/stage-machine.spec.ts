import { ALLOWED, canTransition, STAGES, type Stage } from './stage-machine.js';

describe('stage machine', () => {
  it('allows SAVED to move only to APPLIED or WITHDRAWN', () => {
    expect(ALLOWED.SAVED).toEqual(['APPLIED', 'WITHDRAWN']);
    expect(canTransition('SAVED', 'APPLIED')).toBe(true);
    expect(canTransition('SAVED', 'INTERVIEWING')).toBe(false);
    expect(canTransition('SAVED', 'OFFER')).toBe(false);
  });

  it('allows APPLIED to move to INTERVIEWING, REJECTED or WITHDRAWN', () => {
    expect(ALLOWED.APPLIED).toEqual(['INTERVIEWING', 'REJECTED', 'WITHDRAWN']);
    expect(canTransition('APPLIED', 'INTERVIEWING')).toBe(true);
    expect(canTransition('APPLIED', 'OFFER')).toBe(false);
    expect(canTransition('APPLIED', 'SAVED')).toBe(false);
  });

  it('allows INTERVIEWING to move to OFFER, REJECTED or WITHDRAWN', () => {
    expect(ALLOWED.INTERVIEWING).toEqual(['OFFER', 'REJECTED', 'WITHDRAWN']);
    expect(canTransition('INTERVIEWING', 'OFFER')).toBe(true);
    expect(canTransition('INTERVIEWING', 'APPLIED')).toBe(false);
  });

  it('allows OFFER to move only to REJECTED or WITHDRAWN', () => {
    expect(ALLOWED.OFFER).toEqual(['REJECTED', 'WITHDRAWN']);
    expect(canTransition('OFFER', 'WITHDRAWN')).toBe(true);
    expect(canTransition('OFFER', 'INTERVIEWING')).toBe(false);
  });

  it('treats REJECTED and WITHDRAWN as terminal', () => {
    expect(ALLOWED.REJECTED).toEqual([]);
    expect(ALLOWED.WITHDRAWN).toEqual([]);
    for (const stage of STAGES) {
      expect(canTransition('REJECTED', stage)).toBe(false);
      expect(canTransition('WITHDRAWN', stage)).toBe(false);
    }
  });

  it('never allows a stage to transition to itself', () => {
    for (const stage of STAGES) {
      expect(canTransition(stage, stage as Stage)).toBe(false);
    }
  });
});
