import { TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { QuestionCard, useWeakQuestions } from '@/features/questions';
import { EmptyState, ErrorState, Spinner } from '@/shared/ui';

export function WeakSpotsPage() {
  const { t } = useTranslation();
  const { data: questions, isPending, isError, refetch } = useWeakQuestions();

  return (
    <div className="stack">
      <div>
        <h1 style={{ marginBottom: 4 }}>
          <span className="tok-com">{'// '}</span>
          {t('weakSpots.title')}
        </h1>
        <p className="muted" style={{ margin: 0 }}>
          {t('weakSpots.explainer')}
        </p>
      </div>
      {isPending ? (
        <Spinner center />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : questions.length === 0 ? (
        <EmptyState
          title={t('weakSpots.empty')}
          description={t('weakSpots.emptyHint')}
          glyph={<TrendingDown size={28} />}
        />
      ) : (
        questions.map((q) => <QuestionCard key={q.id} question={q} mode="feed" />)
      )}
    </div>
  );
}
