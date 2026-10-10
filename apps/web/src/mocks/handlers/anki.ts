import { http, HttpResponse } from 'msw';

import type { Question } from '@/features/questions/types';

import { db, nextId } from '../db';
import { buildQuestion, recordRevision } from './questions';
import { allQuestions, currentUser, forbidden, localeOf, unauthorized } from './utils';

/** Mirrors apps/api/internal/httpapi/anki.go (a simplified export body). */
const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
    .replace(/\t/g, '    ');

function exportLine(q: Question) {
  const tags = q.tags.map((t) => 'cs::' + t.split(/\s+/).join('_')).join(' ');
  return [esc(q.prompt), esc(q.explanation), tags, `cs-trainer-${q.id}`].join('\t');
}

export const ankiHandlers = [
  http.get('/api/export/anki', ({ request }) => {
    const me = currentUser(request);
    if (!me) return unauthorized();
    const url = new URL(request.url);
    const all = allQuestions(localeOf(request));
    let qs: Question[];
    if (url.searchParams.get('source') === 'bookmarks') {
      const ids = db.bookmarks.filter((b) => b.userId === me.id).map((b) => b.questionId);
      qs = all.filter((q) => ids.includes(q.id));
    } else if (url.searchParams.get('source') === 'test') {
      const test = db.tests.find((t) => t.id === url.searchParams.get('id') && t.ownerId === me.id);
      if (!test) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
      qs = all.filter((q) => test.questionIds.includes(q.id));
    } else {
      const tags = url.searchParams.getAll('tags');
      qs = tags.length ? all.filter((q) => q.tags.some((t) => tags.includes(t))) : all;
    }
    const body =
      '#separator:tab\n#html:true\n#notetype:Basic\n#deck:CS Trainer\n#tags column:3\n#guid column:4\n' +
      qs.map(exportLine).join('\n') +
      '\n';
    return new HttpResponse(body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="cs-trainer-anki.txt"',
      },
    });
  }),

  http.post('/api/admin/import/flashcards', async ({ request }) => {
    const me = currentUser(request);
    if (!me) return unauthorized();
    if (me.role !== 'admin') return forbidden();
    const { cards, defaultTags } = (await request.json()) as {
      cards: { front: string; back: string; tags: string[] }[];
      defaultTags: string[];
    };
    const result = { created: 0, skipped: 0, errors: [] as string[] };
    cards.forEach((c, i) => {
      const front = c.front.trim();
      const back = c.back.trim();
      if (!front || !back)
        return void result.errors.push(`card ${i + 1}: front and back are required`);
      if (
        db.questions.some((s) => s.question.type === 'flashcard' && s.question.prompt === front)
      ) {
        return void result.skipped++;
      }
      const tags = c.tags.length ? c.tags : defaultTags.length ? defaultTags : ['Imported'];
      const body = { type: 'flashcard' as const, prompt: front, explanation: back, tags };
      const question = buildQuestion(nextId('q'), body);
      db.questions.push({ question });
      recordRevision(question.id, 'created', body, me.name);
      result.created++;
    });
    return HttpResponse.json(result);
  }),
];
