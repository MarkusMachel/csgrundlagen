import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import {
  ResultsScreen,
  TestModePicker,
  TestTimer,
  useDiscardDraft,
  useSaveDraft,
  useSubmitTest,
  useTest,
  useTestAttemptStore,
  useTestDraft,
  type TestMode,
  type TestSubmitResult,
} from '@/features/custom-tests';
import { QuestionCard, useQuestions, type Question } from '@/features/questions';
import { ErrorState, Spinner } from '@/shared/ui';
import { formatRelative } from '@/shared/utils/relativeTime';
import { seededShuffle } from '@/shared/utils/shuffle';
import { useUIStore } from '@/stores/useUIStore';

export function TakeTestPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id: testId = '' } = useParams();

  const { data: test, isPending, isError, refetch } = useTest(testId);
  // Fetch exactly the test's questions (any number, anywhere in the bank).
  const { data: pool } = useQuestions({
    ids: test?.questionIds ?? [],
    pageSize: test?.questionIds.length ?? 1,
  });

  const attempt = useTestAttemptStore();
  const submitTest = useSubmitTest(testId);
  const [result, setResult] = useState<TestSubmitResult | null>(null);
  const draft = useTestDraft(testId);
  const saveDraft = useSaveDraft(testId);
  const discardDraft = useDiscardDraft(testId);

  const started = attempt.testId === testId && attempt.mode !== null;

  // Autosave the attempt shortly after each change, so it can be resumed.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSave = useRef<Promise<unknown>>(Promise.resolve());
  const submitting = useRef(false);
  useEffect(() => {
    if (!started || result || submitting.current || !attempt.mode || !attempt.startedAt) return;
    const snapshot = {
      mode: attempt.mode,
      questionIds: attempt.questionIds ?? undefined,
      answers: attempt.answers,
      shuffleSeed: attempt.shuffleSeed,
      startedAt: attempt.startedAt,
    };
    saveTimer.current = setTimeout(() => {
      lastSave.current = saveDraft.mutateAsync(snapshot).catch(() => undefined);
    }, 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    started,
    result,
    attempt.mode,
    attempt.answers,
    attempt.questionIds,
    attempt.shuffleSeed,
    attempt.startedAt,
  ]);

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
    if (!test?.shuffleOptions) return undefined;
    if (question.type !== 'multiple-choice' && question.type !== 'multi-select') return undefined;
    return seededShuffle(
      question.options.map((o) => o.id),
      attempt.shuffleSeed + index + 1,
    );
  };

  const handleSubmit = async () => {
    if (!attempt.mode || submitTest.isPending || result || submitting.current) return;
    // Stop autosaving and let a save in flight land first, so it can't
    // re-create the draft that submitting removes.
    submitting.current = true;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await lastSave.current;
    submitTest.mutate(
      {
        mode: attempt.mode,
        answers: attempt.answers,
        questionIds: attempt.questionIds ?? undefined,
        startedAt: attempt.startedAt ?? undefined,
      },
      {
        onSuccess: setResult,
        onSettled: () => {
          submitting.current = false;
        },
      },
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
    if (draft.isPending) return <Spinner center />;
    const saved = draft.data;
    const total = saved?.questionIds?.length || test.questionIds.length;
    const minutesLeft =
      saved && test.timed && test.durationMinutes
        ? test.durationMinutes - (Date.now() - new Date(saved.startedAt).getTime()) / 60000
        : null;
    return (
      <div className="stack">
        <h1>
          <span className="tok-com">{'// '}</span>
          {test.name}
        </h1>
        {saved ? (
          <div className="card stack resume-card" style={{ gap: 10 }}>
            <h2 style={{ margin: 0 }}>{t('takeTest.resume.title')}</h2>
            <p className="muted" style={{ margin: 0 }}>
              {t('takeTest.resume.summary', {
                mode: t(`takeTest.${saved.mode}`),
                answered: Object.keys(saved.answers).length,
                total,
                when: formatRelative(saved.updatedAt ?? saved.startedAt, i18n.language),
              })}
              {minutesLeft !== null &&
                ' ' +
                  (minutesLeft > 0
                    ? t('takeTest.resume.timeLeft', {
                        minutes: Math.max(1, Math.floor(minutesLeft)),
                      })
                    : t('takeTest.resume.timeUp'))}
            </p>
            <div className="hstack" style={{ gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => attempt.resume(testId, saved)}
              >
                {minutesLeft !== null && minutesLeft <= 0
                  ? t('takeTest.resume.submitNow')
                  : t('takeTest.resume.continue')}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                disabled={discardDraft.isPending}
                onClick={() => discardDraft.mutate()}
              >
                {t('takeTest.resume.startOver')}
              </button>
            </div>
          </div>
        ) : (
          <TestModePicker onStart={(mode: TestMode) => attempt.start(testId, mode)} />
        )}
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
          <TestTimer
            durationMinutes={test.durationMinutes}
            startedAt={attempt.startedAt}
            onExpire={() => void handleSubmit()}
          />
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
        onClick={() => void handleSubmit()}
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
