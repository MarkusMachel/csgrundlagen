import type { ReviewState } from './types';

export const START_EASE = 2.5;
export const MIN_EASE = 1.3;
export const MAX_EASE = 3;
export const RELEARN_MINUTES = 10;
/** Longest gap between reviews; without a cap the interval grows exponentially. */
export const MAX_INTERVAL_DAYS = 365;

/**
 * Simplified SM-2, the same rule as the Go API (internal/store/review.go):
 * correct → repetitions+1, next gap 1 day, then 3 days, then gap × ease (ease +0.05);
 * (capped at 365 days); wrong → repetitions reset, due again in 10 minutes, ease −0.2 (never below 1.3).
 */
export function nextReview(prev: ReviewState | undefined, correct: boolean, now = new Date()) {
  const s = { repetitions: 0, intervalDays: 0, ease: START_EASE, ...prev };
  const at = (ms: number) => new Date(now.getTime() + ms).toISOString();
  if (!correct) {
    return {
      repetitions: 0,
      intervalDays: 0,
      ease: Math.max(MIN_EASE, s.ease - 0.2),
      dueAt: at(RELEARN_MINUTES * 60_000),
    };
  }
  const repetitions = s.repetitions + 1;
  const intervalDays =
    repetitions === 1
      ? 1
      : repetitions === 2
        ? 3
        : Math.min(MAX_INTERVAL_DAYS, Math.round(Math.max(s.intervalDays, 1) * s.ease * 10) / 10);
  return {
    repetitions,
    intervalDays,
    ease: Math.min(MAX_EASE, s.ease + 0.05),
    dueAt: at(intervalDays * 86_400_000),
  };
}
