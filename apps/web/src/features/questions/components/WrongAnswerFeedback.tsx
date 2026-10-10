import { BookOpen, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { InlineText, RichText } from '@/shared/ui';

import type { OptionFeedback, Question } from '../types';

/**
 * Why the picked option is wrong, and what to read about it. Options are
 * quoted rather than named by letter, since letters follow the shuffled order.
 */
export function WrongAnswerFeedback({
  question,
  feedback,
}: {
  question: Question;
  feedback?: OptionFeedback[];
}) {
  const { t } = useTranslation();
  if (
    !feedback?.length ||
    (question.type !== 'multiple-choice' && question.type !== 'multi-select')
  )
    return null;
  return (
    <div className="wrong-feedback" data-testid="wrong-answer-feedback">
      {feedback.map((f) => {
        const label = question.options.find((o) => o.id === f.optionId)?.label ?? f.optionId;
        return (
          <div key={f.optionId} className="wrong-feedback__item">
            <p className="wrong-feedback__head">
              {t('question.whyWrong')}{' '}
              <q>
                <InlineText text={label} />
              </q>
            </p>
            {f.text && <RichText text={f.text} />}
            {f.material && (
              <a
                className="wrong-feedback__read"
                href={f.material.url}
                target="_blank"
                rel="noreferrer noopener"
              >
                <BookOpen size={14} aria-hidden />
                {t('question.readAbout', { title: f.material.title })}
                <ExternalLink size={12} aria-hidden />
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}
