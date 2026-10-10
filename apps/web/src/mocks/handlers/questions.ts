import { http, HttpResponse } from 'msw';

import { correctAnswerOf, isAnswerCorrect } from '@/features/questions/grading';
import type { AnswerStat, AnswerValue, Question } from '@/features/questions/types';
import type { MultipleChoiceOption } from '@/features/questions/types';
import { isWeakStat } from '@/features/weak-spots';

import { ANSWERS_BUCKET, db, nextId, recordAnswer, statKeys } from '../db';
import {
  allQuestions,
  currentUser,
  findQuestion,
  forbidden,
  localeOf,
  unauthorized,
} from './utils';

export interface CreateQuestionBody {
  type: Question['type'];
  prompt: string;
  tags: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  explanation: string;
  options?: MultipleChoiceOption[];
  correctOptionId?: string;
  correctOptionIds?: string[];
  correctAnswer?: boolean;
  code?: string;
  codeLanguage?: string;
  expectedOutput?: string;
  relatedMaterialIds?: string[];
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
    const ids = (url.searchParams.get('ids') ?? '').split(',').filter(Boolean);
    const pageSize = Math.min(
      Math.max(50, ids.length),
      Math.max(1, Number(url.searchParams.get('pageSize') ?? '10')),
    );
    const tags = url.searchParams.getAll('tags').filter(Boolean);
    const search = (url.searchParams.get('search') ?? '').trim().toLowerCase();
    const difficulties = url.searchParams.getAll('difficulty');
    const status = url.searchParams.get('status');
    const sort = url.searchParams.get('sort');

    let items = allQuestions(localeOf(request));
    if (ids.length > 0) {
      // a specific set, e.g. a test's questions, in the order asked for
      items = ids
        .map((id) => items.find((q) => q.id === id))
        .filter((q): q is Question => q !== undefined);
    }
    if (tags.length > 0) {
      items = items.filter((q) => tags.some((t) => q.tags.includes(t)));
    }
    if (difficulties.length > 0) {
      items = items.filter(
        (q) => q.difficulty !== undefined && difficulties.includes(q.difficulty),
      );
    }
    if (search) {
      items = items.filter(
        (q) =>
          q.prompt.toLowerCase().includes(search) ||
          q.tags.some((t) => t.toLowerCase().includes(search)),
      );
    }
    // Per-user status, ignored for anonymous callers (same as the Go API).
    const user = currentUser(request);
    if (user && status) {
      const statOf = (id: string) =>
        db.userQuestionStats.find((s) => s.userId === user.id && s.questionId === id);
      const keep: Record<string, (q: Question) => boolean> = {
        unanswered: (q) => !statOf(q.id),
        answered: (q) => !!statOf(q.id),
        wrong: (q) => {
          const s = statOf(q.id);
          return !!s && s.timesCorrect < s.timesAnswered;
        },
        bookmarked: (q) => db.bookmarks.some((b) => b.userId === user.id && b.questionId === q.id),
      };
      if (keep[status]) items = items.filter(keep[status]);
    }
    if (sort === 'newest') {
      items = [...items].reverse();
    } else if (sort === 'random') {
      const seed = url.searchParams.get('seed') ?? '';
      const hash = (s: string) => [...s].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0, 7);
      items = [...items].sort((a, b) => hash(a.id + seed) - hash(b.id + seed));
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
    const correct = isAnswerCorrect(question, answer);
    const nextReviewAt = recordAnswer(
      user.id,
      question.id,
      statKeys(question, answer, correct),
      correct,
    );
    return HttpResponse.json({
      questionId: question.id,
      correct,
      correctAnswer,
      nextReviewAt,
      feedback: feedbackFor(question, answer),
    });
  }),

  http.get('/api/questions/:id/comments', ({ request, params }) => {
    const viewer = currentUser(request);
    const admin = viewer?.role === 'admin';
    const comments = db.comments
      .filter((c) => c.questionId === params.id && (admin || !c.hiddenAt))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(({ hiddenAt, ...c }) => ({
        ...c,
        hidden: !!hiddenAt,
        reportedByMe: db.commentReports.some(
          (r) => r.commentId === c.id && r.userId === viewer?.id,
        ),
      }));
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
      question.type === 'multiple-choice' || question.type === 'multi-select'
        ? question.options.map((o) => ({ optionId: o.id, label: `${o.id}` }))
        : question.type === 'true-false'
          ? [
              { optionId: 'true', label: 'True' },
              { optionId: 'false', label: 'False' },
            ]
          : [
              { optionId: 'correct', label: 'Correct' },
              { optionId: 'incorrect', label: 'Incorrect' },
            ];
    // One multi-select answer picks several options, so its total is kept in
    // its own bucket instead of summing the picks.
    const totalResponses =
      question.type === 'multi-select'
        ? (counts[ANSWERS_BUCKET] ?? 0)
        : Object.values(counts).reduce((a, b) => a + b, 0);
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
    const question = buildQuestion(nextId('q'), body);
    db.questions.push({ question });
    recordRevision(question.id, 'created', body, user.name);
    linkMaterials(question.id, body.relatedMaterialIds ?? []);
    return HttpResponse.json(question, { status: 201 });
  }),

  http.put('/api/questions/:id', async ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    if (user.role !== 'admin') return forbidden();
    const seed = db.questions.find((s) => s.question.id === params.id);
    if (!seed) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    const body = (await request.json()) as CreateQuestionBody;
    if (!db.revisions.some((r) => r.questionId === seed.question.id)) {
      recordRevision(seed.question.id, 'original', asInput(seed.question));
    }
    recordRevision(seed.question.id, 'edited', body, user.name);
    seed.question = buildQuestion(seed.question.id, body);
    seed.translations = undefined; // the content changed, so old translations no longer apply
    linkMaterials(seed.question.id, body.relatedMaterialIds ?? []);
    return HttpResponse.json(seed.question);
  }),

  // Cascades like the database: answers, bookmarks, notes, comments, reports
  // and test membership go with the question.
  http.delete('/api/questions/:id', ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    if (user.role !== 'admin') return forbidden();
    const id = String(params.id);
    if (!db.questions.some((s) => s.question.id === id)) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    const keep = <T extends { questionId: string }>(xs: T[]) =>
      xs.filter((x) => x.questionId !== id);
    db.questions = db.questions.filter((s) => s.question.id !== id);
    db.bookmarks = keep(db.bookmarks);
    db.notes = keep(db.notes);
    db.comments = keep(db.comments);
    db.bugReports = keep(db.bugReports);
    db.userQuestionStats = keep(db.userQuestionStats);
    delete db.answerCounts[id];
    for (const test of db.tests) test.questionIds = test.questionIds.filter((q) => q !== id);
    linkMaterials(id, []);
    return new HttpResponse(null, { status: 204 });
  }),
];

