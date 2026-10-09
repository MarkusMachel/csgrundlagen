import { Bookmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { QuestionCard, useBookmarkedQuestions } from '@/features/questions';
import { EmptyState, ErrorState, Spinner } from '@/shared/ui';

export function BookmarksPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: questions, isPending, isError, refetch } = useBookmarkedQuestions();

  return (
    <div className="stack">
      <h1>
        <span className="tok-com">{'// '}</span>
        {t('bookmarks.title')}
      </h1>
      {isPending ? (
        <Spinner center />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : questions.length === 0 ? (
        <EmptyState
          title={t('bookmarks.empty')}
          description={t('bookmarks.emptyHint')}
          actionLabel={t('bookmarks.goHome')}
          onAction={() => navigate('/')}
          glyph={<Bookmark size={28} />}
        />
      ) : (
        questions.map((q) => <QuestionCard key={q.id} question={q} mode="feed" />)
      )}
    </div>
  );
}
