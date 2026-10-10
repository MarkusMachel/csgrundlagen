import { Bookmark, ChevronDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { CodeBlock, InlineText } from '@/shared/ui';
import { parseRichText, type RichSegment } from '@/shared/utils/richText';

import { useIsBookmarked, useToggleBookmark } from '../hooks/useBookmark';
import { useSubmitAnswer } from '../hooks/useSubmitAnswer';
import type { AnswerValue, Question, QuestionMode, TestSubMode } from '../types';
import { AnswerOptions, type AnswerReveal } from './AnswerOptions';
import { QuestionTabs } from './ExpandableTabs/QuestionTabs';

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
  optionOrder,
  heading,
}: QuestionCardProps) {
  const { t } = useTranslation();
  const isExam = mode === 'test' && testMode === 'exam';

  // feed-mode local answer + submission result
  const [localAnswer, setLocalAnswer] = useState<AnswerValue | undefined>(undefined);
  const submitAnswer = useSubmitAnswer(question.id);
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

  const bookmarkable = mode === 'feed' || mode === 'pick';
  const isBookmarked = useIsBookmarked(question.id);
  const toggleBookmark = useToggleBookmark(question.id);

  const controlled = mode === 'test';
  const currentAnswer = controlled ? value : localAnswer;

  let reveal: AnswerReveal | undefined;
  if (mode === 'review') {
    reveal = {
      correctAnswer:
        question.type === 'multiple-choice' ? question.correctOptionId : question.correctAnswer,
      givenAnswer: reviewGivenAnswer,
    };
  } else if (submitted && submitAnswer.data) {
    reveal = { correctAnswer: submitAnswer.data.correctAnswer, givenAnswer: currentAnswer };
  }

  const showScissors =
    (mode === 'feed' || mode === 'pick' || mode === 'test') && !isExam && !reveal;
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

        <CodeLine numbered={false}>
          <span aria-hidden>&nbsp;</span>
        </CodeLine>

        <AnswerOptions
          question={question}
          value={currentAnswer}
          onChange={(v) => (controlled ? onChange?.(v) : setLocalAnswer(v))}
          disabled={answersDisabled}
          reveal={reveal}
          showScissors={showScissors}
          struckOptions={struckOptions}
          onToggleStruck={toggleStruck}
          optionOrder={optionOrder}
        />

        <CodeLine numbered={false}>
          <div className="pane-actions">
            {showSubmit && (
              <button
                type="button"
                className="btn"
                disabled={currentAnswer === undefined || submitted || submitAnswer.isPending}
                onClick={() => {
                  if (currentAnswer !== undefined) submitAnswer.mutate(currentAnswer);
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
            </p>
          </CodeLine>
        )}
      </div>

      {tabsOpen && (
        <QuestionTabs
          question={question}
          explanationRevealed={explanationRevealed}
          hideRevealingTabs={hideRevealingTabs}
        />
      )}
    </article>
  );
}
