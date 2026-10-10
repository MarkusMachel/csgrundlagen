import type { CustomTest, TestAttempt } from '@/features/custom-tests/types';
import type { MaterialItem } from '@/features/materials/types';
import type {
  AnswerValue,
  Bookmark,
  BugReport,
  QuestionComment,
  Question,
  QuestionNote,
  UserQuestionStat,
} from '@/features/questions/types';
import { nextReview } from '@/features/review/srs';
import type { ReviewState } from '@/features/review/types';

import { seedComments } from './seed/comments';
import { seedMaterials } from './seed/materials';
import { seedQuestions, type SeedQuestion } from './seed/questions';
import { seedUsers, type SeedUser } from './seed/users';

/** Multi-select: how many answers there were (each counts toward several options). */
export const ANSWERS_BUCKET = '__answers';

/**
 * In-memory "database" behind the MSW handlers. Mutable module state, reset
 * per test via resetDb(). Aggregate answer counts are stored per option so
 * /questions/:id/stats can be computed live as users submit answers.
 */

interface Db {
  /** Accounts, including ones created through sign-up. */
  users: SeedUser[];
  /** Password reset token -> user id (single use). */
  resetTokens: Record<string, string>;
  /** All questions (seeded + admin-created), with optional translations. */
  questions: SeedQuestion[];
  /** All materials (seeded + admin-created); mutable so links can be added. */
  materials: MaterialItem[];
  comments: QuestionComment[];
  bookmarks: Bookmark[];
  notes: QuestionNote[];
  bugReports: BugReport[];
  tests: CustomTest[];
  attempts: TestAttempt[];
  userQuestionStats: UserQuestionStat[];
  /** Spaced-repetition state, keyed `${userId}:${questionId}`. */
  reviews: Record<string, ReviewState>;
  /** Every answer, for the progress page's activity chart. */
  answerLog: { userId: string; questionId: string; correct: boolean; at: string }[];
  /** questionId -> option id ('A'…'E', 'true'/'false') or 'correct'/'incorrect' -> count */
  answerCounts: Record<string, Record<string, number>>;
}

function seedAnswerCounts(): Record<string, Record<string, number>> {
  // Deterministic fake global stats so the Stats tab has data on first load.
  const counts: Record<string, Record<string, number>> = {};
  seedQuestions.forEach(({ question }, qi) => {
    const perOption: Record<string, number> = {};
    const [optionIds, correctIds] =
      question.type === 'multiple-choice'
        ? [question.options.map((o) => o.id), [question.correctOptionId]]
        : question.type === 'multi-select'
          ? [question.options.map((o) => o.id), question.correctOptionIds]
          : question.type === 'true-false'
            ? [['true', 'false'], [String(question.correctAnswer)]]
            : [['correct', 'incorrect'], ['correct']];
    optionIds.forEach((id, oi) => {
      perOption[id] = correctIds.includes(id) ? 40 + ((qi * 7) % 30) : 3 + ((qi + oi * 5) % 12);
    });
    if (question.type === 'multi-select') {
      perOption[ANSWERS_BUCKET] = Math.max(...Object.values(perOption)) + 5;
    }
    counts[question.id] = perOption;
  });
  return counts;
}

function seedUserQuestionStats(): UserQuestionStat[] {
  // Give the demo user some history so Weak Spots is populated out of the box:
  // q5 answered often but poorly, q12 wrong on the last try, q22 mastered.
  return [
    {
      userId: 'u1',
      questionId: 'q5',
      timesAnswered: 5,
      timesCorrect: 1,
      lastAnsweredAt: '2026-09-01T08:00:00.000Z',
      lastAnswerCorrect: false,
    },
    {
      userId: 'u1',
      questionId: 'q12',
      timesAnswered: 2,
      timesCorrect: 1,
      lastAnsweredAt: '2026-09-03T18:30:00.000Z',
      lastAnswerCorrect: false,
    },
    {
      userId: 'u1',
      questionId: 'q22',
      timesAnswered: 4,
      timesCorrect: 4,
      lastAnsweredAt: '2026-09-04T12:00:00.000Z',
      lastAnswerCorrect: true,
    },
  ];
}

