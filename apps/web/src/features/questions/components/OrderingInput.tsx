import { ArrowDown, ArrowUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { InlineText } from '@/shared/ui';
import { toPlainText } from '@/shared/utils/richText';
import { seededShuffle } from '@/shared/utils/shuffle';

import type { OrderingQuestion } from '../types';

/**
 * The starting arrangement: shuffled the same way every time for a question
 * (so it doesn't jump around between renders), and never already solved.
 */
export function initialOrder(q: OrderingQuestion): string[] {
  const ids = q.options.map((o) => o.id);
  const seed = [...q.id].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0, 7);
  const order = seededShuffle(ids, seed);
  const solved = order.every((id, i) => id === q.correctOrder[i]);
  return solved ? [...order.slice(1), order[0]] : order;
}

interface OrderingInputProps {
  question: OrderingQuestion;
  value: string[];
  onChange: (order: string[]) => void;
  disabled?: boolean;
  /** After answering: mark each position right or wrong. */
  revealed?: boolean;
}

/** Arrange items with up/down buttons, rendered as array assignments. */
export function OrderingInput({
  question,
  value,
  onChange,
  disabled,
  revealed,
}: OrderingInputProps) {
  const { t } = useTranslation();
  const label = (id: string) => question.options.find((o) => o.id === id)?.label ?? id;
  const move = (from: number, to: number) => {
    const next = [...value];
    [next[from], next[to]] = [next[to], next[from]];
    onChange(next);
  };

  return (
    <div className="ordering">
      <div className="code-line">
        <p className="code-line__body option-hint tok-com">
          {'// '}
          {t('question.orderHint')}
        </p>
      </div>
      <ol className="ordering__list" aria-label={toPlainText(question.prompt)}>
        {value.map((id, i) => {
          const right = revealed && question.correctOrder[i] === id;
          const wrong = revealed && !right;
          const plain = toPlainText(label(id));
          return (
            <li
              key={id}
              className={`code-line option-line ordering__row${right ? ' ordering__row--right' : ''}${wrong ? ' ordering__row--wrong' : ''}`}
            >
              <div className="code-line__body option-row">
                <span className="option-entry ordering__entry">
                  <span className="option-entry__text">
                    <span className="tok-idx">steps[{i}]</span>
                    <span className="muted"> = </span>
                    <span className="tok-str">
                      &quot;
                      <InlineText text={label(id)} />
                      &quot;
                    </span>
                  </span>
                  {revealed && (
                    <span
                      className={
                        right ? 'option-entry__mark tok-green' : 'option-entry__mark tok-red'
                      }
                    >
                      {right
                        ? '✓'
                        : t('question.belongsAt', { n: question.correctOrder.indexOf(id) })}
                    </span>
                  )}
                </span>
                {!revealed && (
                  <span className="ordering__moves">
                    <button
                      type="button"
                      className="btn btn--icon"
                      disabled={disabled || i === 0}
                      aria-label={t('question.moveUp', { item: plain })}
                      onClick={() => move(i, i - 1)}
                    >
                      <ArrowUp size={15} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="btn btn--icon"
                      disabled={disabled || i === value.length - 1}
                      aria-label={t('question.moveDown', { item: plain })}
                      onClick={() => move(i, i + 1)}
                    >
                      <ArrowDown size={15} aria-hidden />
                    </button>
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
