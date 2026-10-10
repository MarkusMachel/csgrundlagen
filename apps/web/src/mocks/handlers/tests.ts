import { http, HttpResponse } from 'msw';

import {
  scoreAnswers,
  type CreateTestInput,
  type TestDraft,
  type TestMode,
} from '@/features/custom-tests';
import type { AnswerValue, Question } from '@/features/questions/types';

import { db, nextId, recordAnswer, statKeys } from '../db';
import { feedbackFor } from './questions';
import { currentUser, findQuestion, unauthorized } from './utils';

export const testHandlers = [
  http.get('/api/tests', ({ request }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    const tests = db.tests
      .filter((t) => t.ownerId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((t) => {
        const d = db.drafts[`${t.id}:${user.id}`];
        return d
          ? {
              ...t,
              draft: {
                answered: Object.keys(d.answers).length,
                total: d.questionIds?.length || t.questionIds.length,
                startedAt: d.startedAt,
                updatedAt: d.updatedAt,
              },
            }
          : t;
      });
    return HttpResponse.json(tests);
  }),

  http.post('/api/tests', async ({ request }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    const input = (await request.json()) as CreateTestInput;
    const test = {
      id: nextId('t'),
      ownerId: user.id,
      name: input.name,
      questionIds: input.questionIds,
      timed: input.timed,
      durationMinutes: input.timed ? input.durationMinutes : undefined,
      shuffleQuestions: input.shuffleQuestions,
      shuffleOptions: input.shuffleOptions,
      createdAt: new Date().toISOString(),
    };
    db.tests.push(test);
    return HttpResponse.json(test, { status: 201 });
  }),

  http.get('/api/tests/:id', ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    const test = db.tests.find((t) => t.id === params.id && t.ownerId === user.id);
    if (!test) return HttpResponse.json({ message: 'Test not found' }, { status: 404 });
    return HttpResponse.json(test);
  }),

  http.delete('/api/tests/:id', ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    const index = db.tests.findIndex((t) => t.id === params.id && t.ownerId === user.id);
    if (index < 0) return HttpResponse.json({ message: 'Test not found' }, { status: 404 });
    db.tests.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/api/tests/:id/attempts', ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    const attempts = db.attempts
      .filter((a) => a.testId === params.id && a.userId === user.id)
      .sort((a, b) => (b.submittedAt ?? '').localeCompare(a.submittedAt ?? ''));
    return HttpResponse.json(attempts);
  }),

  http.get('/api/tests/:id/draft', ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    return HttpResponse.json(db.drafts[`${params.id}:${user.id}`] ?? null);
  }),

  http.put('/api/tests/:id/draft', async ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    if (!db.tests.some((t) => t.id === params.id && t.ownerId === user.id)) {
      return HttpResponse.json({ message: 'Test not found' }, { status: 404 });
    }
    const next = (await request.json()) as TestDraft;
    const key = `${params.id}:${user.id}`;
    const prev = db.drafts[key];
    // like the API: the clock keeps running unless it's a new attempt
    const sameAttempt =
      prev &&
      prev.mode === next.mode &&
      prev.shuffleSeed === next.shuffleSeed &&
      (prev.questionIds ?? []).join() === (next.questionIds ?? []).join();
    db.drafts[key] = {
      ...next,
      startedAt: sameAttempt ? prev.startedAt : next.startedAt,
      updatedAt: new Date().toISOString(),
    };
    return new HttpResponse(null, { status: 204 });
  }),

  http.delete('/api/tests/:id/draft', ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    delete db.drafts[`${params.id}:${user.id}`];
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('/api/tests/:id/submit', async ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    const test = db.tests.find((t) => t.id === params.id && t.ownerId === user.id);
    if (!test) return HttpResponse.json({ message: 'Test not found' }, { status: 404 });
    delete db.drafts[`${test.id}:${user.id}`];

    const body = (await request.json()) as {
      mode: TestMode;
      answers: Record<string, AnswerValue>;
      questionIds?: string[]; // subset for "Retry Incorrect Only" attempts
      startedAt?: string;
    };
    const questionIds =
      body.questionIds && body.questionIds.length > 0 ? body.questionIds : test.questionIds;
    const questions = questionIds
      .map((id) => findQuestion(id, 'en'))
      .filter((q): q is Question => q !== undefined);

    const { score, total, breakdown } = scoreAnswers(questions, body.answers);
    breakdown.forEach((item) => {
      const question = questions.find((q) => q.id === item.questionId)!;
      recordAnswer(
        user.id,
        item.questionId,
        statKeys(question, item.givenAnswer, item.correct),
        item.correct,
      );
    });

    const attempt = {
      id: nextId('att'),
      testId: test.id,
      userId: user.id,
      mode: body.mode,
      answers: body.answers,
      score,
      startedAt: body.startedAt ?? new Date().toISOString(),
      submittedAt: new Date().toISOString(),
    };
    db.attempts.push(attempt);
    const withFeedback = breakdown.map((item) => {
      const question = questions.find((q) => q.id === item.questionId);
      return { ...item, feedback: question && feedbackFor(question, item.givenAnswer) };
    });
    return HttpResponse.json({ attempt, total, score, breakdown: withFeedback });
  }),
];
