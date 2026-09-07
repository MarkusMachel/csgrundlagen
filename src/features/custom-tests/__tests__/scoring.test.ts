import { describe, expect, it } from 'vitest';

import type { Question } from '@/features/questions/types';

import { incorrectQuestionIds, isAnswerCorrect, scoreAnswers } from '../utils/scoring';

const mcq: Question = {
  id: 'q1',
  type: 'multiple-choice',
  prompt: 'Pick B',
  tags: [],
  explanation: '',
  options: [
    { id: 'A', label: 'a' },
    { id: 'B', label: 'b' },
    { id: 'C', label: 'c' },
  ],
  correctOptionId: 'B',
};

const tfq: Question = {
  id: 'q2',
  type: 'true-false',
  prompt: 'True?',
  tags: [],
  explanation: '',
  correctAnswer: true,
};

const mcq2: Question = { ...mcq, id: 'q3', correctOptionId: 'A' };

describe('scoring', () => {
  it('scores correct, wrong, and unanswered (unanswered counts as wrong)', () => {
    const { score, total, breakdown } = scoreAnswers([mcq, tfq, mcq2], {
      q1: 'B', // correct
      q2: false, // wrong
      // q3 unanswered
    });
    expect(total).toBe(3);
    expect(score).toBe(1);
    expect(breakdown.map((b) => b.correct)).toEqual([true, false, false]);
  });

  it('treats boolean answers strictly (false !== undefined)', () => {
    expect(isAnswerCorrect(tfq, true)).toBe(true);
    expect(isAnswerCorrect(tfq, false)).toBe(false);
    expect(isAnswerCorrect(tfq, undefined)).toBe(false);
  });

  it('derives the incorrect subset for Retry Incorrect Only', () => {
    const { breakdown } = scoreAnswers([mcq, tfq, mcq2], { q1: 'B', q2: false });
    expect(incorrectQuestionIds(breakdown)).toEqual(['q2', 'q3']);
  });

  it('scores a perfect run', () => {
    const { score, breakdown } = scoreAnswers([mcq, tfq], { q1: 'B', q2: true });
    expect(score).toBe(2);
    expect(incorrectQuestionIds(breakdown)).toEqual([]);
  });
});
