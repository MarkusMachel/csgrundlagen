import ReplayIcon from '@mui/icons-material/Replay';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { QuestionCard, type Question } from '@/features/questions';

import type { TestSubmitResult } from '../types';
import { incorrectQuestionIds } from '../utils/scoring';

interface ResultsScreenProps {
  result: TestSubmitResult;
  /** Questions in attempt order, so the breakdown matches what the user saw. */
  questions: Question[];
  onRetryIncorrect: (questionIds: string[]) => void;
  onBackToTests: () => void;
}

export function ResultsScreen({
  result,
  questions,
  onRetryIncorrect,
  onBackToTests,
}: ResultsScreenProps) {
  const { t } = useTranslation();
  const wrongIds = incorrectQuestionIds(result.breakdown);

  return (
    <Stack spacing={3} data-testid="results-screen">
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h4" component="h2" gutterBottom>
          {t('takeTest.results')}
        </Typography>
        <Typography variant="h5" color={wrongIds.length === 0 ? 'success.main' : 'text.primary'}>
          {t('takeTest.yourScore', { score: result.score, total: result.total })}
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="center" sx={{ mt: 2 }}>
          {wrongIds.length > 0 && (
            <Button
              variant="contained"
              startIcon={<ReplayIcon />}
              onClick={() => onRetryIncorrect(wrongIds)}
            >
              {t('takeTest.retryIncorrect')}
            </Button>
          )}
          <Button variant="outlined" onClick={onBackToTests}>
            {t('takeTest.backToTests')}
          </Button>
        </Stack>
      </Paper>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {result.breakdown.map((item, index) => {
          const question = questions.find((q) => q.id === item.questionId);
          if (!question) return null;
          return (
            <QuestionCard
              key={item.questionId}
              question={question}
              mode="review"
              reviewGivenAnswer={item.givenAnswer}
              heading={t('takeTest.questionOf', {
                current: index + 1,
                total: result.breakdown.length,
              })}
            />
          );
        })}
      </Box>
    </Stack>
  );
}