export function buildQuestion(id: string, body: CreateQuestionBody): Question {
  const base = {
    id,
    prompt: body.prompt,
    tags: body.tags,
    difficulty: body.difficulty,
    explanation: body.explanation,
  };
  // feedback goes to its own table, like the API: public questions don't carry it
  const raw = body.options ?? [];
  const correctIds =
    body.type === 'multi-select' ? (body.correctOptionIds ?? []) : [body.correctOptionId ?? 'A'];
  db.optionFeedback[id] = Object.fromEntries(
    raw
      .filter((o) => body.type !== 'ordering' && !correctIds.includes(o.id))
      .filter((o) => o.feedback?.trim() || o.materialId)
      .map((o) => [
        o.id,
        { feedback: o.feedback?.trim() || undefined, materialId: o.materialId || undefined },
      ]),
  );
  const options = raw.map(({ id: optionId, label }) => ({ id: optionId, label }));
  switch (body.type) {
    case 'multiple-choice':
      return {
        ...base,
        type: 'multiple-choice',
        options,
        correctOptionId: body.correctOptionId ?? 'A',
      };
    case 'multi-select':
      return {
        ...base,
        type: 'multi-select',
        options,
        correctOptionIds: body.correctOptionIds ?? [],
      };
    case 'ordering': // options arrive in the correct order
      return { ...base, type: 'ordering', options, correctOrder: options.map((o) => o.id) };
    case 'output':
      return {
        ...base,
        type: 'output',
        code: body.code ?? '',
        codeLanguage: body.codeLanguage ?? 'js',
        expectedOutput: body.expectedOutput ?? '',
      };
    case 'flashcard':
      return { ...base, type: 'flashcard' };
    default:
      return { ...base, type: 'true-false', correctAnswer: body.correctAnswer ?? true };
  }
}

/** Makes exactly these materials link to the question (optional linking). */
export function linkMaterials(questionId: string, materialIds: string[]) {
  for (const material of db.materials) {
    const others = (material.relatedQuestionIds ?? []).filter((q) => q !== questionId);
    const linked = materialIds.includes(material.id) ? [...others, questionId] : others;
    material.relatedQuestionIds = linked.length > 0 ? linked : undefined;
  }
}

/** Mirrors store.recordRevision. */
export function recordRevision(
  questionId: string,
  kind: 'created' | 'edited' | 'restored' | 'original',
  snapshot: unknown,
  editorName?: string,
  restoredFrom?: number,
) {
  db.revisions.push({
    id: db.revisions.length + 1,
    questionId,
    kind,
    editorName,
    snapshot,
    createdAt: new Date().toISOString(),
    restoredFrom,
  });
}

/** A stored question back in the admin form's shape (mirrors Question.asInput). */
export function asInput(q: Question) {
  const { id: _id, correctOrder, ...rest } = q as Question & { correctOrder?: string[] };
  if (q.type === 'ordering' && correctOrder) {
    return { ...rest, options: correctOrder.map((id) => q.options.find((o) => o.id === id)!) };
  }
  return rest;
}

/** Mirrors store.feedbackFor: notes on the wrong options someone picked. */
export function feedbackFor(question: Question, answer: AnswerValue | undefined) {
  if (question.type !== 'multiple-choice' && question.type !== 'multi-select') return undefined;
  const picked = Array.isArray(answer) ? answer : typeof answer === 'string' ? [answer] : [];
  const correct =
    question.type === 'multi-select' ? question.correctOptionIds : [question.correctOptionId];
  const notes = db.optionFeedback[question.id] ?? {};
  const out = picked
    .filter((id) => !correct.includes(id) && notes[id])
    .map((id) => {
      const m = notes[id].materialId
        ? db.materials.find((x) => x.id === notes[id].materialId)
        : undefined;
      return {
        optionId: id,
        text: notes[id].feedback,
        material: m && { id: m.id, type: m.type, title: m.title, url: m.url, author: m.author },
      };
    });
  return out.length ? out : undefined;
}
