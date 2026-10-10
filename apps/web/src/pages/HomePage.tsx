import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AnkiExportButton } from '@/features/anki';
import { WelcomePanel } from '@/features/onboarding';
import {
  emptyFilters,
  QuestionCard,
  QuestionFeed,
  useDailyQuestion,
  type FilterState,
} from '@/features/questions';
import { Spinner } from '@/shared/ui';
import { scrollBehavior } from '@/shared/utils/motion';

export function HomePage() {
  const { t } = useTranslation();
  const daily = useDailyQuestion();
  const [filters, setFilters] = useState<FilterState>(emptyFilters);

  // Filters live in the left sidebar; the Question of the Day leads the main column.
  return (
    <QuestionFeed
      mode="feed"
      layout="sidebar"
      filters={filters}
      onFiltersChange={setFilters}
      lead={
        <>
          <WelcomePanel
            onPickTopic={(tag) => {
              setFilters({ ...emptyFilters, tags: [tag] });
              document
                .getElementById('question-feed-title')
                ?.scrollIntoView?.({ behavior: scrollBehavior() });
            }}
          />
          <section data-testid="question-of-the-day" style={{ marginBottom: 12 }}>
            <h1>
              <span className="tok-com">{'// '}</span>
              {t('home.questionOfTheDay')}
            </h1>
            {daily.isPending ? (
              <Spinner center />
            ) : daily.data ? (
              <QuestionCard question={daily.data} mode="feed" />
            ) : null}
          </section>
          <div
            className="hstack"
            style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}
          >
            <h2 id="question-feed-title" style={{ margin: 0, scrollMarginTop: 60 }}>
              <span className="tok-com">{'// '}</span>
              {t('home.feedTitle')}
            </h2>
            <AnkiExportButton
              source={{
                source: 'filter',
                tags: filters.tags,
                difficulties: filters.difficulties,
                search: filters.search,
                status: filters.status || undefined,
              }}
            />
          </div>
        </>
      }
    />
  );
}
