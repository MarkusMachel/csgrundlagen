import { describe, expect, it } from 'vitest';

import { canShuffleOptions, shuffledOptionOrder } from '../optionShuffle';
import type { Question } from '../types';

const mc = (labels: string[]): Question => ({
  id: 'q',
  type: 'multiple-choice',
  prompt: 'p',
  explanation: 'e',
  tags: [],
  options: labels.map((label, i) => ({ id: 'ABCDE'[i], label })),
  correctOptionId: 'A',
});

describe('option shuffling', () => {
  it('shuffles ordinary options, keeping every id', () => {
    const q = mc(['TCP', 'UDP', 'ICMP', 'ARP']);
    expect(canShuffleOptions(q)).toBe(true);
    const order = shuffledOptionOrder(q, 1234)!;
    expect([...order].sort()).toEqual(['A', 'B', 'C', 'D']);
  });

  it('keeps the authored order when options refer to each other', () => {
    for (const label of ['All of the above', 'None of the above', 'Both A and C', 'Options B or D', 'A & B']) {
      expect(canShuffleOptions(mc(['x', 'y', label]))).toBe(false);
    }
  });

  it('does not misread ordinary words', () => {
    expect(canShuffleOptions(mc(['A queue and a stack', 'Big-O and Theta', 'Plan A']))).toBe(true);
  });

  it('only applies to option-based questions', () => {
    const tf = { id: 't', type: 'true-false', prompt: 'p', explanation: 'e', tags: [], correctAnswer: true } as Question;
    expect(shuffledOptionOrder(tf, 1)).toBeUndefined();
  });
});
