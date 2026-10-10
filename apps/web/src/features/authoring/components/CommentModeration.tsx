import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { EmptyState, ErrorState, Spinner } from '@/shared/ui';
import { toPlainText } from '@/shared/utils/richText';

import { ConfirmDeleteButton } from './ConfirmDeleteButton';
import {
  useAdminDeleteComment,
  useModerateComment,
  useModerationQueue,
  type ModerationFilter,
} from '../hooks/useModeration';

const FILTERS: ModerationFilter[] = ['reported', 'hidden', 'all'];

/** Admin queue: reported comments first; hide, dismiss or delete them. */
export function CommentModeration() {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState<ModerationFilter>('reported');
  const queue = useModerationQueue(filter);
  const moderate = useModerateComment();
  const remove = useAdminDeleteComment();
  const day = (iso: string) => new Date(iso).toLocaleDateString(i18n.language);

  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="filters__group" role="group" aria-label={t('moderation.filter')}>
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className="toggle-chip"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {t(`moderation.filters.${f}`)}
          </button>
        ))}
      </div>
      {queue.isPending ? (
        <Spinner center />
      ) : queue.isError ? (
        <ErrorState onRetry={() => void queue.refetch()} />
      ) : queue.data.items.length === 0 ? (
        <EmptyState title={t(`moderation.empty.${filter}`)} />
      ) : (
        <ul className="admin-list">
          {queue.data.items.map((c) => (
            <li key={c.id} className="admin-list__row admin-list__row--top">
              <div className="admin-list__main">
                <span className="admin-list__title" style={{ whiteSpace: 'normal' }}>
                  “{c.body}”
                  {c.hidden && (
                    <span className="chip chip--danger">{t('question.comments.hidden')}</span>
                  )}
                </span>
                <span className="admin-list__meta">
                  {t('moderation.by', { name: c.userName, date: day(c.createdAt) })}
                </span>
                <Link to={`/questions/${c.questionId}`} className="admin-list__meta">
                  {toPlainText(c.questionPrompt).split('\n')[0]}
                </Link>
                {c.openReports.length > 0 && (
                  <ul className="report-list">
                    {c.openReports.map((r, i) => (
                      <li key={i}>
                        <span className="chip chip--warn">
                          {t(`question.comments.reason.${r.reason}`)}
                        </span>{' '}
                        {t('moderation.reportedBy', { name: r.userName, date: day(r.createdAt) })}
                        {r.note && <> — “{r.note}”</>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="admin-list__actions">
                <button
                  type="button"
                  className="btn btn--small"
                  disabled={moderate.isPending}
                  onClick={() => moderate.mutate({ id: c.id, hidden: !c.hidden })}
                >
                  {c.hidden ? <Eye size={14} aria-hidden /> : <EyeOff size={14} aria-hidden />}
                  {c.hidden ? t('moderation.unhide') : t('moderation.hide')}
                </button>
                {c.openReports.length > 0 && (
                  <button
                    type="button"
                    className="btn btn--small btn--ghost"
                    disabled={moderate.isPending}
                    onClick={() => moderate.mutate({ id: c.id })}
                  >
                    {t('moderation.dismiss')}
                  </button>
                )}
                <ConfirmDeleteButton
                  label={t('moderation.commentBy', { name: c.userName })}
                  pending={remove.isPending}
                  onConfirm={() => remove.mutate(c.id)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
