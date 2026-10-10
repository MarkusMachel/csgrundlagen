import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { normalizeOutput } from '../grading';

interface OutputInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** After answering: the expected output to compare against. */
  expected?: string;
}

/** A terminal-like box for typing the predicted output. */
export function OutputInput({ value, onChange, disabled, expected }: OutputInputProps) {
  const { t } = useTranslation();
  const id = useId();
  const right = expected !== undefined && normalizeOutput(value) === normalizeOutput(expected);
  return (
    <div className="output-answer">
      <label htmlFor={id} className="option-hint tok-com">
        {'// '}
        {t('question.predictOutput')}
      </label>
      <textarea
        id={id}
        className={`textarea output-answer__input${expected !== undefined ? (right ? ' output-answer__input--right' : ' output-answer__input--wrong') : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={Math.max(3, value.split('\n').length + 1)}
        spellCheck={false}
        autoComplete="off"
        placeholder={t('question.outputPlaceholder')}
      />
      {expected !== undefined && !right && (
        <div className="output-answer__expected">
          <span className="option-hint tok-com">
            {'// '}
            {t('question.expectedOutput')}
          </span>
          <pre className="terminal__body">{expected}</pre>
        </div>
      )}
    </div>
  );
}
