import { CircularProgress, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { QuestionCard, useBookmarkedQuestions } from '@/features/questions';
import { EmptyState, ErrorState } from '@/shared/ui';

export function BookmarksPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: questions, isPending, isError, refetch } = useBookmarkedQuestions();

  return (
    <Stack spacing={2}>
      <Typography variant="h5" component="h1">
        {t('bookmarks.title')}
      </Typography>
      {isPending ? (
        <CircularProgress aria-label={t('common.loading')} />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : questions.length === 0 ? (
        <EmptyState
          title={t('bookmarks.empty')}
          description={t('bookmarks.emptyHint')}
          actionLabel={t('bookmarks.goHome')}
          onAction={() => navigate('/')}
        />
      ) : (
        questions.map((q) => <QuestionCard key={q.id} question={q} mode="feed" />)
      )}
    </Stack>
  );
}
