import { ChevronLeft, ChevronRight, SearchX } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { useDebounce } from '@/shared/hooks/useDebounce';
import { EmptyState, ErrorState, Spinner } from '@/shared/ui';
import { pageWindow } from '@/shared/utils/pageWindow';
import { useUIStore } from '@/stores/useUIStore';

import { QuestionCard } from './QuestionCard';
import { emptyFilters, QuestionFilters, type FilterState } from './QuestionFilters';
import { QuestionFilterSidebar } from './QuestionFilterSidebar';
import { useQuestions, useTags } from '../hooks/useQuestions';

const PAGE_SIZE = 10; // §15 open decision: 10 per page

interface QuestionFeedProps {
  mode: 'feed' | 'pick';
  selectedIds?: string[];
  onToggleSelect?: (questionId: string) => void;
  /**
   * 'bar' puts the filters in a row above the list; 'sidebar' puts them in a
   * sticky panel on the left edge and the page uses the full window width.
   */
  layout?: 'bar' | 'sidebar';
  /** Content above the results in the main column (sidebar layout), e.g. the Question of the Day. */
  lead?: ReactNode;
}

/**
 * Filterable, paginated question list shared by Home (feed mode) and the
 * Build-a-Test picker (pick mode). Rendering is a plain map over one page
 * (10 items) — swap for a virtualized list if page sizes ever grow (§12).
 */
export function QuestionFeed({
  mode,
  selectedIds = [],
  onToggleSelect,
  layout = 'bar',
  lead,
}: QuestionFeedProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const debouncedSearch = useDebounce(filters.search, 300);

  const { data: tags } = useTags();
  const { data, isPending, isError, refetch } = useQuestions({
    ...filters,
    page,
    pageSize: PAGE_SIZE,
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

  const filterProps = {
    value: filters,
    onChange: (next: FilterState) => {
      setFilters(next);
      setPage(1);
    },
    allTags: tags ?? [],
    total: data?.total,
  };

  const results = isPending ? (
    <Spinner center />
  ) : isError ? (
    <ErrorState onRetry={() => void refetch()} />
  ) : data.items.length === 0 ? (
    <EmptyState
      title={t('home.noResults')}
      description={t('home.noResultsHint')}
      glyph={<SearchX size={28} />}
    />
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
          {pageWindow(page, data.totalPages).map((p, i) =>
            p === 'gap' ? (
              <span key={`gap-${i}`} className="page-gap" aria-hidden>
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                className={p === page ? 'page-btn page-btn--current' : 'page-btn'}
                aria-current={p === page ? 'page' : undefined}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ),
          )}
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
  );

  if (layout === 'sidebar') {
    return (
      <div className="feed-layout">
        <aside className="feed-layout__sidebar">
          <QuestionFilterSidebar {...filterProps} />
        </aside>
        <div className="feed-layout__main stack">
          {lead}
          {results}
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <QuestionFilters {...filterProps} />
      {results}
    </div>
  );
}
