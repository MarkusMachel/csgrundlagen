import { http, HttpResponse } from 'msw';

import type { AdminStats } from '@/features/authoring/statsTypes';
import type { AdminBugReport } from '@/features/authoring/types';
import type { BugReport } from '@/features/questions/types';

import { db } from '../db';
import { currentUser, forbidden, unauthorized } from './utils';

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
        users: db.users.length,
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
        .sort(
          (a, b) => DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty),
        ),
      materialsByType: [...materialsByType].map(([type, count]) => ({ type, count })),
      answersByTag: [...tagAnswerCounts]
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
      correctness: { correct, incorrect: answered - correct },
    };

    return HttpResponse.json(stats);
  }),

  http.get('/api/admin/bug-reports', ({ request }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    if (user.role !== 'admin') return forbidden();
    const status = new URL(request.url).searchParams.get('status');
    const reports = db.bugReports
      .filter((r) => !status || r.status === status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(withContext);
    return HttpResponse.json(reports);
  }),

  http.patch('/api/admin/bug-reports/:id', async ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    if (user.role !== 'admin') return forbidden();
    const { status } = (await request.json()) as { status: BugReport['status'] };
    if (!['open', 'reviewed', 'closed'].includes(status)) {
      return HttpResponse.json(
        { message: 'status must be open, reviewed or closed' },
        { status: 400 },
      );
    }
    const report = db.bugReports.find((r) => r.id === params.id);
    if (!report) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    report.status = status;
    return HttpResponse.json(withContext(report));
  }),
];

/** Adds the question prompt and reporter name, like the Go API's admin view. */
function withContext(r: BugReport): AdminBugReport {
  return {
    ...r,
    questionPrompt: db.questions.find((s) => s.question.id === r.questionId)?.question.prompt ?? '',
    userName: db.users.find((u) => u.id === r.userId)?.name ?? '',
  };
}
