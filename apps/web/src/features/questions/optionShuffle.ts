import { seededShuffle } from '@/shared/utils/shuffle';

import type { Question } from './types';

/**
 * Options that point at other options by position ("all of the above",
 * "both A and C") stop making sense when shuffled, so such questions keep
 * their authored order.
 */
const POSITIONAL =
  /\b(all|none|both|neither) of the (above|options)\b|\b(options?|answers?) [A-E]\b|\b[A-E] (and|or|&) [A-E]\b/i;

/** Whether a question's options may be shown in a random order. */
export function canShuffleOptions(question: Question): boolean {
  if (question.type !== 'multiple-choice' && question.type !== 'multi-select') return false;
  return !question.options.some((o) => POSITIONAL.test(o.label));
}

/** A fresh random option order, or undefined to keep the authored one. */
export function shuffledOptionOrder(question: Question, seed: number): string[] | undefined {
  if (question.type !== 'multiple-choice' && question.type !== 'multi-select') return undefined;
  if (!canShuffleOptions(question)) return undefined;
  return seededShuffle(
    question.options.map((o) => o.id),
    seed,
  );
}
