import { describe, expect, it } from 'vitest';

import { MAX_EASE, MAX_INTERVAL_DAYS, MIN_EASE, nextReview } from '../srs';

// Same expectations as the Go test (internal/store/review_test.go), so the
// mock and the real API schedule identically.
describe('nextReview (SM-2)', () => {
  const now = new Date('2026-10-10T12:00:00Z');
  const days = (iso: string) => (Date.parse(iso) - now.getTime()) / 86_400_000;

  it('spaces correct answers 1 day, 3 days, then by the ease factor', () => {
    let s = nextReview(undefined, true, now);
    expect([s.repetitions, days(s.dueAt)]).toEqual([1, 1]);
    s = nextReview(s, true, now);
    expect([s.repetitions, days(s.dueAt)]).toEqual([2, 3]);
    s = nextReview(s, true, now);
    expect(s.repetitions).toBe(3);
    expect(days(s.dueAt)).toBeGreaterThan(3);
    expect(days(s.dueAt)).toBeLessThanOrEqual(3 * MAX_EASE);
  });

  it('brings a miss back in 10 minutes and lowers the ease, within bounds', () => {
    const good = nextReview(nextReview(undefined, true, now), true, now);
    let s = nextReview(good, false, now);
    expect(s.repetitions).toBe(0);
    expect(Date.parse(s.dueAt) - now.getTime()).toBe(10 * 60_000);
    expect(s.ease).toBeLessThan(good.ease);
    for (let i = 0; i < 20; i++) s = nextReview(s, false, now);
    expect(s.ease).toBe(MIN_EASE);
    for (let i = 0; i < 50; i++) s = nextReview(s, true, now);
    expect(s.ease).toBe(MAX_EASE);
    expect(days(s.dueAt)).toBe(MAX_INTERVAL_DAYS); // capped, not overflowing
  });
});
