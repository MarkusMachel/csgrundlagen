import type { CustomTest, TestAttempt } from '@/features/custom-tests/types';
import type { MaterialItem } from '@/features/materials/types';
import type {
  Bookmark,
  BugReport,
  QuestionComment,
  QuestionNote,
  UserQuestionStat,
} from '@/features/questions/types';

import { seedComments } from './seed/comments';
import { seedMaterials } from './seed/materials';
import { seedQuestions, type SeedQuestion } from './seed/questions';

/**
 * In-memory "database" behind the MSW handlers. Mutable module state, reset
 * per test via resetDb(). Aggregate answer counts are stored per option so
 * /questions/:id/stats can be computed live as users submit answers.
 */

interface Db {
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
  /** questionId -> optionId ('A'…'E' or 'true'/'false') -> count */
  answerCounts: Record<string, Record<string, number>>;
}

function seedAnswerCounts(): Record<string, Record<string, number>> {
  // Deterministic fake global stats so the Stats tab has data on first load.
  const counts: Record<string, Record<string, number>> = {};
  seedQuestions.forEach(({ question }, qi) => {
    const perOption: Record<string, number> = {};
    const optionIds =
      question.type === 'multiple-choice' ? question.options.map((o) => o.id) : ['true', 'false'];
    const correctId =
      question.type === 'multiple-choice' ? question.correctOptionId : String(question.correctAnswer);
    optionIds.forEach((id, oi) => {
      perOption[id] = id === correctId ? 40 + ((qi * 7) % 30) : 3 + ((qi + oi * 5) % 12);
    });
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

function freshDb(): Db {
  return {
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

export function recordAnswer(userId: string, questionId: string, optionId: string, correct: boolean) {
  const counts = (db.answerCounts[questionId] ??= {});
  counts[optionId] = (counts[optionId] ?? 0) + 1;

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
}
