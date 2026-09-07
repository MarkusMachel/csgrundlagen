import { Box, Skeleton, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { QuestionCard, QuestionFeed, useDailyQuestion } from '@/features/questions';

export function HomePage() {
  const { t } = useTranslation();
  const daily = useDailyQuestion();

  return (
    <Stack spacing={3}>
      <Box data-testid="question-of-the-day">
        <Typography variant="h5" component="h1" gutterBottom>
          {t('home.questionOfTheDay')}
        </Typography>
        {daily.isPending ? (
          <Skeleton variant="rounded" height={220} />
        ) : daily.data ? (
          <QuestionCard question={daily.data} mode="feed" />
        ) : null}
      </Box>

      <Box>
        <Typography variant="h5" component="h2" gutterBottom>
          {t('home.feedTitle')}
        </Typography>
        <QuestionFeed mode="feed" />
      </Box>
    </Stack>
  );
}
