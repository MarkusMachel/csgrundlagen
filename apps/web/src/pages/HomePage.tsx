import { useTranslation } from 'react-i18next';

import { QuestionCard, QuestionFeed, useDailyQuestion } from '@/features/questions';
import { Spinner } from '@/shared/ui';

export function HomePage() {
  const { t } = useTranslation();
  const daily = useDailyQuestion();

  return (
    <div className="stack" style={{ gap: 28 }}>
      <section data-testid="question-of-the-day">
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

      <section>
        <h2>
          <span className="tok-com">{'// '}</span>
          {t('home.feedTitle')}
        </h2>
        <QuestionFeed mode="feed" />
      </section>
    </div>
  );
}
