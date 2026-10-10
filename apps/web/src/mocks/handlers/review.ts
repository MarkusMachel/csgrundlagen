import { http, HttpResponse } from 'msw';

import type { Progress } from '@/features/progress/types';
import type { Question } from '@/features/questions/types';

import { db } from '../db';
import { allQuestions, currentUser, findQuestion, localeOf, unauthorized } from './utils';

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Same contracts as the Go API's /review/queue and /me/progress. */
export const reviewHandlers = [
  http.get('/api/review/queue', ({ request }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    const url = new URL(request.url);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? '20')));
    const newLimit = Math.min(50, Math.max(0, Number(url.searchParams.get('new') ?? '0')));
    const locale = localeOf(request);
    const now = Date.now();

    const mine = Object.entries(db.reviews)
      .filter(([key]) => key.startsWith(`${user.id}:`))
      .map(([key, r]) => ({ questionId: key.slice(user.id.length + 1), ...r }));
    const due = mine
      .filter((r) => Date.parse(r.dueAt) <= now)
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
    // design challenges need the drawing board, so reviews leave them out (like the API)
    const reviewable = (q: Question | undefined): q is Question =>
      q !== undefined && q.type !== 'design';
    const dueReviewable = due.filter((r) => reviewable(findQuestion(r.questionId, locale)));
    const items = dueReviewable
      .slice(0, limit)
      .map((r) => findQuestion(r.questionId, locale))
      .filter(reviewable);
    const seen = new Set(mine.map((r) => r.questionId));
    const fresh =
      newLimit > 0
        ? allQuestions(locale)
            .filter((q) => !seen.has(q.id) && q.type !== 'design')
            .slice(0, newLimit)
        : [];
    return HttpResponse.json({
      items: [...items, ...fresh],
      due: dueReviewable.length,
      new: fresh.length,
    });
  }),

  http.get('/api/me/progress', ({ request }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    const log = db.answerLog.filter((a) => a.userId === user.id);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const day = (offset: number) => new Date(today.getTime() + offset * 86_400_000);

    const byDay = new Map<string, { answers: number; correct: number }>();
    for (const a of log) {
      const k = dayKey(new Date(a.at));
      const d = byDay.get(k) ?? { answers: 0, correct: 0 };
      d.answers += 1;
      if (a.correct) d.correct += 1;
      byDay.set(k, d);
    }
    let streak = 0;
    let cursor = byDay.has(dayKey(today)) ? 0 : -1;
    while (byDay.has(dayKey(day(cursor)))) {
      streak += 1;
      cursor -= 1;
    }

    const reviews = Object.entries(db.reviews).filter(([k]) => k.startsWith(`${user.id}:`));
    const upcoming = Array.from({ length: 7 }, (_, i) => ({ date: dayKey(day(i)), count: 0 }));
    for (const [, r] of reviews) {
      const due = new Date(r.dueAt);
      const offset = Math.max(0, Math.floor((due.getTime() - today.getTime()) / 86_400_000));
      if (offset < 7) upcoming[offset].count += 1;
    }

    const tags = [...new Set(db.questions.flatMap((s) => s.question.tags))].sort();
    const progress: Progress = {
      totals: {
        questions: db.questions.length,
        seen: new Set(log.map((a) => a.questionId)).size,
        answers: log.length,
        correct: log.filter((a) => a.correct).length,
        dueNow: reviews.filter(([, r]) => Date.parse(r.dueAt) <= now.getTime()).length,
        streakDays: streak,
      },
      byTag: tags.map((tag) => {
        const ids = new Set(
          db.questions.filter((s) => s.question.tags.includes(tag)).map((s) => s.question.id),
        );
        const answers = log.filter((a) => ids.has(a.questionId));
        return {
          tag,
          questions: ids.size,
          seen: new Set(answers.map((a) => a.questionId)).size,
          answers: answers.length,
          correct: answers.filter((a) => a.correct).length,
        };
      }),
      activity: Array.from({ length: 30 }, (_, i) => {
        const date = dayKey(day(i - 29));
        return { date, ...(byDay.get(date) ?? { answers: 0, correct: 0 }) };
      }),
      upcoming,
    };
    return HttpResponse.json(progress);
  }),

  // Go runs through the real API (which forwards it to the Go Playground);
  // the in-browser mock has no server to send it to.
  http.post('/api/run', ({ request }) => {
    if (!currentUser(request)) return unauthorized();
    return HttpResponse.json(
      { message: 'Running Go needs the real API: start it with npm run up or npm run dev:real.' },
      { status: 503 },
    );
  }),
];
