import { useEffect, useMemo, useState } from 'react';
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
import { ErrorState, Spinner } from '@/shared/ui';
import { seededShuffle } from '@/shared/utils/shuffle';
import { useUIStore } from '@/stores/useUIStore';

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

  // Status bar: answered count + progress dashes (mockup design).
  const setStatus = useUIStore((s) => s.setStatus);
  const answeredCount = orderedQuestions.filter((q) => attempt.answers[q.id] !== undefined).length;
  useEffect(() => {
    if (!started || result || orderedQuestions.length === 0) return;
    setStatus(
      t('status.attemptPosition', { answered: answeredCount, total: orderedQuestions.length }),
      orderedQuestions.map((q) => attempt.answers[q.id] !== undefined),
    );
    return () => setStatus(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, result, answeredCount, orderedQuestions.length, setStatus, t]);

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

  if (isPending) return <Spinner center />;
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
      <div className="stack">
        <h1>
          <span className="tok-com">{'// '}</span>
          {test.name}
        </h1>
        <TestModePicker onStart={(mode: TestMode) => attempt.start(testId, mode)} />
      </div>
    );
  }

  return (
    <div className="stack">
      {/* Sticky header keeps the countdown visible without scrolling (§12). */}
      <div className="attempt-header">
        <h1 style={{ margin: 0, flex: 1, minWidth: 200 }}>
          {test.name} <span className="tok-com">— {t(`takeTest.${attempt.mode}`)}</span>
        </h1>
        {test.timed && test.durationMinutes && (
          <TestTimer durationMinutes={test.durationMinutes} onExpire={handleSubmit} />
        )}
      </div>

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

      <button
        type="button"
        className="btn btn--primary"
        onClick={handleSubmit}
        disabled={submitTest.isPending}
        style={{ alignSelf: 'flex-start' }}
        data-testid="submit-test"
      >
        <span className="prompt-char" aria-hidden>
          $
        </span>
        {t('takeTest.submitAll')}
      </button>
    </div>
  );
}
