import { detectLevel, isLevel, LEVELS } from './level.js';

describe('detectLevel', () => {
  it('reads the role title first', () => {
    expect(detectLevel('Acme | x | Remote', 'Senior Software Engineer')).toBe(
      'senior',
    );
    expect(detectLevel('Acme | x | Remote', 'Software Engineer II')).toBe(
      'mid',
    );
    expect(detectLevel('Acme | x | Remote', 'Junior Developer')).toBe('junior');
    expect(detectLevel('Acme | x | Remote', 'Engineering Intern')).toBe(
      'intern',
    );
    expect(detectLevel('Acme | x | Remote', 'Staff Engineer')).toBe('lead');
  });

  it('falls back to the second headline segment', () => {
    expect(detectLevel('Acme | Sr. Backend Engineer | Remote', null)).toBe(
      'senior',
    );
    expect(detectLevel('Acme | Backend Engineer | Remote', null)).toBeNull();
  });

  it('ranks leadership above senior and intern above everything', () => {
    expect(detectLevel('', 'Senior Staff Engineer')).toBe('lead');
    expect(detectLevel('', 'Engineering Manager')).toBe('lead');
    expect(detectLevel('', 'Head of Engineering')).toBe('lead');
    expect(detectLevel('', 'Principal Architect')).toBe('lead');
    expect(detectLevel('', 'Senior Engineering Intern')).toBe('intern');
  });

  it('does not read levels out of unrelated words', () => {
    expect(detectLevel('', 'Headless CMS Developer')).toBeNull();
    expect(detectLevel('', 'Software Engineer (Frontend)')).toBeNull();
    expect(detectLevel('', 'Associate Software Engineer')).toBe('junior');
    expect(detectLevel('', 'Full Stack Engineer III')).toBe('senior');
  });
});

describe('isLevel', () => {
  it('accepts only the five levels', () => {
    for (const level of LEVELS) {
      expect(isLevel(level)).toBe(true);
    }
    expect(isLevel('expert')).toBe(false);
  });
});
