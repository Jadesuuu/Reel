import { describe, expect, it } from 'vitest';
import { DEFAULT_API_URL, isLocalOrigin, normalizeApiUrl, originOf } from './settings.js';

describe('normalizeApiUrl', () => {
  it('falls back to the local API', () => {
    expect(normalizeApiUrl('')).toBe(DEFAULT_API_URL);
    expect(normalizeApiUrl('   ')).toBe(DEFAULT_API_URL);
  });

  it('adds the scheme and the version prefix when they are missing', () => {
    expect(normalizeApiUrl('localhost:4000')).toBe('http://localhost:4000/api/v1');
    expect(normalizeApiUrl('https://api.reel.example/')).toBe('https://api.reel.example/api/v1');
    expect(normalizeApiUrl('https://api.reel.example/api/v1/')).toBe(
      'https://api.reel.example/api/v1',
    );
  });
});

describe('origins', () => {
  it('reads the origin and recognises local ones', () => {
    expect(originOf('http://localhost:4000/api/v1')).toBe('http://localhost:4000');
    expect(originOf('nonsense')).toBeNull();
    expect(isLocalOrigin('http://localhost:4000')).toBe(true);
    expect(isLocalOrigin('http://127.0.0.1:4000')).toBe(true);
    expect(isLocalOrigin('https://api.reel.example')).toBe(false);
  });
});
