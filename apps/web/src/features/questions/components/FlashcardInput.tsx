import { Eye } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { RichText } from '@/shared/ui';

import type { FlashcardQuestion } from '../types';

interface FlashcardInputProps {
  question: FlashcardQuestion;
  /** true = knew it, false = didn't, undefined = not graded yet */
  value: boolean | undefined;
  onGrade: (knewIt: boolean) => void;
  disabled?: boolean;
  /** Review screens show the back straight away. */
  revealed?: boolean;
}

/** Front → "Show answer" → back, then the learner grades themselves. */
export function FlashcardInput({
  question,
  value,
  onGrade,
  disabled,
  revealed,
}: FlashcardInputProps) {
  const { t } = useTranslation();
  const [shown, setShown] = useState(false);
  const open = shown || revealed || value !== undefined;

  if (!open) {
    return (
      <button type="button" className="btn flashcard__show" onClick={() => setShown(true)}>
        <Eye size={15} aria-hidden />
        {t('flashcard.show')}
      </button>
    );
  }
  return (
    <div className="flashcard__back">
      <div className="flashcard__answer" aria-label={t('flashcard.answer')}>
        <RichText text={question.explanation} />
      </div>
      <div className="flashcard__grade" role="group" aria-label={t('flashcard.how')}>
        <button
          type="button"
          className="btn flashcard__knew"
          aria-pressed={value === true}
          disabled={disabled}
          onClick={() => onGrade(true)}
        >
          {t('flashcard.knew')}
        </button>
        <button
          type="button"
          className="btn flashcard__didnt"
          aria-pressed={value === false}
          disabled={disabled}
          onClick={() => onGrade(false)}
        >
          {t('flashcard.didnt')}
        </button>
      </div>
    </div>
  );
}
