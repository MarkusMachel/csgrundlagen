import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { InlineText, RichText } from '@/shared/ui';
import { parseRichText, toPlainText } from '@/shared/utils/richText';

import type { AnswerValue, Question } from '../types';
import { ScissorsToggle } from './ScissorsToggle';

const isCodeOption = (row: RowSpec) =>
  parseRichText(row.label).some((segment) => segment.kind === 'code');

export interface AnswerReveal {
  correctAnswer: AnswerValue;
  givenAnswer?: AnswerValue;
}

interface AnswerOptionsProps {
  question: Question;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
  disabled?: boolean;
  reveal?: AnswerReveal;
  showScissors: boolean;
  struckOptions: ReadonlySet<string>;
  onToggleStruck: (optionKey: string) => void;
  /** Shuffled option-id order for this attempt (multiple choice and multi-select). */
  optionOrder?: string[];
}

/** Option keys of an answer value: one for a single pick, several for a set. */
const keysOf = (v: AnswerValue | undefined): string[] =>
  v === undefined ? [] : Array.isArray(v) ? v : [String(v)];

interface RowSpec {
  key: string; // option id ('A'…'E') or 'true'/'false'
  label: string; // accessible name + displayed value
  /** The variable name in the code notation, e.g. A in `var A = "HTTP"`, or answer. */
  lhs: string;
  /** Right-hand side for true/false (true / false); multiple choice renders `label`. */
  rhs: string;
  answerValue: AnswerValue;
}

/**
 * Answers rendered as variable declarations — `var A = "HTTP"` — per the
 * editor-style design. Each row is a numbered code line; the native radio
 * (checkbox for multi-select) is visually hidden and the whole entry is its
 * label (aria-label carries the plain option text so accessible names stay
 * notation-free).
 */
export function AnswerOptions({
  question,
  value,
  onChange,
  disabled = false,
  reveal,
  showScissors,
  struckOptions,
  onToggleStruck,
  optionOrder,
}: AnswerOptionsProps) {
  const { t } = useTranslation();
  const groupName = useId();

  const multi = question.type === 'multi-select';
  let rows: RowSpec[];
  if (question.type === 'multiple-choice' || question.type === 'multi-select') {
    let options = question.options;
    if (optionOrder) {
      options = [...options].sort((a, b) => optionOrder.indexOf(a.id) - optionOrder.indexOf(b.id));
    }
    rows = options.map((o, i) => ({
      key: o.id,
      label: o.label,
      lhs: String.fromCharCode(65 + i), // A, B, C… by displayed position (options may be shuffled)
      rhs: o.label,
      answerValue: o.id,
    }));
  } else if (question.type === 'true-false') {
    rows = [
      { key: 'true', label: t('question.true'), lhs: 'answer', rhs: 'true', answerValue: true },
      { key: 'false', label: t('question.false'), lhs: 'answer', rhs: 'false', answerValue: false },
    ];
  } else {
    return null; // ordering and output questions have their own inputs
  }

  const selected = keysOf(value);
  const correctKeys = reveal ? keysOf(reveal.correctAnswer) : [];
  const givenKeys = reveal ? keysOf(reveal.givenAnswer) : [];
  const toggle = (key: string) =>
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);

  return (
    <div role={multi ? 'group' : 'radiogroup'} aria-label={toPlainText(question.prompt)}>
      {multi && (
        <div className="code-line">
          <p className="code-line__body option-hint tok-com">
            {'// '}
            {t('question.pickAll')}
          </p>
        </div>
      )}
      {rows.map((row) => {
        const struck = struckOptions.has(row.key);
        const isSelected = selected.includes(row.key);
        const isCorrect = reveal !== undefined && correctKeys.includes(row.key);
        const isWrongPick = reveal !== undefined && givenKeys.includes(row.key) && !isCorrect;

        const entryClasses = [
          'option-entry',
          isCorrect
            ? 'option-entry--correct'
            : isWrongPick
              ? 'option-entry--wrong'
              : isSelected
                ? 'option-entry--selected'
                : '',
          struck ? 'option-entry--struck' : '',
          disabled ? 'option-entry--disabled' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <div key={row.key} className="code-line option-line">
            <div className="code-line__body">
              <div className="option-row">
                {showScissors && (
                  <ScissorsToggle
                    optionLabel={question.type === 'true-false' ? row.label : row.lhs}
                    struck={struck}
                    onToggle={() => onToggleStruck(row.key)}
                  />
                )}
                <label className={entryClasses}>
                  <input
                    type={multi ? 'checkbox' : 'radio'}
                    name={groupName}
                    value={row.key}
                    checked={isSelected}
                    disabled={disabled}
                    aria-label={toPlainText(row.label)}
                    onChange={() => (multi ? toggle(row.key) : onChange(row.answerValue))}
                  />
                  {isCodeOption(row) ? (
                    // a code-block answer: `var A =` with the highlighted snippet below
                    <span className="option-entry__text option-entry__text--block">
                      <span className="tok-kw">var</span> <span className="tok-idx">{row.lhs}</span>
                      <span className="muted"> =</span>
                      <RichText text={row.label} />
                    </span>
                  ) : (
                    <span className="option-entry__text">
                      <span className="tok-kw">var</span> <span className="tok-idx">{row.lhs}</span>
                      <span className="muted"> = </span>
                      <span className="tok-str">
                        {question.type !== 'true-false' ? (
                          <>
                            &quot;
                            <InlineText text={row.label} />
                            &quot;
                          </>
                        ) : (
                          row.rhs
                        )}
                      </span>
                    </span>
                  )}
                  {(isCorrect || isWrongPick) && (
                    <span
                      className={
                        isCorrect ? 'option-entry__mark tok-green' : 'option-entry__mark tok-red'
                      }
                      aria-hidden
                    >
                      {isCorrect ? '✓' : '✕'}
                    </span>
                  )}
                </label>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
