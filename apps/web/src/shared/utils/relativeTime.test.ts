import { describe, expect, it } from 'vitest';

import { formatRelative } from './relativeTime';

const now = Date.parse('2026-10-10T12:00:00Z');
const at = (secondsFromNow: number) => new Date(now + secondsFromNow * 1000).toISOString();

describe('formatRelative', () => {
  it('picks a readable unit', () => {
    expect(formatRelative(at(10 * 60), 'en', now)).toBe('in 10 minutes');
    expect(formatRelative(at(5 * 3600), 'en', now)).toBe('in 5 hours');
    expect(formatRelative(at(3 * 86400), 'en', now)).toBe('in 3 days');
    expect(formatRelative(at(86400), 'en', now)).toBe('tomorrow');
    expect(formatRelative(at(20), 'en', now)).toBe('this minute');
    expect(formatRelative(at(86400 - 2), 'en', now)).toBe('tomorrow'); // a hair under a day
  });

  it('localizes', () => {
    expect(formatRelative(at(3 * 86400), 'de', now)).toBe('in 3 Tagen');
  });
});
