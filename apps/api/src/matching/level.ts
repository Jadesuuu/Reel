export const LEVELS = ['intern', 'junior', 'mid', 'senior', 'lead'] as const;

export type Level = (typeof LEVELS)[number];

const RULES: ReadonlyArray<readonly [Level, RegExp]> = [
  [
    'intern',
    /\b(intern|interns|internship|trainee|apprentice|apprenticeship|working student|co-op|coop)\b/i,
  ],
  [
    'lead',
    /\b(staff|principal|distinguished|fellow|architect|lead|leads|head|director|manager|managing|vp|vice president|chief|cto|ceo|coo|cio|founding)\b/i,
  ],
  ['senior', /\b(senior|sr\.?|iii|iv)\b/i],
  [
    'junior',
    /\b(junior|jr\.?|entry[- ]level|entry|graduate|new grad|grad|associate|early[- ]career)\b/i,
  ],
  ['mid', /\b(mid|mid[- ]level|intermediate|ii)\b/i],
];

export function detectLevel(
  headline: string,
  role: string | null,
): Level | null {
  const basis =
    role && role.trim().length > 0
      ? role
      : (headline.split('|')[1] ?? headline);
  for (const [level, pattern] of RULES) {
    if (pattern.test(basis)) {
      return level;
    }
  }
  return null;
}

export function isLevel(value: string): value is Level {
  return (LEVELS as readonly string[]).includes(value);
}
