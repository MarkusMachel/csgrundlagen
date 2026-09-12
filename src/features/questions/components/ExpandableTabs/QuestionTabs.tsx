import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';


import { BugReportTab } from './BugReportTab';
import { CommentedAnswerTab } from './CommentedAnswerTab';
import { CommentsTab } from './CommentsTab';
import { MaterialTab } from './MaterialTab';
import { MyNotesTab } from './MyNotesTab';
import { StatsTab } from './StatsTab';
import type { Question } from '../../types';

interface QuestionTabsProps {
  question: Question;
  /** Whether the explanation content is revealed (submitted / review / practice). */
  explanationRevealed: boolean;
  /** Exam pre-submit hides Commented Answer, Comments, and Stats entirely (§10). */
  hideRevealingTabs: boolean;
}

type TabKey = 'explanation' | 'comments' | 'notes' | 'stats' | 'material' | 'bug';

/** Editor-style bottom panel (like OUTPUT / PROBLEMS / TERMINAL). */
export function QuestionTabs({ question, explanationRevealed, hideRevealingTabs }: QuestionTabsProps) {
  const { t } = useTranslation();
  const idBase = useId();

  const tabs: TabKey[] = hideRevealingTabs
    ? ['notes', 'material', 'bug']
    : ['explanation', 'comments', 'notes', 'stats', 'material', 'bug'];

  const [active, setActive] = useState<TabKey>(tabs[0]);
  const activeTab = tabs.includes(active) ? active : tabs[0];

  const correctKey =
    question.type === 'multiple-choice' ? question.correctOptionId : String(question.correctAnswer);

  return (
    <div className="panel">
      <div className="panel-tabs" role="tablist">
        {tabs.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`${idBase}-tab-${key}`}
            aria-selected={activeTab === key}
            aria-controls={`${idBase}-panel-${key}`}
            className="panel-tab"
            onClick={() => setActive(key)}
          >
            {t(`question.tabs.${key}`)}
          </button>
        ))}
      </div>
      <div
        className="panel-body"
        role="tabpanel"
        id={`${idBase}-panel-${activeTab}`}
        aria-labelledby={`${idBase}-tab-${activeTab}`}
      >
        {/* Only the active tab renders, so its data is fetched lazily. */}
        {activeTab === 'explanation' && (
          <CommentedAnswerTab explanation={question.explanation} revealed={explanationRevealed} />
        )}
        {activeTab === 'comments' && <CommentsTab questionId={question.id} />}
        {activeTab === 'notes' && <MyNotesTab questionId={question.id} />}
        {activeTab === 'stats' && <StatsTab questionId={question.id} correctKey={correctKey} />}
        {activeTab === 'material' && <MaterialTab questionId={question.id} />}
        {activeTab === 'bug' && <BugReportTab questionId={question.id} />}
      </div>
    </div>
  );
}