/**
 * Answer log and review schedule matching the seeded stats: the misses (q5,
 * q12) are due now, the mastered q22 comes back in a few days.
 */
function seedHistory(): Pick<Db, 'reviews' | 'answerLog'> {
  const reviews: Record<string, ReviewState> = {};
  const answerLog: Db['answerLog'] = [];
  for (const s of seedUserQuestionStats()) {
    answerLog.push({
      userId: s.userId,
      questionId: s.questionId,
      correct: s.lastAnswerCorrect,
      at: s.lastAnsweredAt,
    });
    reviews[`${s.userId}:${s.questionId}`] = s.lastAnswerCorrect
      ? {
          repetitions: 3,
          intervalDays: 7.5,
          ease: 2.6,
          dueAt: new Date(Date.now() + 4 * 86_400_000).toISOString(),
        }
      : { repetitions: 0, intervalDays: 0, ease: 1.9, dueAt: s.lastAnsweredAt };
  }
  return { reviews, answerLog };
}

function freshDb(): Db {
  return {
    users: seedUsers.map((u) => ({ ...u })),
    resetTokens: {},
    questions: seedQuestions.map((s) => ({
      question: { ...s.question },
      translations: s.translations,
    })),
    materials: seedMaterials.map((m) => ({
      ...m,
      relatedQuestionIds: m.relatedQuestionIds ? [...m.relatedQuestionIds] : undefined,
    })),
    comments: [...seedComments],
    bookmarks: [],
    notes: [],
    bugReports: [],
    tests: [],
    attempts: [],
    userQuestionStats: seedUserQuestionStats(),
    ...seedHistory(),
    answerCounts: seedAnswerCounts(),
  };
}

export let db: Db = freshDb();

export function resetDb(): void {
  db = freshDb();
}

let idCounter = 1000;
export function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

/**
 * The stats buckets an answer counts toward, like the Go API: the picked
 * option, each picked option (multi-select), or right/wrong (ordering, output).
 */
export function statKeys(question: Question, answer: AnswerValue | undefined, correct: boolean) {
  if (question.type === 'ordering' || question.type === 'output') {
    return [correct ? 'correct' : 'incorrect'];
  }
  if (question.type === 'multi-select') {
    return [...(Array.isArray(answer) ? answer : []), ANSWERS_BUCKET];
  }
  return [answer === undefined ? 'unanswered' : String(answer)];
}

/** Records an answer everywhere the real API would; returns the next review time. */
export function recordAnswer(
  userId: string,
  questionId: string,
  /** Stats buckets this answer counts toward (see statKeys). */
  keys: string[],
  correct: boolean,
): string {
  const key = `${userId}:${questionId}`;
  const review = nextReview(db.reviews[key], correct);
  db.reviews[key] = review;
  db.answerLog.push({ userId, questionId, correct, at: new Date().toISOString() });

  const counts = (db.answerCounts[questionId] ??= {});
  for (const k of keys) counts[k] = (counts[k] ?? 0) + 1;

  const existing = db.userQuestionStats.find(
    (s) => s.userId === userId && s.questionId === questionId,
  );
  const now = new Date().toISOString();
  if (existing) {
    existing.timesAnswered += 1;
    if (correct) existing.timesCorrect += 1;
    existing.lastAnsweredAt = now;
    existing.lastAnswerCorrect = correct;
  } else {
    db.userQuestionStats.push({
      userId,
      questionId,
      timesAnswered: 1,
      timesCorrect: correct ? 1 : 0,
      lastAnsweredAt: now,
      lastAnswerCorrect: correct,
    });
  }
  return review.dueAt;
}
