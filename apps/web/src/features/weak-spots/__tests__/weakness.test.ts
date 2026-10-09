import { describe, expect, it } from 'vitest';

import type { UserQuestionStat } from '@/features/questions/types';

import { isWeakStat } from '../weakness';

function stat(overrides: Partial<UserQuestionStat>): UserQuestionStat {
  return {
    userId: 'u1',
    questionId: 'q1',
    timesAnswered: 0,
    timesCorrect: 0,
    lastAnsweredAt: '2026-09-01T00:00:00.000Z',
    lastAnswerCorrect: true,
    ...overrides,
  };
}

describe('isWeakStat', () => {
  it('is weak when the most recent attempt was wrong', () => {
    expect(isWeakStat(stat({ timesAnswered: 1, timesCorrect: 0, lastAnswerCorrect: false }))).toBe(
      true,
    );
    // even with high overall accuracy
    expect(isWeakStat(stat({ timesAnswered: 10, timesCorrect: 9, lastAnswerCorrect: false }))).toBe(
      true,
    );
  });

  it('is weak when accuracy < 60% with at least 2 attempts', () => {
    expect(isWeakStat(stat({ timesAnswered: 5, timesCorrect: 2, lastAnswerCorrect: true }))).toBe(
      true,
    );
  });

  it('is not weak on a single correct answer', () => {
    expect(isWeakStat(stat({ timesAnswered: 1, timesCorrect: 1, lastAnswerCorrect: true }))).toBe(
      false,
    );
  });

  it('is not weak at or above the accuracy threshold when last answer was right', () => {
    expect(isWeakStat(stat({ timesAnswered: 5, timesCorrect: 3, lastAnswerCorrect: true }))).toBe(
      false,
    );
    expect(isWeakStat(stat({ timesAnswered: 4, timesCorrect: 4, lastAnswerCorrect: true }))).toBe(
      false,
    );
  });

  it('is not weak with zero attempts', () => {
    expect(isWeakStat(stat({}))).toBe(false);
  });
});
