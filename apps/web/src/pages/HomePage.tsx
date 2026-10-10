import { useTranslation } from 'react-i18next';

import { QuestionCard, QuestionFeed, useDailyQuestion } from '@/features/questions';
import { Spinner } from '@/shared/ui';

export function HomePage() {
  const { t } = useTranslation();
  const daily = useDailyQuestion();

  // Filters live in the left sidebar; the Question of the Day leads the main column.
  return (
    <QuestionFeed
      mode="feed"
      layout="sidebar"
      lead={
        <>
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
          <h2 style={{ margin: 0 }}>
            <span className="tok-com">{'// '}</span>
            {t('home.feedTitle')}
          </h2>
        </>
      }
    />
  );
}
