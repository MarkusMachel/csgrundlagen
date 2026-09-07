import { http, HttpResponse } from 'msw';

import type { SearchResults } from '@/features/search';

import { db } from '../db';
import { allQuestions, currentUser, localeOf } from './utils';
import { seedMaterials } from '../seed/materials';


export const searchHandlers = [
  http.get('/api/search', ({ request }) => {
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') ?? '').trim().toLowerCase();
    const user = currentUser(request);
    const empty: SearchResults = { questions: [], materials: [], tests: [] };
    if (!q) return HttpResponse.json(empty);

    const questions = allQuestions(localeOf(request))
      .filter(
        (question) =>
          question.prompt.toLowerCase().includes(q) ||
          question.tags.some((t) => t.toLowerCase().includes(q)),
      )
      .slice(0, 5)
      .map((question) => ({
        id: question.id,
        title: question.prompt,
        subtitle: question.tags.join(', '),
      }));

    const materials = seedMaterials
      .filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q) ||
          m.tags.some((t) => t.toLowerCase().includes(q)),
      )
      .slice(0, 5)
      .map((m) => ({ id: m.id, title: m.title, subtitle: m.type }));

    const tests = user
      ? db.tests
          .filter((t) => t.ownerId === user.id && t.name.toLowerCase().includes(q))
          .slice(0, 5)
          .map((t) => ({ id: t.id, title: t.name, subtitle: `${t.questionIds.length} questions` }))
      : [];

    return HttpResponse.json({ questions, materials, tests });
  }),
];
