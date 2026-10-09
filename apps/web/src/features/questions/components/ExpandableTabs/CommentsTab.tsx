import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { EmptyState, ErrorState, Spinner } from '@/shared/ui';

import { useAddComment, useQuestionComments } from '../../hooks/useQuestionExtras';

const commentSchema = z.object({ body: z.string().trim().min(1) });
type CommentForm = z.infer<typeof commentSchema>;

export function CommentsTab({ questionId }: { questionId: string }) {
  const { t, i18n } = useTranslation();
  const { data: comments, isPending, isError, refetch } = useQuestionComments(questionId);
  const addComment = useAddComment(questionId);
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
          {comments.map((c) => (
            <div key={c.id} className="comment-item">
              <span className="comment-avatar" aria-hidden>
                {c.userName.charAt(0)}
              </span>
              <div style={{ minWidth: 0 }}>
                <div className="comment-meta">
                  <strong style={{ color: 'var(--text)' }}>{c.userName}</strong>{' '}
                  {new Date(c.createdAt).toLocaleDateString(i18n.language)}
                </div>
                <div>{c.body}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={onSubmit} className="hstack" style={{ alignItems: 'flex-start' }}>
        <input
          className="input"
          placeholder={t('question.comments.placeholder')}
          aria-invalid={!!form.formState.errors.body}
          {...form.register('body')}
        />
        <button type="submit" className="btn btn--primary" disabled={addComment.isPending}>
          {t('question.comments.post')}
        </button>
      </form>
    </div>
  );
}
