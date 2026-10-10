import type { Question } from '@/features/questions';

/** GET /review/queue: due questions first, then any requested new ones. */
export interface ReviewQueue {
  items: Question[];
  /** Total due now (items may hold fewer). */
  due: number;
  /** Unseen questions appended after the due ones. */
  new: number;
}

/** One user's spaced-repetition state for one question. */
export interface ReviewState {
  repetitions: number;
  intervalDays: number;
  ease: number;
  dueAt: string;
}
