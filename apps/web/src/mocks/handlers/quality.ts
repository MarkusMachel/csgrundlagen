import { http, HttpResponse } from 'msw';

import { db } from '../db';
import { buildQuestion, linkMaterials, recordRevision, type CreateQuestionBody } from './questions';
import { currentUser, forbidden, unauthorized } from './utils';

/** Mirrors store.QualityReport and the revision endpoints. */
const MIN = 10;

function adminOnly(request: Request) {
  const me = currentUser(request);
  if (!me) return { error: unauthorized() };
  if (me.role !== 'admin') return { error: forbidden() };
  return { me };
}

export const qualityHandlers = [
  http.get('/api/questions/:id/revisions', ({ request, params }) => {
    const { error } = adminOnly(request);
    if (error) return error;
    if (!db.questions.some((s) => s.question.id === params.id)) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    const revs = db.revisions
      .filter((r) => r.questionId === params.id)
      .reverse()
      .map(({ questionId: _q, ...r }) => r);
    return HttpResponse.json(revs);
  }),

  http.post('/api/questions/:id/revisions/:rid/restore', ({ request, params }) => {
    const { error, me } = adminOnly(request);
    if (error) return error;
    const rev = db.revisions.find((r) => r.questionId === params.id && r.id === Number(params.rid));
    const seed = db.questions.find((s) => s.question.id === params.id);
    if (!rev || !seed) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    // the snapshot is in the admin form's shape, like a PUT body
    const body = rev.snapshot as CreateQuestionBody;
    seed.question = buildQuestion(seed.question.id, body);
    seed.translations = undefined;
    linkMaterials(seed.question.id, body.relatedMaterialIds ?? []);
    recordRevision(seed.question.id, 'restored', rev.snapshot, me!.name, rev.id);
    return HttpResponse.json(seed.question);
  }),

  http.get('/api/admin/quality', ({ request }) => {
    const { error } = adminOnly(request);
    if (error) return error;
    const flagCounts: Record<string, number> = {};
    let analysed = 0;
    let tooFew = 0;
    const items = db.questions.map(({ question: q }) => {
      const counts = db.answerCounts[q.id] ?? {};
      const options =
        q.type === 'multiple-choice' || q.type === 'multi-select'
          ? q.options.map((o) => ({
              id: o.id,
              label: o.label,
              correct:
                q.type === 'multiple-choice'
                  ? o.id === q.correctOptionId
                  : q.correctOptionIds.includes(o.id),
              picks: counts[o.id] ?? 0,
              share: 0,
            }))
          : undefined;
      let answers: number;
      let correct: number;
      if (q.type === 'true-false') {
        answers = (counts.true ?? 0) + (counts.false ?? 0);
        correct = counts[String(q.correctAnswer)] ?? 0;
      } else if (q.type === 'multi-select') {
        answers = counts.__answers ?? 0;
        correct = Math.min(...(options ?? []).filter((o) => o.correct).map((o) => o.picks));
      } else if (options) {
        answers = options.reduce((n, o) => n + o.picks, 0);
        correct = options.find((o) => o.correct)?.picks ?? 0;
      } else {
        answers = (counts.correct ?? 0) + (counts.incorrect ?? 0);
        correct = counts.correct ?? 0;
      }
      options?.forEach((o) => (o.share = answers ? o.picks / answers : 0));
      const rate = answers ? correct / answers : 0;
      const openBugs = db.bugReports.filter(
        (b) => b.questionId === q.id && (b.status ?? 'open') === 'open',
      ).length;
      const flags: string[] = [];
      if (openBugs > 0) flags.push('open_bug_reports');
      if (answers < MIN) tooFew++;
      else {
        analysed++;
        if (rate >= 0.95) flags.push('too_easy');
        if (rate <= 0.3) flags.push('too_hard');
        if (q.type === 'multiple-choice' && options!.some((o) => !o.correct && o.picks > correct)) {
          flags.push('wrong_key');
        }
        if (answers >= 20 && options?.some((o) => !o.correct && o.share < 0.03))
          flags.push('dead_distractor');
      }
      flags.forEach((f) => (flagCounts[f] = (flagCounts[f] ?? 0) + 1));
      return {
        questionId: q.id,
        prompt: q.prompt,
        type: q.type,
        tags: q.tags,
        answers,
        correctRate: rate,
        flags,
        options,
        openBugs,
      };
    });
    const weight = (it: { flags: string[] }) =>
      it.flags.reduce((w, f) => w + (f === 'wrong_key' || f === 'open_bug_reports' ? 10 : 1), 0);
    items.sort((a, b) => weight(b) - weight(a) || b.answers - a.answers);
    return HttpResponse.json({ minAnswers: MIN, analysed, tooFew, items, flagCounts });
  }),
];
