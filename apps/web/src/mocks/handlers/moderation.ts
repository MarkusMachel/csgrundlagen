import { http, HttpResponse } from 'msw';

import type { CommentReportReason } from '@/features/questions/types';

import { db } from '../db';
import { currentUser, forbidden, unauthorized } from './utils';

/** Mirrors apps/api/internal/httpapi/moderation.go. */
const notFound = () => HttpResponse.json({ message: 'Not found' }, { status: 404 });
const open = (commentId: string) =>
  db.commentReports.filter((r) => r.commentId === commentId && !r.resolved);

export const moderationHandlers = [
  http.post('/api/comments/:id/report', async ({ request, params }) => {
    const me = currentUser(request);
    if (!me) return unauthorized();
    const { reason, note } = (await request.json()) as {
      reason: CommentReportReason;
      note?: string;
    };
    if (!['spam', 'offensive', 'misleading', 'other'].includes(reason)) {
      return HttpResponse.json({ message: 'invalid reason' }, { status: 400 });
    }
    const comment = db.comments.find((c) => c.id === params.id && !c.hiddenAt);
    if (!comment) return notFound();
    if (comment.userId === me.id) {
      return HttpResponse.json({ message: "you can't report your own comment" }, { status: 400 });
    }
    if (!db.commentReports.some((r) => r.commentId === comment.id && r.userId === me.id)) {
      db.commentReports.push({
        commentId: comment.id,
        userId: me.id,
        reason,
        note,
        createdAt: new Date().toISOString(),
      });
    }
    return new HttpResponse(null, { status: 204 });
  }),

  http.delete('/api/comments/:id', ({ request, params }) => {
    const me = currentUser(request);
    if (!me) return unauthorized();
    const comment = db.comments.find((c) => c.id === params.id);
    if (!comment || (comment.userId !== me.id && me.role !== 'admin')) return notFound();
    db.comments = db.comments.filter((c) => c !== comment);
    db.commentReports = db.commentReports.filter((r) => r.commentId !== comment.id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/api/admin/comments', ({ request }) => {
    const me = currentUser(request);
    if (!me) return unauthorized();
    if (me.role !== 'admin') return forbidden();
    const filter = new URL(request.url).searchParams.get('filter') ?? 'reported';
    const items = db.comments
      .filter((c) =>
        filter === 'hidden' ? !!c.hiddenAt : filter === 'all' ? true : open(c.id).length > 0,
      )
      .map((c) => ({
        ...c,
        hidden: !!c.hiddenAt,
        questionPrompt:
          db.questions.find((q) => q.question.id === c.questionId)?.question.prompt ?? '',
        openReports: open(c.id).map((r) => ({
          reason: r.reason,
          note: r.note,
          userName: db.users.find((u) => u.id === r.userId)?.name ?? '',
          createdAt: r.createdAt,
        })),
      }));
    const openReports = new Set(
      db.commentReports.filter((r) => !r.resolved).map((r) => r.commentId),
    ).size;
    return HttpResponse.json({ items, openReports });
  }),

  http.patch('/api/admin/comments/:id', async ({ request, params }) => {
    const me = currentUser(request);
    if (!me) return unauthorized();
    if (me.role !== 'admin') return forbidden();
    const comment = db.comments.find((c) => c.id === params.id);
    if (!comment) return notFound();
    const { hidden } = (await request.json()) as { hidden?: boolean };
    if (hidden === true) comment.hiddenAt ??= new Date().toISOString();
    if (hidden === false) comment.hiddenAt = undefined;
    if (hidden !== false) open(comment.id).forEach((r) => (r.resolved = true));
    return new HttpResponse(null, { status: 204 });
  }),
];
