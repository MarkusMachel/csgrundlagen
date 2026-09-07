import { CircularProgress, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { QuestionCard, useQuestion } from '@/features/questions';
import { ErrorState } from '@/shared/ui';

/** Single-question view — the navigation target for search results. */
export function QuestionPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { data: question, isPending, isError, refetch } = useQuestion(id);

  if (isPending) return <CircularProgress aria-label={t('common.loading')} />;
  if (isError || !question) return <ErrorState onRetry={() => void refetch()} />;

  return (
    <Stack sx={{ maxWidth: 800 }}>
      <QuestionCard question={question} mode="feed" />
    </Stack>
  );
}
