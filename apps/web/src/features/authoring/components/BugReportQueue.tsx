import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useQuestion } from '@/features/questions';
import { EmptyState, ErrorState, Spinner } from '@/shared/ui';
import { toPlainText } from '@/shared/utils/richText';

import { useBugReports, useSetBugReportStatus } from '../hooks/useAuthoring';
import type { BugStatus } from '../types';
import { QuestionForm } from './QuestionForm';

const FILTERS: (BugStatus | '')[] = ['open', 'reviewed', 'closed', ''];

/** Admin queue for user bug reports: triage, fix the question, close. */
export function BugReportQueue() {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState<BugStatus | ''>('open');
  const [editingId, setEditingId] = useState<string | null>(null);
  const reports = useBugReports(status);
  const setReportStatus = useSetBugReportStatus();

  if (editingId) return <EditReportedQuestion id={editingId} onDone={() => setEditingId(null)} />;

  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="filters__group" role="group" aria-label={t('authoring.bugs.filter')}>
        {FILTERS.map((s) => (
          <button
            key={s || 'all'}
            type="button"
            className="toggle-chip"
            aria-pressed={status === s}
            onClick={() => setStatus(s)}
          >
            {t(`authoring.bugs.status.${s || 'all'}`)}
          </button>
        ))}
      </div>
      {reports.isPending ? (
        <Spinner center />
      ) : reports.isError ? (
        <ErrorState onRetry={() => void reports.refetch()} />
      ) : reports.data.length === 0 ? (
        <EmptyState title={t('authoring.bugs.empty')} />
      ) : (
        <ul className="admin-list">
          {reports.data.map((r) => (
            <li key={r.id} className="admin-list__row admin-list__row--top">
              <div className="admin-list__main">
                <span className="admin-list__title">“{r.message}”</span>
                <span className="admin-list__meta">
                  {t('authoring.bugs.reportedBy', {
                    name: r.userName,
                    date: new Date(r.createdAt).toLocaleDateString(i18n.language),
                  })}{' '}
                  ·{' '}
                  <span className={`bug-status bug-status--${r.status}`}>
                    {t(`authoring.bugs.status.${r.status}`)}
                  </span>
                </span>
                <Link to={`/questions/${r.questionId}`} className="admin-list__meta">
                  {toPlainText(r.questionPrompt).split('\n')[0]}
                </Link>
              </div>
              <div className="admin-list__actions">
                <button
                  type="button"
                  className="btn btn--small btn--ghost"
                  onClick={() => setEditingId(r.questionId)}
                >
                  <Pencil size={14} aria-hidden />
                  {t('authoring.bugs.editQuestion')}
                </button>
                {r.status !== 'reviewed' && r.status !== 'closed' && (
                  <button
                    type="button"
                    className="btn btn--small"
                    onClick={() => setReportStatus.mutate({ id: r.id, status: 'reviewed' })}
                  >
                    {t('authoring.bugs.markReviewed')}
                  </button>
                )}
                {r.status !== 'closed' ? (
                  <button
                    type="button"
                    className="btn btn--small"
                    onClick={() => setReportStatus.mutate({ id: r.id, status: 'closed' })}
                  >
                    {t('authoring.bugs.close')}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn--small btn--ghost"
                    onClick={() => setReportStatus.mutate({ id: r.id, status: 'open' })}
                  >
                    {t('authoring.bugs.reopen')}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EditReportedQuestion({ id, onDone }: { id: string; onDone: () => void }) {
  const { t } = useTranslation();
  const { data, isPending, isError } = useQuestion(id);
  if (isPending) return <Spinner center />;
  if (isError || !data) return <ErrorState />;
  return (
    <div className="stack" style={{ gap: 12 }}>
      <h2 style={{ margin: 0 }}>{t('authoring.editQuestion')}</h2>
      {data.type === 'design' ? (
        <p className="alert alert--info">{t('authoring.designSeedOnly')}</p>
      ) : (
        <QuestionForm question={data} onSaved={onDone} onCancel={onDone} />
      )}
    </div>
  );
}
