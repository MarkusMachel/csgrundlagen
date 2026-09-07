import { CircularProgress, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { QuestionCard, useWeakQuestions } from '@/features/questions';
import { EmptyState, ErrorState } from '@/shared/ui';

export function WeakSpotsPage() {
  const { t } = useTranslation();
  const { data: questions, isPending, isError, refetch } = useWeakQuestions();

  return (
    <Stack spacing={2}>
      <Typography variant="h5" component="h1">
        {t('weakSpots.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t('weakSpots.explainer')}
      </Typography>
      {isPending ? (
        <CircularProgress aria-label={t('common.loading')} />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : questions.length === 0 ? (
        <EmptyState title={t('weakSpots.empty')} description={t('weakSpots.emptyHint')} />
      ) : (
        questions.map((q) => <QuestionCard key={q.id} question={q} mode="feed" />)
      )}
    </Stack>
  );
}
