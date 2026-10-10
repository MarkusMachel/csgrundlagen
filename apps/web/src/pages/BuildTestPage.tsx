import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { TestBuilderTray, useTestBuilderStore } from '@/features/custom-tests';
import { QuestionFeed, useFilterState, useQuestions } from '@/features/questions';

export function BuildTestPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedQuestionIds, toggleQuestion } = useTestBuilderStore();
  // a saved filter on Home links here with its filters in the URL
  const [filters, setFilters] = useFilterState('build');

  // Resolve the selected ids to question data for the tray's title list.
  const { data } = useQuestions({
    ids: selectedQuestionIds,
    pageSize: Math.max(1, selectedQuestionIds.length),
  });
  const selectedQuestions = selectedQuestionIds.length > 0 ? (data?.items ?? []) : [];

  return (
    <div className="build-layout">
      <div>
        <h1>
          <span className="tok-com">{'// '}</span>
          {t('builder.title')}
        </h1>
        <p className="muted">{t('builder.pickerHint')}</p>
        <QuestionFeed
          mode="pick"
          selectedIds={selectedQuestionIds}
          onToggleSelect={toggleQuestion}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>
      <div className="build-layout__tray">
        <TestBuilderTray
          selectedQuestions={selectedQuestions}
          onSaved={() => navigate('/my-tests')}
        />
      </div>
    </div>
  );
}
