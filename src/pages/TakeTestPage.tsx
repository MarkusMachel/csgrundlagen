import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import {
  ResultsScreen,
  TestModePicker,
  TestTimer,
  useSubmitTest,
  useTest,
  useTestAttemptStore,
  type TestMode,
  type TestSubmitResult,
} from '@/features/custom-tests';
import { QuestionCard, useQuestions, type Question } from '@/features/questions';
import { ErrorState } from '@/shared/ui';
import { seededShuffle } from '@/shared/utils/shuffle';

export function TakeTestPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id: testId = '' } = useParams();

  const { data: test, isPending, isError, refetch } = useTest(testId);
  // Resolve the test's question ids against the (seed-scale) question pool.
  const { data: pool } = useQuestions({ page: 1, pageSize: 50 });

  const attempt = useTestAttemptStore();
  const submitTest = useSubmitTest(testId);
  const [result, setResult] = useState<TestSubmitResult | null>(null);

  const started = attempt.testId === testId && attempt.mode !== null;

  // Question order is derived once per attempt from the stored seed (§9.5).
  const orderedQuestions: Question[] = useMemo(() => {
    if (!test || !pool) return [];
    const ids = attempt.questionIds ?? test.questionIds;
    const ordered =
      test.shuffleQuestions && started ? seededShuffle(ids, attempt.shuffleSeed) : ids;
    return ordered
      .map((id) => pool.items.find((q) => q.id === id))
      .filter((q): q is Question => q !== undefined);
  }, [test, pool, attempt.questionIds, attempt.shuffleSeed, started]);

  const optionOrderFor = (question: Question, index: number): string[] | undefined => {
    if (!test?.shuffleOptions || question.type !== 'multiple-choice') return undefined;
    return seededShuffle(
      question.options.map((o) => o.id),
      attempt.shuffleSeed + index + 1,
    );
  };

  const handleSubmit = () => {
    if (!attempt.mode || submitTest.isPending || result) return;
    submitTest.mutate(
      {
        mode: attempt.mode,
        answers: attempt.answers,
        questionIds: attempt.questionIds ?? undefined,
        startedAt: attempt.startedAt ?? undefined,
      },
      { onSuccess: setResult },
    );
  };

  const handleRetryIncorrect = (questionIds: string[]) => {
    if (!attempt.mode) return;
    const mode = attempt.mode;
    setResult(null);
    submitTest.reset();
    attempt.start(testId, mode, questionIds);
  };

  if (isPending) return <CircularProgress aria-label={t('common.loading')} />;
  if (isError || !test) return <ErrorState onRetry={() => void refetch()} />;

  if (result) {
    return (
      <ResultsScreen
        result={result}
        questions={orderedQuestions}
        onRetryIncorrect={handleRetryIncorrect}
        onBackToTests={() => {
          attempt.reset();
          navigate('/my-tests');
        }}
      />
    );
  }

  if (!started) {
    return (
      <Stack spacing={2}>
        <Typography variant="h5" component="h1">
          {test.name}
        </Typography>
        <TestModePicker onStart={(mode: TestMode) => attempt.start(testId, mode)} />
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      {/* Sticky header keeps the countdown visible without scrolling (§12). */}
      <Box
        sx={{
          position: 'sticky',
          top: { xs: 56, sm: 64 },
          zIndex: 2,
          bgcolor: 'background.default',
          py: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="h6" component="h1" sx={{ flex: 1, minWidth: 200 }}>
          {test.name} — {t(`takeTest.${attempt.mode}`)}
        </Typography>
        {test.timed && test.durationMinutes && (
          <TestTimer durationMinutes={test.durationMinutes} onExpire={handleSubmit} />
        )}
      </Box>

      {orderedQuestions.map((question, index) => (
        <QuestionCard
          key={question.id}
          question={question}
          mode="test"
          testMode={attempt.mode ?? 'practice'}
          value={attempt.answers[question.id]}
          onChange={(v) => attempt.setAnswer(question.id, v)}
          optionOrder={optionOrderFor(question, index)}
          heading={t('takeTest.questionOf', {
            current: index + 1,
            total: orderedQuestions.length,
          })}
        />
      ))}

      <Button
        variant="contained"
        size="large"
        onClick={handleSubmit}
        disabled={submitTest.isPending}
        sx={{ alignSelf: 'flex-start' }}
        data-testid="submit-test"
      >
        {t('takeTest.submitAll')}
      </Button>
    </Stack>
  );
}
