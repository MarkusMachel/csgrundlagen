import { ChevronLeft, ChevronRight, SearchX } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useDebounce } from '@/shared/hooks/useDebounce';
import { EmptyState, ErrorState, Spinner } from '@/shared/ui';
import { useUIStore } from '@/stores/useUIStore';

import { QuestionCard } from './QuestionCard';
import { useQuestions, useTags } from '../hooks/useQuestions';


const PAGE_SIZE = 10; // §15 open decision: 10 per page

interface QuestionFeedProps {
  mode: 'feed' | 'pick';
  selectedIds?: string[];
  onToggleSelect?: (questionId: string) => void;
}

/**
 * Filterable, paginated question list shared by Home (feed mode) and the
 * Build-a-Test picker (pick mode). Rendering is a plain map over one page
 * (10 items) — swap for a virtualized list if page sizes ever grow (§12).
 */
export function QuestionFeed({ mode, selectedIds = [], onToggleSelect }: QuestionFeedProps) {
  const { t } = useTranslation();
  const tagSelectId = useId();
  const [page, setPage] = useState(1);
  const [tag, setTag] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data: tags } = useTags();
  const { data, isPending, isError, refetch } = useQuestions({
    page,
    pageSize: PAGE_SIZE,
    tags: tag ? [tag] : [],
    search: debouncedSearch,
  });

  // Status-bar context: "question <page-window> of <total>" (mockup design).
  const setStatus = useUIStore((s) => s.setStatus);
  useEffect(() => {
    if (mode !== 'feed' || !data) return;
    setStatus(
      t('status.feedPosition', {
        from: (data.page - 1) * data.pageSize + 1,
        to: Math.min(data.page * data.pageSize, data.total),
        total: data.total,
      }),
    );
    return () => setStatus(null);
  }, [mode, data, setStatus, t]);

  return (
    <div className="stack">
      <div className="toolbar">
        <div className="field field--grow">
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
        </div>
        <div className="field">
          <label htmlFor={tagSelectId}>{t('home.filterByTag')}</label>
          <select
            id={tagSelectId}
            className="select"
            value={tag}
            onChange={(e) => {
              setTag(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t('home.allTags')}</option>
            {(tags ?? []).map((tg) => (
              <option key={tg} value={tg}>
                {tg}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isPending ? (
        <Spinner center />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : data.items.length === 0 ? (
        <EmptyState title={t('home.noResults')} description={t('home.noResultsHint')} glyph={<SearchX size={28} />} />
      ) : (
        <>
          <div className="stack" data-testid="question-feed">
            {data.items.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                mode={mode}
                selected={selectedIds.includes(question.id)}
                onToggleSelect={onToggleSelect}
              />
            ))}
          </div>
          {data.totalPages > 1 && (
            <nav className="pagination" aria-label="pagination">
              <button
                type="button"
                className="page-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                aria-label="previous page"
              >
                <ChevronLeft size={15} aria-hidden style={{ verticalAlign: '-2px' }} />
              </button>
              {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={p === page ? 'page-btn page-btn--current' : 'page-btn'}
                  aria-current={p === page ? 'page' : undefined}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className="page-btn"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                aria-label="next page"
              >
                <ChevronRight size={15} aria-hidden style={{ verticalAlign: '-2px' }} />
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
