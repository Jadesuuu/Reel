import { normalizeKeywords } from './normalize.js';

describe('normalizeKeywords', () => {
  it('lowercases and trims', () => {
    expect(normalizeKeywords(['  React ', 'NODE'])).toEqual(['react', 'node']);
  });

  it('drops empty and whitespace-only entries', () => {
    expect(normalizeKeywords(['', '   ', 'go'])).toEqual(['go']);
  });

  it('dedupes case-insensitively, keeping first order', () => {
    expect(normalizeKeywords(['  React ', 'react', ''])).toEqual(['react']);
  });

  it('returns an empty array for an empty input', () => {
    expect(normalizeKeywords([])).toEqual([]);
  });

  it('preserves insertion order across distinct values', () => {
    expect(normalizeKeywords(['ts', 'node', 'react', 'node'])).toEqual([
      'ts',
      'node',
      'react',
    ]);
  });
});
