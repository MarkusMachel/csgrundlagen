import { Box, Typography } from '@mui/material';
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
  const selectedQuestions = (data?.items ?? []).filter((q) =>
    selectedQuestionIds.includes(q.id),
  );

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 340px' },
        gap: 3,
        alignItems: 'start',
      }}
    >
      <Box>
        <Typography variant="h5" component="h1" gutterBottom>
          {t('builder.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('builder.pickerHint')}
        </Typography>
        <QuestionFeed
          mode="pick"
          selectedIds={selectedQuestionIds}
          onToggleSelect={toggleQuestion}
        />
      </Box>
      <Box sx={{ position: { md: 'sticky' }, top: { md: 88 } }}>
        <TestBuilderTray
          selectedQuestions={selectedQuestions}
          onSaved={() => navigate('/my-tests')}
        />
      </Box>
    </Box>
  );
}
