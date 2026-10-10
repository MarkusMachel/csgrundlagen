import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useQuestions, type Question } from '@/features/questions';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { EmptyState, ErrorState, Spinner } from '@/shared/ui';
import { toPlainText } from '@/shared/utils/richText';

import { ConfirmDeleteButton } from './ConfirmDeleteButton';
import { EditQuestionView } from './EditQuestionView';
import { useDeleteQuestion } from '../hooks/useAuthoring';

const PAGE_SIZE = 20;

/** Admin list of every question with edit and delete. */
export function QuestionManager() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Question | null>(null);
  const deleteQuestion = useDeleteQuestion();
  const { data, isPending, isError, refetch } = useQuestions({
    page,
    pageSize: PAGE_SIZE,
    search: useDebounce(search, 250),
    sort: 'newest',
  });

  if (editing) {
    return <EditQuestionView key={editing.id} question={editing} onDone={() => setEditing(null)} />;
  }

  return (
    <div className="stack" style={{ gap: 12 }}>
      <input
        type="search"
        className="input"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        placeholder={t('home.searchPlaceholder')}
        aria-label={t('home.searchPlaceholder')}
      />
      {isPending ? (
        <Spinner center />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : data.items.length === 0 ? (
        <EmptyState title={t('home.noResults')} />
      ) : (
        <>
          <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>
            {t('home.resultCount', { count: data.total })}
          </p>
          <ul className="admin-list">
            {data.items.map((q) => {
              const prompt = toPlainText(q.prompt).split('\n')[0];
              return (
                <li key={q.id} className="admin-list__row">
                  <div className="admin-list__main">
                    <span className="admin-list__title">{prompt}</span>
                    <span className="admin-list__meta">
                      {t(`authoring.type.${q.type}`)} · {q.tags.join(', ')}
                    </span>
                  </div>
                  <div className="admin-list__actions">
                    <button
                      type="button"
                      className="btn btn--small btn--ghost"
                      aria-label={t('authoring.editLabel', { label: prompt })}
                      onClick={() => setEditing(q)}
                    >
                      <Pencil size={14} aria-hidden />
                      {t('authoring.edit')}
                    </button>
                    <ConfirmDeleteButton
                      label={prompt}
                      pending={deleteQuestion.isPending}
                      onConfirm={() => deleteQuestion.mutate(q.id)}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          {data.totalPages > 1 && (
            <div className="hstack" style={{ gap: 8, justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn--small"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                {t('authoring.prevPage')}
              </button>
              <span className="muted" style={{ fontSize: 12.5 }}>
                {page} / {data.totalPages}
              </span>
              <button
                type="button"
                className="btn btn--small"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t('authoring.nextPage')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
