import type { UserQuestionStat } from '@/features/questions/types';

/**
 * The single tunable definition of "weak" (§15 open decision, documented here):
 * a question is weak when the user's accuracy is below WEAK_ACCURACY_THRESHOLD
 * with at least WEAK_MIN_ATTEMPTS attempts, OR the most recent attempt was wrong.
 */
export const WEAK_ACCURACY_THRESHOLD = 0.6;
export const WEAK_MIN_ATTEMPTS = 2;

export function isWeakStat(stat: UserQuestionStat): boolean {
  if (stat.timesAnswered === 0) return false;
  if (!stat.lastAnswerCorrect) return true;
  return (
    stat.timesAnswered >= WEAK_MIN_ATTEMPTS &&
    stat.timesCorrect / stat.timesAnswered < WEAK_ACCURACY_THRESHOLD
  );
}
