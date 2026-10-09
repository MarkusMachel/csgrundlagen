import { http, HttpResponse } from 'msw';

import type { AnswerStat, AnswerValue, Question } from '@/features/questions/types';
import type { MultipleChoiceOption } from '@/features/questions/types';
import { isWeakStat } from '@/features/weak-spots';


import { db, nextId, recordAnswer } from '../db';
import { allQuestions, currentUser, findQuestion, forbidden, localeOf, unauthorized } from './utils';

interface CreateQuestionBody {
  type: Question['type'];
  prompt: string;
  tags: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  explanation: string;
  options?: MultipleChoiceOption[];
  correctOptionId?: string;
  correctAnswer?: boolean;
  relatedMaterialIds?: string[];
}

function correctAnswerOf(question: Question): AnswerValue {
  return question.type === 'multiple-choice' ? question.correctOptionId : question.correctAnswer;
}

export const questionHandlers = [
  http.get('/api/questions/daily', ({ request }) => {
    // Deterministic by calendar date so it survives refreshes (§7).
    const questions = allQuestions(localeOf(request));
    const today = new Date().toISOString().slice(0, 10);
    const hash = [...today].reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7);
    const question = questions[Math.abs(hash) % questions.length];
    return HttpResponse.json(question);
  }),

  http.get('/api/questions/weak', ({ request }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    const locale = localeOf(request);
    const weakIds = db.userQuestionStats
      .filter((s) => s.userId === user.id && isWeakStat(s))
      .map((s) => s.questionId);
    const questions = weakIds
      .map((id) => findQuestion(id, locale))
      .filter((q): q is Question => q !== undefined);
    return HttpResponse.json(questions);
  }),

  http.get('/api/questions', ({ request }) => {
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
    const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get('pageSize') ?? '10')));
    const tags = url.searchParams.getAll('tags').filter(Boolean);
    const search = (url.searchParams.get('search') ?? '').trim().toLowerCase();

    let items = allQuestions(localeOf(request));
    if (tags.length > 0) {
      items = items.filter((q) => tags.some((t) => q.tags.includes(t)));
    }
    if (search) {
      items = items.filter(
        (q) =>
          q.prompt.toLowerCase().includes(search) ||
          q.tags.some((t) => t.toLowerCase().includes(search)),
      );
    }
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    return HttpResponse.json({
      items: items.slice(start, start + pageSize),
      page,
      pageSize,
      total,
      totalPages,
    });
  }),

  http.get('/api/questions/:id', ({ request, params }) => {
    const question = findQuestion(String(params.id), localeOf(request));
    if (!question) return HttpResponse.json({ message: 'Question not found' }, { status: 404 });
    return HttpResponse.json(question);
  }),

  http.post('/api/questions/:id/submit', async ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    const question = findQuestion(String(params.id), 'en');
    if (!question) return HttpResponse.json({ message: 'Question not found' }, { status: 404 });

    const { answer } = (await request.json()) as { answer: AnswerValue };
    const correctAnswer = correctAnswerOf(question);
    const correct = answer === correctAnswer;
    recordAnswer(user.id, question.id, String(answer), correct);
    return HttpResponse.json({ questionId: question.id, correct, correctAnswer });
  }),

  http.get('/api/questions/:id/comments', ({ params }) => {
    const comments = db.comments
      .filter((c) => c.questionId === params.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return HttpResponse.json(comments);
  }),

  http.post('/api/questions/:id/comments', async ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    const { body } = (await request.json()) as { body: string };
    const comment = {
      id: nextId('c'),
      questionId: String(params.id),
      userId: user.id,
      userName: user.name,
      body,
      createdAt: new Date().toISOString(),
    };
    db.comments.push(comment);
    return HttpResponse.json(comment, { status: 201 });
  }),

  http.get('/api/questions/:id/notes', ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    const note = db.notes.find((n) => n.userId === user.id && n.questionId === params.id);
    return HttpResponse.json(note ?? null);
  }),

  http.put('/api/questions/:id/notes', async ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    const { body } = (await request.json()) as { body: string };
    const existing = db.notes.find((n) => n.userId === user.id && n.questionId === params.id);
    const now = new Date().toISOString();
    if (existing) {
      existing.body = body;
      existing.updatedAt = now;
      return HttpResponse.json(existing);
    }
    const note = {
      id: nextId('n'),
      userId: user.id,
      questionId: String(params.id),
      body,
      updatedAt: now,
    };
    db.notes.push(note);
    return HttpResponse.json(note, { status: 201 });
  }),

  http.get('/api/questions/:id/stats', ({ request, params }) => {
    const question = findQuestion(String(params.id), localeOf(request));
    if (!question) return HttpResponse.json({ message: 'Question not found' }, { status: 404 });
    const counts = db.answerCounts[question.id] ?? {};
    const optionEntries =
      question.type === 'multiple-choice'
        ? question.options.map((o) => ({ optionId: o.id, label: `${o.id}` }))
        : [
            { optionId: 'true', label: 'True' },
            { optionId: 'false', label: 'False' },
          ];
    const totalResponses = Object.values(counts).reduce((a, b) => a + b, 0);
    const distribution: AnswerStat[] = optionEntries.map(({ optionId, label }) => {
      const count = counts[optionId] ?? 0;
      return {
        optionId,
        label,
        count,
        percentage: totalResponses === 0 ? 0 : Math.round((count / totalResponses) * 1000) / 10,
      };
    });
    return HttpResponse.json({ questionId: question.id, totalResponses, distribution });
  }),

  http.post('/api/questions/:id/bug-reports', async ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    const { message } = (await request.json()) as { message: string };
    const report = {
      id: nextId('bug'),
      questionId: String(params.id),
      userId: user.id,
      message,
      createdAt: new Date().toISOString(),
      status: 'open' as const,
    };
    db.bugReports.push(report);
    return HttpResponse.json(report, { status: 201 });
  }),

  http.post('/api/questions/:id/bookmark', ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    const questionId = String(params.id);
    const index = db.bookmarks.findIndex(
      (b) => b.userId === user.id && b.questionId === questionId,
    );
    if (index >= 0) {
      db.bookmarks.splice(index, 1);
      return HttpResponse.json({ bookmarked: false });
    }
    db.bookmarks.push({
      id: nextId('bm'),
      userId: user.id,
      questionId,
      createdAt: new Date().toISOString(),
    });
    return HttpResponse.json({ bookmarked: true });
  }),

  http.get('/api/bookmarks', ({ request }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    const locale = localeOf(request);
    const questions = db.bookmarks
      .filter((b) => b.userId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((b) => findQuestion(b.questionId, locale))
      .filter((q): q is Question => q !== undefined);
    return HttpResponse.json(questions);
  }),

  http.get('/api/tags', () =>
    HttpResponse.json([...new Set(db.questions.flatMap((s) => s.question.tags))].sort()),
  ),

  // Admin-only content authoring (mirrors a future real backend's gate).
  http.post('/api/questions', async ({ request }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    if (user.role !== 'admin') return forbidden();
    const body = (await request.json()) as CreateQuestionBody;
    const id = nextId('q');
    const base = {
      id,
      prompt: body.prompt,
      tags: body.tags,
      difficulty: body.difficulty,
      explanation: body.explanation,
    };
    const question: Question =
      body.type === 'multiple-choice'
        ? {
            ...base,
            type: 'multiple-choice',
            options: body.options ?? [],
            correctOptionId: body.correctOptionId ?? 'A',
          }
        : { ...base, type: 'true-false', correctAnswer: body.correctAnswer ?? true };
    db.questions.push({ question });
    // optional linking: attach this question to existing materials
    for (const materialId of body.relatedMaterialIds ?? []) {
      const material = db.materials.find((m) => m.id === materialId);
      if (material) {
        material.relatedQuestionIds = [...(material.relatedQuestionIds ?? []), id];
      }
    }
    return HttpResponse.json(question, { status: 201 });
  }),
];
