import { http, HttpResponse } from 'msw';

import type { AdminStats } from '@/features/authoring/statsTypes';

import { db } from '../db';
import { currentUser, forbidden, unauthorized } from './utils';
import { seedUsers } from '../seed/users';


const DIFFICULTY_ORDER = ['easy', 'medium', 'hard', 'unspecified'];

export const adminHandlers = [
  // Admin-only aggregate stats for the Admin > Stats tab.
  http.get('/api/admin/stats', ({ request }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    if (user.role !== 'admin') return forbidden();

    const questionsByType = new Map<string, number>();
    const questionsByDifficulty = new Map<string, number>();
    const tagAnswerCounts = new Map<string, number>();
    let answersSubmitted = 0;

    for (const { question } of db.questions) {
      questionsByType.set(question.type, (questionsByType.get(question.type) ?? 0) + 1);
      const difficulty = question.difficulty ?? 'unspecified';
      questionsByDifficulty.set(difficulty, (questionsByDifficulty.get(difficulty) ?? 0) + 1);

      const perOption = db.answerCounts[question.id] ?? {};
      const questionTotal = Object.values(perOption).reduce((a, b) => a + b, 0);
      answersSubmitted += questionTotal;
      for (const tag of question.tags) {
        tagAnswerCounts.set(tag, (tagAnswerCounts.get(tag) ?? 0) + questionTotal);
      }
    }

    const materialsByType = new Map<string, number>();
    for (const material of db.materials) {
      materialsByType.set(material.type, (materialsByType.get(material.type) ?? 0) + 1);
    }

    // Correctness is only tracked in userQuestionStats (per-user activity),
    // so that — not the seeded baseline in answerCounts — is the source here.
    const correct = db.userQuestionStats.reduce((sum, s) => sum + s.timesCorrect, 0);
    const answered = db.userQuestionStats.reduce((sum, s) => sum + s.timesAnswered, 0);

    const stats: AdminStats = {
      totals: {
        questions: db.questions.length,
        materials: db.materials.length,
        users: seedUsers.length,
        tests: db.tests.length,
        testAttempts: db.attempts.length,
        answersSubmitted,
        bookmarks: db.bookmarks.length,
        comments: db.comments.length,
        bugReports: db.bugReports.length,
      },
      questionsByType: [...questionsByType].map(([type, count]) => ({ type, count })),
      // Ordinal, not alphabetical: easy → medium → hard → unspecified.
      questionsByDifficulty: [...questionsByDifficulty]
        .map(([difficulty, count]) => ({ difficulty, count }))
        .sort((a, b) => DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty)),
      materialsByType: [...materialsByType].map(([type, count]) => ({ type, count })),
      answersByTag: [...tagAnswerCounts]
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
      correctness: { correct, incorrect: answered - correct },
    };

    return HttpResponse.json(stats);
  }),
];
