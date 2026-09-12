import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { TestBuilderTray, useTestBuilderStore } from '@/features/custom-tests';
import { QuestionFeed, useQuestions } from '@/features/questions';

export function BuildTestPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedQuestionIds, toggleQuestion } = useTestBuilderStore();

  // Resolve selected ids to question data for the tray's title list.
  // Seed scale fits one large page; a real backend would get a by-ids endpoint.
  const { data } = useQuestions({ page: 1, pageSize: 50 });
  const selectedQuestions = (data?.items ?? []).filter((q) => selectedQuestionIds.includes(q.id));

  return (
    <div className="build-layout">
      <div>
        <h1>
          <span className="tok-com">{'// '}</span>
          {t('builder.title')}
        </h1>
        <p className="muted">{t('builder.pickerHint')}</p>
        <QuestionFeed mode="pick" selectedIds={selectedQuestionIds} onToggleSelect={toggleQuestion} />
      </div>
      <div className="build-layout__tray">
        <TestBuilderTray selectedQuestions={selectedQuestions} onSaved={() => navigate('/my-tests')} />
      </div>
    </div>
  );
}
