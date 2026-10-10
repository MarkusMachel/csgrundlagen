import { zodResolver } from '@hookform/resolvers/zod';
import { Flag, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { EmptyState, ErrorState, Modal, Spinner } from '@/shared/ui';
import { isSignInCancelled } from '@/stores/useAuthPrompt';
import { useAuthStore } from '@/stores/useAuthStore';

import {
  useAddComment,
  useDeleteComment,
  useQuestionComments,
  useReportComment,
} from '../../hooks/useQuestionExtras';
import type { CommentReportReason, QuestionComment } from '../../types';

const commentSchema = z.object({ body: z.string().trim().min(1) });
type CommentForm = z.infer<typeof commentSchema>;

const REASONS: CommentReportReason[] = ['spam', 'offensive', 'misleading', 'other'];

export function CommentsTab({ questionId }: { questionId: string }) {
  const { t, i18n } = useTranslation();
  const me = useAuthStore((s) => s.user);
  const { data: comments, isPending, isError, refetch } = useQuestionComments(questionId);
  const addComment = useAddComment(questionId);
  const deleteComment = useDeleteComment(questionId);
  const [reporting, setReporting] = useState<QuestionComment | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const form = useForm<CommentForm>({
    resolver: zodResolver(commentSchema),
    defaultValues: { body: '' },
  });

  const onSubmit = form.handleSubmit(async ({ body }) => {
    await addComment.mutateAsync(body);
    form.reset();
  });

  if (isPending) return <Spinner />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;

  return (
    <div className="stack" style={{ gap: 10 }}>
      {comments.length === 0 ? (
        <EmptyState title={t('question.comments.empty')} glyph="//" />
      ) : (
        <div>
          {comments.map((c) => {
            const mine = c.userId === me?.id;
            return (
              <div
                key={c.id}
                className={c.hidden ? 'comment-item comment-item--hidden' : 'comment-item'}
              >
                <span className="comment-avatar" aria-hidden>
                  {c.userName.charAt(0)}
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="comment-meta">
                    <strong style={{ color: 'var(--text)' }}>{c.userName}</strong>{' '}
                    {new Date(c.createdAt).toLocaleDateString(i18n.language)}
                    {c.hidden && (
                      <span className="chip chip--danger">{t('question.comments.hidden')}</span>
                    )}
                  </div>
                  <div>{c.body}</div>
                </div>
                <div className="comment-actions">
                  {me &&
                    !mine &&
                    !c.hidden &&
                    (c.reportedByMe ? (
                      <span className="muted comment-actions__done">
                        {t('question.comments.reported')}
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn--icon"
                        aria-label={t('question.comments.reportLabel', { name: c.userName })}
                        title={t('question.comments.report')}
                        onClick={() => setReporting(c)}
                      >
                        <Flag size={14} aria-hidden />
                      </button>
                    ))}
                  {me &&
                    (mine || me.role === 'admin') &&
                    (confirmingId === c.id ? (
                      <span className="hstack" style={{ gap: 4 }}>
                        <button
                          type="button"
                          className="btn btn--small btn--danger"
                          disabled={deleteComment.isPending}
                          onClick={() =>
                            deleteComment.mutate(c.id, { onSettled: () => setConfirmingId(null) })
                          }
                        >
                          {t('question.comments.confirmDelete')}
                        </button>
                        <button
                          type="button"
                          className="btn btn--small btn--ghost"
                          onClick={() => setConfirmingId(null)}
                        >
                          {t('common.cancel')}
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn--icon"
                        aria-label={t('question.comments.deleteLabel', { name: c.userName })}
                        title={t('question.comments.delete')}
                        onClick={() => setConfirmingId(c.id)}
                      >
                        <Trash2 size={14} aria-hidden />
                      </button>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <form onSubmit={onSubmit} className="hstack" style={{ alignItems: 'flex-start' }}>
        <input
          className="input"
          placeholder={t('question.comments.placeholder')}
          aria-label={t('question.comments.placeholder')}
          aria-invalid={!!form.formState.errors.body}
          {...form.register('body')}
        />
        <button type="submit" className="btn btn--primary" disabled={addComment.isPending}>
          {t('question.comments.post')}
        </button>
      </form>
      <ReportDialog
        questionId={questionId}
        comment={reporting}
        onClose={() => setReporting(null)}
      />
    </div>
  );
}

function ReportDialog({
  questionId,
  comment,
  onClose,
}: {
  questionId: string;
  comment: QuestionComment | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const noteId = useId();
  const report = useReportComment(questionId);
  const [reason, setReason] = useState<CommentReportReason>('spam');
  const [note, setNote] = useState('');

  const close = () => {
    setReason('spam');
    setNote('');
    report.reset();
    onClose();
  };

  return (
    <Modal
      open={!!comment}
      size="small"
      title={t('question.comments.reportTitle')}
      onClose={close}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={close}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={report.isPending}
            onClick={() =>
              comment &&
              report.mutate(
                { commentId: comment.id, reason, note: note.trim() || undefined },
                { onSuccess: close },
              )
            }
          >
            {t('question.comments.sendReport')}
          </button>
        </>
      }
    >
      {comment && (
        <blockquote className="report-quote">
          <strong>{comment.userName}:</strong> {comment.body}
        </blockquote>
      )}
      <fieldset className="report-reasons">
        <legend>{t('question.comments.why')}</legend>
        {REASONS.map((r) => (
          <label key={r} className="checkbox-row">
            <input
              type="radio"
              name="report-reason"
              checked={reason === r}
              onChange={() => setReason(r)}
            />
            {t(`question.comments.reason.${r}`)}
          </label>
        ))}
      </fieldset>
      <div className="field" style={{ marginTop: 10 }}>
        <label htmlFor={noteId}>{t('question.comments.note')}</label>
        <textarea
          id={noteId}
          className="input"
          rows={2}
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      {report.isError && !isSignInCancelled(report.error) && (
        <div className="alert alert--error" role="alert" style={{ marginTop: 10 }}>
          {t('common.errorTitle')}
        </div>
      )}
    </Modal>
  );
}
