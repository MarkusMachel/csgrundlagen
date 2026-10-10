import type { AnswerValue, Question } from './types';

/**
 * Client-side grading, the same rules as the Go API (internal/store/grading.go).
 * The mocks grade with it, and the UI uses it to reveal what was right.
 */

/** The answer a submission is graded against. */
export function correctAnswerOf(q: Question): AnswerValue {
  switch (q.type) {
    case 'multiple-choice':
      return q.correctOptionId;
    case 'true-false':
      return q.correctAnswer;
    case 'multi-select':
      return q.correctOptionIds;
    case 'ordering':
      return q.correctOrder;
    case 'output':
      return q.expectedOutput;
    case 'flashcard':
      return true; // "I knew it"
  }
}

/** Line endings, trailing spaces and surrounding blank lines don't count. */
export function normalizeOutput(s: string): string {
  return s
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/^\n+|\n+$/g, '');
}

export function isAnswerCorrect(q: Question, given: AnswerValue | undefined): boolean {
  if (given === undefined) return false; // unanswered counts as wrong
  switch (q.type) {
    case 'multiple-choice':
      return given === q.correctOptionId;
    case 'true-false':
      return given === q.correctAnswer;
    case 'multi-select': {
      if (!Array.isArray(given)) return false;
      const picked = new Set(given);
      return (
        picked.size === given.length &&
        picked.size === q.correctOptionIds.length &&
        q.correctOptionIds.every((id) => picked.has(id))
      );
    }
    case 'ordering':
      return (
        Array.isArray(given) &&
        given.length === q.correctOrder.length &&
        given.every((id, i) => id === q.correctOrder[i])
      );
    case 'output':
      return (
        typeof given === 'string' && normalizeOutput(given) === normalizeOutput(q.expectedOutput)
      );
    case 'flashcard':
      return given === true;
  }
}

/** Whether an in-progress answer is complete enough to submit. */
export function canSubmit(q: Question, value: AnswerValue | undefined): boolean {
  if (value === undefined) return false;
  if (q.type === 'multi-select') return Array.isArray(value) && value.length > 0;
  if (q.type === 'output') return typeof value === 'string' && value.trim().length > 0;
  return true;
}

/** How an answer is stored and counted (option ids joined by commas). */
export function answerKey(value: AnswerValue | undefined): string {
  if (value === undefined) return 'unanswered';
  return Array.isArray(value) ? value.join(',') : String(value);
}
