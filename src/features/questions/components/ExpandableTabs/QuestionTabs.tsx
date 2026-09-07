import { Box, Tab, Tabs } from '@mui/material';
import { useState } from 'react';
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

export function QuestionTabs({ question, explanationRevealed, hideRevealingTabs }: QuestionTabsProps) {
  const { t } = useTranslation();

  const tabs: TabKey[] = hideRevealingTabs
    ? ['notes', 'material', 'bug']
    : ['explanation', 'comments', 'notes', 'stats', 'material', 'bug'];

  const [active, setActive] = useState<TabKey>(tabs[0]);
  const activeTab = tabs.includes(active) ? active : tabs[0];

  const correctKey =
    question.type === 'multiple-choice' ? question.correctOptionId : String(question.correctAnswer);

  return (
    <Box>
      <Tabs
        value={activeTab}
        onChange={(_e, v: TabKey) => setActive(v)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 44 }}
      >
        {tabs.map((key) => (
          <Tab key={key} value={key} label={t(`question.tabs.${key}`)} sx={{ minHeight: 44 }} />
        ))}
      </Tabs>
      <Box sx={{ pt: 2 }}>
        {/* Only the active tab renders, so its data is fetched lazily. */}
        {activeTab === 'explanation' && (
          <CommentedAnswerTab explanation={question.explanation} revealed={explanationRevealed} />
        )}
        {activeTab === 'comments' && <CommentsTab questionId={question.id} />}
        {activeTab === 'notes' && <MyNotesTab questionId={question.id} />}
        {activeTab === 'stats' && <StatsTab questionId={question.id} correctKey={correctKey} />}
        {activeTab === 'material' && <MaterialTab questionId={question.id} />}
        {activeTab === 'bug' && <BugReportTab questionId={question.id} />}
      </Box>
    </Box>
  );
}
