import { Bookmark, ChevronDown } from 'lucide-react';
import { lazy, Suspense, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { CodeBlock, InlineText, Spinner } from '@/shared/ui';
import { formatRelative } from '@/shared/utils/relativeTime';
import { parseRichText, type RichSegment } from '@/shared/utils/richText';
import { randomSeed } from '@/shared/utils/shuffle';

import { canSubmit, correctAnswerOf } from '../grading';
import { shuffledOptionOrder } from '../optionShuffle';
import type {
  AnswerValue,
  OptionFeedback,
  Question,
  QuestionMode,
  SubmitAnswerResult,
  TestSubMode,
} from '../types';
import { AnswerOptions, type AnswerReveal } from './AnswerOptions';
// The tabs (explanation, comments, notes, …) load when first opened.
const QuestionTabs = lazy(() =>
  import('./ExpandableTabs/QuestionTabs').then((m) => ({ default: m.QuestionTabs })),
);
import { initialOrder, OrderingInput } from './OrderingInput';
import { OutputInput } from './OutputInput';
import { RunnableCode } from './RunnableCode';
import { WrongAnswerFeedback } from './WrongAnswerFeedback';
import { useIsBookmarked, useToggleBookmark } from '../hooks/useBookmark';
import { useSubmitAnswer } from '../hooks/useSubmitAnswer';

export interface QuestionCardProps {
  question: Question;
  mode: QuestionMode;
  /** Only meaningful when mode === 'test'. */
  testMode?: TestSubMode;
  /** pick mode: current selection state + toggle. */
  selected?: boolean;
  onToggleSelect?: (questionId: string) => void;
  /** test mode: controlled answer. */
  value?: AnswerValue;
  onChange?: (value: AnswerValue) => void;
  /** review mode: the answer the user gave (undefined = unanswered). */
  reviewGivenAnswer?: AnswerValue;
  /** test/review mode: per-attempt shuffled option order (multiple choice). */
  optionOrder?: string[];
  /** Optional heading like "Question 2 of 5" in test mode. */
  heading?: string;
  /** Review mode: feedback on the wrong options that were picked. */
  reviewFeedback?: OptionFeedback[];
  /** feed mode: called once the answer is graded (e.g. to advance a review session). */
  onAnswered?: (result: SubmitAnswerResult) => void;
}

/** One numbered (or blank-gutter) line inside the editor pane. */
function CodeLine({ numbered = true, children }: { numbered?: boolean; children: ReactNode }) {
  return (
    <div className={numbered ? 'code-line' : 'code-line code-line--spacer'}>
      <div className="code-line__body">{children}</div>
    </div>
  );
}

export function QuestionCard({
  question,
  mode,
  testMode,
  selected = false,
  onToggleSelect,
  value,
  onChange,
  reviewGivenAnswer,
  reviewFeedback,
  optionOrder,
  heading,
  onAnswered,
}: QuestionCardProps) {
  const { t, i18n } = useTranslation();
  const isExam = mode === 'test' && testMode === 'exam';

  // feed-mode local answer + submission result
  const [localAnswer, setLocalAnswer] = useState<AnswerValue | undefined>(undefined);
  const submitAnswer = useSubmitAnswer(question.id, question);
  const submitted = submitAnswer.isSuccess;

  // scissors strike-outs: session-only by design (§15)
  const [struckOptions, setStruckOptions] = useState<ReadonlySet<string>>(new Set());
  const toggleStruck = (key: string) =>
    setStruckOptions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const [tabsOpen, setTabsOpen] = useState(mode === 'review');

  // Outside tests (which have their own setting), options come in a new order
  // every time a question is shown, so answers are learned, not positions.
  // Drawn once per mounted card, so it doesn't move while you answer.
  const [viewSeed] = useState(randomSeed);
  const shownOrder =
    optionOrder ??
    (mode === 'feed' || mode === 'pick' ? shuffledOptionOrder(question, viewSeed) : undefined);

  const bookmarkable = mode === 'feed' || mode === 'pick';
  const isBookmarked = useIsBookmarked(question.id);
  const toggleBookmark = useToggleBookmark(question.id);

  const controlled = mode === 'test';
  // An ordering question always has an answer: the arrangement on screen.
  const currentAnswer =
    (controlled ? value : localAnswer) ??
    (question.type === 'ordering' ? initialOrder(question) : undefined);
  const setAnswer = (v: AnswerValue) => (controlled ? onChange?.(v) : setLocalAnswer(v));

  let reveal: AnswerReveal | undefined;
  if (mode === 'review') {
    reveal = { correctAnswer: correctAnswerOf(question), givenAnswer: reviewGivenAnswer };
  } else if (submitted && submitAnswer.data) {
    reveal = { correctAnswer: submitAnswer.data.correctAnswer, givenAnswer: currentAnswer };
  }

  const hasOptions = question.type !== 'ordering' && question.type !== 'output';
  const showScissors =
    hasOptions && (mode === 'feed' || mode === 'pick' || mode === 'test') && !isExam && !reveal;
  const showSubmit = mode === 'feed';
  // Practice keeps explanations reachable as the user goes (§15 open decision).
  const explanationRevealed =
    mode === 'review' || submitted || (mode === 'test' && testMode === 'practice');
  const hideRevealingTabs = isExam;
  const answersDisabled = mode === 'review' || (mode === 'feed' && submitted);

  // Short id like a git hash: the UUID up to its first hyphen (full id in the tooltip).
  const shortId = question.id.split('-')[0];
  const breadcrumb = [...question.tags.map((tag) => tag.toLowerCase()), shortId];
  // One numbered line per line of prose; a fenced code block takes a single line.
  const promptRows = parseRichText(question.prompt).flatMap<RichSegment>((segment) =>
    segment.kind === 'code'
      ? [segment]
      : segment.text
          .split('\n')
          .filter((line) => line.trim().length > 0)
          .map((line) => ({ kind: 'text' as const, text: line })),
  );

  return (
    <article className="editor-pane" data-testid={`question-card-${question.id}`}>
      <div className="editor-pane__header">
        {heading && <span style={{ color: 'var(--text)', fontWeight: 600 }}>{heading}</span>}
        <span className="editor-pane__breadcrumb">
          {breadcrumb.map((part, i) => (
            <span
              key={`${part}-${i}`}
              title={i === breadcrumb.length - 1 ? question.id : undefined}
            >
              {i > 0 && <span className="crumb-sep"> / </span>}
              {part}
            </span>
          ))}
        </span>
        {bookmarkable && (
          <button
            type="button"
            className="btn btn--icon"
            style={{ marginLeft: 'auto', color: isBookmarked ? 'var(--accent)' : undefined }}
            aria-label={isBookmarked ? t('question.removeBookmark') : t('question.bookmark')}
            aria-pressed={isBookmarked}
            onClick={() => toggleBookmark.mutate()}
          >
            <Bookmark size={17} aria-hidden fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      <div className="code">
        {question.difficulty && (
          <CodeLine>
            <span className="tok-com">
              {'// '}
              {t('question.difficultyLabel').toLowerCase()}:{' '}
              {t(`question.difficulty.${question.difficulty}`)}
            </span>
          </CodeLine>
        )}

        {promptRows.map((row, i) => (
          <CodeLine key={i}>
            {row.kind === 'code' ? (
              <CodeBlock code={row.code} lang={row.lang} />
            ) : (
              <span style={{ fontWeight: 500 }}>
                <InlineText text={row.text} />
              </span>
            )}
          </CodeLine>
        ))}

        {question.type === 'output' && (
          <CodeLine>
            {/* Predict first: the Run button appears once the answer is graded. */}
            <RunnableCode code={question.code} language={question.codeLanguage} canRun={!!reveal} />
          </CodeLine>
        )}

        <CodeLine numbered={false}>
          <span aria-hidden>&nbsp;</span>
        </CodeLine>

        {question.type === 'ordering' ? (
          <OrderingInput
            question={question}
            value={(reveal?.givenAnswer ?? currentAnswer) as string[]}
            onChange={setAnswer}
            disabled={answersDisabled}
            revealed={!!reveal}
          />
        ) : question.type === 'output' ? (
          <CodeLine numbered={false}>
            <OutputInput
              value={String(reveal?.givenAnswer ?? currentAnswer ?? '')}
              onChange={setAnswer}
              disabled={answersDisabled}
              expected={reveal ? String(reveal.correctAnswer) : undefined}
            />
          </CodeLine>
        ) : (
          <AnswerOptions
            question={question}
            value={currentAnswer}
            onChange={setAnswer}
            disabled={answersDisabled}
            reveal={reveal}
            showScissors={showScissors}
            struckOptions={struckOptions}
            onToggleStruck={toggleStruck}
            optionOrder={shownOrder}
          />
        )}

        <CodeLine numbered={false}>
          <div className="pane-actions">
            {showSubmit && (
              <button
                type="button"
                className="btn"
                disabled={
                  !canSubmit(question, currentAnswer) || submitted || submitAnswer.isPending
                }
                onClick={() => {
                  if (currentAnswer !== undefined) {
                    submitAnswer.mutate(currentAnswer, { onSuccess: (r) => onAnswered?.(r) });
                  }
                }}
              >
                <span className="prompt-char" aria-hidden>
                  $
                </span>
                {t('question.submit')}
              </button>
            )}
            {mode === 'pick' && (
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onToggleSelect?.(question.id)}
                  aria-label={t('builder.addToTest')}
                />
                <span className="tok-com">{t('builder.addToTest')}</span>
              </label>
            )}
            <button
              type="button"
              className="btn btn--icon"
              style={{ marginLeft: 'auto' }}
              aria-label={t('question.tabs.explanation')}
              aria-expanded={tabsOpen}
              onClick={() => setTabsOpen((o) => !o)}
            >
              <ChevronDown
                size={17}
                aria-hidden
                style={{
                  transform: tabsOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 150ms',
                }}
              />
            </button>
          </div>
        </CodeLine>

        {mode === 'feed' && submitted && submitAnswer.data && (
          <CodeLine numbered={false}>
            <p
              role="alert"
              data-testid="answer-feedback"
              className={
                submitAnswer.data.correct
                  ? 'feedback-line feedback-line--correct'
                  : 'feedback-line feedback-line--wrong'
              }
              style={{ margin: 0 }}
            >
              {'> '}
              {submitAnswer.data.correct ? t('question.correct') : t('question.incorrect')}
              {submitAnswer.data.offline && (
                <span className="feedback-line__next"> {t('offline.savedForLater')}</span>
              )}
              {submitAnswer.data.nextReviewAt && (
                <span className="feedback-line__next">
                  {' '}
                  {t('review.nextReview', {
                    when: formatRelative(submitAnswer.data.nextReviewAt, i18n.language),
                  })}
                </span>
              )}
            </p>
            <WrongAnswerFeedback question={question} feedback={submitAnswer.data.feedback} />
          </CodeLine>
        )}
        {mode === 'review' && reviewFeedback && reviewFeedback.length > 0 && (
          <CodeLine numbered={false}>
            <WrongAnswerFeedback question={question} feedback={reviewFeedback} />
          </CodeLine>
        )}
      </div>

      {tabsOpen && (
        <Suspense fallback={<Spinner />}>
          <QuestionTabs
            question={question}
            explanationRevealed={explanationRevealed}
            hideRevealingTabs={hideRevealingTabs}
          />
        </Suspense>
      )}
    </article>
  );
}
