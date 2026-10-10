import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import type { AnswerValue, Question } from '../types';
import { ScissorsToggle } from './ScissorsToggle';

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
  /** Shuffled option-id order for this attempt (multiple-choice only). */
  optionOrder?: string[];
}

interface RowSpec {
  key: string; // option id ('A'…'E') or 'true'/'false'
  label: string; // accessible name + displayed value
  /** The variable name in the code notation, e.g. A in `var A = "HTTP"`, or answer. */
  lhs: string;
  /** Rendered right-hand side, e.g. "Transport layer" or true. */
  rhs: string;
  answerValue: AnswerValue;
}

/**
 * Answers rendered as variable declarations — `var A = "HTTP"` — per the
 * editor-style design. Each row is a numbered code line; the native radio is
 * visually hidden and the whole entry is its label (aria-label carries the
 * plain option text so accessible names stay notation-free).
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

  let rows: RowSpec[];
  if (question.type === 'multiple-choice') {
    let options = question.options;
    if (optionOrder) {
      options = [...options].sort((a, b) => optionOrder.indexOf(a.id) - optionOrder.indexOf(b.id));
    }
    rows = options.map((o, i) => ({
      key: o.id,
      label: o.label,
      lhs: String.fromCharCode(65 + i), // A, B, C… by displayed position (options may be shuffled)
      rhs: `"${o.label}"`,
      answerValue: o.id,
    }));
  } else {
    rows = [
      { key: 'true', label: t('question.true'), lhs: 'answer', rhs: 'true', answerValue: true },
      { key: 'false', label: t('question.false'), lhs: 'answer', rhs: 'false', answerValue: false },
    ];
  }

  const selectedKey = value === undefined ? '' : String(value);

  return (
    <div role="radiogroup" aria-label={question.prompt}>
      {rows.map((row) => {
        const struck = struckOptions.has(row.key);
        const isSelected = selectedKey === row.key;
        const isCorrect = reveal !== undefined && String(reveal.correctAnswer) === row.key;
        const isWrongPick =
          reveal !== undefined &&
          reveal.givenAnswer !== undefined &&
          String(reveal.givenAnswer) === row.key &&
          !isCorrect;

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
                    optionLabel={question.type === 'multiple-choice' ? row.lhs : row.label}
                    struck={struck}
                    onToggle={() => onToggleStruck(row.key)}
                  />
                )}
                <label className={entryClasses}>
                  <input
                    type="radio"
                    name={groupName}
                    value={row.key}
                    checked={isSelected}
                    disabled={disabled}
                    aria-label={row.label}
                    onChange={() => onChange(row.answerValue)}
                  />
                  <span className="option-entry__text">
                    <span className="tok-kw">var</span> <span className="tok-idx">{row.lhs}</span>
                    <span className="muted"> = </span>
                    <span className="tok-str">{row.rhs}</span>
                  </span>
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
